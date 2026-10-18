# Site health audit — 18 Oct 2026 (report only, nothing changed)

"Verified" means I checked it in the code or database today. "Not measured" means I did not test it.

## 1. Freshness
- Verified: the sitemap files (`public/sitemaps/*.xml`, made by `scripts/generate-sitemaps.mjs`) and the pre-built pages (`scripts/inject-meta.mjs`, `vite.config.ts`) are only rebuilt when you publish.
- If you add a job, announcement or blog post in admin between publishes, it opens fine for visitors, because the page loads its data in the browser. Google gets the general starting page until the next publish, and the new item is not in the sitemap. IndexNow (see section 9) still tells Bing about it within 15 minutes.
- Options:
  - A. Keep publishing by hand, at least once a day. No cost, no risk.
  - B. Serve `jobs.xml`, `blog.xml` and `scholarships.xml` live from the `generate-sitemap` function, which already exists. Low effort and almost no cost. Medium risk: it has to use the same expiry and quality rules as the build, or the two will disagree.
  - C. Scheduled publishing. Lovable has no scheduled publish today, so it is not available.
  - Recommendation: A now. B only for jobs and blog, using the same `opportunityExpiry.js` rule.

## 2. Backups and alerts
- Backups: I can't see backup status or plan details from here. Check them in Cloud settings. Treat this as unverified.
- Verified, 8 scheduled jobs are running: IndexNow every 15 min, mock-test queue every 5 min, auto-fill every 30 min, quality gate hourly, stats hourly, duplicate scan and merge nightly, streak emails daily.
- Missing: there are no alerts. Nothing warns you when a function fails or the queue gets stuck. Failures only show up in the logs.
- Daily AI cap: set to 500 paid calls a day (`system_settings.paid_ai_daily_ceiling`). The admin quota screen (`src/components/admin/QuotaMonitor.tsx`) shows the 1,400 total quota. It is not confirmed that it shows the paid cap. Note: the setting's own note says to lower the cap to 300 after 21 Sep, which has not been done.

## 3. Security (126 warnings)
- There are **no ERROR-level warnings**. All 126 are warnings:
  1. **57** database functions that anyone can run without signing in. Most are meant to be public, like stats, board topic questions and reviews. A few may be admin-only and should be locked. Fix: medium, which means going through them one by one.
  2. **68** of the same kind of function that any signed-in user can run. Same review. Medium.
  3. **1** leaked-password protection is off. Fix: one switch in auth settings. Very small.

## 4. Analytics
- Verified active in `index.html`: Microsoft Clarity, GA4 (`src/utils/analytics.ts`), and OneSignal push (live site only). Lovable analytics is built into hosting.
- Events that exist: sign_up, test_completion, scroll, user_engagement, empty_topic_view, campaign_visit/signup, and announcement view/open/like/share/comment/copy link.
- Missing: test_start, test_abandon, result_share, whatsapp_join_click, notification_optin, guest_to_signup.

## 5. UX
- Guest attempts: allowed. Mock tests have a 15-question demo, per the guest-mode memory.
- Resume after refresh: `src/components/exam/useExamPersistence.ts` saves progress on the device. It is not confirmed that it covers every test type or a network drop during submit.
- WhatsApp share of results: not found. WhatsApp only appears in the floating button, the channel invite box, the footer and About.
- Install as an app: `public/site.webmanifest` exists, but there is no install prompt. This is fine unless you want one.
- WhatsApp previews: every pre-built page has its own title. The preview image is a category banner (`src/lib/seoUrls.ts`), not a separate image for each page.

## 6. Performance
- **Not measured today.** Earlier audits (September plans in `.lovable/plan/`) point to three main causes:
  1. Heavy code loaded when the page first opens.
  2. Outside scripts (GA4, Clarity, OneSignal, AdSense) blocking the browser.
  3. Font loading and late-loading sections shifting the page layout.
- Getting real phone scores for the 4 pages needs a separate measuring step.

## 7. Category hubs
- Exist: `/exams` (central), `/exams/sts`, `/exams/sthp`, `/exams/nthp`, MDCAT, ECAT, NTS, FPSC, PPSC, CSS, PMS, university guides (`src/pages/exams/`), and forces pages (Army/PAF/ASF).
- Missing: police (Sindh Police SSU only appears inside STS), judiciary/High Court, medical entry tests overall, teaching jobs (SPSC/PST already have pages).
- Mock tests: 95 total, and all 95 have syllabus data. I did not count tests per category. Doing that needs a list of agreed category names first.

## 8. Trust pages
- About, Contact, Privacy Policy, Terms and Editorial Policy all exist (`src/pages/About.tsx`, `src/pages/Contact.tsx`, `src/pages/legal/*`) and are pre-built.

## 9. Bing / IndexNow
- IndexNow is live: key file `public/92c4599546070b0df41f558aeeb6c31e.txt`, plus `supabase/functions/indexnow-ping` and `indexnow-submit-recent` (every 15 min).
- Bing Webmaster: no verification tag found in the code, and no connection is set up. You can verify the site through Search Console import instead.

## Priority list
1. Turn on leaked-password protection. Tiny effort, no risk.
2. Lower the paid AI cap to 300 as the note says, if you still want that. Tiny effort, no risk.
3. Add the missing GA4 events: test start, result share, WhatsApp click, notification opt-in. Small effort, low risk.
4. WhatsApp "Share my result" button. Small effort, low risk.
5. Daily failure/stuck-queue email alert. Medium effort, low risk.
6. Review the 125 public database functions and lock the admin-only ones. Medium effort, medium risk (it can break public pages).
7. Live jobs and blog sitemaps (option B). Medium effort, medium risk.
8. Police and judiciary hubs, built from existing tests. Medium effort, low risk.
9. Phone speed measurement, then fixes. Medium effort, medium risk.

## Open questions
- Should the paid AI cap now be 300?
- Do you want sitemaps served live, or will you publish daily?
- Which category names should I use to count tests per category?
