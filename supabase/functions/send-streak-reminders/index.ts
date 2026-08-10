// Daily streak-reminder emails (Resend).
// Selects users inactive for 2-4 days who opted in and were not emailed in the
// last 5 days, personalises the copy with their name + last attempted test, and
// sends one friendly Roman-Urdu/English reminder.
//
// Auth: service role, admin JWT, or x-cron-token (shared internal guard).
// Supports { dryRun: true } to inspect the recipient list without sending.

import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { requireAdminOrService } from '../_shared/adminGuard.ts'

const SITE_URL = 'https://mcqsai.com'
const FROM = 'MCQsAI <hello@mcqsai.com>'
const MAX_PER_RUN = 200
const INACTIVE_MIN_DAYS = 2
const INACTIVE_MAX_DAYS = 4
const REMINDER_COOLDOWN_DAYS = 5

type Candidate = {
  userId: string
  email: string
  name: string
  lastActiveAt: string | null
  testName: string | null
  score: number | null
  total: number | null
  testUrl: string
  unsubscribeToken: string
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const firstName = (raw: string | null | undefined, email: string) => {
  let source = (raw || '').trim()
  // Ignore email-like or handle-like usernames — they make terrible greetings.
  if (!source || source.includes('@')) source = email.split('@')[0]
  const cleaned = source
    .replace(/[._\-+]+/g, ' ')
    .replace(/[^\p{L}\s]/gu, '') // drop digits/symbols, keep letters
    .trim()
  const first = cleaned.split(/\s+/)[0] || ''
  if (first.length < 2) return 'dost'
  return first.charAt(0).toUpperCase() + first.slice(1)
}

function buildEmail(c: Candidate) {
  const name = c.name
  const unsubUrl = `${SITE_URL}/unsubscribe?token=${c.unsubscribeToken}`
  const ctaUrl = `${SITE_URL}${c.testUrl}`
  const coachUrl = `${SITE_URL}/dashboard`

  const subject = `${name} — 10 questions, 5 minutes. Chalein?`

  const hasAttempt = !!c.testName
  const scoreBit =
    c.score !== null && c.total ? ` (${c.score}/${c.total} correct)` : ''

  // Raw (unescaped) copy — escaped only when injected into HTML.
  const bodyBlocks = hasAttempt
    ? [
        `Assalam-o-Alaikum ${name} 👋`,
        `2 din se aap nazar nahi aaye — sab khairiyat? 🙂`,
        `Aap ne last time "${c.testName}" attempt kiya tha${scoreBit}. Achhi baat yeh hai: is test ke liye hamare paas questions ka bohat bara bank hai — aap jitni baar chahein practice kar sakte hain, har baar naye questions milenge. Questions khatam hone ka koi darr nahi. 💪`,
        `Aur aapka AI Coach bhi kaam kar raha hai — wo silently aapki progress track kar raha hai, aapke weak topics note kar raha hai, aur next practice ke liye plan bana raha hai. Aap sahi jagah par hain apni preparation ke liye.`,
      ]
    : [
        `Assalam-o-Alaikum ${name} 👋`,
        `Aap ne account bana liya tha lekin abhi pehla test start nahi kiya 🙂`,
        `Shuru karna asaan hai — apna exam choose karein, aur 10 questions se test-drive karein. Questions ka bohat bara bank hai, aur AI Coach pehle test ke baad hi aapki progress track karna shuru kar dega.`,
      ]

  const ctaLabel = hasAttempt ? 'Continue practice — 10 questions' : 'Pehla test shuru karein'
  const closing = hasAttempt
    ? 'Aaj sirf 10 questions. 5 minute. Bas itna hi. Streak bach jayega. 🔥'
    : 'Aaj sirf 10 questions. 5 minute. Bas itna hi. 🔥'

  const paragraphs = bodyBlocks
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#1f2937;">${esc(p)}</p>`
    )
    .join('')

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f6f7fb;">
  <div style="display:none;max-height:0;overflow:hidden;">${esc(closing)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr><td style="padding:20px 24px;background:linear-gradient(90deg,#7c3aed,#06b6d4);">
          <span style="font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">MCQsAI</span>
        </td></tr>
        <tr><td style="padding:24px;font-family:Arial,Helvetica,sans-serif;">
          ${paragraphs}
          <p style="margin:24px 0 12px;">
            <a href="${ctaUrl}" style="display:inline-block;background:linear-gradient(90deg,#7c3aed,#06b6d4);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:13px 22px;border-radius:12px;">${esc(ctaLabel)}</a>
          </p>
          <p style="margin:0 0 20px;font-size:14px;">
            <a href="${coachUrl}" style="color:#7c3aed;text-decoration:underline;">Dekhein aapka AI Coach kya kehta hai</a>
          </p>
          <p style="margin:0 0 8px;font-size:15px;line-height:1.65;color:#1f2937;">${esc(closing)}</p>
          <p style="margin:0;font-size:14px;color:#6b7280;">— Team MCQsAI</p>
        </td></tr>
        <tr><td style="padding:16px 24px 24px;border-top:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9ca3af;">
          Yeh reminder aap ne on kiya tha. Nahi chahiye? Ek click mein band karein:
          <a href="${unsubUrl}" style="color:#6b7280;">Unsubscribe</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

  const text = [
    ...bodyBlocks,
    `${ctaLabel}: ${ctaUrl}`,
    `AI Coach: ${coachUrl}`,
    closing,
    '— Team MCQsAI',
    '',
    `Unsubscribe: ${unsubUrl}`,
  ].join('\n\n')

  return { subject, html, text }
}


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const denied = await requireAdminOrService(req)
  if (denied) return denied

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendKey = Deno.env.get('RESEND_API_KEY')
    const admin = createClient(supabaseUrl, serviceKey)

    let dryRun = false
    let testEmail: string | null = null
    try {
      const body = await req.json()
      dryRun = body?.dryRun === true
      if (typeof body?.testEmail === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.testEmail)) {
        testEmail = body.testEmail.trim()
      }
    } catch (_) {
      /* no body */
    }

    if (!resendKey && !dryRun) {
      return json({ error: 'RESEND_API_KEY is not configured' }, 500)
    }

    // One-off preview send: sample copy to a single address, no DB writes.
    if (testEmail) {
      const sample = buildEmail({
        userId: 'test',
        email: testEmail,
        name: firstName(null, testEmail),
        lastActiveAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        testName: 'General Knowledge & Everyday Science practice test',
        score: 11,
        total: 20,
        testUrl: '/mock-tests',
        unsubscribeToken: 'preview-token',
      })
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
        body: JSON.stringify({
          from: FROM,
          to: [testEmail],
          subject: `[TEST] ${sample.subject}`,
          html: sample.html,
          text: sample.text,
        }),
      })
      const bodyText = await res.text()
      if (!res.ok) {
        console.error(`[streak-reminders] test send failed [${res.status}]: ${bodyText}`)
        return json({ error: 'Resend request failed', status: res.status, details: bodyText }, res.status)
      }
      return json({ ok: true, testEmail, sent: 1, subject: `[TEST] ${sample.subject}` })
    }


    const now = Date.now()
    const inactiveSince = new Date(now - INACTIVE_MAX_DAYS * 86400000) // oldest allowed activity
    const inactiveUntil = new Date(now - INACTIVE_MIN_DAYS * 86400000) // newest allowed activity
    const cooldownBefore = new Date(now - REMINDER_COOLDOWN_DAYS * 86400000)

    // Opted-in users who are off cooldown.
    const { data: prefs, error: prefsErr } = await admin
      .from('email_prefs')
      .select('user_id, unsubscribe_token, last_reminder_at')
      .eq('streak_reminders', true)
      .or(`last_reminder_at.is.null,last_reminder_at.lt.${cooldownBefore.toISOString()}`)
      .limit(2000)

    if (prefsErr) throw prefsErr
    if (!prefs?.length) return json({ ok: true, candidates: 0, sent: 0, dryRun })

    const userIds = prefs.map((p: any) => p.user_id)

    // Latest activity per user within the inactivity window.
    const { data: attempts } = await admin
      .from('test_attempts')
      .select('user_id, content_id, test_type, score, total_questions, completed_at, subjects')
      .in('user_id', userIds)
      .order('completed_at', { ascending: false })
      .limit(5000)

    const latestAttempt = new Map<string, any>()
    for (const a of attempts || []) {
      if (!latestAttempt.has(a.user_id)) latestAttempt.set(a.user_id, a)
    }

    // Resolve friendly test titles for job/mock tests.
    const contentIds = Array.from(
      new Set(
        Array.from(latestAttempt.values())
          .map((a) => a.content_id)
          .filter((id: any) => typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id))
      )
    )
    const titleById = new Map<string, string>()
    if (contentIds.length) {
      const { data: jobTests } = await admin
        .from('job_tests')
        .select('id, title')
        .in('id', contentIds)
      for (const t of jobTests || []) titleById.set(t.id, t.title)
    }

    const { data: profiles } = await admin
      .from('profiles')
      .select('id, username')
      .in('id', userIds)
    const nameById = new Map<string, string | null>((profiles || []).map((p: any) => [p.id, p.username]))

    const candidates: Candidate[] = []

    for (const pref of prefs as any[]) {
      const attempt = latestAttempt.get(pref.user_id)
      const lastActive = attempt?.completed_at ? new Date(attempt.completed_at) : null

      // Only nudge users whose last activity sits inside the 2-4 day window.
      // Users who never practised are handled by the no-attempt variant, but
      // only when their account itself is inside the window (checked below).
      if (lastActive && !(lastActive <= inactiveUntil && lastActive >= inactiveSince)) continue

      const { data: authUser } = await admin.auth.admin.getUserById(pref.user_id)
      const email = authUser?.user?.email
      if (!email) continue

      if (!lastActive) {
        const created = authUser.user?.created_at ? new Date(authUser.user.created_at) : null
        if (!created || !(created <= inactiveUntil && created >= inactiveSince)) continue
      }

      const rawName =
        nameById.get(pref.user_id) ||
        (authUser.user?.user_metadata?.full_name as string | undefined) ||
        null

      const testName = attempt
        ? titleById.get(attempt.content_id) ||
          (Array.isArray(attempt.subjects) && attempt.subjects.length
            ? `${attempt.subjects[0]} practice test`
            : null)
        : null

      candidates.push({
        userId: pref.user_id,
        email,
        name: firstName(rawName, email),
        lastActiveAt: attempt?.completed_at ?? null,
        testName,
        score: attempt?.score ?? null,
        total: attempt?.total_questions ?? null,
        testUrl: attempt ? '/mock-tests' : '/mock-tests',
        unsubscribeToken: pref.unsubscribe_token,
      })

      if (candidates.length >= MAX_PER_RUN) break
    }

    if (dryRun) {
      return json({
        ok: true,
        dryRun: true,
        candidates: candidates.length,
        preview: candidates.slice(0, 10).map((c) => ({
          email: c.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
          name: c.name,
          testName: c.testName,
          lastActiveAt: c.lastActiveAt,
        })),
        sampleEmail: candidates.length ? buildEmail(candidates[0]) : null,
      })
    }

    let sent = 0
    let failed = 0

    for (const c of candidates) {
      const { subject, html, text } = buildEmail(c)
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: FROM,
            to: [c.email],
            subject,
            html,
            text,
            headers: {
              'List-Unsubscribe': `<${SITE_URL}/unsubscribe?token=${c.unsubscribeToken}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
          }),
        })

        if (!res.ok) {
          const errorBody = await res.text()
          console.error(`[streak-reminders] Resend failed [${res.status}]: ${errorBody}`)
          failed++
          await admin.from('email_send_log').insert({
            user_id: c.userId,
            email_type: 'streak_reminder',
            status: 'failed',
            error: `[${res.status}] ${errorBody}`.slice(0, 1000),
          })
          continue
        }

        await res.text()
        sent++
        await admin
          .from('email_prefs')
          .update({ last_reminder_at: new Date().toISOString() })
          .eq('user_id', c.userId)
        await admin.from('email_send_log').insert({
          user_id: c.userId,
          email_type: 'streak_reminder',
          status: 'sent',
          meta: { test_name: c.testName, last_active_at: c.lastActiveAt },
        })
      } catch (e: any) {
        failed++
        console.error('[streak-reminders] send error:', e?.message || e)
        await admin.from('email_send_log').insert({
          user_id: c.userId,
          email_type: 'streak_reminder',
          status: 'failed',
          error: String(e?.message || e).slice(0, 1000),
        })
      }
    }

    return json({ ok: true, candidates: candidates.length, sent, failed })
  } catch (e: any) {
    console.error('[streak-reminders] fatal:', e?.message || e)
    return json({ error: String(e?.message || e) }, 500)
  }
})
