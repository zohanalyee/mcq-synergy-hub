# Larkana Library Campaign Readiness — Audit + Plan

Report-only. No code changes in this turn.

## 1. Referral tracking — current state

Verified in code:
- `/larkana` route exists and renders the home page, and `LibraryWelcome.tsx` already detects the visit (path `/larkana`, or `utm_source=library_banner`, or `src=larkana_library`) and shows a celebration modal.
- GA4 tracking exists (`src/utils/analytics.ts` + `GA4PageTracker.tsx`): pageviews, heartbeat engagement, scroll depth, `sign_up` event.
- No first-party campaign attribution anywhere: no `utm`/`ref` capture in code, no referral column on `profiles` (columns confirmed: id, username, city, user_type, occupation, target_exam, profile_completed, bio, avatar_url, active_learning_context, timestamps), and no admin counter.

Gap: GA4 alone will show `/larkana` pageviews but cannot reliably attribute **signups** (in-app browsers strip params, GA4 sampling/consent, and no cross-check inside your own DB).

### Proposal (Phase 1 — do this before printing the banner)
- Print the QR as `https://mcqsai.com/larkana?utm_source=library_banner&utm_medium=qr&utm_campaign=larkana_library`. The `/larkana` path is the durable signal; UTMs are a bonus.
- Add a small first-party attribution layer:
  - `campaign_visits` table (campaign, path, referrer, user_agent hash, device type, visited_at) written once per browser session from a lightweight capture hook.
  - Persist the detected campaign in `localStorage` for 30 days; on signup, stamp it as `signup_campaign` (new nullable column on `profiles`) so signups are attributable even days later.
  - GA4 events alongside: `campaign_visit` and `campaign_signup` with the campaign name, so Google reports match the DB.
- Admin dashboard: new "Campaigns" card in the admin panel showing, per campaign — visits (today / 7d / total), signups, signup rate, tests started, tests completed. Backed by one `get_campaign_stats` SECURITY DEFINER RPC (admin-only) so the client makes a single call.
- RLS/grants: `campaign_visits` gets INSERT for `anon` + `authenticated` (a visit counter must accept guests), SELECT restricted to admins via `is_admin()`; stats read only through the RPC.

## 2. First-time onboarding (guest, mobile, from QR) — friction found

Current flow: scan → `/larkana` → celebration modal (gold, animated, confetti; body scroll locked; "Start Practicing MCQs Now" → `/mock-tests`, or "Maybe later" → home).

Friction flagged:
1. Confetti runs on a 3.5s repeating interval until the user acts — on low-end Android this competes with first paint, plus multiple animated blur blobs and a repeating box-shadow animation on the same screen. Recommend: one burst only, and skip animation entirely when `prefers-reduced-motion` or the low-capability device flag is set.
2. The modal is long on a 372px viewport (5 badge rows + 2 headings + 2 paragraphs); the primary CTA can land below the fold. Recommend a mobile-compact variant: shorter headline, badges as a 2-column chip grid, CTA visible without scrolling.
3. Modal colors are hardcoded amber/slate hexes rather than brand tokens — inconsistent with the site's violet/cyan aero identity. Recommend re-skinning onto existing tokens while keeping a "celebration" accent.
4. Dead-end after "Maybe later": the guest lands on the generic home page with no exam pre-selection. Recommend the CTA row become an exam chooser (MDCAT / SPSC-CCE / FPSC / STS-NTS / Class 9-12) where each chip deep-links straight into a ready mock test or board subject — one tap from scan to first question.
5. "Start Practicing MCQs Now" goes to the `/mock-tests` hub, which is another list to parse. Recommend it point at a single curated "Larkana starter test" (15-question guest demo cap already enforced) so the first experience is a question, not a menu.
6. No "what happens next" reassurance for guests (that results are saved after sign-in). One short line under the CTA fixes it; the guest result carry-forward already exists.

## 3. Re-engagement — current state

Verified: there is **no** user-facing outbound channel. `notificationService.ts` only writes in-app rows to `user_notifications` (visible only if the user returns). No email function (no Resend/SMTP anywhere in `supabase/functions`), no web-push, no WhatsApp. The Telegram function is admin-side content ingestion only.

Cheapest ladder, in order of effort:
1. **Free, zero infra — installable app + in-app streak surface.** Confirm the PWA manifest gives a real "Add to Home Screen" prompt on Android, plus a visible streak/"come back tomorrow" strip on the dashboard. Highest ROI for a library audience that will mostly return via the icon.
2. **Cheap — email streak reminder** (recommended first outbound). Resend free tier + your existing verified domain, one edge function on a daily `pg_cron` (e.g. 13:00 PKT): pick users with `last_activity` 2–4 days ago who have opted in, send one "your streak is about to break — 10 questions, 5 minutes" email with a deep link, cap one email per user per 5 days, unsubscribe link + `email_prefs` table. Needs an opt-in checkbox at signup and a Profile toggle.
3. **Free but more work — web push.** Service worker + VAPID keys + `push_subscriptions` table; iOS requires the app be installed first, so coverage is partial. Do after email works.
4. **WhatsApp — not recommended now.** Business API needs template approval and per-message cost; revisit only if the campaign proves volume.

## 4. Mastery / freshness — confirmation

Both layers are wired, but they are **different systems on different surfaces**:
- **Mock Tests / job tests:** mastery-aware selection is active — `user_question_mastery` is read in `jobTestService.ts` (seen-question exclusion + learning → unseen → review → mastered ranking), with concept-group LRU rotation and AI top-up only on DB exhaustion.
- **Board topics / question bank:** freshness is rotation-based, not mastery-based — `questionBankService.ts` orders by `usage_count ASC, last_used_at ASC` (nulls first) and `record_question_usage` is called after completion from `gamification.ts`. This is global rotation, so a returning user can still be shown a question they personally answered before if it is globally under-used.

Recommendation (small, contained): apply the existing per-user seen/mastery exclusion to the board-topic quiz path too, so "fresh for this user" means the same thing everywhere. Guests keep the current global rotation since there is no user id to key on.

## Suggested phasing

- **Phase 1 (before the banner is printed):** referral tracking + admin campaign counter, mobile-compact onboarding modal with exam chooser and starter-test deep link, motion/perf trim.
- **Phase 2 (campaign week 1):** email streak reminder with opt-in and unsubscribe; PWA install prompt check.
- **Phase 3:** extend per-user mastery freshness to board topics; then evaluate web push against real return-rate data.

## Technical notes

New DB objects: `campaign_visits` table, `profiles.signup_campaign` column, `get_campaign_stats` admin RPC, and (Phase 2) `email_prefs` + a daily reminder edge function on `pg_cron`. All new public tables get explicit GRANTs plus RLS, per project standards. Onboarding work stays in `LibraryWelcome.tsx` and existing brand tokens — no new colors or fonts, existing Header/Footer untouched.
