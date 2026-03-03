import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { extractText, getDocumentProxy } from "https://esm.sh/unpdf@0.12.1";
import { callGeminiText, callGeminiVision } from '../_shared/gemini.ts';
import { retryWithBackoff } from '../_shared/quotaManager.ts';

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

function uint8ToBase64(bytes: Uint8Array): string {
  let raw = "";
  const step = 32768;
  for (let i = 0; i < bytes.length; i += step) {
    const slice = bytes.subarray(i, Math.min(i + step, bytes.length));
    raw += String.fromCharCode(...slice);
  }
  return btoa(raw);
}

function hasReadableText(text: string): boolean {
  const trimmed = text.trim();
  const letterCount = (trimmed.match(/[A-Za-z\u0600-\u06FF\u0900-\u097F]/g) || []).length;
  return trimmed.length >= 120 && letterCount >= 60;
}

async function extractPdfText(fileBytes: Uint8Array, geminiApiKey: string): Promise<string> {
  try {
    const pdf = await getDocumentProxy(fileBytes);
    const { text } = await extractText(pdf, { mergePages: true });
    const nativeText = (text || "").trim();

    if (hasReadableText(nativeText)) {
      console.log(`[convert-document-mcqs] Native PDF extraction succeeded (${nativeText.length} chars)`);
      return nativeText;
    }

    console.warn(`[convert-document-mcqs] Native PDF extraction insufficient (${nativeText.length} chars), falling back to OCR`);
  } catch (error) {
    console.warn("[convert-document-mcqs] Native PDF extraction failed, falling back to OCR:", error);
  }

  const base64Pdf = uint8ToBase64(fileBytes);
  const ocrText = await callGeminiVision(
    geminiApiKey,
    "Extract ALL readable text from this PDF. Preserve question and option structure. Output only extracted text.",
    base64Pdf,
    "application/pdf",
    { maxOutputTokens: 32768 }
  );

  if (!hasReadableText(ocrText)) {
    throw new Error("PDF appears unreadable or has no extractable text.");
  }

  console.log(`[convert-document-mcqs] OCR PDF extraction succeeded (${ocrText.length} chars)`);
  return ocrText;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables (GEMINI_API_KEY)");
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

      const fileBytes = new Uint8Array(await fileResponse.arrayBuffer());
      const contentType = (fileResponse.headers.get("content-type") || "").toLowerCase();
      const isPdf = source_type === "pdf" || contentType.includes("application/pdf") || file_url.toLowerCase().includes(".pdf");

      if (isPdf) {
        documentText = await extractPdfText(fileBytes, GEMINI_API_KEY);
      } else {
        documentText = new TextDecoder().decode(fileBytes);
      }
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
    const systemPrompt = `You are an expert MCQ extractor. Your PRIMARY GOAL is to extract EVERY SINGLE question from the document.

CRITICAL INSTRUCTIONS:
1. Extract ALL questions - do not stop early
2. If there's an answer key at the end, match it with questions
3. Count total questions found
4. Handle questions split across pages
5. Ignore page numbers, headers, footers

AVAILABLE SUBJECTS IN SYSTEM:
${subjectsList}

AVAILABLE TOPICS PER SUBJECT:
${topicsList}

EXTRACTION RULES:
━━━━━━━━━━━━━━━━
1. Find EVERY question (Q1, Q2, 1., 2., Question 1:, etc.)
2. Extract ALL 4 options (A/B/C/D or 1/2/3/4)
3. Match correct answer from answer key if present
4. If answer key says "1. B", match it to Question 1
5. Continue until NO MORE questions found

DIFFICULTY CRITERIA:
- Easy: Basic recall, definitions, "What is...", "Which is..."
- Medium: Application, "Why...", "How...", multi-step
- Hard: Analysis, synthesis, "Evaluate...", "Compare..."

ANSWER VERIFICATION:
- Check if marked answer is logically correct
- Flag if answer seems wrong
- Provide brief reasoning

OUTPUT FORMAT (PURE JSON, NO MARKDOWN):
{
  "metadata": {
    "total_questions": <actual count>,
    "source_type": "${source_type}",
    "detected_subject": "Subject Name or null",
    "extraction_confidence": 0.95,
    "has_answer_key": true
  },
  "questions": [
    {
      "id": "q1",
      "question": "Which is the central control system of the body?",
      "options": {
        "A": "Heart",
        "B": "Brain",
        "C": "Lungs",
        "D": "Stomach"
      },
      "correct_option": "B",
      "explanation": "The brain controls all body functions",
      "subject_id": "matched-uuid-or-null",
      "suggested_subject": "Science",
      "topic_id": "matched-uuid-or-null",
      "suggested_topic": "Human Body",
      "difficulty": "Easy",
      "verified": true,
      "verification_note": "Correct - brain is the control center",
      "confidence": 0.98
    }
  ],
  "summary": {
    "total": <count>,
    "verified_correct": <count>,
    "flagged": <count>,
    "easy": <count>,
    "medium": <count>,
    "hard": <count>
  }
}

CRITICAL SUCCESS CRITERIA:
✓ Extract EVERY question (if document has 25, output must have 25)
✓ Match answer key correctly
✓ Classify by difficulty
✓ Verify each answer
✓ Return valid JSON only (no markdown)

EXAMPLE:
If document shows:
"1. Question text?
 A) Option 1
 B) Option 2
 C) Option 3
 D) Option 4
 
 Answer Key: 1. B"

Extract as:
{
  "id": "q1",
  "question": "Question text?",
  "options": {"A": "Option 1", "B": "Option 2", "C": "Option 3", "D": "Option 4"},
  "correct_option": "B"
}

DO NOT STOP until all questions are extracted!`;
    const userPrompt = `Extract ALL MCQ questions from this document.

IMPORTANT: 
- This document likely contains MULTIPLE questions (possibly 20-50+)
- Extract EVERY SINGLE ONE
- If you see "Answer Key" at the end, use it to match correct answers
- Count questions as you extract to ensure completeness

DOCUMENT TEXT:
${documentText}

REMINDER: Extract ALL questions found. Do not stop after a few!`;

    console.log(`[convert-document-mcqs] Calling Gemini API directly with ${documentText.length} chars of text`);

    let responseText: string;
    try {
      responseText = await retryWithBackoff(
        () => callGeminiText(GEMINI_API_KEY, systemPrompt, userPrompt, {
          temperature: 0.3,
          maxOutputTokens: 32768,
        }),
        4,
        'convert-document-mcqs'
      );
    } catch (aiErr: any) {
      const msg = aiErr.message || '';
      console.error(`[convert-document-mcqs] AI error:`, msg);
      if (msg.includes('RATE_LIMIT') || msg.includes('429')) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a few minutes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw aiErr;
    }

    // Robust JSON parsing
    let parsed: any;
    const cleanJson = (text: string): string => {
      // Remove markdown code blocks
      let cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      // Find JSON boundaries
      const jsonStart = cleaned.indexOf("{");
      const jsonEnd = cleaned.lastIndexOf("}");
      if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON object found in AI response");
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
      // Fix common issues
      cleaned = cleaned
        .replace(/,\s*}/g, "}")
        .replace(/,\s*]/g, "]")
        .replace(/[\x00-\x1F\x7F]/g, (ch) => ch === '\n' || ch === '\r' || ch === '\t' ? ch : "");
      return cleaned;
    };

    try {
      parsed = JSON.parse(responseText);
    } catch {
      try {
        const cleaned = cleanJson(responseText);
        parsed = JSON.parse(cleaned);
      } catch (e2) {
        // Attempt to repair truncated JSON
        try {
          let repaired = cleanJson(responseText);
          let openB = 0, closeB = 0, openA = 0, closeA = 0;
          for (const c of repaired) {
            if (c === '{') openB++; if (c === '}') closeB++;
            if (c === '[') openA++; if (c === ']') closeA++;
          }
          // Remove trailing comma before adding closers
          repaired = repaired.replace(/,\s*$/, "");
          while (closeA < openA) { repaired += ']'; closeA++; }
          while (closeB < openB) { repaired += '}'; closeB++; }
          parsed = JSON.parse(repaired);
          console.warn("[convert-document-mcqs] ⚠️ Repaired truncated JSON response");
        } catch {
          const aiPreview = responseText.replace(/\s+/g, " ").trim().substring(0, 500);
          console.error("[convert-document-mcqs] Raw AI response (first 500 chars):", responseText.substring(0, 500));
          return new Response(
            JSON.stringify({
              error: "AI returned non-JSON output. The document may be unreadable or extracted as binary data.",
              ai_response_preview: aiPreview,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    console.log(`[convert-document-mcqs] ✓ Extracted ${parsed.questions?.length || 0} questions`);

    // Extraction completeness sanity check
    if (parsed.questions && parsed.questions.length > 0) {
      const textLines = documentText.split('\n').length;
      if (parsed.questions.length < 5 && textLines > 100) {
        console.warn(`[convert-document-mcqs] ⚠️ WARNING: Only ${parsed.questions.length} questions extracted from ${textLines} lines of text. Document may need reprocessing.`);
      }
    }

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
