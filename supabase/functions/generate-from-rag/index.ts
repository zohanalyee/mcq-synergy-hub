import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Gemini model fallback
const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];

interface MCQQuestion {
  title: string;
  options: { A: string; B: string; C: string; D: string };
  correct_option: string;
  explanation: string;
  difficulty: string;
}

async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text }] },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Embedding API error: ${response.status}`);
  }

  const data = await response.json();
  return data.embedding?.values || [];
}

async function callGeminiWithFallback(
  prompt: string,
  systemPrompt: string,
  apiKey: string
): Promise<string> {
  let lastError: Error | null = null;

  for (const model of GEMINI_MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: {
              temperature: 0.7,
              topP: 0.9,
              maxOutputTokens: 8192,
            },
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error(`Model ${model} failed:`, response.status, errText);
        lastError = new Error(`${model}: ${response.status}`);
        continue;
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch (err) {
      lastError = err as Error;
      console.error(`Model ${model} error:`, err);
    }
  }

  throw lastError || new Error("All Gemini models failed");
}

function parseJSONFromResponse(text: string): MCQQuestion[] {
  // Try to extract JSON array from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      console.error("Failed to parse JSON array");
    }
  }

  // Try parsing the whole response
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    console.error("Failed to parse response as JSON");
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      document_id,
      topic_id,
      subject,
      topic,
      count = 10,
      difficulty_distribution = { easy: 4, medium: 4, hard: 2 },
    } = await req.json();

    if (!document_id || !topic_id) {
      return new Response(
        JSON.stringify({ error: "document_id and topic_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Step 1: Fetch document sections for this document
    console.log(`Fetching chunks for document: ${document_id}`);
    const { data: sections, error: sectionsError } = await supabase
      .from("document_sections")
      .select("content")
      .eq("document_id", document_id)
      .order("section_index")
      .limit(20); // Use top 20 chunks

    if (sectionsError) {
      throw new Error(`Failed to fetch document sections: ${sectionsError.message}`);
    }

    if (!sections || sections.length === 0) {
      return new Response(
        JSON.stringify({ error: "No content found in document" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Combine chunks into context
    const context = sections.map(s => s.content).join("\n\n---\n\n");
    console.log(`Using ${sections.length} chunks, total length: ${context.length} chars`);

    // Step 3: Build MCQ generation prompt
    const systemPrompt = `You are an expert MCQ question generator for educational content.
Your task is to create high-quality multiple choice questions based ONLY on the provided document context.

RULES:
1. Generate questions ONLY from the provided context - do not add external knowledge
2. Each question must have exactly 4 options (A, B, C, D)
3. Only ONE option should be correct
4. Provide a brief explanation for the correct answer
5. Distribute difficulty as specified
6. Questions should test understanding, not just recall

OUTPUT FORMAT:
Return ONLY a valid JSON array with this structure:
[
  {
    "title": "The question text",
    "options": { "A": "First option", "B": "Second option", "C": "Third option", "D": "Fourth option" },
    "correct_option": "A",
    "explanation": "Brief explanation why A is correct",
    "difficulty": "Easy"
  }
]`;

    const userPrompt = `Generate ${count} multiple-choice questions from the following educational content.

SUBJECT: ${subject || "General"}
TOPIC: ${topic || "General"}

DIFFICULTY DISTRIBUTION:
- Easy: ${difficulty_distribution.easy} questions
- Medium: ${difficulty_distribution.medium} questions
- Hard: ${difficulty_distribution.hard} questions

DOCUMENT CONTENT:
${context.substring(0, 15000)}

Generate exactly ${count} questions. Return ONLY the JSON array, no other text.`;

    // Step 4: Generate MCQs using Gemini
    console.log("Generating MCQs with Gemini...");
    const responseText = await callGeminiWithFallback(userPrompt, systemPrompt, GEMINI_API_KEY);
    
    // Step 5: Parse response
    const questions = parseJSONFromResponse(responseText);
    console.log(`Parsed ${questions.length} questions from response`);

    if (questions.length === 0) {
      return new Response(
        JSON.stringify({ error: "Failed to generate valid questions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 6: Save questions to content_items
    let savedCount = 0;
    const errors: string[] = [];

    for (const q of questions) {
      try {
        const { error: insertError } = await supabase.from("content_items").insert({
          title: q.title,
          description: q.title,
          category: "mcq",
          status: "approved",
          subject: subject,
          topic: topic,
          topic_id: topic_id,
          difficulty: q.difficulty || "Medium",
          options: q.options,
          correct_option: q.correct_option,
          explanation: q.explanation,
          source_type: "rag_generated",
          source_document_id: document_id,
          show_in_subjects: true,
          show_in_syllabus: true,
          show_in_mock_tests: true,
        });

        if (insertError) {
          errors.push(`Insert error: ${insertError.message}`);
        } else {
          savedCount++;
        }
      } catch (err) {
        errors.push(`Save error: ${(err as Error).message}`);
      }
    }

    // Step 7: Log usage
    await supabase.from("ai_usage_logs").insert({
      source_type: "rag_mcq_generation",
      subject: subject,
      topic: topic,
      questions_requested: count,
      questions_fetched: questions.length,
      questions_saved: savedCount,
      metadata: { document_id, topic_id, errors },
    });

    console.log(`Saved ${savedCount}/${questions.length} questions`);

    return new Response(
      JSON.stringify({
        success: true,
        questions_generated: questions.length,
        questions_saved: savedCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-from-rag error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
