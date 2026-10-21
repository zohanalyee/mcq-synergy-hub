// Mock-test Question Quality Gate (Batch 4B, checker v2 in Batch 8.1).
// Writes ONLY to question_quality_reviews / quality_job_runs. Never edits or
// deletes live questions. AI: free Gemini keys only (allowPaidFallback: false).
//
// Two actions:
//  - { action: 'sweep' }  one test per call, no AI: saves the v2 no-AI checks.
//  - default (cron/admin) small AI run: no-AI checks are saved FIRST, then at most
//    10 questions / 2 AI calls / ~60 s, rotating across Wave tests.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callAIWithAutoSwitch } from '../_shared/gemini.ts';
import { CHECKER_VERSION, LETTERS, correctLetter, normalizeOptions, isNumericSubject, strictVerdict, noAiReview } from '../_shared/qualityChecks.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-token',
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const PER_RUN = 10;
const MAX_AI_CALLS = 2;
const TIME_BUDGET_MS = 60_000;
const LEASE_MS = 5 * 60_000;

const SYSTEM = `You are an independent exam-question solver for Pakistani competitive and admission tests.
For each numbered MCQ, first solve it yourself WITHOUT looking at the stated key, and choose the single best option letter.
If you are not confident or the question is defective, use "?" as the answer.
Then check every option: list ALL option letters that are correct or acceptable ("correct_options").
Exactly one option should be correct; list more than one if two or more are defensibly correct (e.g. several synonyms/antonyms, two grammatical sentences, "data was/were").
Then compare with the stated key: "key_matches" is true only if the stated key is the one correct option.
Then read the explanation: "explanation_agrees" is false if its own reasoning points to a different option than the stated key, or if it is factually wrong.
Also choose the closest topic from the provided topic list (exact text), a difficulty (easy|medium|hard),
and whether the question is relevant to that syllabus (true|false).
Return ONLY a JSON array: [{"index":1,"answer":"B","correct_options":["B"],"key_matches":true,"explanation_agrees":true,"topic":"...","difficulty":"medium","relevant":true}]`;

async function getSetting(admin: any, key: string, fallback: any) {
  const { data } = await admin.from('system_settings').select('value').eq('key', key).maybeSingle();
  return data?.value ?? fallback;
}
function parseArray(text: string): any[] {
  const c = text.replace(/```json/gi, '').replace(/```/g, '');
  const s = c.indexOf('['), e = c.lastIndexOf(']');
  if (s < 0 || e < 0) return [];
  try { const p = JSON.parse(c.slice(s, e + 1)); return Array.isArray(p) ? p : []; } catch { return []; }
}
async function pageAll(build: (f: number, t: number) => any) {
  const out: any[] = [];
  for (let f = 0; ; f += 1000) {
    const { data, error } = await build(f, f + 999);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < 1000) return out;
  }
}

/** Save v2 no-AI rows for every question of a test that has none yet. Idempotent. */
async function ensureNoAi(admin: any, def: string) {
  const [qs, v2, v1, topics] = await Promise.all([
    pageAll((f, t) => admin.from('job_test_questions').select('id, question, options, correct_answer, explanation, subject, topic').eq('job_test_id', def).order('created_at').order('id').range(f, t)),
    pageAll((f, t) => admin.from('question_quality_reviews').select('question_id').eq('definition_id', def).eq('checker_version', CHECKER_VERSION).range(f, t)),
    pageAll((f, t) => admin.from('question_quality_reviews').select('question_id, ai_verdict, ai_answers, ai_topic, ai_topic_tier, ai_difficulty, relevant').eq('definition_id', def).lt('checker_version', CHECKER_VERSION).range(f, t)),
    admin.from('quality_syllabus_topics').select('topic, is_banned').eq('definition_id', def).then((r: any) => r.data ?? []),
  ]);
  const have = new Set(v2.map((r: any) => r.question_id));
  const old = new Map(v1.map((r: any) => [r.question_id, r]));
  const banned = topics.filter((x: any) => x.is_banned).map((x: any) => x.topic);
  const now = new Date().toISOString();
  const rows = noAiReview(qs, banned).filter((r) => !have.has(r.question_id)).map((r) => {
    const row: any = { ...r, definition_id: def, checker_version: CHECKER_VERSION, signal_flags: [], checked_at: now };
    const o: any = old.get(r.question_id);
    // Carry an earlier needs_review/fail verdict over (still bad under v3). Earlier passes are
    // re-checked with the stricter v3 prompt — free keys only, inside the quality_gate budget.
    if (r.ai_verdict === 'pending' && o && ['needs_review', 'fail'].includes(o.ai_verdict) && o.ai_answers) {
      Object.assign(row, { ai_verdict: o.ai_verdict, ai_answers: o.ai_answers, ai_topic: o.ai_topic, ai_topic_tier: o.ai_topic_tier, ai_difficulty: o.ai_difficulty, relevant: o.relevant });
    }
    return row;
  });
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await admin.from('question_quality_reviews').upsert(rows.slice(i, i + 500), { onConflict: 'question_id,checker_version', ignoreDuplicates: true });
    if (error) throw new Error(`save failed: ${error.message}`);
  }
  return { total: qs.length, added: rows.length, questions: qs };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const url = Deno.env.get('SUPABASE_URL')!;
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // ---- auth: cron token or admin user ----
  let ok = false;
  const cron = req.headers.get('x-cron-token');
  if (cron) {
    const v = await getSetting(admin, 'indexnow_cron_token', null);
    const expected = typeof v === 'string' ? v : v?.token;
    ok = !!expected && cron === expected;
  }
  if (!ok) {
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return json({ success: false, error: 'Missing authorization' }, 401);
    const uc = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
    const { data: u } = await uc.auth.getUser();
    if (!u?.user) return json({ success: false, error: 'Invalid token' }, 401);
    const { data: r } = await admin.from('user_roles').select('role').eq('user_id', u.user.id).eq('role', 'admin').maybeSingle();
    if (!r) return json({ success: false, error: 'Admin required' }, 403);
  }
  const body = await req.json().catch(() => ({}));

  // ================= One-test-per-call no-AI sweep =================
  if (body?.action === 'sweep') {
    const { data: defs } = await admin.from('job_test_definitions').select('id, job_title').order('id');
    const list = defs ?? [];
    const { data: st } = await admin.from('quality_job_runs').select('cursor').eq('id', 'det-sweep').maybeSingle();
    let index = body.restart ? 0 : Number(st?.cursor?.index ?? 0);
    if (index >= list.length) return json({ success: true, done: true, index, total: list.length });
    const d = list[index];
    try {
      const r = await ensureNoAi(admin, d.id);
      index++;
      await admin.from('quality_job_runs').update({
        status: index >= list.length ? 'idle' : 'running', cursor: { index, total: list.length, last_test: d.job_title },
        last_run_at: new Date().toISOString(), last_success_at: new Date().toISOString(), last_error: null,
      }).eq('id', 'det-sweep');
      return json({ success: true, done: index >= list.length, index, total: list.length, test: d.job_title, checked: r.total, added: r.added });
    } catch (e: any) {
      const msg = String(e?.message ?? e).slice(0, 200);
      await admin.from('quality_job_runs').update({ status: 'error', last_error: msg, last_error_at: new Date().toISOString() }).eq('id', 'det-sweep');
      return json({ success: false, error: msg, index, total: list.length }, 500);
    }
  }

  // ================= Small AI run =================
  const mode = String(await getSetting(admin, 'quality_mode', 'off'));
  const wave = Number(await getSetting(admin, 'quality_wave', 0));
  const cap = Number(await getSetting(admin, 'quality_daily_ai_cap', 300));
  if (mode === 'off' || !wave) return json({ success: true, skipped: true, reason: 'quality_mode off or wave 0', ai_calls: 0 });

  const started = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  const { data: run } = await admin.from('quality_job_runs').select('*').eq('id', 'quality-gate').maybeSingle();
  if (run?.lease_until && new Date(run.lease_until) > new Date()) return json({ success: true, skipped: true, reason: 'another run in progress' });
  const calls = run?.day === today ? run.calls_today : 0;
  if (calls >= cap) {
    await admin.from('quality_job_runs').update({ status: 'paused', pause_reason: `daily cap ${cap} reached`, day: today, calls_today: calls, lease_until: null }).eq('id', 'quality-gate');
    return json({ success: true, skipped: true, reason: 'daily cap reached', ai_calls: 0 });
  }
  await admin.from('quality_job_runs').update({
    status: 'running', day: today, calls_today: calls, lease_until: new Date(Date.now() + LEASE_MS).toISOString(),
  }).eq('id', 'quality-gate');

  let reviewed = 0, aiCalls = 0, noAiSaved = 0, waiting: string | null = null, error: string | null = null, testLabel: string | null = null;
  let rot = Number(run?.cursor?.rot ?? 0);
  try {
    const { data: tests } = await admin.from('quality_wave_tests').select('definition_id, label').eq('wave', wave).order('label');
    const list = tests ?? [];
    for (let k = 0; k < list.length && Date.now() - started < TIME_BUDGET_MS; k++) {
      const t = list[(rot + k) % list.length];
      const ensured = await ensureNoAi(admin, t.definition_id);
      noAiSaved += ensured.added;
      const { data: pend } = await admin.from('question_quality_reviews').select('id, question_id')
        .eq('definition_id', t.definition_id).eq('checker_version', CHECKER_VERSION).eq('deterministic_ok', true).eq('ai_verdict', 'pending').limit(200);
      if (!pend?.length) continue;
      rot = (rot + k + 1) % list.length; // next run starts with the following test
      testLabel = t.label;
      const qById = new Map(ensured.questions.map((q: any) => [q.id, q]));
      const items = pend.map((p: any) => ({ p, q: qById.get(p.question_id) })).filter((x: any) => x.q);
      const numeric = items.filter((x: any) => isNumericSubject(x.q.subject, x.q.topic));
      const factual = items.filter((x: any) => !isNumericSubject(x.q.subject, x.q.topic));
      const group = (numeric.length ? numeric : factual).slice(0, PER_RUN);
      const passes = numeric.length ? 1 : 2;
      const { data: topics } = await admin.from('quality_syllabus_topics').select('topic, source_tier, is_banned').eq('definition_id', t.definition_id);
      const topicList = (topics ?? []).filter((x: any) => !x.is_banned);
      const tierOf = (name?: string) => topicList.find((x: any) => x.topic === name)?.source_tier ?? null;
      const prompt = `Test: ${t.label}\nTopic list: ${topicList.map((x: any) => x.topic).join(' | ') || '(none)'}\n\n` +
        group.map((c: any, i: number) => `#${i + 1}\nQ: ${c.q.question}\n${normalizeOptions(c.q.options).map((o, j) => `${LETTERS[j]}) ${o}`).join('\n')}\nStated key: ${correctLetter(c.q) ?? '?'}\nExplanation: ${String(c.q.explanation ?? '').slice(0, 600) || '(none)'}`).join('\n\n');
      const answers: any[][] = [];
      for (let p = 0; p < passes && aiCalls < MAX_AI_CALLS; p++) {
        if (calls + aiCalls >= cap) { waiting = `daily cap ${cap} reached`; break; }
        try {
          const r = await callAIWithAutoSwitch(SYSTEM, prompt, { temperature: p === 0 ? 0.1 : 0.5, maxOutputTokens: 3072 },
            { sourceType: 'mock_quality_gate', supabaseClient: admin, allowPaidFallback: false, group: 'quality_gate' });
          aiCalls++;
          answers.push(parseArray(r.text));
        } catch (e: any) {
          const m = String(e?.message ?? e);
          if (/FREE_ONLY_EXHAUSTED|429|quota|budget/i.test(m)) waiting = 'Waiting for free AI quota (no-AI checks were still saved)';
          else { aiCalls++; error = m.slice(0, 200); }
          break;
        }
      }
      if (answers.length === passes) {
        const now = new Date().toISOString();
        for (let i = 0; i < group.length; i++) {
          const c: any = group[i];
          const per = answers.map((a) => a.find((x: any) => Number(x?.index) === i + 1) ?? null);
          const { verdict, reasons: aiReasons } = strictVerdict(correctLetter(c.q)!, per, passes === 1);
          const first = per[0] ?? {};
          const { error: ue } = await admin.from('question_quality_reviews').update({
            ai_verdict: first.relevant === false && verdict === 'pass' ? 'needs_review' : verdict,
            ai_answers: per.map((x) => x?.answer ?? null), ai_topic: first.topic ?? null, ai_topic_tier: tierOf(first.topic),
            ai_difficulty: ['easy', 'medium', 'hard'].includes(String(first.difficulty)) ? first.difficulty : null,
            relevant: typeof first.relevant === 'boolean' ? first.relevant : null,
            reasons: [...aiReasons, ...(first.relevant === false ? ['not_relevant_to_syllabus'] : [])], checked_at: now,
          }).eq('id', c.p.id);
          if (ue) { error = `save failed: ${ue.message}`; break; }
          reviewed++;
        }
      }
      break; // one test per run keeps every run small
    }
  } catch (e: any) {
    error = String(e?.message ?? e).slice(0, 200);
  }

  const nowIso = new Date().toISOString();
  const summary = { reviewed, ai_calls: aiCalls, no_ai_saved: noAiSaved, test: testLabel, waiting, error };
  await admin.from('quality_job_runs').update({
    status: error ? 'error' : waiting ? 'waiting' : 'idle', pause_reason: error ?? waiting, lease_until: null,
    calls_today: calls + aiCalls, last_run_at: nowIso, last_summary: summary, cursor: { rot },
    ...(reviewed > 0 ? { last_success_at: nowIso } : {}),
    ...(error ? { last_error: error, last_error_at: nowIso } : {}),
  }).eq('id', 'quality-gate');
  return json({ success: !error, ...summary });
});
