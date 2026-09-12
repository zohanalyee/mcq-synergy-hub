import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkQuota, retryWithBackoff, logQuotaUsage, quotaExhaustedResponse, QuotaExhaustedError } from '../_shared/quotaManager.ts';
import { probeFreeGeminiKeys, checkAutoFillPaidBudget } from '../_shared/gemini.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-trigger, x-cron-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface AutoFillConfig {
  enabled: boolean;
  min_threshold: number;
  batch_size: number;
  priority: 'lowest_first' | 'random';
  run_target?: number;
  difficulty_weights?: { easy?: number; medium?: number; hard?: number };
}
interface SprintConfig {
  enabled: boolean;
  scope_keywords?: string[];
  target_per_topic?: number;
  daily_budget?: number;
}

/**
 * COST GUARD config. Auto-fill is meant to run on the FREE Gemini keys. If both
 * free keys are down (429 / invalid key), every batch used to silently fall
 * through to the paid Lovable gateway. Now a run only spends paid credits when
 * this setting explicitly allows it, and only up to max_paid_calls_per_run.
 */
interface PaidBudgetConfig {
  enabled?: boolean;
  max_paid_calls_per_run?: number;
  max_paid_calls_per_day?: number;
}


/**
 * THRESHOLD SPRINT (indexing quality gate).
 * Board/topic pages are only allowed into Google's index at >= 5 approved MCQs.
 * When enabled, a run that is using the FREE keys prefers "near-miss" topics
 * (1..4 approved) so a handful of questions converts straight into an
 * indexable page. Deliberately skipped in paid mode so it never creates extra
 * paid spend.
 */
interface ThresholdSprintConfig {
  enabled?: boolean;
  min_count?: number;
  max_count?: number;
  free_only?: boolean;
  label?: string;
}




interface CampaignSurge {
  enabled: boolean;
  label?: string;
  starts_at?: string | null;
  ends_at?: string | null;
  daily_budget?: number;
  min_multiplier?: number;
  sprint_keywords?: string[];
}




interface AutoFillQueueItem {
  topic_id: string;
  topic_name: string;
  subject_id: string;
  subject_name: string;
  level_name: string;
  system_name: string;
  current_count: number;
  questions_needed: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // ============= AUTHORIZATION GUARD =============
    const authHeader = req.headers.get('Authorization');
    let isScheduledCall = !!authHeader?.includes(supabaseServiceKey);
    const isAdminCall = req.headers.get('x-admin-trigger') === 'true';

    // Cron calls authenticate with a shared x-cron-token (the scheduled job
    // cannot carry the service-role key safely).
    const cronToken = req.headers.get('x-cron-token');
    if (!isScheduledCall && cronToken) {
      const guardClient = createClient(supabaseUrl, supabaseServiceKey);
      const { data: tokenSetting } = await guardClient
        .from('system_settings')
        .select('value')
        .eq('key', 'indexnow_cron_token')
        .maybeSingle();
      const expected = typeof tokenSetting?.value === 'string'
        ? tokenSetting.value
        : (tokenSetting?.value as any)?.token;
      if (expected && cronToken === expected) {
        isScheduledCall = true;
      }
    }

    if (!isScheduledCall && !isAdminCall) {
      console.log('[Scheduled Auto-Fill] ⛔ Blocked: Not a valid scheduled or admin call');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: This function can only be called by scheduled jobs or admin triggers' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For browser-based admin calls, verify JWT and admin role
    if (isAdminCall && !isScheduledCall) {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing authorization token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } }
      });

      const { data: userData, error: userError } = await userClient.auth.getUser();
      if (userError || !userData?.user) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid or expired token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', userData.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) {
        return new Response(
          JSON.stringify({ success: false, error: 'Admin privileges required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[Scheduled Auto-Fill] ✅ Admin verified: ${userData.user.id}`);
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`[Scheduled Auto-Fill] ✅ Authorized. Starting at ${new Date().toISOString()}`);

    // ============= QUOTA CHECK =============
    let quotaInfo;
    try {
      quotaInfo = await checkQuota(supabase);
      console.log(`[Scheduled Auto-Fill] 📊 Quota remaining: ${quotaInfo.remaining}`);
    } catch (err) {
      if (err instanceof QuotaExhaustedError) {
        console.log(`[Scheduled Auto-Fill] ❌ Quota exhausted. Skipping.`);
        return quotaExhaustedResponse(corsHeaders);
      }
      throw err;
    }

    // ============= OVERLAP GUARD (scheduled calls only) =============
    // Phase 2: runs every few hours now, so only guard against an overlapping
    // run started within the last 90 minutes instead of once-per-day.
    if (!isAdminCall) {
      const since = new Date(Date.now() - 25 * 60 * 1000).toISOString();
      const { count: recentRunCount } = await supabase
        .from('ai_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('source_type', 'auto_fill_run_summary')
        .gte('created_at', since);

      if ((recentRunCount || 0) > 0) {
        console.log(`[Scheduled Auto-Fill] ⏭️ A run already happened in the last 25 minutes. Skipping.`);
        return new Response(
          JSON.stringify({ success: true, skipped: true, reason: 'Recent run within 25 minutes', recent_runs: recentRunCount }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }


    // Check if auto-fill is enabled + read Phase 3 sprint config
    const { data: settingsRows } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['auto_fill_config', 'content_fill_sprint', 'campaign_surge', 'auto_fill_paid_budget', 'threshold_sprint']);

    const config = (settingsRows?.find((r: any) => r.key === 'auto_fill_config')?.value ?? null) as AutoFillConfig | null;
    const sprint = (settingsRows?.find((r: any) => r.key === 'content_fill_sprint')?.value ?? null) as SprintConfig | null;
    const paidBudget = (settingsRows?.find((r: any) => r.key === 'auto_fill_paid_budget')?.value ?? null) as PaidBudgetConfig | null;
    const thresholdCfg = (settingsRows?.find((r: any) => r.key === 'threshold_sprint')?.value ?? null) as ThresholdSprintConfig | null;
    const thresholdMin = Number(thresholdCfg?.min_count ?? 1);
    const thresholdMax = Number(thresholdCfg?.max_count ?? 4);


    // Campaign Surge window: time-boxed budget/scope boost (e.g. Larkana banner
    // week). Auto-expires at ends_at — no code change needed to switch it off.
    const surgeCfg = (settingsRows?.find((r: any) => r.key === 'campaign_surge')?.value ?? null) as CampaignSurge | null;
    const nowMs = Date.now();
    const surgeOn = !!surgeCfg?.enabled
      && (!surgeCfg?.starts_at || new Date(surgeCfg.starts_at).getTime() <= nowMs)
      && (!surgeCfg?.ends_at || new Date(surgeCfg.ends_at).getTime() >= nowMs);
    if (surgeOn) {
      console.log(`[Scheduled Auto-Fill] 🚀 Campaign surge ACTIVE: ${surgeCfg?.label || 'unnamed'}`);
    }

    const sprintOn = !!sprint?.enabled || surgeOn;
    const thresholdOn = !!thresholdCfg?.enabled;

    const surgeKeywords = surgeOn
      ? (surgeCfg?.sprint_keywords || []).map((k) => String(k).trim().toLowerCase()).filter((k) => k.length > 1)
      : [];
    const sprintKeywords = Array.from(new Set([
      ...(sprint?.scope_keywords || []).map((k) => String(k).trim().toLowerCase()).filter((k) => k.length > 1),
      ...surgeKeywords,
    ]));

    if (!config?.enabled) {
      console.log('[Scheduled Auto-Fill] Auto-fill is disabled. Exiting.');
      return new Response(
        JSON.stringify({ success: true, message: 'Auto-fill is disabled', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============= WORK PRECHECK (quota guard) =============
    // The free-key probe is a REAL Gemini request, so never spend one on a run
    // that has nothing to generate. Cheap DB check first.
    const { data: precheckRows } = await supabase.rpc('get_autofill_queue', { limit_count: 1 });
    const hasQueuedWork = ((precheckRows as AutoFillQueueItem[] | null) || []).length > 0;

    // ============= FREE-KEY HEALTH GATE (cost guard) =============
    // Cached/cooldown-aware: a key known to be 429 stays parked until the next
    // Google free-tier reset instead of being re-probed every 30 minutes.
    const paidBudgetInfo = await checkAutoFillPaidBudget(supabase);
    let paidCallsAllowed = paidBudgetInfo.allowedThisRun;

    const keyHealth = hasQueuedWork
      ? await probeFreeGeminiKeys(supabase)
      : { usable: 0, total: 0, no_model_available: false, probe_calls: 0, details: [] as any[] };

    if (hasQueuedWork) {
      console.log(`[Scheduled Auto-Fill] 🔑 Free Gemini keys usable: ${keyHealth.usable}/${keyHealth.total} (probe calls spent: ${keyHealth.probe_calls}); paid allowance this run: ${paidCallsAllowed} (used today ${paidBudgetInfo.usedToday}/${paidBudgetInfo.dailyLimit})`);
      for (const d of keyHealth.details) {
        if (!d.ok) console.warn(`[Scheduled Auto-Fill] 🔑 key #${d.key_index + 1} unusable (status ${d.status}): ${d.reason ?? ''}`);
      }
      if (keyHealth.no_model_available) {
        console.error('[Scheduled Auto-Fill] 🧩 No Gemini model available for any free key — model ids likely retired.');
      }
    }

    // Paid mode only when free capacity is genuinely gone AND a budget exists.
    const paidMode = hasQueuedWork && keyHealth.usable === 0 && paidCallsAllowed > 0;
    if (paidMode) {
      console.warn(`[Scheduled Auto-Fill] 💳 All free keys down — running on the capped paid budget (${paidCallsAllowed} call(s) this run).`);
    }

    if (!hasQueuedWork || (keyHealth.usable === 0 && !paidMode)) {
      const stopReason = !hasQueuedWork
        ? 'No topics below target — nothing to generate (probe skipped, no quota spent)'
        : keyHealth.no_model_available
          ? 'No Gemini model available for our free keys (model retired) — update the model list'
          : 'No usable free Gemini key and no paid budget left — run skipped to protect credits';
      await logQuotaUsage(supabase, {
        source_type: 'auto_fill_run_summary',
        questions_requested: 0,
        questions_fetched: 0,
        questions_saved: 0,
        metadata: {
          run_summary: true,
          skipped: true,
          stop_reason: stopReason,
          free_keys_usable: keyHealth.usable,
          free_keys_total: keyHealth.total,
          probe_calls: keyHealth.probe_calls,
          no_model_available: keyHealth.no_model_available,
          key_health: keyHealth.details,
          paid_budget_used_today: paidBudgetInfo.usedToday,
          paid_budget_daily_limit: paidBudgetInfo.dailyLimit,
        },
      });
      return new Response(
        JSON.stringify({
          success: true,
          skipped: true,
          processed: 0,
          reason: stopReason,
          no_model_available: keyHealth.no_model_available,
          key_health: keyHealth.details,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }



    // Phase 2 safety limits — raised deliberately. Real ceiling stays the
    // DAILY_QUOTA_LIMIT check in quotaManager (1400 requests/day).
    const HARD_BATCH_LIMIT = 20;
    const DEFAULT_RUN_TARGET = 600;
    const baseTarget = sprintOn
      ? (sprint?.daily_budget || config.run_target || DEFAULT_RUN_TARGET)
      : (config.run_target || DEFAULT_RUN_TARGET);
    // Surge raises the run budget (never lowers it), still under the daily quota guard.
    const requestedTarget = surgeOn
      ? Math.max(baseTarget, Number(surgeCfg?.daily_budget) || baseTarget)
      : baseTarget;
    const HARD_RUN_TARGET = Math.max(10, Math.min(requestedTarget, 1500));
    const HARD_NIGHTLY_LIMIT = HARD_RUN_TARGET;

    const requestedBatch = sprintOn
      ? (sprint?.target_per_topic || config.batch_size || 15)
      : (config.batch_size || 15);
    const batchSize = Math.min(requestedBatch, HARD_BATCH_LIMIT);


    // Difficulty rotation from configured weights (default 20/60/20).
    const weights = config.difficulty_weights || { easy: 20, medium: 60, hard: 20 };
    const difficultyPool: string[] = [
      ...Array(Math.max(1, Math.round((weights.easy ?? 20) / 10))).fill('easy'),
      ...Array(Math.max(1, Math.round((weights.medium ?? 60) / 10))).fill('medium'),
      ...Array(Math.max(1, Math.round((weights.hard ?? 20) / 10))).fill('hard'),
    ];
    let difficultyIndex = 0;

    // Sprint scope: does this topic match one of the configured priority keywords?
    const matchesKeyword = (item: AutoFillQueueItem): boolean => {
      const haystack = [item.system_name, item.level_name, item.subject_name, item.topic_name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return sprintKeywords.some((k) => haystack.includes(k));
    };

    /**
     * Sprint mode is a PREFERENCE, never an exclusion.
     *
     * Previously an exam keyword that matched nothing in the taxonomy (e.g.
     * "mdcat", which never appears literally — the data says "Biology / Class 11")
     * filtered the whole queue away and every nightly run exited with 0 saved.
     * Now matched topics (plus their subject siblings) are simply sorted FIRST
     * and the rest of the queue follows, so the daily budget is always spent.
     */
    const applySprintScope = (rows: AutoFillQueueItem[]): AutoFillQueueItem[] => {
      if (!sprintOn || sprintKeywords.length === 0) return rows;
      const scopedSubjects = new Set<string>();
      for (const row of rows) {
        if (matchesKeyword(row) && row.subject_id) scopedSubjects.add(row.subject_id);
      }
      const inScope = (row: AutoFillQueueItem) =>
        matchesKeyword(row) || scopedSubjects.has(row.subject_id);
      const priority = rows.filter(inScope);
      const rest = rows.filter((row) => !inScope(row));
      if (priority.length === 0) {
        console.warn(
          `[Scheduled Auto-Fill] ⚠️ Sprint keywords [${sprintKeywords.join(', ')}] matched 0 of ${rows.length} queued topics — falling back to the full queue so the run is not wasted.`,
        );
      }
      return [...priority, ...rest];
    };



    /**
     * Phase 2 — TRAFFIC DEPTH LADDER.
     * get_autofill_queue only returns topics under the flat min_threshold, so a
     * popular topic that just crossed the threshold looked "complete" forever.
     * The ladder raises the per-topic target by real page views, and these rows
     * are appended AFTER the primary gap queue drains, so empty topics keep
     * first claim on the budget.
     */
    const depthTargetForViews = (views: number): number => {
      if (views >= 500) return 60;
      if (views >= 200) return 40;
      if (views >= 50) return 25;
      if (views >= 20) return 15;
      return 0; // no traffic signal yet -> flat threshold governs
    };

    let depthQueue: AutoFillQueueItem[] | null = null;

    const loadDepthQueue = async (): Promise<AutoFillQueueItem[]> => {
      if (depthQueue) return depthQueue;
      const { data, error } = await supabase.rpc('get_content_health');
      if (error) {
        console.error('[Scheduled Auto-Fill] depth ladder unavailable:', error.message);
        depthQueue = [];
        return depthQueue;
      }
      const rows = ((data as any[]) || [])
        .map((r) => {
          const views = Number(r.view_count || 0);
          const approved = Number(r.approved_count || 0);
          const target = depthTargetForViews(views);
          return { r, views, approved, target, deficit: target - approved };
        })
        .filter((x) => x.r.topic_id && x.deficit > 0)
        // Hottest, shallowest topics first.
        .sort((a, b) => b.views - a.views || b.deficit - a.deficit)
        .map((x) => ({
          topic_id: x.r.topic_id,
          topic_name: x.r.topic_name,
          subject_id: x.r.subject_name || '',
          subject_name: x.r.subject_name,
          level_name: x.r.class_number ? `Class ${x.r.class_number}` : '',
          system_name: x.r.board_name || '',
          current_count: x.approved,
          questions_needed: x.deficit,
        })) as AutoFillQueueItem[];
      depthQueue = rows;
      console.log(`[Scheduled Auto-Fill] depth ladder: ${rows.length} high-traffic topic(s) below their traffic-based target`);
      return depthQueue;
    };

    let topicsProcessed = 0;
    let totalQuestionsSaved = 0;
    // Real accounting so the admin history shows yield, not just saved rows.
    let totalQuestionsRequested = 0;
    let totalApproved = 0;
    let totalFlagged = 0;
    let totalDuplicateSkipped = 0;
    let totalTopicRejected = 0;
    let zeroYieldStreak = 0;
    let depthTopicsProcessed = 0;
    let nearMissTopicsProcessed = 0;

    let lastRawQueueSize = 0;
    let stopReason = '';
    let queueError: string | null = null;
    const attemptedTopicIds = new Set<string>();
    const runStartedAt = Date.now();

    console.log(`[Scheduled Auto-Fill] Limits: batch=${batchSize}, run_target=${HARD_RUN_TARGET}, sprint=${sprintOn ? sprintKeywords.join('|') || 'all' : 'off'}`);



    /**
     * WALL-CLOCK BUDGET (root cause of the "silent runs").
     * The platform gateway kills the request after ~150s of no response bytes,
     * which killed the function mid-loop and meant the run summary was NEVER
     * logged (and the wasted-run alarm could never fire). Each invocation now
     * stops well before that, logs its summary, and the next scheduled run
     * (every 30 min) continues where this one left off.
     */
    const MAX_RUN_MS = 110_000;

    // Continuous loop until limit hit, time budget spent, or no gaps
    let paidCallsUsed = 0;
    while (totalQuestionsSaved < HARD_NIGHTLY_LIMIT) {
      if (Date.now() - runStartedAt > MAX_RUN_MS) {
        stopReason = 'Time budget reached (partial run, continues next cycle)';
        console.log(`[Scheduled Auto-Fill] ⏱️ ${stopReason}`);
        break;
      }

      // In paid mode the run is capped to a small number of generation calls.
      if (paidMode && paidCallsUsed >= paidCallsAllowed) {
        stopReason = `Paid budget for this run spent (${paidCallsUsed}/${paidCallsAllowed} call(s))`;
        console.warn(`[Scheduled Auto-Fill] 💳 ${stopReason}`);
        break;
      }


      // Re-check quota each iteration
      try {
        const iterQuota = await checkQuota(supabase);
        if (iterQuota.remaining < 5) {
          stopReason = 'Quota too low to continue';
          console.log(`[Scheduled Auto-Fill] ${stopReason} (${iterQuota.remaining} remaining)`);
          break;
        }
      } catch {
        stopReason = 'Daily limit reached';
        break;
      }

      // Fetch a window of priority gaps (curriculum-priority ordered in the RPC),
      // then pick the first one we have not attempted in this run. Prevents an
      // infinite loop on a topic that keeps returning 0 saved questions.
      const { data: queueData, error: queueRpcError } = await supabase.rpc('get_autofill_queue', {
        limit_count: sprintOn ? 400 : 50
      });

      if (queueRpcError) {
        queueError = queueRpcError.message;
        stopReason = `Queue unavailable: ${queueRpcError.message}`;
        console.error(`[Scheduled Auto-Fill] ❌ ${stopReason}`);
        break;
      }

      const rawQueue = (queueData as AutoFillQueueItem[] | null) || [];
      lastRawQueueSize = rawQueue.length;
      // DEFICIT-FIRST: within the priority window, spend the run on the topics
      // that are furthest from their target instead of near-saturated ones
      // (those are where AI output gets discarded as near-duplicates).
      const queue = applySprintScope(rawQueue)
        .slice()
        .sort((a, b) => (Number(b.questions_needed) || 0) - (Number(a.questions_needed) || 0));

      // THRESHOLD SPRINT: on free-key runs only, finish the near-miss topics
      // (1..4 approved MCQs) first — a few questions each flips them over the
      // 5-MCQ indexing gate. Cheapest first so the most pages convert per run.
      let topic: AutoFillQueueItem | undefined;
      if (thresholdOn && !paidMode) {
        const nearMiss = queue
          .filter((q) => {
            const n = Number(q.current_count) || 0;
            return n >= thresholdMin && n <= thresholdMax;
          })
          .sort((a, b) => (Number(b.current_count) || 0) - (Number(a.current_count) || 0));
        topic = nearMiss.find((q) => !attemptedTopicIds.has(q.topic_id));
        if (topic) nearMissTopicsProcessed++;
      }
      if (!topic) topic = queue.find((q) => !attemptedTopicIds.has(q.topic_id));


      let fromDepthLadder = false;

      // Primary gap queue exhausted -> keep going on high-traffic topics that
      // are above the flat threshold but below their traffic-based depth target.
      if (!topic) {
        const depthRows = applySprintScope(await loadDepthQueue());
        topic = depthRows.find((q) => !attemptedTopicIds.has(q.topic_id));
        fromDepthLadder = !!topic;
      }

      if (!topic) {
        stopReason = rawQueue.length === 0
          ? 'All topics stocked to their traffic-based depth target'
          : 'All queued topics already attempted in this run';
        console.log(`[Scheduled Auto-Fill] ${stopReason}`);
        break;
      }



      attemptedTopicIds.add(topic.topic_id);
      if (fromDepthLadder) depthTopicsProcessed++;
      console.log(`[Scheduled Auto-Fill] Generating for topic: ${topic.topic_name} (${topic.subject_name})${fromDepthLadder ? ' [depth ladder]' : ''}`);


      // Check if topic has RAG documents
      const { data: documents } = await supabase
        .from('documents')
        .select('id')
        .eq('topic_id', topic.topic_id)
        .eq('status', 'completed')
        .limit(1);

      const hasRAGDocuments = documents && documents.length > 0;
      const endpoint = hasRAGDocuments ? 'generate-from-rag' : 'generate-test';
      
      console.log(`[Scheduled Auto-Fill] Using ${endpoint} (RAG: ${hasRAGDocuments})`);

      // Calculate safe question count
      const remainingQuota = HARD_NIGHTLY_LIMIT - totalQuestionsSaved;
      const questionsToRequest = Math.min(batchSize, topic.questions_needed, remainingQuota);

      // Call the appropriate function with retryWithBackoff
      try {
        const generateResponse = await retryWithBackoff(
          () => fetch(`${supabaseUrl}/functions/v1/${endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              topic: `${topic.topic_name} (${topic.subject_name})`,
              topic_id: topic.topic_id,
              topic_name: topic.topic_name,
              subject_name: topic.subject_name,
              difficulty: difficultyPool[difficultyIndex++ % difficultyPool.length],
              question_count: questionsToRequest,
              count: questionsToRequest,
              mode: 'bank_only',
              source: 'auto_fill',
              free_only: !paidMode,
              forceNew: true
            })
          }),
          2, // max 2 retries for auto-fill
          `auto-fill ${topic.topic_name}`
        );

        totalQuestionsRequested += questionsToRequest;
        if (paidMode) paidCallsUsed++;

        if (generateResponse.ok) {
          const result = await generateResponse.json();
          const saved = result.questions_saved || result.saved || 0;
          topicsProcessed++;
          totalQuestionsSaved += saved;
          totalDuplicateSkipped += Number(result.duplicate_skipped) || 0;
          totalTopicRejected += Number(result.topic_rejected) || 0;
          totalFlagged += Number(result.duplicates_flagged) || 0;
          totalApproved += Number(result.questions_approved) || 0;
          zeroYieldStreak = saved > 0 ? 0 : zeroYieldStreak + 1;
          console.log(`[Scheduled Auto-Fill] ✓ Generated ${saved} questions for "${topic.topic_name}" (total: ${totalQuestionsSaved}, discarded this call: ${Number(result.discarded_before_insert) || 0})`);

          // LOW-YIELD ABORT: three saturated topics in a row means the AI output
          // is being discarded as duplicates. Stop instead of paying for more.
          if (zeroYieldStreak >= 3) {
            stopReason = 'Low yield — 3 consecutive topics returned 0 usable questions';
            console.warn(`[Scheduled Auto-Fill] 🛑 ${stopReason}`);
            break;
          }
        } else {
          const errorText = await generateResponse.text();
          console.error(`[Scheduled Auto-Fill] Failed for ${topic.topic_name}:`, errorText);

          if (errorText.includes('FREE_ONLY_EXHAUSTED') || errorText.includes('paid fallback is disabled')) {
            stopReason = 'Free Gemini capacity exhausted (paid fallback disabled)';
            console.warn(`[Scheduled Auto-Fill] 🛑 ${stopReason}`);
            break;
          }

          if (errorText.toLowerCase().includes('limit') || errorText.toLowerCase().includes('quota')) {
            stopReason = 'Daily limit reached';
            break;
          }
        }
      } catch (retryErr: any) {
        console.error(`[Scheduled Auto-Fill] Retry exhausted for ${topic.topic_name}:`, retryErr.message);
        if (retryErr.message?.includes('quota') || retryErr.message?.includes('429')) {
          stopReason = 'API rate limit reached';
          break;
        }
      }

      // Check run target
      if (totalQuestionsSaved >= HARD_NIGHTLY_LIMIT) {
        stopReason = 'Run target reached (safety cap)';
        console.log(`[Scheduled Auto-Fill] ${stopReason}`);
        break;
      }


      // Small delay to prevent hammering
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    /**
     * WASTED-RUN detector: the run saved nothing even though the gap queue had
     * work in it. This is exactly the silent failure that burned 8 nightly runs
     * (sprint keyword matched nothing) — now it is recorded on the run summary
     * so the admin dashboard can raise a visible warning.
     */
    const wastedRun = totalQuestionsSaved === 0 && lastRawQueueSize > 0 && !queueError;
    if (wastedRun) {
      console.error(
        `[Scheduled Auto-Fill] 🚨 WASTED RUN — 0 questions saved while ${lastRawQueueSize} topic(s) were queued. Reason: ${stopReason}`,
      );
    }

    // ============= RUN SUMMARY (always logged, even for 0 questions) =============
    await logQuotaUsage(supabase, {
      source_type: 'auto_fill_run_summary',
      questions_requested: totalQuestionsRequested,
      questions_fetched: totalQuestionsSaved,
      questions_saved: totalQuestionsSaved,
      metadata: {
        run_summary: true,
        triggered_by: isAdminCall ? 'admin' : 'cron',
        topics_processed: topicsProcessed,
        depth_ladder_topics: depthTopicsProcessed,
        topics_attempted: attemptedTopicIds.size,
        questions_saved: totalQuestionsSaved,
        // Real yield accounting (previously invisible)
        questions_requested: totalQuestionsRequested,
        approved: totalApproved,
        flagged_duplicates: totalFlagged,
        duplicate_skipped: totalDuplicateSkipped,
        topic_rejected: totalTopicRejected,
        discarded_before_insert: totalDuplicateSkipped + totalTopicRejected,
        free_keys_usable: keyHealth.usable,
        free_keys_total: keyHealth.total,
        probe_calls: keyHealth.probe_calls,
        paid_mode: paidMode,
        paid_calls_used: paidCallsUsed,
        paid_calls_allowed: paidCallsAllowed,
        paid_budget_used_today: paidBudgetInfo.usedToday,
        paid_budget_daily_limit: paidBudgetInfo.dailyLimit,
        run_target: HARD_RUN_TARGET,
        batch_size: batchSize,
        sprint_mode: sprintOn,
        sprint_scope: sprintOn ? sprintKeywords : [],
        stop_reason: stopReason || 'completed',
        queue_error: queueError,
        queue_size: lastRawQueueSize,
        wasted_run: wastedRun,
        duration_ms: Date.now() - runStartedAt,
      },
    });

    // Log the run result
    console.log(`[Scheduled Auto-Fill] ✅ Completed. Topics: ${topicsProcessed}, Questions: ${totalQuestionsSaved}, Requested: ${totalQuestionsRequested}, Discarded: ${totalDuplicateSkipped + totalTopicRejected}, Reason: ${stopReason}`);

    return new Response(
      JSON.stringify({
        success: !queueError,
        message: `Auto-fill completed: ${stopReason}`,
        topics_processed: topicsProcessed,
        depth_ladder_topics: depthTopicsProcessed,
        topics_attempted: attemptedTopicIds.size,
        questions_saved: totalQuestionsSaved,
        questions_requested: totalQuestionsRequested,
        duplicate_skipped: totalDuplicateSkipped,
        topic_rejected: totalTopicRejected,
        flagged_duplicates: totalFlagged,
        free_keys_usable: keyHealth.usable,
        paid_mode: paidMode,
        paid_calls_used: paidCallsUsed,
        run_target: HARD_RUN_TARGET,
        sprint_mode: sprintOn,
        sprint_scope: sprintOn ? sprintKeywords : [],
        queue_error: queueError,
        queue_size: lastRawQueueSize,
        wasted_run: wastedRun,
        stop_reason: stopReason

      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );



  } catch (error: any) {
    if (error instanceof QuotaExhaustedError) {
      return quotaExhaustedResponse(corsHeaders);
    }
    console.error('[Scheduled Auto-Fill] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
