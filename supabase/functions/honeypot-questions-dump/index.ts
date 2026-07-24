// Honeypot decoy endpoint — Phase 5 Week 1 (observe-only).
// Real clients never call this. Every hit is logged to scraper_signals.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const xff = req.headers.get('x-forwarded-for') ?? '';
    const rawIp = xff.split(',')[0]?.trim() || req.headers.get('cf-connecting-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') ?? '';
    const country = req.headers.get('cf-ipcountry') ?? null;
    const asn = req.headers.get('cf-asn') ?? null;
    const url = new URL(req.url);

    const ipHash = await sha256(rawIp);

    // Fire-and-forget insert; never block the response on logging errors.
    supabase.from('scraper_signals').insert({
      ip_hash: ipHash,
      user_agent: userAgent,
      endpoint: 'honeypot_questions_dump',
      signal_type: 'honeypot',
      metadata: {
        method: req.method,
        path: url.pathname,
        query: url.search,
        country,
        asn,
      },
    }).then(({ error }) => {
      if (error) console.error('[honeypot] insert error', error);
    });

    return new Response(
      JSON.stringify({
        warning: 'scraping detected',
        message: 'This endpoint is a decoy. All access is logged.',
        items: [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );
  } catch (err) {
    console.error('[honeypot] error', err);
    return new Response(
      JSON.stringify({ warning: 'scraping detected', items: [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );
  }
});
