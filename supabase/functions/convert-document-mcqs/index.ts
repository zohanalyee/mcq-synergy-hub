import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function verifyAdmin(req: Request, supabase: any): Promise<{ authorized: boolean; userId?: string; error?: string }> {
  const authHeader = req.headers.get("Authorization");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (authHeader?.includes(serviceKey || "")) {
    return { authorized: true, userId: "service_role" };
  }
  if (!authHeader?.startsWith("Bearer ")) {
    return { authorized: false, error: "Missing or invalid authorization header" };
  }
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return { authorized: false, error: "Invalid token" };
  }
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .eq("role", "admin")
    .single();
  if (!roleData) {
    return { authorized: false, error: "Admin privileges required" };
  }
  return { authorized: true, userId: data.user.id };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const auth = await verifyAdmin(req, supabase);
    if (!auth.authorized) {
      return new Response(
        JSON.stringify({ error: auth.error }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { file_url, raw_text, source_type = "txt" } = await req.json();

    if (!file_url && !raw_text) {
      return new Response(
        JSON.stringify({ error: "Either file_url or raw_text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Get document text
    let documentText = raw_text || "";

    if (file_url && !raw_text) {
      console.log(`[convert-document-mcqs] Fetching file: ${file_url}`);
      const fileResponse = await fetch(file_url);
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file: ${fileResponse.status}`);
      }
      documentText = await fileResponse.text();
    }

    if (!documentText || documentText.trim().length < 50) {
      return new Response(
        JSON.stringify({ error: "Document text is too short or empty. Ensure the file contains readable text content." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Truncate to avoid token limits
    const maxChars = 80000;
    if (documentText.length > maxChars) {
      documentText = documentText.substring(0, maxChars);
      console.log(`[convert-document-mcqs] Truncated text to ${maxChars} chars`);
    }

    // Step 2: Fetch available subjects and topics for classification
    const { data: subjects } = await supabase
      .from("subjects")
      .select("id, name")
      .order("name");

    const { data: topics } = await supabase
      .from("topics")
      .select("id, name, subject_id")
      .order("name");

    const subjectsList = (subjects || []).map((s: any) => `- ${s.name} (id: ${s.id})`).join("\n");
    const topicsBySubject: Record<string, any[]> = {};
    for (const t of (topics || [])) {
      const subj = (subjects || []).find((s: any) => s.id === t.subject_id);
      const subjName = subj?.name || "Unknown";
      if (!topicsBySubject[subjName]) topicsBySubject[subjName] = [];
      topicsBySubject[subjName].push({ id: t.id, name: t.name });
    }
    const topicsList = Object.entries(topicsBySubject)
      .map(([subj, tops]) => `${subj}:\n${tops.map((t: any) => `  - ${t.name} (id: ${t.id})`).join("\n")}`)
      .join("\n\n");

    // Step 3: Combined AI prompt (Extract + Classify + Verify in one call)
    const systemPrompt = `You are an expert MCQ extractor, classifier, and verifier. You will:
1. Extract ALL multiple-choice questions from the document
2. Classify each question by subject, topic, and difficulty
3. Verify if the marked answers are correct

AVAILABLE SUBJECTS IN SYSTEM:
${subjectsList}

AVAILABLE TOPICS PER SUBJECT:
${topicsList}

DIFFICULTY CRITERIA:
- Easy: Basic recall/definition, single-step reasoning
- Medium: Application of concepts, multi-step reasoning
- Hard: Complex analysis, multi-concept integration, critical thinking

ANSWER VERIFICATION:
- Check if the marked correct answer is actually correct
- Flag questions where the answer seems wrong or ambiguous

OUTPUT FORMAT - Return ONLY valid JSON (no markdown, no code blocks):
{
  "metadata": {
    "total_questions": 0,
    "source_type": "${source_type}",
    "detected_subject": null,
    "extraction_confidence": 0.0
  },
  "questions": [
    {
      "id": "q1",
      "question": "Question text?",
      "options": {
        "A": "First option",
        "B": "Second option",
        "C": "Third option",
        "D": "Fourth option"
      },
      "correct_option": "A",
      "explanation": "Why this is correct",
      "subject_id": "matched-uuid-or-null",
      "suggested_subject": "Subject Name",
      "topic_id": "matched-uuid-or-null",
      "suggested_topic": "Topic Name",
      "difficulty": "Easy",
      "verified": true,
      "verification_note": "",
      "confidence": 0.95
    }
  ],
  "summary": {
    "total": 0,
    "verified_correct": 0,
    "flagged": 0,
    "easy": 0,
    "medium": 0,
    "hard": 0
  }
}

IMPORTANT:
- Extract ALL questions found in the document
- Match subjects/topics to existing ones when possible (use the IDs provided)
- If no match, suggest a subject/topic name
- correct_option must be "A", "B", "C", or "D"
- Set verified=false and add verification_note for suspicious answers
- Return valid JSON only, no markdown wrapping`;

    const userPrompt = `Extract, classify, and verify ALL MCQ questions from this document:\n\n${documentText}`;

    console.log(`[convert-document-mcqs] Calling AI with ${documentText.length} chars of text`);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 16384,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error(`[convert-document-mcqs] AI error: ${aiResponse.status}`, errText);
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a few minutes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to your Lovable workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.choices?.[0]?.message?.content || "";

    // Parse AI response
    let parsed: any;
    try {
      // Try direct parse
      parsed = JSON.parse(responseText);
    } catch {
      // Try extracting JSON from markdown code blocks
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try finding JSON object
        const objMatch = responseText.match(/\{[\s\S]*\}/);
        if (objMatch) {
          parsed = JSON.parse(objMatch[0]);
        } else {
          throw new Error("Failed to parse AI response as JSON");
        }
      }
    }

    console.log(`[convert-document-mcqs] Extracted ${parsed.questions?.length || 0} questions`);

    // Log usage
    await supabase.from("ai_usage_logs").insert({
      source_type: "document_mcq_conversion",
      questions_requested: 0,
      questions_fetched: parsed.questions?.length || 0,
      questions_saved: 0,
      triggered_by_user_id: auth.userId === "service_role" ? null : auth.userId,
      metadata: { source_type, text_length: documentText.length },
    });

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[convert-document-mcqs] Error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
