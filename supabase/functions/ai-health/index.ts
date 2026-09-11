import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * AI Health Check Endpoint
 * 
 * Tests the Google Gemini API key validity without consuming generation quota.
 * Uses the /models endpoint which is a free read-only call.
 * 
 * Returns:
 * - gemini_key_configured: boolean - whether GEMINI_API_KEY secret exists
 * - gemini_key_valid: boolean - whether the key is accepted by Google
 * - models_available: string[] - list of available models (if key is valid)
 * - error: string | null - error message if key is invalid
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require admin authentication
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Allow service role calls (internal/cron)
    const isServiceRole = authHeader === `Bearer ${supabaseServiceKey}`;

    if (!isServiceRole) {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const token = authHeader?.replace('Bearer ', '');
      if (!token) {
        return new Response(JSON.stringify({ error: 'Authentication required' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      // Check admin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      if (!roleData) {
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Checks EVERY configured free key (#1 → #2 → #3) against the /models
    // endpoint, which is free and consumes no generation quota.
    const freeKeys = getFreeGeminiKeys();

    console.log('🔍 AI Health Check initiated');
    console.log(`🔑 Free Gemini keys configured: ${freeKeys.length}`);

    if (freeKeys.length === 0) {
      return new Response(
        JSON.stringify({
          gemini_key_configured: false,
          gemini_key_valid: false,
          models_available: [],
          keys: [],
          error: 'No Gemini API key secret is configured',
          instructions: 'Add GEMINI_API_KEY (and optionally EXTERNAL_JOBS_GEMINI_KEY / GEMINI_API_KEY_3) to Supabase secrets'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const keyReports: any[] = [];
    let anyValid = false;
    let modelsFromValidKey: string[] = [];

    for (const { key, index } of freeKeys) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        if (response.ok) {
          const data = await response.json();
          const geminiModels = (data.models?.map((m: any) => m.name) || [])
            .filter((n: string) => n.includes('gemini'));
          anyValid = true;
          if (modelsFromValidKey.length === 0) modelsFromValidKey = geminiModels.slice(0, 10);
          keyReports.push({ key_number: index + 1, valid: true, models_found: geminiModels.length });
          console.log(`✅ key #${index + 1} VALID (${geminiModels.length} gemini models)`);
        } else {
          const errorText = await response.text();
          let errorMessage = errorText;
          try {
            errorMessage = JSON.parse(errorText).error?.message || errorText;
          } catch { /* keep raw text */ }
          keyReports.push({
            key_number: index + 1,
            valid: false,
            http_status: response.status,
            error: String(errorMessage).substring(0, 200),
          });
          console.error(`❌ key #${index + 1} invalid [${response.status}]`);
        }
      } catch (err: any) {
        keyReports.push({ key_number: index + 1, valid: false, error: String(err?.message).substring(0, 200) });
      }
    }

    return new Response(
      JSON.stringify({
        gemini_key_configured: true,
        gemini_key_valid: anyValid,
        keys_configured: freeKeys.length,
        keys: keyReports,
        models_available: modelsFromValidKey,
        status: anyValid ? 'healthy' : 'unhealthy',
        error: anyValid ? null : 'No configured Gemini key is currently valid',
        troubleshooting: anyValid
          ? undefined
          : 'Check the keys in Google AI Studio — invalid, restricted, or project quota exceeded.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
    console.error('🚨 Health check error:', error);
    
    return new Response(
      JSON.stringify({
        gemini_key_configured: !!Deno.env.get('GEMINI_API_KEY'),
        gemini_key_valid: false,
        error: error.message || 'Unknown error during health check',
        status: 'error'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
