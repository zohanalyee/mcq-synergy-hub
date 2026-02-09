import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkQuota, retryWithBackoff, logQuotaUsage, quotaExhaustedResponse, QuotaExhaustedError } from '../_shared/quotaManager.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface AutoFillConfig {
  enabled: boolean;
  min_threshold: number;
  batch_size: number;
  priority: 'lowest_first' | 'random';
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

    // ============= ALREADY RAN TODAY CHECK =============
    const today = new Date().toISOString().split('T')[0];
    const { count: todayRunCount } = await supabase
      .from('ai_usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('source_type', 'auto_fill')
      .gte('created_at', `${today}T00:00:00Z`);

    if ((todayRunCount || 0) > 0) {
      console.log(`[Scheduled Auto-Fill] ⏭️ Already ran today (${todayRunCount} entries). Skipping.`);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'Already ran today', today_runs: todayRunCount }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    // Hard safety limits (reduced from 50 to 30)
    const HARD_BATCH_LIMIT = 5;
    const HARD_NIGHTLY_LIMIT = 30;
    
    const batchSize = Math.min(config.batch_size || 5, HARD_BATCH_LIMIT);
    let topicsProcessed = 0;
    let totalQuestionsSaved = 0;
    let stopReason = '';

    console.log(`[Scheduled Auto-Fill] Safety limits: batch=${batchSize}, nightly=${HARD_NIGHTLY_LIMIT}`);

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

      // Fetch the top priority gap
      const { data: queueData } = await supabase.rpc('get_autofill_queue', { 
        limit_count: 1 
      });
      
      const queue = queueData as AutoFillQueueItem[] | null;

      if (!queue || queue.length === 0) {
        stopReason = 'All topics fully stocked';
        console.log(`[Scheduled Auto-Fill] ${stopReason}`);
        break;
      }

      const topic = queue[0];
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
              difficulty: 'medium',
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
