// Dedicated Job Test generator. Isolated from content_items.
// Reads syllabus + admin sample questions from job_test_definitions,
// generates fresh MCQs via Gemini, stores in job_test_questions
// (admin_approved=false), logs telemetry to job_test_generation_logs.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { callAIWithAutoSwitch } from "../_shared/gemini.ts";
import { checkStemStyle, stemStyleRules } from "../_shared/stemStyle.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Verify admin authorization (or service-role caller for cron/agent jobs)
async function verifyAdmin(req: Request, supabase: any): Promise<{ authorized: boolean; userId?: string; error?: string }> {
  const authHeader = req.headers.get("Authorization");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceKey && authHeader?.includes(serviceKey)) {
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


const MAX_BATCHES = 5; // Allow up to ~50 questions (5 × 10)
const BATCH_SIZE = 10;
const DELAY_BETWEEN_BATCHES_MS = 2000;
const DAILY_LOG_CAP = 200; // per job_test_id

// Phase 7 — Pakistan Grounding Upgrade.
// Explicit system instruction so the AI always reasons about Pakistan's
// federal/provincial recruitment exams — never US SAT, UK GCSE, or any
// foreign curriculum. Used as the Gemini systemInstruction for every batch.
const PAKISTAN_GROUNDING_SYSTEM = `You are an expert question setter for PAKISTAN recruitment and competitive examinations.

You MUST ground every question in the Pakistani context: Pakistani laws, institutions, geography, history, current affairs, Islamiat, Pakistan Studies, and the official syllabi of Pakistani testing bodies.

You understand the style, difficulty, and subject coverage of these Pakistani recruitment exams:
- FIA (Federal Investigation Agency)
- ASF (Airport Security Force)
- ANF (Anti-Narcotics Force)
- NAB (National Accountability Bureau)
- FBR (Federal Board of Revenue)
- Sindh High Court (SHC) recruitment tests
- BPSC (Balochistan Public Service Commission)
- STS (Sindh Testing Service)
- SPSC (Sindh Public Service Commission)
- PTS (Pakistan Testing Service)
- plus FPSC, PPSC, NTS and similar national/provincial bodies.

STRICT GROUNDING RULES:
1. NEVER produce questions based on US SAT, UK GCSE, A-Levels, or any non-Pakistani curriculum.
2. Use Pakistani spellings, currency (PKR), measurement conventions, and local examples.
3. For GK/Current Affairs/Pakistan Studies, prioritize Pakistan-specific facts.
4. Match the tone and rigor of official Pakistani recruitment papers.`;

// Map a job-test context to the closest known Pakistani exam body for the prompt.
const JOB_EXAM_KEYWORDS: { label: string; re: RegExp }[] = [
  { label: "FIA (Federal Investigation Agency)", re: /\bfia\b|federal investigation/i },
  { label: "ASF (Airport Security Force)", re: /\basf\b|airport security/i },
  { label: "ANF (Anti-Narcotics Force)", re: /\banf\b|anti[- ]?narcotics/i },
  { label: "NAB (National Accountability Bureau)", re: /\bnab\b|national accountability/i },
  { label: "FBR (Federal Board of Revenue)", re: /\bfbr\b|federal board of revenue|inland revenue/i },
  { label: "Sindh High Court", re: /sindh high court|\bshc\b/i },
  { label: "BPSC (Balochistan Public Service Commission)", re: /\bbpsc\b|balochistan public service/i },
  { label: "SPSC (Sindh Public Service Commission)", re: /\bspsc\b|sindh public service/i },
  { label: "STS (Sindh Testing Service)", re: /\bsts\b|sindh testing/i },
  { label: "PTS (Pakistan Testing Service)", re: /\bpts\b|pakistan testing/i },
  { label: "FPSC (Federal Public Service Commission)", re: /\bfpsc\b|federal public service/i },
  { label: "PPSC (Punjab Public Service Commission)", re: /\bppsc\b|punjab public service/i },
  { label: "NTS (National Testing Service)", re: /\bnts\b|national testing/i },
];

function inferJobExam(...parts: (string | null | undefined)[]): string | undefined {
  const blob = parts.filter(Boolean).join(" ");
  if (!blob.trim()) return undefined;
  for (const { label, re } of JOB_EXAM_KEYWORDS) {
    if (re.test(blob)) return label;
  }
  return undefined;
}

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

async function callGemini(prompt: string): Promise<string> {
  console.log(`[AI] Calling auto-switcher (Gemini → Lovable Gateway fallback)...`);
  try {
    // Phase 7 — pass Pakistan grounding as the systemInstruction.
    const { text, provider, cost } = await callAIWithAutoSwitch(PAKISTAN_GROUNDING_SYSTEM, prompt, {
      temperature: 0.8,
      maxOutputTokens: 8000,
    });
    console.log(`[AI] ✅ provider=${provider} cost=${cost} chars=${text.length}`);
    return text;
  } catch (e) {
    const msg = (e as Error).message || 'unknown';
    console.error(`[AI] ❌ auto-switch failed: ${msg.slice(0, 200)}`);
    throw e;
  }
}

function buildPrompt(
  section: SyllabusSection,
  samples: SampleQ[],
  count: number,
  examLabel?: string,
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

  const examLine = examLabel
    ? `TARGET EXAM: ${examLabel} — a Pakistani recruitment exam. Match its real syllabus and difficulty.`
    : `TARGET EXAM: Pakistani recruitment exam (FPSC/PPSC/NTS standard).`;

  return `You are generating MCQ questions for a Pakistani competitive exam (FPSC/PPSC/NTS standard).

${examLine}
SUBJECT: ${section.subject}
COUNT: ${count}
DIFFICULTY MIX: ~30% easy, 50% medium, 20% hard
${topicsBlock}${styleBlock}${forbiddenBlock}${sampleBlock}
${stemStyleRules(section.subject)}

HARD RULES:
1. Only generate questions on the allowed topics above.
2. NEVER include forbidden content. If unsure, skip.
3. Each question must have exactly 4 options labeled A, B, C, D.
4. correct_answer must be one of "A", "B", "C", "D".
5. Provide a concise explanation.
6. No duplicates.
7. Pakistan context only — never US SAT, UK GCSE, or foreign curriculum.
8. Obey the STEM STYLE RULES above — a long passage-style stem is an automatic reject.


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
  examLabel?: string,
  /** Absolute desired pool size for THIS section (Phase 1 pool growth). */
  growTarget?: number,
) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`[GENERATE] Subject: ${section.subject}`);
  console.log(`[GENERATE] Target: ${section.question_count || 10} | Samples: ${samples.length} | Forbidden rules: ${(section.forbidden || []).length}`);
  console.log(`${"=".repeat(60)}`);

  const startedAt = Date.now();
  const target = section.question_count || 10;

  // ===== Phase 3.5 — Rotation-pool multiplier =====
  // AI generation is still gated by `target` (aiDeficit = target - existing).
  // Cross-source REUSE goes further: it enriches the underlying pool up to
  // ceil(target * pool_multiplier) so repeat attempts have variety to rotate
  // through, instead of drawing from the same fixed target-sized set.
  let poolMultiplier = 2.0;
  // Exam TIER of this test — reuse must stay inside the same tier so a
  // CSS-level comprehension item never lands in a BPS-13 clerical paper.
  let targetTier: ExamTier = "clerical";
  try {
    const { data: defRow } = await supabase
      .from("job_test_definitions")
      .select("pool_multiplier, job_title, department, exam_tier")
      .eq("id", jobTestId)
      .maybeSingle();
    const raw = Number(defRow?.pool_multiplier);
    if (Number.isFinite(raw) && raw >= 1) poolMultiplier = raw;
    targetTier = isExamTier(defRow?.exam_tier)
      ? defRow.exam_tier
      : tierForJobTest(defRow?.job_title, defRow?.department);
  } catch (_e) { /* fall back to 2.0 / clerical */ }
  console.log(`[TIER] ${section.subject}: target tier = ${targetTier}`);
  const poolTarget = Math.ceil(target * poolMultiplier);


  // ===== Phase 1 — Growth target =====
  // Popular tests must be able to grow their pool BEYOND the exam-share target,
  // otherwise a 100-Q test with 200 questions never generates again and users
  // keep seeing repeats. `growTarget` (admin "Grow pool" / queue row) wins;
  // otherwise we fall back to the rotation pool (target × pool_multiplier).
  const desiredPool = Math.max(
    target,
    growTarget && growTarget > 0 ? Math.ceil(growTarget) : poolTarget,
  );

  // ===== DB PRECHECK (reuse-first) =====
  let existingApproved = 0;
  let existingTotal = 0;
  try {
    const { count } = await supabase
      .from("job_test_questions")
      .select("id", { count: "exact", head: true })
      .eq("job_test_id", jobTestId)
      .eq("subject", section.subject)
      .eq("admin_approved", true);
    existingApproved = count ?? 0;
    const { count: totalCount } = await supabase
      .from("job_test_questions")
      .select("id", { count: "exact", head: true })
      .eq("job_test_id", jobTestId)
      .eq("subject", section.subject);
    existingTotal = totalCount ?? existingApproved;
  } catch (e) {
    console.warn(`[PRECHECK] count failed for ${section.subject}:`, (e as Error).message);
  }

  // AI trigger counts drafts too, so repeated runs never re-generate questions
  // that are already sitting in the approval queue.
  const deficit = Math.max(0, desiredPool - existingTotal);
  const reuseNeed = Math.max(0, desiredPool - existingApproved); // reuse enrichment
  console.log(
    `[PRECHECK] ${section.subject}: existing_approved=${existingApproved} existing_total=${existingTotal} target=${target} pool_target=${poolTarget} desired_pool=${desiredPool} ai_deficit=${deficit} reuse_need=${reuseNeed}`,
  );


  // ===== PHASE 3 — Cross-source LINK-only reuse layer =====
  // Runs whenever reuseNeed>0 (even when AI deficit=0), so the pool keeps
  // growing beyond the target for rotation variety.
  //
  // Subject-alias map: equivalent section names across tests (e.g. "General
  // Knowledge" vs "General Knowledge (Pakistan & Current Affairs)") share one
  // canonical pool, so court/clerk posts with overlapping syllabi reuse each
  // other's questions instead of paying AI twice. Display names never change.
  let subjectPool: string[] = [section.subject];
  try {
    const { data: aliasRows, error: aliasErr } = await supabase.rpc("get_subject_aliases", {
      p_subject: section.subject,
    });
    if (!aliasErr && Array.isArray(aliasRows) && aliasRows.length > 0) {
      const names = aliasRows
        .map((r: any) => (typeof r === "string" ? r : r?.subject))
        .filter((s: any): s is string => typeof s === "string" && s.trim().length > 0);
      if (names.length > 0) subjectPool = Array.from(new Set(names));
    }
  } catch (e) {
    console.warn(`[REUSE] alias lookup failed:`, (e as Error).message);
  }
  if (subjectPool.length > 1) {
    console.log(`[REUSE] ${section.subject}: alias pool = ${subjectPool.join(" | ")}`);
  }

  const seenGroups = new Set<string>();

  let crossReused = 0;
  const reuseInsertRows: any[] = [];
  const ciSourceIdsToBump: string[] = [];
  const jtqSourceIdsToBump: string[] = [];

  const { data: existingRows } = await supabase
    .from("job_test_questions")
    .select("question, concept_group_id")
    .eq("job_test_id", jobTestId)
    .eq("subject", section.subject);
  const existingQuestions = new Set(
    (existingRows || []).map((r: any) => String(r.question || "").trim().toLowerCase()),
  );
  for (const r of existingRows || []) {
    if (r.concept_group_id) seenGroups.add(r.concept_group_id);
  }

  const need = reuseNeed;

  // (a) content_items pool
  try {
    const { data: ciPool } = await supabase
      .from("content_items")
      .select("id, title, options, correct_option, explanation, difficulty, topic, concept_group_id")
      .eq("category", "mcq")
      .eq("status", "approved")
      .in("subject", subjectPool)
      .order("usage_count", { ascending: true, nullsFirst: true })
      .order("last_used_at", { ascending: true, nullsFirst: true })
      .limit(need * 4);

    for (const row of ciPool || []) {
      if (reuseInsertRows.length >= need) break;
      const qtext = String(row.title || "").trim();
      if (!qtext) continue;
      if (existingQuestions.has(qtext.toLowerCase())) continue;
      if (row.concept_group_id && seenGroups.has(row.concept_group_id)) continue;
      const opts = row.options || {};
      if (!opts.A || !opts.B || !opts.C || !opts.D) continue;
      const correct = String(row.correct_option || "").toUpperCase();
      if (!["A", "B", "C", "D"].includes(correct)) continue;
      const diff = ["easy", "medium", "hard"].includes(String(row.difficulty || "").toLowerCase())
        ? String(row.difficulty).toLowerCase()
        : "medium";
      reuseInsertRows.push({
        job_test_id: jobTestId,
        subject: section.subject,
        topic: row.topic || null,
        question: qtext,
        options: opts,
        correct_answer: correct,
        explanation: row.explanation || "",
        difficulty: diff,
        generation_batch: batchNumber,
        admin_approved: true,
        concept_group_id: row.concept_group_id || null,
        reused_from_content_item_id: row.id,
      });
      existingQuestions.add(qtext.toLowerCase());
      if (row.concept_group_id) seenGroups.add(row.concept_group_id);
      ciSourceIdsToBump.push(row.id);
    }
  } catch (e) {
    console.warn(`[REUSE] CI pool query failed:`, (e as Error).message);
  }

  // (b) other-job-test JTQ pool
  if (reuseInsertRows.length < need) {
    try {
      const { data: jtqPool } = await supabase
        .from("job_test_questions")
        .select("id, question, options, correct_answer, explanation, difficulty, topic, concept_group_id")
        .eq("admin_approved", true)
        .in("subject", subjectPool)
        .neq("job_test_id", jobTestId)
        .order("usage_count", { ascending: true, nullsFirst: true })
        .order("last_used_at", { ascending: true, nullsFirst: true })
        .limit(need * 4);

      for (const row of jtqPool || []) {
        if (reuseInsertRows.length >= need) break;
        const qtext = String(row.question || "").trim();
        if (!qtext) continue;
        if (existingQuestions.has(qtext.toLowerCase())) continue;
        if (row.concept_group_id && seenGroups.has(row.concept_group_id)) continue;
        const opts = row.options || {};
        if (!opts.A || !opts.B || !opts.C || !opts.D) continue;
        const correct = String(row.correct_answer || "").toUpperCase();
        if (!["A", "B", "C", "D"].includes(correct)) continue;
        const diff = ["easy", "medium", "hard"].includes(String(row.difficulty || "").toLowerCase())
          ? String(row.difficulty).toLowerCase()
          : "medium";
        reuseInsertRows.push({
          job_test_id: jobTestId,
          subject: section.subject,
          topic: row.topic || null,
          question: qtext,
          options: opts,
          correct_answer: correct,
          explanation: row.explanation || "",
          difficulty: diff,
          generation_batch: batchNumber,
          admin_approved: true,
          concept_group_id: row.concept_group_id || null,
          reused_from_content_item_id: null,
        });
        existingQuestions.add(qtext.toLowerCase());
        if (row.concept_group_id) seenGroups.add(row.concept_group_id);
        jtqSourceIdsToBump.push(row.id);
      }
    } catch (e) {
      console.warn(`[REUSE] JTQ pool query failed:`, (e as Error).message);
    }
  }

  if (reuseInsertRows.length > 0) {
    const { error: reuseErr } = await supabase
      .from("job_test_questions")
      .insert(reuseInsertRows);
    if (reuseErr) {
      console.error(`[REUSE] insert failed:`, reuseErr.message);
    } else {
      crossReused = reuseInsertRows.length;
      console.log(`[REUSE] ✅ ${section.subject}: linked ${crossReused} question(s) from cross-source pool`);
      // Bump usage counters on all source rows (dual-source RPC handles both banks).
      const allSourceIds = [...ciSourceIdsToBump, ...jtqSourceIdsToBump];
      if (allSourceIds.length > 0) {
        try {
          await supabase.rpc("record_question_usage", { question_ids: allSourceIds });
        } catch (_e) { /* ignore */ }
      }
    }
  }

  const aiDeficit = Math.max(0, deficit - crossReused);
  if (aiDeficit === 0) {
    await supabase.from("job_test_generation_logs").insert({
      job_test_id: jobTestId,
      subject: section.subject,
      requested_count: deficit,
      difficulty: "mixed",
      generated_count: 0,
      accepted_count: 0,
      rejected_count: 0,
      rejection_reasons: { reused_from_db: existingApproved, cross_reused: crossReused },
      api_calls_made: 0,
      generation_time_seconds: 0,
      status: "success",
      error_message: null,
    });
    console.log(`[REUSE] ✅ ${section.subject}: full deficit covered by cross-source reuse, AI skipped`);
    return {
      subject: section.subject,
      requested: target,
      generated: 0,
      accepted: 0,
      inserted: crossReused,
      reused: existingApproved,
      cross_reused: crossReused,
      status: "reused",
    };
  }

  const accepted: any[] = [];
  const rejectionReasons: Record<string, number> = {};
  let apiCalls = 0;
  let generated = 0;
  let stopEarly = false;

  for (let batch = 0; batch < MAX_BATCHES && accepted.length < aiDeficit && !stopEarly; batch++) {
    const remaining = aiDeficit - accepted.length;
    const want = Math.min(BATCH_SIZE, remaining);
    const prompt = buildPrompt(section, samples, want, examLabel);

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
      if (accepted.length >= aiDeficit) break;
      if (!isStructurallyValid(q)) {
        rejectionReasons["invalid_structure"] = (rejectionReasons["invalid_structure"] || 0) + 1;
        continue;
      }
      // Genre guard: kill essay/comprehension-style stems before they hit the DB.
      const style = checkStemStyle(q.question, section.subject);
      if (!style.ok) {
        const key = `style:${style.reason}`;
        rejectionReasons[key] = (rejectionReasons[key] || 0) + 1;
        console.warn(
          `[STYLE] ❌ ${section.subject}: ${style.reason} (${style.length}/${style.limit}) — "${String(q.question).slice(0, 80)}"`,
        );
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

    console.log(`[BATCH ${batch + 1}] Accepted so far: ${accepted.length}/${aiDeficit}`);

    if (batch < MAX_BATCHES - 1 && accepted.length < aiDeficit && !stopEarly) {
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
    accepted.length === 0 && crossReused === 0
      ? "failed"
      : accepted.length < aiDeficit
        ? "partial"
        : "success";

  await supabase.from("job_test_generation_logs").insert({
    job_test_id: jobTestId,
    subject: section.subject,
    requested_count: deficit,
    difficulty: "mixed",
    generated_count: generated,
    accepted_count: accepted.length,
    rejected_count: generated - accepted.length,
    rejection_reasons: { ...rejectionReasons, reused_from_db: existingApproved, cross_reused: crossReused },
    api_calls_made: apiCalls,
    generation_time_seconds: elapsed,
    status,
    error_message:
      status === "failed" ? "No questions accepted after retries" : null,
  });

  console.log(`\n[COMPLETE] ${section.subject}`);
  console.log(`  status=${status} target=${target} reused=${existingApproved} cross_reused=${crossReused} ai_deficit=${aiDeficit} generated=${generated} accepted=${accepted.length} api_calls=${apiCalls} time=${elapsed}s`);
  if (Object.keys(rejectionReasons).length > 0) {
    console.log(`  rejections=${JSON.stringify(rejectionReasons)}`);
  }

  return {
    subject: section.subject,
    requested: target,
    generated,
    accepted: accepted.length,
    inserted: inserted.length + crossReused,
    reused: existingApproved,
    cross_reused: crossReused,
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

    // Auth gate: only admins or service-role callers may trigger AI generation
    const auth = await verifyAdmin(req, supabase);
    if (!auth.authorized) {
      console.warn(`[generate-job-test] unauthorized: ${auth.error}`);
      return new Response(
        JSON.stringify({ error: auth.error || "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      job_test_id,
      subject,
      triggering_user_id,
      topup_reason,
      grow_target,
      grow_multiplier,
    } = body as {
      job_test_id?: string;
      subject?: string;
      triggering_user_id?: string;
      topup_reason?: string;
      /** Absolute desired pool for the requested subject. */
      grow_target?: number;
      /** Pool multiple of each section's exam-share target (e.g. 5 = 5×). */
      grow_multiplier?: number;
    };

    console.log(`\n[REQUEST] generate-job-test job_test_id=${job_test_id} subject=${subject || "(all)"} grow_target=${grow_target ?? "-"} grow_multiplier=${grow_multiplier ?? "-"} topup=${topup_reason || "(none)"} user=${triggering_user_id || "(none)"}`);


    if (!job_test_id) {
      return new Response(
        JSON.stringify({ error: "job_test_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Phase 4b — per-user AI top-up guardrail
    const isUserTopup = !!triggering_user_id && !!topup_reason;
    if (isUserTopup) {
      const { data: gate, error: gateErr } = await supabase.rpc("can_user_topup", {
        p_user_id: triggering_user_id,
        p_job_test_id: job_test_id,
        p_subject: subject ?? null,
      });
      if (gateErr) {
        console.warn("[topup] can_user_topup rpc error:", gateErr.message);
      }
      const allowed = (gate as any)?.allowed === true;
      if (!allowed) {
        console.log(`[topup] blocked user=${triggering_user_id} reason=${(gate as any)?.reason}`);
        return new Response(
          JSON.stringify({
            success: false,
            skipped: true,
            reason: "topup_blocked",
            gate,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
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
    // Phase 7 — infer the Pakistani exam body from the definition for grounding.
    const examLabel = inferJobExam(def.job_title, def.department);
    console.log(`[GROUNDING] exam=${examLabel || "(generic Pakistan recruitment)"}`);
    const results = [];

    for (const section of targetSections) {
      const samples = samplesAll[section.subject] || [];
      const sectionTarget = section.question_count || 10;
      const sectionGrow =
        subject && grow_target && grow_target > 0
          ? grow_target
          : grow_multiplier && grow_multiplier > 0
            ? Math.ceil(sectionTarget * grow_multiplier)
            : undefined;
      const r = await generateForSection(
        supabase,
        job_test_id,
        section,
        samples,
        batchNumber,
        examLabel,
        sectionGrow,
      );

      results.push(r);
      // brief pause between sections
      await new Promise((r) => setTimeout(r, 500));
    }

    const totalAccepted = results.reduce((s, r) => s + r.accepted, 0);
    const totalReused = results.reduce((s, r) => s + (r.reused || 0), 0);
    const totalCrossReused = results.reduce((s, r: any) => s + (r.cross_reused || 0), 0);
    console.log(`\n[REQUEST DONE] total_accepted=${totalAccepted} total_reused=${totalReused} cross_reused=${totalCrossReused} sections=${results.length}`);
    console.log(`  per-section: ${JSON.stringify(results.map((r: any) => ({ s: r.subject, a: r.accepted, reused: r.reused || 0, cross: r.cross_reused || 0, st: r.status })))}`);

    // Phase 4b — log this run against the triggering user's top-up ledger
    if (isUserTopup) {
      const totalRequested = results.reduce((s, r: any) => s + (r.requested || r.accepted || 0), 0);
      await supabase.from("user_ai_topup_log").insert({
        user_id: triggering_user_id!,
        job_test_id,
        subject: subject ?? null,
        reason: topup_reason ?? "user_exhausted",
        questions_requested: totalRequested,
        questions_saved: totalAccepted,
        success: totalAccepted > 0,
        metadata: {
          sections: results.length,
          reused: totalReused,
          cross_reused: totalCrossReused,
        },
      }).then(({ error }) => {
        if (error) console.warn("[topup] log insert failed:", error.message);
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        job_test_id,
        exam_grounding: examLabel || "generic_pakistan_recruitment",
        results,
        total_accepted: totalAccepted,
        total_reused: totalReused,
        total_cross_reused: totalCrossReused,
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
