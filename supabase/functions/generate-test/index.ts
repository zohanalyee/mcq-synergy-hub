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

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    // Build the prompt with user parameters
    const prompt = `You are a strict JSON generator. Create a test with ${question_count} multiple choice questions about ${topic} at ${difficulty} level. Output ONLY raw JSON. Structure: { "session_name": "Title", "questions": [ { "question": "...", "options": ["A", "B", "C", "D"], "answer": "The Correct Option String" } ] }`;

    console.log('Sending prompt to Gemini:', prompt);

    // Call Google Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Received response from Gemini');

    // Extract the generated text from Gemini response
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      console.error('No text generated from Gemini');
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
