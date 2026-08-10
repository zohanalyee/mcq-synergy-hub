# Phase 2 — Streak Reminder Emails (Resend)

Two parts: (1) DNS steps you do in Cloudflare now, (2) the system I build after you approve the email copy below.

## 1. Resend domain verification (Cloudflare DNS)

1. Resend dashboard → Domains → Add Domain → enter `mcqsai.com`, region EU/US (either is fine).
2. Resend shows 3–4 records. Add them in Cloudflare DNS for `mcqsai.com`, all with **Proxy status = DNS only (grey cloud)**:
   - **MX** — name `send` (or `bounces`), value `feedback-smtp.<region>.amazonses.com`, priority `10`.
   - **TXT (SPF)** — name `send`, value `v=spf1 include:amazonses.com ~all`.
   - **TXT (DKIM)** — name `resend._domainkey`, value = the long `p=...` key Resend gives you (paste exactly, no line breaks).
   - **TXT (DMARC, optional but recommended)** — name `_dmarc`, value `v=DMARC1; p=none; rua=mailto:you@mcqsai.com`.
3. Careful with existing records: if `mcqsai.com` already has an SPF TXT at the root, do **not** add a second root SPF — the Resend SPF goes on the `send` subdomain, so there's no clash.
4. Click **Verify** in Resend (usually 5–15 min on Cloudflare).
5. Create an API key (Sending access) — I'll then ask you to save it as `RESEND_API_KEY` via the secure secret form.
6. Sender address will be `MCQsAI <hello@mcqsai.com>` (or `noreply@`) — tell me which you prefer.

## 2. Email copy for your review

Subject line options (pick one):
- A: `{{name}}, aapka streak tootne wala hai 😅`
- B: `{{name}} — 10 questions, 5 minutes. Chalein?`
- C: `Aap ne {{testName}} adhoora chhoda tha…`

Body (HTML email, plain-text version mirrors this):

```text
Assalam-o-Alaikum {{name}} 👋

2 din se aap nazar nahi aaye — sab khairiyat? 🙂

Aap ne last time "{{testName}}" attempt kiya tha ({{score}}/{{total}} correct).
Achhi baat yeh hai: is test ke liye hamare paas questions ka bohat bara bank
hai — aap jitni baar chahein practice kar sakte hain, har baar naye questions
milenge. Questions khatam hone ka koi darr nahi. 💪

Aur aapka AI Coach bhi kaam kar raha hai — wo silently aapki progress track
kar raha hai, aapke weak topics note kar raha hai, aur next practice ke liye
plan bana raha hai. Aap sahi jagah par hain apni preparation ke liye.

[ Continue practice — 10 questions ]   ← button, deep link to {{testUrl}}
[ Dekhein aapka AI Coach kya kehta hai ] ← secondary link to /dashboard

Aaj sirf 10 questions. 5 minute. Bas itna hi. Streak bach jayega. 🔥

— Team MCQsAI

---
Yeh reminder aap ne on kiya tha. Nahi chahiye? Ek click mein band karein: {{unsubscribeUrl}}
```

Fallback when the user has no attempt yet (signed up, never practised):

```text
Assalam-o-Alaikum {{name}} 👋

Aap ne account bana liya tha lekin abhi pehla test start nahi kiya 🙂
Shuru karna asaan hai — apna exam choose karein, aur 10 questions se test-drive
karein. Questions ka bohat bara bank hai, aur AI Coach pehle test ke baad hi
aapki progress track karna shuru kar dega.

[ Pehla test shuru karein ]

— Team MCQsAI
```

Notes on tone: Roman-Urdu + English mix (site tone), one emoji per paragraph max, no corporate phrasing, name always used, test name always specific when available.

**Please confirm: subject line choice, sender address, and any wording edits.** I'll build only after that.

## 3. What I build after copy approval

- **Opt-in**: `email_prefs` table (`user_id`, `streak_reminders` bool, `last_reminder_at`, `unsubscribe_token`), default on at signup via an opt-in checkbox on the sign-up form and a toggle in Profile → Settings. Explicit GRANTs + RLS (user reads/writes own row only; service_role full).
- **Selection query** (runs server-side in the function): users whose latest activity across `test_attempts` / `user_attempt_history` is 2–4 days old, `streak_reminders = true`, and `last_reminder_at` older than 5 days. Email address comes from `auth.users` using the service role (profiles has no email column).
- **Personalisation data**: latest `test_attempts` row → score/total + test title resolved from `job_tests` / content title, plus deep link back to that test.
- **Edge function** `send-streak-reminders`: builds and sends via Resend, batched with a per-run cap, writes `last_reminder_at`, and logs each send (success/failure) to a small `email_send_log` table for the admin view.
- **Unsubscribe**: `/unsubscribe?token=...` public route + tiny public function that flips `streak_reminders` to false by token — one click, no login.
- **Cron**: `pg_cron` daily at 13:00 PKT (08:00 UTC) calling the function with `x-cron-token` (same pattern as `process-jobtest-queue`).
- **Admin**: reminder counts (sent today / 7d) surfaced in the existing admin Campaigns area.

Guardrails: max 1 email per user per 5 days, hard per-run send cap, dry-run mode for the first run so we inspect the recipient list before anything actually sends.
