import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filename, first_page_text } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    if (!filename) {
      throw new Error('filename is required');
    }

    const systemPrompt = `You are an expert in Pakistani educational content categorization.
Analyze the PDF filename and content preview to detect:
- System (Board): e.g. PTBB (Punjab Textbook Board), STBB (Sindh Textbook Board), FBISE (Federal Board), KPK Board, Balochistan Board, AKU-EB, Cambridge, etc.
- Level (Class): e.g. Class 1, Class 2, ..., Class 12, BSc, MSc, etc.
- Subject: e.g. Biology, Physics, Chemistry, Mathematics, English, Urdu, Pakistan Studies, Islamiat, Computer Science, General Knowledge, etc.
- Topic: Specific chapter or topic name from the content

Return ONLY valid JSON with this exact structure:
{
  "system": "Board/System name",
  "level": "Class/Level name",
  "subject": "Subject name",
  "topic": "Topic/Chapter name",
  "confidence": 0.85,
  "reasoning": "Brief explanation of how you detected each field"
}

Important rules:
- confidence should be 0.0-1.0 based on how certain you are
- If you cannot detect a field, use your best guess and lower the confidence
- For topic, try to identify the specific chapter or unit name
- Normalize names: "Bio" -> "Biology", "Phy" -> "Physics", etc.`;

    const userPrompt = `Analyze this educational PDF:

FILENAME: ${filename}

CONTENT PREVIEW:
${(first_page_text || '').substring(0, 2000)}

Detect System (Board), Level (Class), Subject, and Topic. Return only JSON.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiText = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response (handle markdown code blocks)
    const jsonMatch = aiText.match(/```(?:json)?\s*([\s\S]*?)```/) || aiText.match(/(\{[\s\S]*\})/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : null;
    const metadata = jsonStr ? JSON.parse(jsonStr) : null;

    if (!metadata) {
      console.error('Failed to parse AI response:', aiText);
      throw new Error('Failed to parse AI response');
    }

    console.log('AI categorization result:', metadata);

    return new Response(
      JSON.stringify({ success: true, metadata }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('analyze-pdf-metadata error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
