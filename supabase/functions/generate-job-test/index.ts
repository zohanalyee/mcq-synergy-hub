// Dedicated Job Test generator. Isolated from content_items.
// Reads syllabus + admin sample questions from job_test_definitions,
// generates fresh MCQs via Gemini, stores in job_test_questions
// (admin_approved=false), logs telemetry to job_test_generation_logs.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_BATCHES = 3;
const BATCH_SIZE = 10;
const DELAY_BETWEEN_BATCHES_MS = 2000;
const DAILY_LOG_CAP = 200; // per job_test_id

interface SyllabusSection {
  subject: string;
  percentage?: number;
  question_count: number;
  topics?: string[];
  style_guide?: string;
  forbidden?: string[];
}

interface SampleQ {
  question: string;
  options: Record<string, string>;
  correct?: string;
  correct_answer?: string;
  explanation?: string;
}

function getGeminiKeys(): string[] {
  const key1 = Deno.env.get("GEMINI_API_KEY");
  const key2 = Deno.env.get("EXTERNAL_JOBS_GEMINI_KEY");
  const key3 = Deno.env.get("LOVABLE_API_KEY");

  console.log(`[DEBUG] Checking API keys:`);
  console.log(`  GEMINI_API_KEY: ${key1 ? `Found (length: ${key1.length})` : "NOT FOUND"}`);
  console.log(`  EXTERNAL_JOBS_GEMINI_KEY: ${key2 ? `Found (length: ${key2.length})` : "NOT FOUND"}`);
  console.log(`  LOVABLE_API_KEY: ${key3 ? `Found (length: ${key3.length})` : "NOT FOUND"}`);

  const keys = [key1, key2, key3].filter((k): k is string => !!k && k.length > 10);
  console.log(`[DEBUG] Valid keys found: ${keys.length}`);

  if (keys.length === 0) {
    console.error("❌ CRITICAL: No Gemini API keys configured!");
    console.error("   Please set GEMINI_API_KEY in edge function secrets");
  }
  return keys;
}

async function callGemini(prompt: string): Promise<string> {
  const keys = getGeminiKeys();
  if (keys.length === 0) {
    const error = new Error(
      "No Gemini API key configured. Please add GEMINI_API_KEY to edge function secrets.",
    );
    console.error("❌", error.message);
    throw error;
  }

  console.log(`[DEBUG] Attempting Gemini call with ${keys.length} key(s)`);
  let lastErr: Error | null = null;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    try {
      console.log(`[DEBUG] Trying key ${i + 1}/${keys.length}...`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            topP: 0.95,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
          },
        }),
      });

      console.log(`[DEBUG] Gemini response status: ${res.status}`);

      if (!res.ok) {
        const txt = await res.text();
        console.error(`[DEBUG] Gemini error ${res.status}:`, txt.slice(0, 300));
        lastErr = new Error(`Gemini ${res.status}: ${txt.slice(0, 200)}`);
        continue;
      }

      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      // Surface safety/prompt feedback when text is missing
      if (!text) {
        const finishReason = json?.candidates?.[0]?.finishReason;
        const promptFeedback = json?.promptFeedback;
        console.warn(
          `[DEBUG] Empty response. finishReason=${finishReason}, promptFeedback=${JSON.stringify(promptFeedback || {}).slice(0, 200)}`,
        );
        lastErr = new Error(
          `Empty Gemini response (finishReason=${finishReason || "unknown"})`,
        );
        continue;
      }

      console.log(`[DEBUG] ✅ Gemini returned ${text.length} characters`);
      return text;
    } catch (e) {
      lastErr = e as Error;
      console.error(`[DEBUG] Key ${i + 1} threw:`, (e as Error).message);
    }
  }
  throw lastErr ?? new Error("Gemini failed");
}

function buildPrompt(
  section: SyllabusSection,
  samples: SampleQ[],
  count: number,
): string {
  const sampleBlock =
    samples.length > 0
      ? `\nREFERENCE SAMPLE QUESTIONS (match this style, format, and difficulty):\n${JSON.stringify(samples.slice(0, 3), null, 2)}\n`
      : "";

  const topicsBlock =
    section.topics && section.topics.length > 0
      ? `\nALLOWED TOPICS (only generate from these):\n${section.topics.map((t) => `- ${t}`).join("\n")}\n`
      : "";

  const styleBlock = section.style_guide
    ? `\nSTYLE GUIDE:\n${section.style_guide}\n`
    : "";

  const forbiddenBlock =
    section.forbidden && section.forbidden.length > 0
      ? `\nFORBIDDEN — DO NOT INCLUDE ANY of these:\n${section.forbidden.map((f) => `❌ ${f}`).join("\n")}\n`
      : "";

  return `You are generating MCQ questions for a Pakistani competitive exam (FPSC/PPSC/NTS standard).

SUBJECT: ${section.subject}
COUNT: ${count}
DIFFICULTY MIX: ~30% easy, 50% medium, 20% hard
${topicsBlock}${styleBlock}${forbiddenBlock}${sampleBlock}
HARD RULES:
1. Only generate questions on the allowed topics above.
2. NEVER include forbidden content. If unsure, skip.
3. Each question must have exactly 4 options labeled A, B, C, D.
4. correct_answer must be one of "A", "B", "C", "D".
5. Provide a concise explanation.
6. No duplicates.

Return ONLY a JSON array (no markdown), exactly this shape:
[
  {
    "question": "string",
    "options": {"A":"...","B":"...","C":"...","D":"..."},
    "correct_answer": "A",
    "explanation": "string",
    "difficulty": "easy" | "medium" | "hard",
    "topic": "string"
  }
]`;
}

function parseQuestions(text: string): any[] {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  }

  // 1) Try array first
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    try {
      const arr = JSON.parse(cleaned.slice(start, end + 1));
      if (Array.isArray(arr) && arr.length > 0) return arr;
    } catch (_e) {
      // fall through
    }
  }

  // 2) Try object wrapper { questions: [...] } / { data: [...] } / single MCQ
  try {
    const obj = JSON.parse(cleaned);
    if (obj && typeof obj === "object") {
      if (Array.isArray(obj.questions)) return obj.questions;
      if (Array.isArray(obj.data)) return obj.data;
      if (Array.isArray(obj.items)) return obj.items;
      if (obj.question && obj.options) return [obj];
    }
  } catch (_e) {
    // ignore
  }

  console.warn(
    `[parseQuestions] Could not extract questions. First 300 chars: ${cleaned.slice(0, 300)}`,
  );
  return [];
}

function isStructurallyValid(q: any): boolean {
  if (!q || typeof q !== "object") return false;
  if (!q.question || typeof q.question !== "string") return false;
  if (!q.options || typeof q.options !== "object") return false;
  for (const k of ["A", "B", "C", "D"]) {
    if (!q.options[k] || typeof q.options[k] !== "string") return false;
  }
  if (!["A", "B", "C", "D"].includes(q.correct_answer)) return false;
  if (!q.explanation || typeof q.explanation !== "string") return false;
  return true;
}

function passesForbiddenCheck(q: any, forbidden: string[]): {
  ok: boolean;
  matched?: string;
} {
  if (!forbidden || forbidden.length === 0) return { ok: true };
  const haystack = `${q.question} ${Object.values(q.options).join(" ")} ${q.explanation || ""}`.toLowerCase();
  for (const rule of forbidden) {
    const lower = rule.toLowerCase().trim();
    if (!lower) continue;
    // Extract parenthetical keywords if present
    const parenMatch = lower.match(/\(([^)]+)\)/);
    const tokens: string[] = [];
    if (parenMatch) {
      tokens.push(...parenMatch[1].split(",").map((t) => t.trim()).filter(Boolean));
    }
    // Also use the main word(s) outside the parens, stripped of common prefixes
    const main = lower.replace(/\([^)]*\)/g, "").replace(/^(no |avoid |never )/g, "").trim();
    if (main) tokens.push(main);
    for (const tok of tokens) {
      if (tok.length < 3) continue;
      if (haystack.includes(tok)) return { ok: false, matched: rule };
    }
  }
  return { ok: true };
}

async function generateForSection(
  supabase: any,
  jobTestId: string,
  section: SyllabusSection,
  samples: SampleQ[],
  batchNumber: number,
) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`[GENERATE] Subject: ${section.subject}`);
  console.log(`[GENERATE] Target: ${section.question_count || 10} | Samples: ${samples.length} | Forbidden rules: ${(section.forbidden || []).length}`);
  console.log(`${"=".repeat(60)}`);

  const startedAt = Date.now();
  const target = section.question_count || 10;
  const accepted: any[] = [];
  const rejectionReasons: Record<string, number> = {};
  let apiCalls = 0;
  let generated = 0;
  let stopEarly = false;

  for (let batch = 0; batch < MAX_BATCHES && accepted.length < target && !stopEarly; batch++) {
    const remaining = target - accepted.length;
    const want = Math.min(BATCH_SIZE, remaining);
    const prompt = buildPrompt(section, samples, want);

    console.log(`[BATCH ${batch + 1}/${MAX_BATCHES}] Requesting ${want} questions...`);

    let raw = "";
    try {
      raw = await callGemini(prompt);
      apiCalls++;
      console.log(`[BATCH ${batch + 1}] ✅ API call OK (${raw.length} chars)`);
    } catch (e) {
      const msg = (e as Error).message;
      console.error(`[BATCH ${batch + 1}] ❌ Gemini error:`, msg);
      rejectionReasons["gemini_error"] = (rejectionReasons["gemini_error"] || 0) + 1;
      if (msg.includes("API key")) {
        console.error("❌ STOPPING: API key issue detected");
        stopEarly = true;
      }
      continue;
    }

    const parsed = parseQuestions(raw);
    generated += parsed.length;
    console.log(`[BATCH ${batch + 1}] Parsed ${parsed.length} questions from response`);

    for (const q of parsed) {
      if (accepted.length >= target) break;
      if (!isStructurallyValid(q)) {
        rejectionReasons["invalid_structure"] = (rejectionReasons["invalid_structure"] || 0) + 1;
        continue;
      }
      const fb = passesForbiddenCheck(q, section.forbidden || []);
      if (!fb.ok) {
        const key = `forbidden:${fb.matched}`;
        rejectionReasons[key] = (rejectionReasons[key] || 0) + 1;
        continue;
      }
      accepted.push({
        job_test_id: jobTestId,
        subject: section.subject,
        topic: q.topic || null,
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        difficulty: ["easy", "medium", "hard"].includes(q.difficulty)
          ? q.difficulty
          : "medium",
        generation_batch: batchNumber,
        admin_approved: false,
      });
    }

    console.log(`[BATCH ${batch + 1}] Accepted so far: ${accepted.length}/${target}`);

    if (batch < MAX_BATCHES - 1 && accepted.length < target && !stopEarly) {
      await new Promise((r) => setTimeout(r, DELAY_BETWEEN_BATCHES_MS));
    }
  }

  let inserted: any[] = [];
  if (accepted.length > 0) {
    const { data, error } = await supabase
      .from("job_test_questions")
      .insert(accepted)
      .select("id");
    if (error) {
      console.error(`[INSERT] ❌ Failed to insert questions:`, error.message);
    } else if (data) {
      inserted = data;
      console.log(`[INSERT] ✅ Inserted ${inserted.length} questions`);
    }
  }

  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  const status =
    accepted.length === 0
      ? "failed"
      : accepted.length < target
        ? "partial"
        : "success";

  await supabase.from("job_test_generation_logs").insert({
    job_test_id: jobTestId,
    subject: section.subject,
    requested_count: target,
    difficulty: "mixed",
    generated_count: generated,
    accepted_count: accepted.length,
    rejected_count: generated - accepted.length,
    rejection_reasons: rejectionReasons,
    api_calls_made: apiCalls,
    generation_time_seconds: elapsed,
    status,
    error_message:
      status === "failed" ? "No questions accepted after retries" : null,
  });

  console.log(`\n[COMPLETE] ${section.subject}`);
  console.log(`  status=${status} requested=${target} generated=${generated} accepted=${accepted.length} api_calls=${apiCalls} time=${elapsed}s`);
  if (Object.keys(rejectionReasons).length > 0) {
    console.log(`  rejections=${JSON.stringify(rejectionReasons)}`);
  }

  return {
    subject: section.subject,
    requested: target,
    generated,
    accepted: accepted.length,
    inserted: inserted.length,
    status,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    const { job_test_id, subject } = body as {
      job_test_id?: string;
      subject?: string;
    };

    console.log(`\n[REQUEST] generate-job-test job_test_id=${job_test_id} subject=${subject || "(all)"}`);

    if (!job_test_id) {
      return new Response(
        JSON.stringify({ error: "job_test_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Daily cap check (ad-hoc, not a hardened rate limiter)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: dailyCount } = await supabase
      .from("job_test_generation_logs")
      .select("id", { count: "exact", head: true })
      .eq("job_test_id", job_test_id)
      .gte("created_at", since);

    if ((dailyCount ?? 0) >= DAILY_LOG_CAP) {
      return new Response(
        JSON.stringify({
          error: "Daily generation cap reached for this job test",
          daily_cap: DAILY_LOG_CAP,
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: def, error: defErr } = await supabase
      .from("job_test_definitions")
      .select("*")
      .eq("id", job_test_id)
      .single();

    if (defErr || !def) {
      return new Response(
        JSON.stringify({ error: "Job test definition not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const sections: SyllabusSection[] =
      (def.syllabus?.sections as SyllabusSection[]) || [];
    const targetSections = subject
      ? sections.filter((s) => s.subject === subject)
      : sections;

    if (targetSections.length === 0) {
      return new Response(
        JSON.stringify({ error: "No matching sections in syllabus" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const samplesAll = (def.sample_questions || {}) as Record<string, SampleQ[]>;
    const batchNumber = Math.floor(Date.now() / 1000);
    const results = [];

    for (const section of targetSections) {
      const samples = samplesAll[section.subject] || [];
      const r = await generateForSection(
        supabase,
        job_test_id,
        section,
        samples,
        batchNumber,
      );
      results.push(r);
      // brief pause between sections
      await new Promise((r) => setTimeout(r, 500));
    }

    const totalAccepted = results.reduce((s, r) => s + r.accepted, 0);
    console.log(`\n[REQUEST DONE] total_accepted=${totalAccepted} sections=${results.length}`);
    console.log(`  per-section: ${JSON.stringify(results.map(r => ({ s: r.subject, a: r.accepted, st: r.status })))}`);

    return new Response(
      JSON.stringify({
        success: true,
        job_test_id,
        results,
        total_accepted: totalAccepted,
        needs_review: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[generate-job-test] error:", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
