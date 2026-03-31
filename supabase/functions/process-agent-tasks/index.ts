import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MAX_RETRIES = 3;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Allow service role (cron) or admin JWT
    const authHeader = req.headers.get('Authorization');
    let isAuthorized = false;

    if (authHeader?.includes(serviceKey)) {
      isAuthorized = true;
    } else if (authHeader?.startsWith('Bearer ')) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace('Bearer ', '');
      const { data: claimsData } = await userClient.auth.getClaims(token);
      if (claimsData?.claims?.sub) {
        const { data: adminCheck } = await userClient
          .from('user_roles')
          .select('role')
          .eq('user_id', claimsData.claims.sub)
          .eq('role', 'admin')
          .maybeSingle();
        isAuthorized = !!adminCheck;
      }
    }

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Fetch pending tasks
    const { data: tasks, error: fetchError } = await adminClient
      .from('agent_tasks')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(5);

    if (fetchError) {
      throw new Error(`Failed to fetch tasks: ${fetchError.message}`);
    }

    if (!tasks || tasks.length === 0) {
      console.log('[process-agent-tasks] No pending tasks');
      return new Response(JSON.stringify({ processed: 0, message: 'No pending tasks' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[process-agent-tasks] Processing ${tasks.length} tasks`);
    const results: any[] = [];

    for (const task of tasks) {
      // Mark as processing
      await adminClient
        .from('agent_tasks')
        .update({ status: 'processing', started_at: new Date().toISOString() })
        .eq('id', task.id);

      try {
        let response;
        const functionUrl = `${supabaseUrl}/functions/v1`;

        switch (task.task_type) {
          case 'blog': {
            const input = task.input_data as any;
            response = await fetch(`${functionUrl}/generate-blog`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${serviceKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                title: input.title,
                topic: input.topic,
                keywords: input.keywords || [],
                targetLength: input.targetLength || 1300,
                taskId: task.id,
              }),
            });
            break;
          }

          case 'mcq': {
            const input = task.input_data as any;
            response = await fetch(`${functionUrl}/generate-test`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${serviceKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                mode: 'bank_only',
                subject: input.subject,
                topic: input.topic,
                difficulty: input.difficulty || 'Medium',
                count: input.count || 20,
              }),
            });
            break;
          }

          case 'job': {
            response = await fetch(`${functionUrl}/fetch-external-jobs`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${serviceKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(task.input_data || {}),
            });
            break;
          }

          case 'scholarship': {
            const input = task.input_data as any;
            response = await fetch(`${functionUrl}/scrape-scholarships`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${serviceKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sourceUrl: input.sourceUrl || null,
              }),
            });
            break;
          }

          case 'tender': {
            const input = task.input_data as any;
            response = await fetch(`${functionUrl}/scrape-tenders`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${serviceKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sourceUrl: input.sourceUrl || null,
              }),
            });
            break;
          }

          default:
            throw new Error(`Unknown task type: ${task.task_type}`);
        }

        if (response && !response.ok) {
          const errText = await response.text();
          throw new Error(`Function call failed (${response.status}): ${errText.substring(0, 200)}`);
        }

        const responseData = response ? await response.json() : {};

        // Update task as completed (blog updates itself via taskId, others update here)
        if (task.task_type !== 'blog') {
          await adminClient
            .from('agent_tasks')
            .update({
              status: 'completed',
              output_data: responseData,
              completed_at: new Date().toISOString(),
            })
            .eq('id', task.id);
        }

        results.push({ id: task.id, type: task.task_type, status: 'completed' });
        console.log(`[process-agent-tasks] ✅ Task ${task.id} (${task.task_type}) completed`);

      } catch (taskError: any) {
        console.error(`[process-agent-tasks] ❌ Task ${task.id} failed:`, taskError.message?.substring(0, 200));

        const newRetryCount = (task.retry_count || 0) + 1;
        const isFinalFailure = newRetryCount >= MAX_RETRIES;

        await adminClient
          .from('agent_tasks')
          .update({
            status: isFinalFailure ? 'failed' : 'pending',
            error_message: taskError.message?.substring(0, 500),
            retry_count: newRetryCount,
            ...(isFinalFailure ? { completed_at: new Date().toISOString() } : { started_at: null }),
          })
          .eq('id', task.id);

        results.push({
          id: task.id,
          type: task.task_type,
          status: isFinalFailure ? 'failed' : 'retrying',
          error: taskError.message?.substring(0, 100),
          retry_count: newRetryCount,
        });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[process-agent-tasks] Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
