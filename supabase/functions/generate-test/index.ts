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
  apiKey: string
): Promise<Question[]> {
  const MAX_BATCH_SIZE = 15; // Keep batches small to avoid truncation
  const batches = Math.ceil(totalCount / MAX_BATCH_SIZE);
  const allQuestions: Question[] = [];
  
  console.log(`Generating ${totalCount} questions in ${batches} batch(es)...`);
  
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
}`;

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, difficulty, question_count, forceNew, requestId } = await req.json();

    const qc = Number(question_count) || 10;
    console.log('Request received:', { topic, difficulty, question_count: qc, forceNew: !!forceNew, requestId });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // STEP 1: Database Check (Cache Layer)
    console.log('Step 1: Checking database for existing questions...');

    let dbQuestions: Question[] = [];

    // If forceNew is true, skip cache short-circuit and generate fresh questions.
    if (!forceNew) {
      try {
        const { data: existingQuestions, error: dbError } = await supabase
          .from('content_items')
          .select('title, options, correct_option, explanation')
          .eq('category', 'mcq')
          .eq('status', 'approved')
          .ilike('topic', `%${topic}%`)
          .ilike('difficulty', difficulty)
          .limit(qc * 2); // Fetch extra for better shuffling

        if (dbError) {
          console.error('Database query error:', dbError);
        } else if (existingQuestions && existingQuestions.length > 0) {
          dbQuestions = existingQuestions
            .filter(q => q.title && q.options && q.correct_option)
            .map(q => ({
              question: q.title,
              options: Array.isArray(q.options) ? q.options : [],
              answer: q.correct_option,
              explanation: q.explanation || undefined
            }));
          console.log(`Found ${dbQuestions.length} existing questions in database`);
        }
      } catch (dbErr) {
        console.error('Database check failed:', dbErr);
        // Continue to AI generation if DB fails
      }
    } else {
      console.log('forceNew=true: skipping cache and generating fresh questions');
    }

    // If we have enough questions from DB, return them immediately
    if (!forceNew && dbQuestions.length >= qc) {
      console.log('Sufficient questions in cache, skipping AI call');
      const shuffled = shuffleArray(dbQuestions);
      const selected = shuffled.slice(0, qc);

      return new Response(
        JSON.stringify({
          session_name: `${topic} Quiz`,
          questions: selected,
          source: 'cache'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // STEP 2: AI Generation for missing questions
    const missingCount = forceNew ? qc : qc - dbQuestions.length;
    console.log(`Step 2: Need ${missingCount} more questions from AI`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let newAIQuestions: Question[] = [];
    
    try {
      newAIQuestions = await generateQuestionsInBatches(topic, difficulty, missingCount, LOVABLE_API_KEY);
      console.log(`AI generated ${newAIQuestions.length} new questions total`);
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
            source: 'cache_partial'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      throw aiError;
    }

    // STEP 3: Self-Learning Save - Store new questions in database
    if (newAIQuestions.length > 0) {
      console.log('Step 3: Saving new questions to database for future use...');
      
      try {
        const questionsToInsert = newAIQuestions.map(q => ({
          title: q.question,
          description: q.explanation || '',
          category: 'mcq',
          topic: topic.split(':')[0].trim(), // Extract main topic
          difficulty: difficulty.toLowerCase(),
          options: q.options,
          correct_option: q.answer,
          explanation: q.explanation || '',
          status: 'approved',
          show_in_subjects: true,
          show_in_mock_tests: true
        }));

        const { error: insertError } = await supabase
          .from('content_items')
          .insert(questionsToInsert);

        if (insertError) {
          console.error('Failed to save questions:', insertError);
        } else {
          console.log(`Successfully saved ${questionsToInsert.length} questions to database`);
        }
      } catch (saveErr) {
        console.error('Error saving to database:', saveErr);
        // Don't fail the request if save fails
      }
    }

    // STEP 4: Combine and return
    const allQuestions = [...dbQuestions, ...newAIQuestions];
    
    // If we still don't have enough, return what we have
    if (allQuestions.length === 0) {
      throw new Error('No questions could be generated');
    }
    
    const finalQuestions = shuffleArray(allQuestions).slice(0, qc);

    console.log(`Returning ${finalQuestions.length} questions (${dbQuestions.length} cached + ${newAIQuestions.length} new)`);

    return new Response(
      JSON.stringify({
        session_name: `${topic} Quiz`,
        questions: finalQuestions,
        source: dbQuestions.length > 0 ? 'hybrid' : 'ai'
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
