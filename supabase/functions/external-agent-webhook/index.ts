import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface OpportunityPayload {
  title: string;
  description?: string;
  apply_url: string;
  type: 'job' | 'scholarship';
  organization?: string;
  location?: string;
  deadline_date?: string;
  sector?: 'government' | 'private';
  region?: 'sindh' | 'punjab' | 'kpk' | 'balochistan' | 'federal' | 'international' | 'other';
  scholarship_scope?: 'national' | 'international';
  source_name: string;
  image_url?: string;
  metadata?: Record<string, any>;
}

interface WebhookRequest {
  api_key: string;
  opportunities: OpportunityPayload[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const expectedApiKey = Deno.env.get('EXTERNAL_AGENT_API_KEY');

    // Parse request body
    const body: WebhookRequest = await req.json();

    // Validate API key
    const providedKey = body.api_key || req.headers.get('x-api-key');
    
    if (!expectedApiKey) {
      console.error('[External Webhook] EXTERNAL_AGENT_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook not configured. Please set EXTERNAL_AGENT_API_KEY.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (providedKey !== expectedApiKey) {
      console.log('[External Webhook] Invalid API key attempt');
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate payload
    if (!body.opportunities || !Array.isArray(body.opportunities)) {
      return new Response(
        JSON.stringify({ error: 'Invalid payload: opportunities array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (body.opportunities.length === 0) {
      return new Response(
        JSON.stringify({ success: true, added: 0, duplicates: 0, errors: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limit batch size to prevent abuse
    const MAX_BATCH_SIZE = 100;
    if (body.opportunities.length > MAX_BATCH_SIZE) {
      return new Response(
        JSON.stringify({ error: `Batch size exceeds maximum of ${MAX_BATCH_SIZE}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let added = 0;
    let duplicates = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    for (const opp of body.opportunities) {
      // Validate required fields
      if (!opp.title || !opp.apply_url || !opp.type || !opp.source_name) {
        errors++;
        errorDetails.push(`Missing required fields for: ${opp.title || 'unknown'}`);
        continue;
      }

      // Validate type
      if (!['job', 'scholarship'].includes(opp.type)) {
        errors++;
        errorDetails.push(`Invalid type for: ${opp.title}`);
        continue;
      }

      // Check for duplicate by apply_url
      const { data: existing } = await supabase
        .from('external_opportunities')
        .select('id')
        .eq('apply_url', opp.apply_url)
        .maybeSingle();

      if (existing) {
        duplicates++;
        continue;
      }

      // Insert new opportunity
      const { error: insertError } = await supabase
        .from('external_opportunities')
        .insert({
          title: opp.title.slice(0, 500), // Truncate long titles
          description: opp.description?.slice(0, 2000),
          apply_url: opp.apply_url,
          type: opp.type,
          organization: opp.organization,
          location: opp.location,
          deadline_date: opp.deadline_date,
          sector: opp.sector,
          region: opp.region,
          scholarship_scope: opp.scholarship_scope,
          source_name: opp.source_name,
          image_url: opp.image_url,
          metadata: opp.metadata,
          status: 'pending' // Always pending for admin review
        });

      if (insertError) {
        errors++;
        errorDetails.push(`Insert failed for: ${opp.title} - ${insertError.message}`);
        console.error('[External Webhook] Insert error:', insertError);
      } else {
        added++;
      }
    }

    console.log(`[External Webhook] Processed: ${added} added, ${duplicates} duplicates, ${errors} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        added,
        duplicates,
        errors,
        errorDetails: errors > 0 ? errorDetails : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[External Webhook] Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
