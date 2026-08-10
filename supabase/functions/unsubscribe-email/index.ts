// Public one-click unsubscribe for reminder emails.
// Flips email_prefs.streak_reminders to false for the given token. No login.

import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    let token: string | null = null
    if (req.method === 'GET') {
      token = new URL(req.url).searchParams.get('token')
    } else {
      const body = await req.json().catch(() => ({}))
      token = typeof body?.token === 'string' ? body.token : null
    }

    if (!token || !UUID_RE.test(token)) {
      return json({ error: 'Invalid or missing token' }, 400)
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data, error } = await admin
      .from('email_prefs')
      .update({ streak_reminders: false })
      .eq('unsubscribe_token', token)
      .select('user_id')
      .maybeSingle()

    if (error) throw error
    if (!data) return json({ error: 'Token not found' }, 404)

    await admin.from('email_send_log').insert({
      user_id: data.user_id,
      email_type: 'streak_reminder',
      status: 'unsubscribed',
    })

    return json({ ok: true })
  } catch (e: any) {
    console.error('[unsubscribe-email] error:', e?.message || e)
    return json({ error: String(e?.message || e) }, 500)
  }
})
