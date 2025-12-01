import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const { subjects, topics, questionCount = 30, difficulty, timeLimit = 45 } = await req.json();

    console.log('Generating test with params:', { subjects, topics, questionCount, difficulty, timeLimit });

    // Build query for content_items
    let query = supabase
      .from('content_items')
      .select('*')
      .eq('category', 'mcq')
      .eq('status', 'approved');

    // Filter by subjects if provided
    if (subjects && subjects.length > 0) {
      query = query.in('subject', subjects);
    }

    // Filter by topics if provided
    if (topics && topics.length > 0) {
      query = query.in('topic', topics);
    }

    // Filter by difficulty if provided
    if (difficulty && difficulty.length > 0) {
      query = query.in('difficulty', difficulty);
    }

    const { data: questions, error } = await query;

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log(`Found ${questions?.length || 0} matching questions`);

    if (!questions || questions.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No questions found matching your criteria',
          questions: []
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Shuffle and select requested number of questions
    const shuffled = questions.sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, Math.min(questionCount, questions.length));

    console.log(`Selected ${selectedQuestions.length} questions for test`);

    return new Response(
      JSON.stringify({
        questions: selectedQuestions,
        metadata: {
          totalQuestions: selectedQuestions.length,
          timeLimit,
          subjects,
          topics,
          difficulty
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error generating test:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
