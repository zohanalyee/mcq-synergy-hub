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

    const systemPrompt = `You are a strict JSON generator for educational quizzes. Create high-quality multiple choice questions.
Output ONLY raw JSON in this exact structure:
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

    const userPrompt = `Create exactly ${missingCount} multiple choice questions about ${topic} at ${difficulty} difficulty level. Each question must have exactly 4 options and include an explanation.`;

    console.log('Calling Lovable AI Gateway...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.', details: 'Too many requests' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }
      
      if (response.status === 402) {
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
      
      throw new Error(`AI Gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content;
    
    if (!generatedText) {
      throw new Error('No content generated from AI');
    }

    // Parse AI response
    let jsonText = generatedText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    const aiData = JSON.parse(jsonText);
    const newAIQuestions: Question[] = aiData.questions || [];
    console.log(`AI generated ${newAIQuestions.length} new questions`);

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
