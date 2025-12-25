import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Question {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Sanitize topic for flexible matching - removes brackets and extra whitespace
function sanitizeTopic(topic: string): string {
  return topic.replace(/\s*\([^)]*\)\s*/g, '').trim();
}

// ========== SYLLABUS ENGINE ==========
// Map job tests to their core syllabus subjects for cross-question reuse
const JOB_SYLLABUS_MAP: Record<string, string[]> = {
  "Banking Officer": ["English", "Economics", "Finance", "Quantitative", "IT", "Pakistan Affairs", "Current Affairs"],
  "OG-2": ["English", "Economics", "Finance", "Quantitative", "IT", "Pakistan Affairs", "Current Affairs"],
  "OG-3": ["English", "Economics", "Finance", "Quantitative", "IT", "Pakistan Affairs", "Current Affairs"],
  "Civil Judge": ["Civil Law", "Criminal Law", "Constitutional Law", "English", "Islamic Law", "Pakistan Affairs"],
  "Election Officer": ["English", "Constitution", "Election Act", "Islamiyat", "Pakistan Affairs", "General Knowledge"],
  "Assistant Director": ["English", "General Knowledge", "Pakistan Affairs", "Islamic Studies", "Reasoning", "Current Affairs"],
  "Lecturer": ["English", "General Knowledge", "Pakistan Affairs", "Islamic Studies", "Education"],
  "PMS": ["English", "Pakistan Affairs", "Current Affairs", "Islamic Studies", "General Knowledge", "Essay Writing"],
  "CSS": ["English", "Pakistan Affairs", "Current Affairs", "Islamic Studies", "General Knowledge", "Essay Writing"],
  "PPSC": ["English", "Pakistan Affairs", "General Knowledge", "Islamic Studies", "Current Affairs"],
  "FPSC": ["English", "Pakistan Affairs", "General Knowledge", "Islamic Studies", "Current Affairs"],
  "NTS": ["English", "Quantitative", "Analytical", "General Knowledge"],
  "ECAT": ["Physics", "Chemistry", "Mathematics", "English"],
  "MDCAT": ["Biology", "Chemistry", "Physics", "English"],
  "GAT": ["English", "Quantitative", "Analytical"],
};

// Get syllabus subjects for a job/test topic
function getSyllabusSubjects(topic: string): string[] {
  const sanitized = sanitizeTopic(topic).toLowerCase();
  
  // Check each key in the map
  for (const [jobKey, subjects] of Object.entries(JOB_SYLLABUS_MAP)) {
    if (sanitized.includes(jobKey.toLowerCase()) || jobKey.toLowerCase().includes(sanitized)) {
      return subjects;
    }
  }
  
  // Check if topic contains any key
  for (const [jobKey, subjects] of Object.entries(JOB_SYLLABUS_MAP)) {
    if (topic.toLowerCase().includes(jobKey.toLowerCase())) {
      return subjects;
    }
  }
  
  return []; // No syllabus found - treat as single subject
}

// Build broader search conditions for syllabus-aware matching
// IMPORTANT: PostgREST uses * for wildcards in .or() filters, NOT %
function buildSyllabusSearchConditions(topic: string, sanitizedTopic: string, syllabusSubjects: string[]): string {
  const conditions: string[] = [];
  
  // Add sanitized topic (without parentheses) - this is the key for matching
  if (sanitizedTopic) {
    conditions.push(`topic.ilike.*${sanitizedTopic}*`);
    conditions.push(`subject.ilike.*${sanitizedTopic}*`);
  }
  
  // Add all syllabus subjects to the search
  for (const subject of syllabusSubjects) {
    conditions.push(`topic.ilike.*${subject}*`);
    conditions.push(`subject.ilike.*${subject}*`);
  }
  
  // Remove duplicates
  const uniqueConditions = [...new Set(conditions)];
  console.log(`🔎 Search conditions (${uniqueConditions.length}): ${uniqueConditions.slice(0, 4).join(', ')}...`);
  
  return uniqueConditions.join(',');
}

// Robust JSON parser with repair logic for truncated responses
function parseAIResponse(text: string): Question[] {
  let jsonText = text.trim();
  
  // Remove markdown code blocks
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
  }
  
  // Try parsing as-is first
  try {
    const parsed = JSON.parse(jsonText);
    return parsed.questions || [];
  } catch (e) {
    console.log('Initial JSON parse failed, attempting repair...');
  }
  
  // Try to repair truncated JSON by finding the last complete question
  try {
    // Find the questions array start
    const questionsStart = jsonText.indexOf('"questions"');
    if (questionsStart === -1) {
      throw new Error('No questions array found');
    }
    
    const arrayStart = jsonText.indexOf('[', questionsStart);
    if (arrayStart === -1) {
      throw new Error('No array start found');
    }
    
    // Extract just the array content
    let arrayContent = jsonText.substring(arrayStart);
    
    // Find all complete question objects by matching balanced braces
    const questions: Question[] = [];
    let depth = 0;
    let objStart = -1;
    
    for (let i = 0; i < arrayContent.length; i++) {
      const char = arrayContent[i];
      if (char === '{') {
        if (depth === 0) objStart = i;
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0 && objStart !== -1) {
          const objStr = arrayContent.substring(objStart, i + 1);
          try {
            const q = JSON.parse(objStr);
            if (q.question && q.options && q.answer) {
              questions.push({
                question: q.question,
                options: Array.isArray(q.options) ? q.options : [],
                answer: q.answer,
                explanation: q.explanation || undefined
              });
            }
          } catch {
            // Skip malformed question
          }
          objStart = -1;
        }
      }
    }
    
    console.log(`Repaired JSON: extracted ${questions.length} valid questions`);
    return questions;
  } catch (repairError) {
    console.error('JSON repair failed:', repairError);
    return [];
  }
}

// Generate questions in batches to avoid truncation
async function generateQuestionsInBatches(
  topic: string,
  difficulty: string,
  totalCount: number,
  apiKey: string,
  existingQuestions: string[] = [] // Pass existing question texts to avoid duplicates
): Promise<Question[]> {
  const MAX_BATCH_SIZE = 15; // Keep batches small to avoid truncation
  const batches = Math.ceil(totalCount / MAX_BATCH_SIZE);
  const allQuestions: Question[] = [];
  
  console.log(`Generating ${totalCount} questions in ${batches} batch(es)...`);
  
  // Build duplicate prevention prompt
  const duplicateNote = existingQuestions.length > 0 
    ? `\n\nIMPORTANT: Do NOT generate questions similar to these existing ones:\n${existingQuestions.slice(0, 20).map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    : '';
  
  for (let batch = 0; batch < batches; batch++) {
    const batchSize = Math.min(MAX_BATCH_SIZE, totalCount - allQuestions.length);
    if (batchSize <= 0) break;
    
    console.log(`Batch ${batch + 1}/${batches}: Generating ${batchSize} questions...`);
    
    const systemPrompt = `You are a strict JSON generator for educational quizzes. Create high-quality multiple choice questions.
Output ONLY raw JSON in this exact structure (no markdown, no explanations):
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "answer": "The exact text of the correct option",
      "explanation": "Brief explanation of the correct answer"
    }
  ]
}${duplicateNote}`;

    const userPrompt = `Create exactly ${batchSize} multiple choice questions about ${topic} at ${difficulty} difficulty level. Each question must have exactly 4 options and include a brief explanation. Return ONLY valid JSON.`;

    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 8000, // Limit response size
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Batch ${batch + 1} failed:`, response.status, errorText);
        
        if (response.status === 429) {
          throw { status: 429, message: 'Rate limit exceeded' };
        }
        if (response.status === 402) {
          throw { status: 402, message: 'AI credits depleted' };
        }
        continue; // Skip failed batch but continue with others
      }

      const data = await response.json();
      const generatedText = data.choices?.[0]?.message?.content;
      
      if (generatedText) {
        const batchQuestions = parseAIResponse(generatedText);
        allQuestions.push(...batchQuestions);
        console.log(`Batch ${batch + 1} completed: ${batchQuestions.length} questions`);
      }
    } catch (batchError: any) {
      if (batchError.status === 429 || batchError.status === 402) {
        throw batchError; // Re-throw rate limit/payment errors
      }
      console.error(`Batch ${batch + 1} error:`, batchError);
      // Continue with other batches
    }
    
    // Small delay between batches to avoid rate limiting
    if (batch < batches - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return allQuestions;
}

// Background task to save remaining questions after returning response
async function saveQuestionsInBackground(
  questions: Question[],
  topic: string,
  sanitizedTopic: string,
  difficulty: string,
  supabase: any
): Promise<void> {
  console.log(`📦 Background task: Saving ${questions.length} questions...`);
  
  const BATCH_SIZE = 20; // Insert in smaller batches
  const batches = Math.ceil(questions.length / BATCH_SIZE);
  
  for (let i = 0; i < batches; i++) {
    const batch = questions.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
    
    const questionsToInsert = batch.map(q => ({
      title: q.question,
      description: q.explanation || '',
      category: 'mcq',
      subject: sanitizedTopic, // Set subject for better organization
      topic: topic, // Keep original topic with brackets
      difficulty: difficulty.toLowerCase(),
      options: q.options,
      correct_option: q.answer,
      explanation: q.explanation || '',
      status: 'approved', // AUTO-APPROVED
      show_in_subjects: true,
      show_in_mock_tests: true,
      // Metadata for tracking
      reference_material: JSON.stringify({
        source_role: topic,
        original_topic: sanitizedTopic,
        generated_at: new Date().toISOString(),
        generator: 'ai'
      })
    }));

    try {
      const { error: insertError } = await supabase
        .from('content_items')
        .insert(questionsToInsert);

      if (insertError) {
        if (insertError.message?.includes('duplicate') || insertError.code === '23505') {
          console.log(`📦 Background batch ${i + 1}: Some duplicates skipped`);
        } else {
          console.error(`📦 Background batch ${i + 1} error:`, insertError);
        }
      } else {
        console.log(`📦 Background batch ${i + 1}/${batches}: Saved ${batch.length} questions`);
      }
    } catch (err) {
      console.error(`📦 Background batch ${i + 1} failed:`, err);
    }
  }
  
  console.log('📦 Background task completed');
}

// Background generation + saving (combined for EdgeRuntime.waitUntil)
async function backgroundGenerateAndSave(
  topic: string,
  sanitizedTopic: string,
  difficulty: string,
  missingCount: number,
  existingQuestionTexts: string[],
  apiKey: string,
  supabase: any
): Promise<void> {
  console.log(`🚀 BACKGROUND: Starting generation of ${missingCount} questions for "${topic}"`);
  
  try {
    const newQuestions = await generateQuestionsInBatches(
      topic, 
      difficulty, 
      missingCount, 
      apiKey,
      existingQuestionTexts
    );
    
    console.log(`🚀 BACKGROUND: Generated ${newQuestions.length} questions`);
    
    if (newQuestions.length > 0) {
      await saveQuestionsInBackground(newQuestions, topic, sanitizedTopic, difficulty, supabase);
    }
    
    console.log(`🚀 BACKGROUND: Complete - ${newQuestions.length} questions saved to DB`);
  } catch (err) {
    console.error('🚀 BACKGROUND: Generation/saving failed:', err);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, difficulty, question_count, forceNew, requestId, partial_mode, fetch_only } = await req.json();

    const qc = Number(question_count) || 10;
    const usePartialMode = partial_mode === true;
    const isFetchOnly = fetch_only === true;
    const isLargeRequest = qc > 20;
    const autoPartial = usePartialMode || isLargeRequest;
    
    console.log('📥 Request received:', { 
      topic, 
      difficulty, 
      question_count: qc, 
      forceNew: !!forceNew, 
      partial_mode: usePartialMode,
      fetch_only: isFetchOnly,
      auto_partial: autoPartial,
      requestId 
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Sanitize topic for flexible matching
    const sanitizedTopic = sanitizeTopic(topic);
    console.log(`Topic: "${topic}" → Sanitized: "${sanitizedTopic}"`);

    // ========== SYLLABUS-AWARE SEARCH ==========
    // Get syllabus subjects for this topic (if it's a job test)
    const syllabusSubjects = getSyllabusSubjects(topic);
    const hasSyllabus = syllabusSubjects.length > 0;
    
    if (hasSyllabus) {
      console.log(`📚 SYLLABUS ENGINE: Found ${syllabusSubjects.length} core subjects: [${syllabusSubjects.join(', ')}]`);
    } else {
      console.log(`📘 Single subject mode: "${sanitizedTopic}"`);
    }

    // Build search conditions (syllabus-aware OR simple)
    // IMPORTANT: PostgREST uses * for wildcards in .or() filters, NOT %
    const searchConditions = hasSyllabus 
      ? buildSyllabusSearchConditions(topic, sanitizedTopic, syllabusSubjects)
      : `topic.ilike.*${sanitizedTopic}*,subject.ilike.*${sanitizedTopic}*`;

    // STEP 1: Database Check (Cache Layer) - SYLLABUS-AWARE FUZZY MATCHING
    console.log('Step 1: Checking database for existing questions...');

    let dbQuestions: Question[] = [];
    let existingQuestionTexts: string[] = [];

    // If forceNew is true, skip cache short-circuit and generate fresh questions.
    if (!forceNew) {
      try {
        // Normalize difficulty for matching (case-insensitive)
        const difficultyLower = String(difficulty || 'medium').toLowerCase();
        
        // SYLLABUS-AWARE MATCHING: Search job topic AND all syllabus subjects
        const { data: existingQuestions, error: dbError } = await supabase
          .from('content_items')
          .select('title, options, correct_option, explanation, topic, subject, difficulty')
          .eq('category', 'mcq')
          .eq('status', 'approved')
          .or(searchConditions)
          .limit(qc * 3); // Fetch extra for better randomization (difficulty filter removed for broader match)

        if (dbError) {
          console.error('❌ Database query error:', dbError);
          console.log('🔎 Failed query conditions:', { searchConditions: searchConditions.substring(0, 200), difficulty: difficultyLower });
        } else if (existingQuestions && existingQuestions.length > 0) {
          // Log what subjects/topics we found
          const foundTopics = [...new Set(existingQuestions.map(q => q.topic || q.subject).filter(Boolean))];
          console.log(`📊 Found questions from: [${foundTopics.slice(0, 5).join(', ')}${foundTopics.length > 5 ? '...' : ''}]`);
          
          // Shuffle results to mix questions from different subjects
          const shuffledDbResults = shuffleArray(existingQuestions);
          
          dbQuestions = shuffledDbResults
            .filter(q => q.title && q.options && q.correct_option)
            .map(q => ({
              question: q.title,
              options: Array.isArray(q.options) ? q.options : [],
              answer: q.correct_option,
              explanation: q.explanation || undefined
            }));
          
          // Store existing question texts for duplicate prevention
          existingQuestionTexts = dbQuestions.map(q => q.question);
          
          console.log(`✅ Found ${dbQuestions.length} existing questions in database (syllabus-aware)`);
        } else {
          // CRITICAL LOG: Cache miss - this helps debug why partial mode isn't triggering
          console.log(`🔎 CACHE MISS: 0 questions found for "${sanitizedTopic}"`);
          console.log(`🔎 Query details: hasSyllabus=${hasSyllabus}, subjects=[${syllabusSubjects.slice(0, 3).join(', ')}]`);
        }
      } catch (dbErr) {
        console.error('Database check failed:', dbErr);
        // Continue to AI generation if DB fails
      }
    } else {
      console.log('forceNew=true: skipping cache and generating fresh questions');
    }

    // ========== FETCH_ONLY MODE ==========
    // If fetch_only=true, just return whatever is in DB (used for polling)
    if (isFetchOnly) {
      console.log(`🔍 FETCH_ONLY: Returning ${dbQuestions.length} cached questions (no AI generation)`);
      const returnedQuestions = shuffleArray(dbQuestions).slice(0, qc);
      
      return new Response(
        JSON.stringify({
          session_name: `${topic} Quiz`,
          questions: returnedQuestions,
          source: 'cache',
          cached_count: returnedQuestions.length,
          ai_count: 0,
          remaining_count: Math.max(0, qc - returnedQuestions.length),
          total_requested: qc
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // ========== IMMEDIATE RETURN: FULL CACHE ==========
    // If we have enough questions from DB, return them immediately (ZERO LATENCY)
    if (!forceNew && dbQuestions.length >= qc) {
      console.log('⚡ INSTANT: Sufficient questions in cache, skipping AI call');
      const selected = shuffleArray(dbQuestions).slice(0, qc);

      return new Response(
        JSON.stringify({
          session_name: `${topic} Quiz`,
          questions: selected,
          source: 'cache',
          cached_count: selected.length,
          ai_count: 0,
          remaining_count: 0,
          total_requested: qc
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // ========== IMMEDIATE RETURN: PARTIAL MODE ==========
    // AUTO PARTIAL: For large requests OR explicit partial_mode, return immediately with cached questions
    // and trigger background generation for the rest
    if (autoPartial && dbQuestions.length > 0 && !forceNew) {
      const returnedQuestions = shuffleArray(dbQuestions).slice(0, Math.min(dbQuestions.length, qc));
      const missingCount = qc - returnedQuestions.length;
      
      console.log(`⚡ PARTIAL MODE ACTIVE: Returning ${returnedQuestions.length} questions, Generating ${missingCount} in background`);
      
      // Start background generation if needed (NEVER awaited - this is the key fix!)
      if (missingCount > 0) {
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        if (LOVABLE_API_KEY) {
          EdgeRuntime.waitUntil(
            backgroundGenerateAndSave(
              topic,
              sanitizedTopic,
              difficulty,
              missingCount,
              existingQuestionTexts,
              LOVABLE_API_KEY,
              supabase
            )
          );
        } else {
          console.warn('⚠️ LOVABLE_API_KEY not set - cannot generate background questions');
        }
      }

      // IMMEDIATE RETURN - no waiting for AI
      return new Response(
        JSON.stringify({
          session_name: `${topic} Quiz`,
          questions: returnedQuestions,
          source: 'cache_partial',
          cached_count: returnedQuestions.length,
          ai_count: 0,
          remaining_count: missingCount,
          total_requested: qc
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // ========== FULL AI GENERATION (fallback for small requests with no cache) ==========
    // Only reaches here if: small request (<= 20) AND no/insufficient cached questions
    const missingCount = forceNew ? qc : qc - dbQuestions.length;
    console.log(`Step 2: Need ${missingCount} questions from AI (have ${dbQuestions.length} from cache)`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let newAIQuestions: Question[] = [];
    
    try {
      // Pass existing question texts to avoid duplicates
      newAIQuestions = await generateQuestionsInBatches(
        topic, 
        difficulty, 
        missingCount, 
        LOVABLE_API_KEY,
        existingQuestionTexts // DUPLICATE PREVENTION
      );
      console.log(`🤖 AI generated ${newAIQuestions.length} new questions total`);
    } catch (aiError: any) {
      if (aiError.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.', details: 'Too many requests' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }
      
      if (aiError.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to your workspace.', details: 'Payment required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
        );
      }
      
      // If AI fails but we have some DB questions, return those
      if (dbQuestions.length > 0) {
        console.log('AI failed, returning available DB questions');
        return new Response(
          JSON.stringify({
            session_name: `${topic} Quiz`,
            questions: shuffleArray(dbQuestions),
            source: 'cache_partial',
            cached_count: dbQuestions.length,
            ai_count: 0,
            remaining_count: qc - dbQuestions.length,
            total_requested: qc
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      throw aiError;
    }

    // Save new questions (background for large batches, inline for small)
    if (newAIQuestions.length > 0) {
      console.log('Step 3: Saving new questions to database...');
      
      const IMMEDIATE_LIMIT = 20;
      
      if (newAIQuestions.length <= IMMEDIATE_LIMIT) {
        // Save immediately for small batches
        const questionsToInsert = newAIQuestions.map(q => ({
          title: q.question,
          description: q.explanation || '',
          category: 'mcq',
          subject: sanitizedTopic,
          topic: topic,
          difficulty: difficulty.toLowerCase(),
          options: q.options,
          correct_option: q.answer,
          explanation: q.explanation || '',
          status: 'approved',
          show_in_subjects: true,
          show_in_mock_tests: true,
          reference_material: JSON.stringify({
            source_role: topic,
            original_topic: sanitizedTopic,
            generated_at: new Date().toISOString(),
            generator: 'ai'
          })
        }));

        try {
          const { error: insertError } = await supabase
            .from('content_items')
            .insert(questionsToInsert);

          if (insertError) {
            if (insertError.message?.includes('duplicate') || insertError.code === '23505') {
              console.log('Some questions already exist (duplicate), continuing...');
            } else {
              console.error('Failed to save questions:', insertError);
            }
          } else {
            console.log(`✅ Successfully saved ${questionsToInsert.length} questions (auto-approved)`);
          }
        } catch (saveErr) {
          console.error('Error saving to database:', saveErr);
        }
      } else {
        // Use background task for large batches to prevent timeout
        console.log(`Large batch (${newAIQuestions.length}): Using background task to save`);
        EdgeRuntime.waitUntil(
          saveQuestionsInBackground(newAIQuestions, topic, sanitizedTopic, difficulty, supabase)
        );
      }
    }

    // STEP 4: Combine and return
    const allQuestions = [...dbQuestions, ...newAIQuestions];
    
    if (allQuestions.length === 0) {
      throw new Error('No questions could be generated');
    }
    
    const finalQuestions = shuffleArray(allQuestions).slice(0, qc);

    // Determine source type for UI badge
    const sourceType = dbQuestions.length === 0 ? 'ai' : 
                       newAIQuestions.length === 0 ? 'cache' : 'hybrid';

    console.log(`✅ Returning ${finalQuestions.length} questions (${dbQuestions.length} cached + ${newAIQuestions.length} new) - Source: ${sourceType}`);

    return new Response(
      JSON.stringify({
        session_name: `${topic} Quiz`,
        questions: finalQuestions,
        source: sourceType,
        cached_count: Math.min(dbQuestions.length, qc),
        ai_count: newAIQuestions.length,
        remaining_count: 0,
        total_requested: qc
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in generate-test:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to generate test questions'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
