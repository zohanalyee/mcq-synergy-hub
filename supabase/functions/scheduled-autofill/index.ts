import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkQuota, retryWithBackoff, logQuotaUsage, quotaExhaustedResponse, QuotaExhaustedError } from '../_shared/quotaManager.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-trigger, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface AutoFillConfig {
  enabled: boolean;
  min_threshold: number;
  batch_size: number;
  priority: 'lowest_first' | 'random';
  run_target?: number;
  difficulty_weights?: { easy?: number; medium?: number; hard?: number };
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
    const isScheduledCall = authHeader?.includes(supabaseServiceKey);
    const isAdminCall = req.headers.get('x-admin-trigger') === 'true';

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
      const since = new Date(Date.now() - 90 * 60 * 1000).toISOString();
      const { count: recentRunCount } = await supabase
        .from('ai_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('source_type', 'auto_fill_run_summary')
        .gte('created_at', since);

      if ((recentRunCount || 0) > 0) {
        console.log(`[Scheduled Auto-Fill] ⏭️ A run already happened in the last 90 minutes. Skipping.`);
        return new Response(
          JSON.stringify({ success: true, skipped: true, reason: 'Recent run within 90 minutes', recent_runs: recentRunCount }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check if auto-fill is enabled
    const { data: configData } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'auto_fill_config')
      .single();

    const config = configData?.value as AutoFillConfig | null;
    
    if (!config?.enabled) {
      console.log('[Scheduled Auto-Fill] Auto-fill is disabled. Exiting.');
      return new Response(
        JSON.stringify({ success: true, message: 'Auto-fill is disabled', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Phase 2 safety limits — raised deliberately. Real ceiling stays the
    // DAILY_QUOTA_LIMIT check in quotaManager (1400 requests/day).
    const HARD_BATCH_LIMIT = 20;
    const DEFAULT_RUN_TARGET = 600;
    const HARD_RUN_TARGET = Math.max(
      10,
      Math.min(config.run_target || DEFAULT_RUN_TARGET, 1500)
    );
    const HARD_NIGHTLY_LIMIT = HARD_RUN_TARGET;

    const batchSize = Math.min(config.batch_size || 15, HARD_BATCH_LIMIT);

    // Difficulty rotation from configured weights (default 20/60/20).
    const weights = config.difficulty_weights || { easy: 20, medium: 60, hard: 20 };
    const difficultyPool: string[] = [
      ...Array(Math.max(1, Math.round((weights.easy ?? 20) / 10))).fill('easy'),
      ...Array(Math.max(1, Math.round((weights.medium ?? 60) / 10))).fill('medium'),
      ...Array(Math.max(1, Math.round((weights.hard ?? 20) / 10))).fill('hard'),
    ];
    let difficultyIndex = 0;

    let topicsProcessed = 0;
    let totalQuestionsSaved = 0;
    let stopReason = '';
    let queueError: string | null = null;
    const attemptedTopicIds = new Set<string>();
    const runStartedAt = Date.now();

    console.log(`[Scheduled Auto-Fill] Limits: batch=${batchSize}, run_target=${HARD_RUN_TARGET}`);

    // Continuous loop until limit hit or no gaps
    while (totalQuestionsSaved < HARD_NIGHTLY_LIMIT) {
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
        limit_count: 50
      });

      if (queueRpcError) {
        queueError = queueRpcError.message;
        stopReason = `Queue unavailable: ${queueRpcError.message}`;
        console.error(`[Scheduled Auto-Fill] ❌ ${stopReason}`);
        break;
      }

      const queue = (queueData as AutoFillQueueItem[] | null) || [];
      const topic = queue.find((q) => !attemptedTopicIds.has(q.topic_id));

      if (!topic) {
        stopReason = queue.length === 0
          ? 'All topics fully stocked'
          : 'All queued topics already attempted in this run';
        console.log(`[Scheduled Auto-Fill] ${stopReason}`);
        break;
      }

      attemptedTopicIds.add(topic.topic_id);
      console.log(`[Scheduled Auto-Fill] Generating for topic: ${topic.topic_name} (${topic.subject_name})`);

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
              forceNew: true
            })
          }),
          2, // max 2 retries for auto-fill
          `auto-fill ${topic.topic_name}`
        );

        if (generateResponse.ok) {
          const result = await generateResponse.json();
          const saved = result.questions_saved || result.saved || 0;
          topicsProcessed++;
          totalQuestionsSaved += saved;
          console.log(`[Scheduled Auto-Fill] ✓ Generated ${saved} questions for "${topic.topic_name}" (total: ${totalQuestionsSaved})`);
        } else {
          const errorText = await generateResponse.text();
          console.error(`[Scheduled Auto-Fill] Failed for ${topic.topic_name}:`, errorText);
          
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

      // Check nightly limit
      if (totalQuestionsSaved >= HARD_NIGHTLY_LIMIT) {
        stopReason = 'Nightly limit reached (safety cap)';
        console.log(`[Scheduled Auto-Fill] ${stopReason}`);
        break;
      }

      // Small delay to prevent hammering
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // Log the run result
    console.log(`[Scheduled Auto-Fill] ✅ Completed. Topics: ${topicsProcessed}, Questions: ${totalQuestionsSaved}, Reason: ${stopReason}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Auto-fill completed: ${stopReason}`,
        topics_processed: topicsProcessed,
        questions_saved: totalQuestionsSaved,
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
