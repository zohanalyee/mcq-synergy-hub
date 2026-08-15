import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callAIWithAutoSwitch } from '../_shared/gemini.ts';
import { logQuotaUsage, checkQuota, QuotaExhaustedError, quotaExhaustedResponse } from '../_shared/quotaManager.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-trigger, x-cron-token',
};

const BATCH_SIZE = 20;
const MAX_BATCHES = 10;

interface Verdict {
  index: number;
  verdict: 'ok' | 'flag';
  reason?: string;
}

const SYSTEM_PROMPT = `You are a senior Pakistani exam-board question reviewer (Punjab/Sindh/KPK/Federal boards, MDCAT/ECAT, FPSC/PPSC/NTS).
You are given multiple-choice questions with the FULL TEXT of the marked correct answer.
Treat the marked answer as correct unless you are confident it is wrong.
Flag a question ONLY when it is clearly defective:
- the marked correct answer is factually wrong
- more than one option is correct, or none is correct
- the question is ambiguous, incomplete, or unanswerable
- the content is not relevant to the stated subject/topic or uses non-Pakistani curriculum context
Do NOT flag for style, wording, or difficulty.
Return ONLY a JSON array, no markdown, no commentary:
[{"index":1,"verdict":"ok"},{"index":2,"verdict":"flag","reason":"marked answer wrong"}]`;

function parseVerdicts(text: string): Verdict[] {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start !== -1 && end !== -1) {
    try {
      const parsed = JSON.parse(cleaned.slice(start, end + 1));
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as Verdict[];
    } catch {
      // fall through to the tolerant object scan below
    }
  }

  // Tolerant fallback: pull individual verdict objects out of noisy output.
  const found: Verdict[] = [];
  const objectRe = /\{[^{}]*"index"\s*:\s*(\d+)[^{}]*\}/g;
  let match: RegExpExecArray | null;
  while ((match = objectRe.exec(cleaned)) !== null) {
    const chunk = match[0];
    const isFlag = /"verdict"\s*:\s*"flag"/i.test(chunk);
    const isOk = /"verdict"\s*:\s*"ok"/i.test(chunk);
    if (!isFlag && !isOk) continue;
    found.push({ index: Number(match[1]), verdict: isFlag ? 'flag' : 'ok' });
  }
  return found;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(supabaseUrl, serviceKey);

  try {
    // ============= AUTHORIZATION =============
    const authHeader = req.headers.get('Authorization');
    let authorized = !!authHeader?.includes(serviceKey);
    let isScheduledCall = authorized;

    const cronToken = req.headers.get('x-cron-token');
    if (!authorized && cronToken) {
      const { data: tokenSetting } = await admin
        .from('system_settings')
        .select('value')
        .eq('key', 'indexnow_cron_token')
        .maybeSingle();
      const expected = typeof tokenSetting?.value === 'string'
        ? tokenSetting.value
        : (tokenSetting?.value as any)?.token;
      if (expected && cronToken === expected) {
        authorized = true;
        isScheduledCall = true;
      }
    }

    if (!authorized) {
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ success: false, error: 'Missing authorization token' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData } = await userClient.auth.getUser();
      if (!userData?.user) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid or expired token' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: roleData } = await admin
        .from('user_roles')
        .select('role')
        .eq('user_id', userData.user.id)
        .eq('role', 'admin')
        .maybeSingle();
      if (!roleData) {
        return new Response(JSON.stringify({ success: false, error: 'Admin privileges required' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      authorized = true;
    }

    // ============= QUOTA =============
    // Scheduled (hourly) reviews yield to learner-facing generation: they skip
    // entirely unless a healthy slice of the daily quota is still available.
    const CRON_QUOTA_FLOOR = 200;
    try {
      const quota = await checkQuota(admin);
      if (isScheduledCall && quota.remaining < CRON_QUOTA_FLOOR) {
        return new Response(
          JSON.stringify({
            success: true,
            skipped: true,
            reviewed: 0,
            flagged: 0,
            batches_run: 0,
            stop_reason: `Quota reserved for generation (${quota.remaining} left)`,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    } catch (err) {
      if (err instanceof QuotaExhaustedError) return quotaExhaustedResponse(corsHeaders);
      throw err;
    }


    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const requestedBatches = Math.max(1, Math.min(Number(body.batches) || 3, MAX_BATCHES));
    const startedAt = Date.now();

    let reviewed = 0;
    let flagged = 0;
    let batchesRun = 0;
    let stopReason = 'completed';

    for (let b = 0; b < requestedBatches; b++) {
      // Pull still-unverified approved MCQs (oldest first). Most legacy rows are
      // labelled 'manual' even when AI-generated, so we review the whole bank.
      const { data: rows, error: fetchError } = await admin
        .from('content_items')
        .select('id, title, description, options, correct_option, subject, topic, explanation')
        .eq('category', 'mcq')
        .eq('status', 'approved')
        .is('quality_verified_at', null)
        .order('created_at', { ascending: true })
        .limit(BATCH_SIZE);

      if (fetchError) {
        stopReason = `Fetch failed: ${fetchError.message}`;
        break;
      }
      if (!rows || rows.length === 0) {
        stopReason = 'No unverified AI questions left';
        break;
      }

      /**
       * FREE deterministic pre-pass: essay/comprehension-style stems are the
       * wrong genre for an exam MCQ. Flag them here (no AI tokens spent) and
       * exclude them from the AI batch.
       */
      const styleFlaggedIds: string[] = [];
      const aiRows = rows.filter((r: any) => {
        const style = checkStemStyle(String(r.title ?? ''), r.subject);
        if (style.ok) return true;
        styleFlaggedIds.push(r.id);
        console.warn(`[Quality Gate] ⚠️ style ${style.reason} (${style.length}/${style.limit}) on ${r.id}`);
        return false;
      });

      if (styleFlaggedIds.length > 0) {
        await admin
          .from('content_items')
          .update({
            status: 'pending',
            quality_grade: 'D',
            quality_verified_at: new Date().toISOString(),
          })
          .in('id', styleFlaggedIds);
        reviewed += styleFlaggedIds.length;
        flagged += styleFlaggedIds.length;
      }

      if (aiRows.length === 0) {
        batchesRun++;
        continue;
      }

      const userPrompt = aiRows.map((r: any, i: number) => {
        // options is stored either as an array ["a","b",...] or as {A,B,C,D};
        // correct_option holds either a letter or the full answer text.
        const raw = r.options;
        const list: string[] = Array.isArray(raw)
          ? raw.map((o: any) => String(o ?? ''))
          : ['A', 'B', 'C', 'D'].map((k) => String((raw || {})[k] ?? ''));
        const letters = ['A', 'B', 'C', 'D'];
        const correctRaw = String(r.correct_option ?? '').trim();
        const letterIdx = letters.indexOf(correctRaw.toUpperCase());
        const correctText = letterIdx >= 0 ? list[letterIdx] : correctRaw;
        return `#${i + 1}
Subject: ${r.subject || '-'} | Topic: ${r.topic || '-'}
Q: ${r.title}
${list.map((o, k) => `${letters[k]}) ${o}`).join('\n')}
Marked correct: ${correctText || '-'}`;
      }).join('\n\n');

      let verdicts: Verdict[] = [];

      try {
        const result = await callAIWithAutoSwitch(SYSTEM_PROMPT, userPrompt, {
          temperature: 0.1,
          maxOutputTokens: 4096,
        }, { sourceType: 'quality_gate', supabaseClient: admin });
        verdicts = parseVerdicts(result.text);
      } catch (err: any) {
        stopReason = `AI review failed: ${String(err?.message).substring(0, 160)}`;
        break;
      }

      if (verdicts.length === 0) {
        stopReason = 'AI returned an unparseable review';
        break;
      }

      const nowIso = new Date().toISOString();
      const flaggedIds: string[] = [];
      const okIds: string[] = [];

      for (const v of verdicts) {
        const row = rows[(Number(v.index) || 0) - 1];
        if (!row) continue;
        if (v.verdict === 'flag') flaggedIds.push(row.id);
        else okIds.push(row.id);
      }

      // Anything the model did not mention stays unverified for the next pass.
      if (okIds.length > 0) {
        await admin
          .from('content_items')
          .update({ quality_verified_at: nowIso })
          .in('id', okIds);
      }

      if (flaggedIds.length > 0) {
        await admin
          .from('content_items')
          .update({ status: 'pending', quality_grade: 'D', quality_verified_at: nowIso })
          .in('id', flaggedIds);
      }

      reviewed += okIds.length + flaggedIds.length;
      flagged += flaggedIds.length;
      batchesRun++;

      await new Promise((r) => setTimeout(r, 400));
    }

    await logQuotaUsage(admin, {
      source_type: 'quality_gate_run_summary',
      questions_requested: 0,
      questions_fetched: reviewed,
      questions_saved: 0,
      metadata: {
        run_summary: true,
        reviewed,
        flagged,
        batches_run: batchesRun,
        stop_reason: stopReason,
        duration_ms: Date.now() - startedAt,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      reviewed,
      flagged,
      batches_run: batchesRun,
      stop_reason: stopReason,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('[Verify Questions] Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
