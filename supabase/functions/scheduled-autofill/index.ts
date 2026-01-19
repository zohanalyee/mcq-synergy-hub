import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

interface AIUsageToday {
  total_requests: number;
  total_questions_requested: number;
  total_questions_saved: number;
  daily_limit: number;
  remaining_requests: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[Scheduled Auto-Fill] Starting nightly auto-fill job...');

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

    const batchSize = config.batch_size || 20;
    let topicsProcessed = 0;
    let totalQuestionsSaved = 0;
    let stopReason = '';

    // Continuous loop until limit hit or no gaps
    while (true) {
      // Check daily usage quota
      const { data: usageData } = await supabase.rpc('get_ai_usage_today');
      const usage = usageData?.[0] as AIUsageToday | null;

      if (!usage || usage.remaining_requests <= 0) {
        stopReason = 'Daily limit reached';
        console.log(`[Scheduled Auto-Fill] ${stopReason}`);
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

      // Call the generate-test function
      const generateResponse = await fetch(`${supabaseUrl}/functions/v1/generate-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          topic: `${topic.topic_name} (${topic.subject_name})`,
          topic_id: topic.topic_id,
          difficulty: 'medium',
          question_count: Math.min(batchSize, topic.questions_needed),
          mode: 'bank_only',
          source: 'scheduled_auto_fill',
          forceNew: true
        })
      });

      if (generateResponse.ok) {
        const result = await generateResponse.json();
        topicsProcessed++;
        totalQuestionsSaved += result.questions_saved || 0;
        console.log(`[Scheduled Auto-Fill] ✓ Generated ${result.questions_saved} questions for "${topic.topic_name}"`);
      } else {
        const errorText = await generateResponse.text();
        console.error(`[Scheduled Auto-Fill] Failed for ${topic.topic_name}:`, errorText);
        
        // Check if it's a limit error
        if (errorText.toLowerCase().includes('limit') || errorText.toLowerCase().includes('quota')) {
          stopReason = 'Daily limit reached';
          break;
        }
      }

      // Small delay to prevent hammering the API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Log the run result
    console.log(`[Scheduled Auto-Fill] Completed. Topics: ${topicsProcessed}, Questions: ${totalQuestionsSaved}, Reason: ${stopReason}`);

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

  } catch (error) {
    console.error('[Scheduled Auto-Fill] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
