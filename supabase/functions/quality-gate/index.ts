// Mock-test Question Quality Gate (Batch 4B).
// Writes ONLY to question_quality_reviews / quality_job_runs. Never edits or
// deletes live questions. No-op when system_settings.quality_mode = 'off'.
// AI: free Gemini keys only (allowPaidFallback: false), capped per day.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callAIWithAutoSwitch } from '../_shared/gemini.ts';
import {
  CHECKER_VERSION, LETTERS, correctLetter, deterministicCheck, findDuplicates,
  normalizeOptions, isNumericSubject, combineVerdict,
} from '../_shared/qualityChecks.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-token',
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const PER_RUN = 30;
const AI_BATCH = 10;
const DEFAULT_BANNED = ['politics', 'political party', 'sectarian', 'religious controversy'];

const SYSTEM = `You are an independent exam-question solver for Pakistani competitive and admission tests.
For each numbered MCQ, solve it yourself and choose the single best option letter.
If you are not confident or the question is defective, use "?" as the answer.
Also choose the closest topic from the provided topic list (exact text), a difficulty (easy|medium|hard),
and whether the question is relevant to that syllabus (true|false).
Return ONLY a JSON array: [{"index":1,"answer":"B","topic":"...","difficulty":"medium","relevant":true}]`;

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const url = Deno.env.get('SUPABASE_URL')!;
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(url, service);

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
    ok = true;
  }

  const mode = String(await getSetting(admin, 'quality_mode', 'off'));
  const wave = Number(await getSetting(admin, 'quality_wave', 0));
  const cap = Number(await getSetting(admin, 'quality_daily_ai_cap', 300));
  if (mode === 'off' || !wave) return json({ success: true, skipped: true, reason: 'quality_mode off or wave 0', ai_calls: 0 });

  // ---- lease (single flight) + daily counter ----
  const today = new Date().toISOString().slice(0, 10);
  const { data: run } = await admin.from('quality_job_runs').select('*').eq('id', 'quality-gate').maybeSingle();
  const now = new Date();
  if (run?.lease_until && new Date(run.lease_until) > now) return json({ success: true, skipped: true, reason: 'another run in progress' });
  let calls = run?.day === today ? run.calls_today : 0;
  if (calls >= cap) {
    await admin.from('quality_job_runs').update({ status: 'paused', pause_reason: `daily cap ${cap} reached`, day: today, calls_today: calls }).eq('id', 'quality-gate');
    return json({ success: true, skipped: true, reason: 'daily cap reached', ai_calls: 0 });
  }
  await admin.from('quality_job_runs').update({
    status: 'running', pause_reason: null, day: today, calls_today: calls,
    lease_until: new Date(now.getTime() + 10 * 60_000).toISOString(),
  }).eq('id', 'quality-gate');

  let reviewed = 0, aiCalls = 0, stop = 'completed', pauseReason: string | null = null;
  try {
    const { data: tests } = await admin.from('quality_wave_tests').select('definition_id, label').eq('wave', wave);
    let budget = PER_RUN;
    for (const t of tests ?? []) {
      if (budget <= 0 || pauseReason) break;
      const def = t.definition_id;
      const [{ data: qs }, { data: done }, { data: topics }] = await Promise.all([
        admin.from('job_test_questions').select('id, question, options, correct_answer, explanation, subject, topic').eq('job_test_id', def).order('created_at').limit(1000),
        admin.from('question_quality_reviews').select('question_id').eq('definition_id', def).eq('checker_version', CHECKER_VERSION).limit(1000),
        admin.from('quality_syllabus_topics').select('topic, source_tier, is_banned').eq('definition_id', def),
      ]);
      const doneSet = new Set((done ?? []).map((d: any) => d.question_id));
      const pending = (qs ?? []).filter((q: any) => !doneSet.has(q.id)).slice(0, budget);
      if (!pending.length) continue;
      budget -= pending.length;

      const banned = [...DEFAULT_BANNED, ...(topics ?? []).filter((x: any) => x.is_banned).map((x: any) => x.topic)];
      const topicList = (topics ?? []).filter((x: any) => !x.is_banned);
      const tierOf = (name?: string) => topicList.find((x: any) => x.topic === name)?.source_tier ?? null;
      const dups = findDuplicates(qs ?? []);

      // Student signal (no AI): % correct once 20+ attempts.
      const ids = pending.map((q: any) => q.id);
      const { data: hist } = await admin.from('user_attempt_history').select('question_id, is_correct').in('question_id', ids).limit(5000);
      const { data: reps } = await admin.from('question_reports').select('question_id').in('question_id', ids);
      const sig = (id: string) => {
        const f: string[] = [];
        const h = (hist ?? []).filter((x: any) => x.question_id === id);
        if (h.length >= 20 && h.filter((x: any) => x.is_correct).length / h.length < 0.15) f.push('low_correct_rate');
        if ((reps ?? []).filter((x: any) => x.question_id === id).length >= 3) f.push('reported_3plus');
        return f;
      };

      const rows: any[] = [];
      const aiQueue: any[] = [];
      for (const q of pending) {
        const d = deterministicCheck(q, banned);
        if (dups.has(q.id)) { d.ok = false; d.reasons.push('duplicate_in_test'); }
        const row = {
          question_id: q.id, definition_id: def, checker_version: CHECKER_VERSION,
          deterministic_ok: d.ok, reasons: d.reasons, ai_verdict: d.ok ? 'pending' : 'fail',
          signal_flags: sig(q.id), checked_at: new Date().toISOString(),
        } as any;
        rows.push(row);
        if (d.ok) aiQueue.push({ q, row });
      }

      // AI review in batches of 10.
      for (let i = 0; i < aiQueue.length && !pauseReason; i += AI_BATCH) {
        const chunk = aiQueue.slice(i, i + AI_BATCH);
        const numeric = chunk.filter((c) => isNumericSubject(c.q.subject, c.q.topic));
        const factual = chunk.filter((c) => !isNumericSubject(c.q.subject, c.q.topic));
        const groups: [any[], number][] = [[numeric, 1], [factual, 2]];
        for (const [g, passes] of groups) {
          if (!g.length) continue;
          const prompt = `Test: ${t.label}\nTopic list: ${topicList.map((x: any) => x.topic).join(' | ') || '(none)'}\n\n` +
            g.map((c, k) => `#${k + 1}\nQ: ${c.q.question}\n${normalizeOptions(c.q.options).map((o, j) => `${LETTERS[j]}) ${o}`).join('\n')}`).join('\n\n');
          const answers: any[][] = [];
          for (let p = 0; p < passes; p++) {
            if (calls + aiCalls >= cap) { pauseReason = `daily cap ${cap} reached`; break; }
            try {
              const r = await callAIWithAutoSwitch(SYSTEM, prompt, { temperature: p === 0 ? 0.1 : 0.5, maxOutputTokens: 2048 },
                { sourceType: 'mock_quality_gate', supabaseClient: admin, allowPaidFallback: false });
              aiCalls++;
              answers.push(parseArray(r.text));
            } catch (e: any) {
              aiCalls++;
              pauseReason = String(e?.message ?? e).slice(0, 160);
              break;
            }
          }
          if (answers.length < passes) continue; // leave pending; resume next run
          g.forEach((c, k) => {
            const per = answers.map((a) => a.find((x: any) => Number(x?.index) === k + 1) ?? null);
            const key = correctLetter(c.q)!;
            const verdict = combineVerdict(key, per.map((x) => x?.answer ?? null), passes === 1);
            const first = per[0] ?? {};
            c.row.ai_verdict = first.relevant === false && verdict === 'pass' ? 'needs_review' : verdict;
            if (first.relevant === false) c.row.reasons = [...c.row.reasons, 'not_relevant_to_syllabus'];
            c.row.ai_answers = per.map((x) => x?.answer ?? null);
            c.row.ai_topic = first.topic ?? null;
            c.row.ai_topic_tier = tierOf(first.topic);
            c.row.ai_difficulty = ['easy', 'medium', 'hard'].includes(String(first.difficulty)) ? first.difficulty : null;
            c.row.relevant = typeof first.relevant === 'boolean' ? first.relevant : null;
          });
        }
      }

      // Only persist completed rows (deterministic fails or AI-finished) so resumes stay exact.
      const ready = rows.filter((r) => r.ai_verdict !== 'pending');
      if (ready.length) {
        const { error } = await admin.from('question_quality_reviews').upsert(ready, { onConflict: 'question_id,checker_version' });
        if (error) { pauseReason = `save failed: ${error.message}`; break; }
        reviewed += ready.length;
      }
    }
    if (pauseReason) stop = 'paused';
  } catch (e: any) {
    stop = 'error'; pauseReason = String(e?.message ?? e).slice(0, 160);
  }

  const summary = { reviewed, ai_calls: aiCalls, stop, pause_reason: pauseReason };
  await admin.from('quality_job_runs').update({
    status: pauseReason ? 'paused' : 'idle', pause_reason: pauseReason, lease_until: null,
    calls_today: calls + aiCalls, last_run_at: new Date().toISOString(), last_summary: summary,
  }).eq('id', 'quality-gate');
  return json({ success: true, ...summary });
});
