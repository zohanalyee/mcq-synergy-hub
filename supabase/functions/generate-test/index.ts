import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { topic, difficulty, question_count } = await req.json();

    console.log('Generating test with AI:', { topic, difficulty, question_count });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build the system prompt
    const systemPrompt = `You are a strict JSON generator for educational quizzes. Create high-quality multiple choice questions.
Output ONLY raw JSON in this exact structure:
{
  "session_name": "Quiz Title",
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "answer": "The exact text of the correct option"
    }
  ]
}`;

    const userPrompt = `Create a test with ${question_count} multiple choice questions about ${topic} at ${difficulty} difficulty level. Each question should have exactly 4 options.`;

    console.log('Calling Lovable AI Gateway...');

    // Call Lovable AI Gateway
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
      
      // Handle rate limiting
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded. Please try again in a moment.',
            details: 'Too many requests'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 429
          }
        );
      }
      
      // Handle payment required
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: 'AI credits depleted. Please add credits to your workspace.',
            details: 'Payment required'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 402
          }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Received response from AI Gateway');

    // Extract the generated text from OpenAI-compatible response
    const generatedText = data.choices?.[0]?.message?.content;
    
    if (!generatedText) {
      console.error('No text generated from AI');
      throw new Error('No content generated from AI');
    }

    // Parse the JSON from the generated text
    // Remove markdown code blocks if present
    let jsonText = generatedText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    const testData = JSON.parse(jsonText);
    console.log(`Successfully generated ${testData.questions?.length || 0} questions`);

    return new Response(
      JSON.stringify(testData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error generating test with AI:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to generate test questions'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});