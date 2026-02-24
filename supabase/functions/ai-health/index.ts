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

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    console.log('🔍 AI Health Check initiated');
    console.log(`🔑 GEMINI_API_KEY configured: ${GEMINI_API_KEY ? 'Yes' : 'NO'}`);
    
    if (GEMINI_API_KEY) {
      console.log(`🔑 Key prefix: ${GEMINI_API_KEY.substring(0, 8)}...`);
      console.log(`🔑 Key length: ${GEMINI_API_KEY.length} characters`);
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({
          gemini_key_configured: false,
          gemini_key_valid: false,
          models_available: [],
          error: 'GEMINI_API_KEY secret is not configured in Supabase',
          instructions: 'Add your Google Gemini API key to Supabase Edge Function secrets'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Test the API key by calling the models endpoint (free, no quota consumed)
    console.log('📤 Testing API key against Google Gemini /models endpoint...');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
    );

    console.log(`📥 Google API Response Status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      const modelNames = data.models?.map((m: any) => m.name) || [];
      const geminiModels = modelNames.filter((n: string) => n.includes('gemini'));
      
      console.log(`✅ API Key is VALID. Found ${geminiModels.length} Gemini models.`);
      
      return new Response(
        JSON.stringify({
          gemini_key_configured: true,
          gemini_key_valid: true,
          models_available: geminiModels.slice(0, 10), // Limit to first 10
          error: null,
          status: 'healthy',
          message: 'Google Gemini API key is valid and working'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } else {
      const errorText = await response.text();
      console.error(`❌ API Key validation failed [${response.status}]: ${errorText}`);
      
      let errorMessage = 'Unknown error';
      let errorCode = 'unknown';
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorText;
        errorCode = errorJson.error?.status || String(response.status);
      } catch {
        errorMessage = errorText;
      }
      
      return new Response(
        JSON.stringify({
          gemini_key_configured: true,
          gemini_key_valid: false,
          models_available: [],
          error: errorMessage,
          error_code: errorCode,
          http_status: response.status,
          status: 'unhealthy',
          troubleshooting: response.status === 403 
            ? 'API key may be invalid, restricted, or quota exceeded. Check Google Cloud Console.'
            : response.status === 429 
              ? 'Rate limit hit. Wait a moment and try again.'
              : 'Check that the API key is correct and has Gemini API enabled.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
  } catch (error: any) {
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
