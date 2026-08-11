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
import { LOGO_BASE64, LOGO_CID } from './logo.ts'

const SITE_URL = 'https://mcqsai.com'
const FROM = 'MCQsAI <hello@mcqsai.com>'
const MAX_PER_RUN = 200
const INACTIVE_MIN_DAYS = 2
const INACTIVE_MAX_DAYS = 4
const REMINDER_COOLDOWN_DAYS = 5
// Separate "never started" nudge: signed up but zero attempts, ever.
const NEVER_STARTED_COOLDOWN_DAYS = 7
const MAX_NEVER_STARTED_PER_RUN = 100
const NEVER_STARTED_TYPE = 'never_started_nudge'

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
  variant?: 'streak' | 'never_started'
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// The logo travels WITH the email as an inline CID attachment. Hosting it on
// mcqsai.com does not work: Cloudflare bot-challenges (403) block Gmail's image proxy.
const LOGO_URL = `cid:${LOGO_CID}`
const LOGO_ATTACHMENT = {
  filename: 'mcqsai-logo.png',
  content: LOGO_BASE64,
  content_id: LOGO_CID,
  content_type: 'image/png',
  disposition: 'inline',
}

const firstName = (raw: string | null | undefined, email: string) => {
  let source = (raw || '').trim()
  // Ignore email-like or handle-like usernames — they make terrible greetings.
  if (!source || source.includes('@')) source = email.split('@')[0]
  const cleaned = source
    .replace(/[._\-+]+/g, ' ')
    .replace(/(?<=[a-z])(?=[A-Z])/g, ' ') // camelCase → two words
    .replace(/[^\p{L}\s]/gu, '') // drop digits/symbols, keep letters
    .trim()
  const first = cleaned.split(/\s+/)[0] || ''
  // A glued handle ("zohaibalichanna") is not a name — greet warmly instead.
  if (first.length < 2 || first.length > 14) return 'dost'
  return first.charAt(0).toUpperCase() + first.slice(1)

}

function buildEmail(c: Candidate) {
  const name = c.name
  const unsubUrl = `${SITE_URL}/unsubscribe?token=${c.unsubscribeToken}`
  const ctaUrl = `${SITE_URL}${c.testUrl}`
  const coachUrl = `${SITE_URL}/dashboard`

  const subject =
    c.variant === 'never_started'
      ? `${name} — pehla test shuru karein? 10 questions, 5 minutes`
      : `${name} — 10 questions, 5 minutes. Chalein?`

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
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1f2937;">${esc(p)}</p>`
    )
    .join('')

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f5f6fb;">
  <div style="display:none;max-height:0;overflow:hidden;">${esc(closing)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6fb;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 32px rgba(76,29,149,0.12);border:1px solid #ece9f8;">

        <!-- Brand header: logo tile + wordmark on brand gradient -->
        <tr><td style="padding:26px 24px 24px;background:linear-gradient(120deg,#6d28d9 0%,#7c3aed 45%,#22d3ee 100%);">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:12px;" valign="middle">
                <img src="${LOGO_URL}" width="44" height="44" alt="MCQSAI"
                  style="display:block;width:44px;height:44px;border-radius:12px;border:0;background:#ffffff;" />
              </td>
              <td valign="middle">
                <div style="font-family:'Trebuchet MS',Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:1px;line-height:1.1;">MCQSAI</div>
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:rgba(255,255,255,0.85);margin-top:3px;">AI-powered exam prep · Made in Pakistan</div>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Streak strip -->
        <tr><td style="padding:14px 24px;background:#faf8ff;border-bottom:1px solid #f0ecfd;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6d28d9;font-weight:700;">
          🔥 Aapka streak wapas jag sakta hai — sirf 5 minute chahiye
        </td></tr>

        <tr><td style="padding:26px 24px 8px;font-family:Arial,Helvetica,sans-serif;">
          ${paragraphs}
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 14px;">
            <tr><td style="border-radius:14px;background:linear-gradient(120deg,#6d28d9,#22d3ee);box-shadow:0 8px 18px rgba(109,40,217,0.28);">
              <a href="${ctaUrl}" style="display:inline-block;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 26px;border-radius:14px;">${esc(ctaLabel)} →</a>
            </td></tr>
          </table>
          <p style="margin:0 0 22px;font-size:14px;">
            <a href="${coachUrl}" style="color:#6d28d9;text-decoration:none;font-weight:600;border-bottom:1px solid #ddd6fe;">Dekhein aapka AI Coach kya kehta hai</a>
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
            <tr><td style="padding:14px 16px;background:#f8fafc;border-left:3px solid #22d3ee;border-radius:10px;font-size:14px;line-height:1.6;color:#334155;">
              ${esc(closing)}
            </td></tr>
          </table>
          <p style="margin:0 0 22px;font-size:14px;color:#6b7280;">— Team MCQSAI</p>
        </td></tr>

        <tr><td style="padding:16px 24px 26px;border-top:1px solid #f1f0f7;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#9ca3af;">
          Yeh reminder aap ne khud on kiya tha. Nahi chahiye? Ek click mein band karein:
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
    '— Team MCQSAI',
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
    let testName: string | null = null
    try {
      const body = await req.json()
      dryRun = body?.dryRun === true
      if (typeof body?.testEmail === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.testEmail)) {
        testEmail = body.testEmail.trim()
      }
      if (typeof body?.name === 'string' && body.name.trim()) testName = body.name.trim()
    } catch (_) {
      /* no body */
    }

    if (!resendKey && !dryRun) {
      return json({ error: 'RESEND_API_KEY is not configured' }, 500)
    }

    // One-off preview send: sample copy to a single address, no DB writes.
    if (testEmail) {
      // Prefer the stored first name for a realistic preview greeting.
      let previewRaw: string | null = testName
      if (!previewRaw) {
        let matchId: string | null = null
        for (let page = 1; page <= 20 && !matchId; page++) {
          const { data: authList } = await admin.auth.admin.listUsers({ page, perPage: 200 })
          const users = authList?.users || []
          const hit = users.find((u: any) => u.email?.toLowerCase() === testEmail!.toLowerCase())
          if (hit) matchId = hit.id
          if (users.length < 200) break
        }
        if (matchId) {
          const { data: prof } = await admin
            .from('profiles')
            .select('first_name, username')
            .eq('id', matchId)
            .maybeSingle()
          previewRaw = (prof as any)?.first_name || (prof as any)?.username || null
        }
      }

      const sample = buildEmail({
        userId: 'test',
        email: testEmail,
        name: firstName(previewRaw, testEmail),

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
          attachments: [LOGO_ATTACHMENT],
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
      .select('id, username, first_name')
      .in('id', userIds)
    const nameById = new Map<string, string | null>(
      (profiles || []).map((p: any) => [p.id, p.first_name || p.username])
    )


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
            attachments: [LOGO_ATTACHMENT],
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
