// Mock-test Question Quality Gate (Batch 4B, checker v2 in Batch 8.1).
// Writes ONLY to question_quality_reviews / quality_job_runs. Never edits or
// deletes live questions. AI: free Gemini keys only (allowPaidFallback: false).
//
// Two actions:
//  - { action: 'sweep' }  one test per call, no AI: saves the v2 no-AI checks.
//  - default (cron/admin) small AI run: no-AI checks are saved FIRST, then at most
//    10 questions / 2 AI calls / ~60 s, rotating across Wave tests.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callAIWithAutoSwitch, getFreeGeminiKeys } from '../_shared/gemini.ts';
import { CHECKER_VERSION, LETTERS, correctLetter, normalizeOptions, isNumericSubject, strictVerdict, noAiReview, priorityTier, orderTests, exactDupKey, canStartCall, hasTimeFor, usableKeyIndexes } from '../_shared/qualityChecks.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-token',
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const PER_CALL = 10; // questions per AI call — unchanged from before the speed-up
const MAX_AI_CALLS = 8;
const TIME_BUDGET_MS = 45_000;
const PER_CALL_MS = 15_000; // no new AI call starts unless this much time is left
const AI_DEADLINE_MS = 42_000; // AI requests are aborted at this point of the run
const SLOW_STEP_MS = 4_000; // time that must be left before any slow DB step
const COPY_MAX_SOURCES = 10; // duplicate-copy lookups per run (after saving)
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

  // ================= AI run (Gate speed-up, time-boxed) =================
  // Every slow step is timed (saved in quality_job_runs.last_summary.steps) and
  // checked against the 45 s budget first. AI requests are aborted at AI_DEADLINE_MS.
  // AI reviews are saved right after each AI call; duplicate copying runs last, capped.
  const started = Date.now();
  const steps: { step: string; at: number; ms: number }[] = [];
  const elapsed = () => Date.now() - started;
  async function timed<T>(step: string, fn: () => Promise<T>): Promise<T> {
    const t = Date.now();
    try { return await fn(); } finally { if (steps.length < 60) steps.push({ step, at: t - started, ms: Date.now() - t }); }
  }
  const fits = (needMs: number) => hasTimeFor(elapsed(), needMs, TIME_BUDGET_MS);

  const [modeV, waveV, capV, budgetCfg, healthV, runRes] = await timed('startup', () => Promise.all([
    getSetting(admin, 'quality_mode', 'off'),
    getSetting(admin, 'quality_wave', 0),
    getSetting(admin, 'quality_daily_ai_cap', 300),
    getSetting(admin, 'ai_free_budget', null),
    getSetting(admin, 'free_key_health', null),
    admin.from('quality_job_runs').select('*').eq('id', 'quality-gate').maybeSingle(),
  ]));
  const mode = String(modeV);
  const wave = Number(waveV);
  const settingCap = Number(capV);
  const gateMax = Number((budgetCfg as any)?.groups?.quality_gate?.max ?? settingCap);
  const cap = Math.min(settingCap, gateMax);
  if (mode === 'off' || !wave) return json({ success: true, skipped: true, reason: 'quality_mode off or wave 0', ai_calls: 0 });

  const today = new Date().toISOString().slice(0, 10);
  const run: any = (runRes as any)?.data;
  if (run?.lease_until && new Date(run.lease_until) > new Date()) return json({ success: true, skipped: true, reason: 'another run in progress' });
  const calls = run?.day === today ? run.calls_today : 0;
  const checkedToday = run?.day === today ? Number(run?.cursor?.checked_today ?? 0) : 0;
  const copiedToday = run?.day === today ? Number(run?.cursor?.copied_today ?? 0) : 0;
  const lastChecked: Record<string, string> = { ...(run?.cursor?.last_checked ?? {}) };
  const recentRuns: any[] = Array.isArray(run?.cursor?.recent_runs) ? run.cursor.recent_runs : [];

  const finish = async (status: string, reason: string | null, extra: Record<string, unknown>, counters: { reviewed: number; copied: number; aiCalls: number; rateLimited: number }) => {
    const nowIso = new Date().toISOString();
    const summary = { ...extra, reviewed: counters.reviewed, copied: counters.copied, ai_calls: counters.aiCalls, rate_limited: counters.rateLimited, per_call: PER_CALL, seconds: Math.round(elapsed() / 1000), ms: elapsed(), steps, at: nowIso };
    const brief = { at: nowIso, ms: summary.ms, status, reviewed: counters.reviewed, copied: counters.copied, ai_calls: counters.aiCalls, rate_limited: counters.rateLimited, reason };
    await admin.from('quality_job_runs').update({
      status, pause_reason: reason, lease_until: null, day: today,
      calls_today: calls + counters.aiCalls, last_run_at: nowIso, last_summary: summary,
      cursor: { last_checked: lastChecked, checked_today: checkedToday + counters.reviewed + counters.copied, copied_today: copiedToday + counters.copied, recent_runs: [brief, ...recentRuns].slice(0, 12) },
      ...(counters.reviewed > 0 ? { last_success_at: nowIso } : {}),
      ...(status === 'error' ? { last_error: reason, last_error_at: nowIso } : {}),
    }).eq('id', 'quality-gate');
    return json({ success: status !== 'error', status, ...summary });
  };
  const zero = { reviewed: 0, copied: 0, aiCalls: 0, rateLimited: 0 };

  if (calls >= cap) return finish('paused', `daily cap ${cap} reached`, {}, zero);
  // No usable free key (all parked in free_key_health) → stop before any AI request.
  const usable = usableKeyIndexes(getFreeGeminiKeys().map((k) => k.index), (healthV as any)?.keys ?? {});
  if (!usable.length) return finish('waiting', 'Waiting for free AI quota: every free key is in cooldown', {}, zero);

  await timed('lease', () => admin.from('quality_job_runs').update({
    status: 'running', day: today, calls_today: calls, lease_until: new Date(Date.now() + LEASE_MS).toISOString(),
  }).eq('id', 'quality-gate'));

  const c = { ...zero };
  let noAiSaved = 0, waiting: string | null = null, error: string | null = null, timeStop: string | null = null;
  const testsDone: string[] = [];
  const saved: { q: any; patch: any }[] = []; // sources for duplicate copying, after the main loop
  const stop = () => {
    const r = canStartCall(elapsed(), c.aiCalls, calls + c.aiCalls, { budgetMs: TIME_BUDGET_MS, perCallMs: PER_CALL_MS, maxRunCalls: MAX_AI_CALLS, dailyCap: cap });
    return r.ok ? null : r.reason;
  };
  try {
    const { data: defs } = await timed('definitions', () => admin.from('job_test_definitions').select('id, job_title, department'));
    const list = orderTests((defs ?? []).map((d: any) => ({ id: d.id, label: d.job_title, tier: priorityTier(d.job_title, d.department) })), lastChecked);
    outer: for (const t of list) {
      if (waiting || error) break;
      const s0 = stop();
      if (s0) { if (s0.startsWith('daily cap')) waiting = s0; else timeStop = s0; break; }
      if (!fits(PER_CALL_MS + SLOW_STEP_MS)) { timeStop = 'time budget (before test setup)'; break; }
      const ensured = await timed(`no_ai_checks:${t.label}`, () => ensureNoAi(admin, t.id));
      noAiSaved += ensured.added;
      if (!fits(PER_CALL_MS)) { timeStop = 'time budget (after no-AI checks)'; break; }
      const [{ data: pend }, { data: topics }] = await timed('select_questions', () => Promise.all([
        admin.from('question_quality_reviews').select('id, question_id')
          .eq('definition_id', t.id).eq('checker_version', CHECKER_VERSION).eq('deterministic_ok', true).eq('ai_verdict', 'pending').limit(400),
        admin.from('quality_syllabus_topics').select('topic, source_tier, is_banned').eq('definition_id', t.id),
      ]));
      if (!pend?.length) { lastChecked[t.id] = new Date().toISOString(); continue; }
      const qById = new Map(ensured.questions.map((q: any) => [q.id, q]));
      const items = pend.map((p: any) => ({ p, q: qById.get(p.question_id) })).filter((x: any) => x.q);
      const done = new Set<string>();
      const topicList = (topics ?? []).filter((x: any) => !x.is_banned);
      const tierOf = (name?: string) => topicList.find((x: any) => x.topic === name)?.source_tier ?? null;
      testsDone.push(t.label);
      while (true) {
        const left = items.filter((x: any) => !done.has(x.p.id));
        if (!left.length) { lastChecked[t.id] = new Date().toISOString(); break; }
        const numeric = left.filter((x: any) => isNumericSubject(x.q.subject, x.q.topic));
        const factual = left.filter((x: any) => !isNumericSubject(x.q.subject, x.q.topic));
        const group = (numeric.length ? numeric : factual).slice(0, PER_CALL);
        const passes = numeric.length ? 1 : 2;
        // Both passes must fit; they run side by side so a group costs ~one call of wall time.
        const s = stop() ?? (c.aiCalls + passes > MAX_AI_CALLS ? 'run call limit' : null) ?? (calls + c.aiCalls + passes > cap ? `daily cap ${cap} reached` : null);
        if (s) { if (s.startsWith('daily cap')) waiting = s; else timeStop = s; break outer; }
        const prompt = `Test: ${t.label}\nTopic list: ${topicList.map((x: any) => x.topic).join(' | ') || '(none)'}\n\n` +
          group.map((g: any, i: number) => `#${i + 1}\nQ: ${g.q.question}\n${normalizeOptions(g.q.options).map((o, j) => `${LETTERS[j]}) ${o}`).join('\n')}\nStated key: ${correctLetter(g.q) ?? '?'}\nExplanation: ${String(g.q.explanation ?? '').slice(0, 600) || '(none)'}`).join('\n\n');
        const deadlineAt = started + AI_DEADLINE_MS;
        const results = await timed(`ai_call x${passes}`, () => Promise.allSettled(Array.from({ length: passes }, (_, p) =>
          callAIWithAutoSwitch(SYSTEM, prompt, { temperature: p === 0 ? 0.1 : 0.5, maxOutputTokens: 3072, deadlineAt },
            { sourceType: 'mock_quality_gate', supabaseClient: admin, allowPaidFallback: false, group: 'quality_gate' }))));
        const answers: any[][] = [];
        for (const r of results) {
          if (r.status === 'fulfilled') { c.aiCalls++; answers.push(parseArray(r.value.text)); continue; }
          const m = String((r.reason as any)?.message ?? r.reason);
          if (/^DEADLINE/.test(m)) { c.aiCalls++; timeStop = 'AI request hit the 45 s limit'; }
          else if (/FREE_ONLY_EXHAUSTED|429|quota|budget/i.test(m)) { c.rateLimited++; waiting = 'Waiting for free AI quota (no-AI checks were still saved)'; }
          else { c.aiCalls++; error = m.slice(0, 200); }
        }
        if (answers.length < passes) break outer; // incomplete verdict → leave these pending
        // Save this call's reviews immediately (before any copying).
        const now = new Date().toISOString();
        const patches = group.map((g: any, i: number) => {
          const per = answers.map((a) => a.find((x: any) => Number(x?.index) === i + 1) ?? null);
          const { verdict, reasons: aiReasons } = strictVerdict(correctLetter(g.q)!, per, passes === 1);
          const first = per[0] ?? {};
          return {
            ai_verdict: first.relevant === false && verdict === 'pass' ? 'needs_review' : verdict,
            ai_answers: per.map((x) => x?.answer ?? null), ai_topic: first.topic ?? null, ai_topic_tier: tierOf(first.topic),
            ai_difficulty: ['easy', 'medium', 'hard'].includes(String(first.difficulty)) ? first.difficulty : null,
            relevant: typeof first.relevant === 'boolean' ? first.relevant : null,
            reasons: [...aiReasons, ...(first.relevant === false ? ['not_relevant_to_syllabus'] : [])], checked_at: now,
          };
        });
        const saves = await timed('save_reviews', () => Promise.all(group.map((g: any, i: number) =>
          admin.from('question_quality_reviews').update(patches[i]).eq('id', g.p.id))));
        for (let i = 0; i < group.length; i++) {
          done.add(group[i].p.id);
          if (saves[i]?.error) { error = `save failed: ${saves[i].error.message}`; continue; }
          c.reviewed++;
          saved.push({ q: group[i].q, patch: patches[i] });
        }
        if (error) break outer;
      }
    }
  } catch (e: any) {
    error = String(e?.message ?? e).slice(0, 200);
  }

  // Exact-duplicate copying: separate light step after all AI results are saved, capped per run.
  let copySkipped = 0;
  for (const src of saved.slice(0, COPY_MAX_SOURCES)) {
    if (!fits(SLOW_STEP_MS)) { copySkipped = saved.length - saved.indexOf(src); break; }
    try { c.copied += await timed('copy_duplicates', () => copyToExactDuplicates(admin, src.q, src.patch)); }
    catch (_e) { /* copying never blocks the run */ }
  }
  if (saved.length > COPY_MAX_SOURCES) copySkipped += saved.length - COPY_MAX_SOURCES;

  const status = error ? 'error' : waiting ? 'waiting' : 'idle';
  return finish(status, error ?? waiting ?? timeStop, { no_ai_saved: noAiSaved, tests: testsDone, waiting, error, time_stop: timeStop, copy_skipped: copySkipped }, c);
});

/**
 * Copy one AI verdict to pending reviews of questions that are EXACT duplicates
 * (same normalised stem, same options as a set, same correct option text), in any test.
 * Tagged signal_flags 'copied_verdict' + reason 'copied_from:<id>'. Never edits questions.
 */
async function copyToExactDuplicates(admin: any, src: any, patch: any): Promise<number> {
  const key = exactDupKey(src);
  if (!key) return 0;
  const { data: twins } = await admin.from('job_test_questions')
    .select('id, question, options, correct_answer').eq('question', src.question).neq('id', src.id).limit(50);
  const ids = (twins ?? []).filter((q: any) => exactDupKey(q) === key).map((q: any) => q.id);
  if (!ids.length) return 0;
  const { data: rows } = await admin.from('question_quality_reviews').select('id')
    .in('question_id', ids).eq('checker_version', CHECKER_VERSION).eq('deterministic_ok', true).eq('ai_verdict', 'pending');
  if (!rows?.length) return 0;
  const { error } = await admin.from('question_quality_reviews').update({
    ...patch, reasons: [...patch.reasons, `copied_from:${src.id}`], signal_flags: ['copied_verdict'],
  }).in('id', rows.map((r: any) => r.id));
  return error ? 0 : rows.length;
}
