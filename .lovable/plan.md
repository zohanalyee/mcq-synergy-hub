# Growth, Reach and Zero-Budget Monetization Audit (report only)

Nothing was changed. Each item is marked **Verified** (checked today in files or data) or **To measure** (needs a read-only script run; I have not checked it yet, so no number is given).

## A. Growth and indexing

### 1. Counts per page type (sitemap: Verified today, files in `public/sitemaps/`)

| Type | In sitemap | Notes |
|---|---|---|
| Board topics | 1,335 (`boards-1.xml` 1,000 + `boards-2.xml` 335) | 1,249 indexable topics found in the last build; the gap of about 86 is hubs and class pages. To measure |
| Mock tests | 95 | 94 tests + `/mock-tests` |
| Exam pages | 24 | includes `/exams`, `/exams/sts`, `/exams/nthp`, `/exams/sthp` |
| Blog | 30 | 35 published; 5 have noindex under the 300-word rule (`src/lib/blogIndexability.js`) |
| Jobs | 69 | expiry rule in `src/lib/opportunityExpiry.js` |
| Scholarships | 8 | same rule |
| Announcements | 0 detail pages | detail pages have noindex on purpose; only `/announcements` is listed |
| Tools | 15 | `public/sitemaps/tools.xml` |
| Programmatic `/p/*` | 21 | from the quality gate in `scripts/prog-seo-gate.mjs` |
| Static/hubs | 26 | `static.xml` |
| **Total** | **1,623** | Search Console shows about 1,420 submitted and 172 indexed |

- Search Console's 1,420 is older than the current files. After you publish, the submitted count should go up to about 1,623.
- With only 172 indexed (about 11%), the bottleneck is **getting Google to see the pages as worth indexing**, not adding more pages. 1,335 of the URLs are board topics with thin or overlapping content.

### 2. Internal links
- Topic pages link to previous/next pages, a group of nearby topics and their subject hub (`src/lib/topicLinkGraph.js`). These links are in the static HTML.
- Hubs: `PopularSubjectHubs.tsx` appears on `/boards` and the homepage. `/exams` links to the STS, STHP, NTHP and university guides. The footer links to `/exams`.
- In the last audit, 35 topics had 2 or fewer static inbound links.
- To measure: a link graph built from the `dist/` HTML (inbound links per page, orphan pages, click depth from `/` and `/exams`, anchor text). This is step 1 of the roadmap. It's a free, local, read-only script.
- Risk: blog posts and jobs/scholarships get most of their links from list pages that load with JavaScript. Whether those links are in the static HTML is To measure.

### 3. Top opportunity pages (upcoming events first)
Order: `/exams/nthp` (deadline 15 Dec 2027 on the poster), `/exams/sthp`, `/exams/sts` with the 70 cadre tests, the NTHP mock test, `/exams/mdcat`, `/mdcat-syllabus`, `/mdcat-past-papers`, `/exams/ecat`, `/exams/nts`, `/exams/ppsc`, `/exams/fpsc`, `/exams/css`, `/exams/iba-sukkur`, `/exams/nums`, `/exams/usat`, `/exams/hec-gat-subject`, `/mock-tests`, `/boards`, `/`, `/announcements`.
- The checklist for each page (title, meta, H1, word count, FAQ count, schema, links in and out, mock test link, Join Alerts link, share link) is To measure with one script over `dist/`.
- Already known gaps: the Join Alerts link is hidden on every page until you set `whatsapp_channel_url`. The STS "Syllabus verified on" date is hidden until you give the date.

### 4. Event coverage
To measure: compare `job_tests`, `exam_pages` and `educational_systems`. The output is a list of exams with no guide page, no mock test or no hub link. The last audit already found police and judiciary hubs missing, and these exams have no mock test today. No search volumes will be made up.

### 5. Near-duplicate risk
- Canonical topic linking lets boards share the same questions (`canonical_topic_name`). The same topic across boards can show very similar question sets.
- To measure: count title/meta duplicates across `dist/`, and how much the question sets overlap per canonical topic.
- **Risk flag:** merging or noindexing duplicates could lower impressions. A merge should be tested on a small sample first.

### 6. Structured data (Verified, where found)
- Pages with schema: JobPosting (`JobDetailPage.tsx:83`, `OpportunityDetail.tsx:126`, optional in `BlogPost.tsx`), FAQPage, BreadcrumbList, Course on exam pages, Quiz on topic pages, WebApplication on tools.
- **Risk:** JobPosting on pages we copied from other sites, or on expired listings, goes against Google's job guidelines. Google can take action for this. Proposal: emit JobPosting only for original, non-expired listings that have the required fields. This is safe because it removes no pages.

### 7. Sitemaps
- The sitemap index shows lastmod 2026-10-18 for every child file. Many board URLs share the build date, which makes lastmod less trustworthy to Google.
- To measure: fetch a sample of live URLs and check for redirects and 4xx/5xx errors (free).

### 8. OG and WhatsApp previews
Titles and descriptions are set for each page. Previews use one shared site-wide image, not an image per page. A free improvement: a generated OG image for each exam page, made at build time.

## B. Retention and engagement

### 9. Flow
- Guests can open content freely. Actions are gated, with a 15-question mock demo cap.
- A login prompt appears via `GuestChoiceModal` when a guest saves, goes past the cap, or opens the AI Coach.
- Results are shown to guests, and their score carries forward after signup (`GuestResultCarryForward.tsx`).
- Settings are in `src/config/features.ts`.

### 10. AI Coach
Results come from saved attempts (`user_performance`, `user_question_mastery`) and are shown on the dashboard. Remedial tests are stored in `recommended_tests`. To measure: AI calls per use and limits per user (`src/lib/aiCoach.ts`, coach edge functions).

### 11. Notifications
- OneSignal push works on the live domain and fires `notification_optin`.
- Streak emails are sent by `send-streak-reminders` on a schedule.
- No event measures opens or clicks for streak emails yet.

## C. Monetization at zero budget

### 12. What exists (Verified)
- AdSense client `ca-pub-4978762286882236` and `ads.txt` are set up.
- 4 ad units are placed, one per page: board topic (not on thin pages), blog post (not on thin posts), `/mock-tests` hub, and the test results screen (`src/config/ads.ts`).
- Ads only load on mcqsai.com.
- No consent banner, child-directed setting or non-personalized ads flag was found in the code.
- No payment provider, subscription table or entitlement table was found. The word "premium" in the code is only labels.
- Credits exist (`user_credits`, `deduct_credits`), which helps.

### 13. Manual-payment "Plus" design
- New table `entitlements` (user_id, plan, starts_at, expires_at, source='manual', receipt_ref, status, approved_by).
- New table `plus_receipts`, plus a private storage bucket for receipt images.
- Security rules: users can read their own rows and add receipts. Only admins can approve or revoke, using `is_admin()`.
- A `has_plus()` database function and a `usePlus()` hook in the app.
- An admin "Plus approvals" tab.
- Payment by JazzCash/Easypaisa/bank transfer to your account, by hand, with no fee to us.
- Effort: about 1 to 2 days. Risk: low. Exam fact pages are never paywalled.

### 14. Plus features, best value for lowest cost first
1. Ad-free: no AI cost, easy.
2. Unlimited mocks and full review: no AI cost.
3. Paper Builder: no AI cost.
4. Detailed analytics: no AI cost.
5. Higher AI Coach limit: costs AI calls, so it needs a cap.

### 15. Paper Builder
- Possible using only approved questions from `content_items`, with filters for topic, difficulty and count.
- PDF made in the browser with an answer key. Free users get a watermark and 2 papers a day; Plus users get no watermark.
- Needs one table, `generated_papers`, to count use against the limit.
- Zero AI cost. The PDF library is free.

### 16. Ad risks
- The results-screen ad is right after test content. It is allowed but sits close to policy limits. Never put ads inside the live test (already enforced).
- Your audience includes students under 18. You should consider marking the site child-directed or serving non-personalized ads, and a consent tool is required for visitors from the EEA/UK. AdSense's own consent tool is free.
- Trade-off: both lower ad earnings.

### 17. Events to add
`plus_view`, `plus_click`, `receipt_submitted`, `receipt_approved`, `paper_generated`, `ad_free_active`.

## D. Operations and risk

### 18. Manual admin time
These take your time over and over:
- duplicate review
- content approval
- entering exam facts
- checking expired listings (now automatic)
- publishing so sitemaps refresh

Candidates to automate: a daily sitemap edge function (`generate-sitemap` already exists), a weekly digest email of queue and failure counts, and auto-flagging of empty topics.

### 19. Reliability
- Backup status can't be seen from here. You should check it in Cloud settings.
- There are no alerts for failures or a stuck queue.
- The three riskiest security items:
  1. Leaked-password protection is off.
  2. Many public database functions can be called by anyone.
  3. Public read access to `system_settings` is now limited to one setting. This is safe, but every new public policy should be checked.

## (a) Priority table

| Item | Traffic/rank | Revenue | Effort | Risk | Depends on |
|---|---|---|---|---|---|
| Publish pending batches | High | Med | 0 | Low | you |
| Link graph and page checklist script | High (insight) | - | 0.5 day | None | - |
| Limit JobPosting to eligible listings | Protects rank | - | 0.5 day | Low | - |
| Cut thin/duplicate board topics | Med+ | - | 1 day | **May lower impressions** | sample test |
| Police and judiciary hubs | Med | Low | 1 day | Low | official sources |
| Daily dynamic sitemap | Med | - | 0.5 day | Low | - |
| Ad consent and child-directed setting | - | -/policy safe | 0.5 day | Lowers ad earnings | your choice |
| Plus manual payments | - | High | 1-2 days | Low | payment account |
| Paper Builder | Low | High | 2 days | Low | Plus |
| Failure alerts digest | - | Protects | 0.5 day | Low | email setup |

## (b) 30/60/90 days
- **Days 1-30:** publish, run the measurement scripts, fix JobPosting, set the WhatsApp URL, add the STS verified date, NTHP push, keep the cutoff ready for MDCAT 2027 content, add the consent setting.
- **Days 31-60:** Plus MVP, funnel events, police and judiciary hubs, daily sitemap, alerts digest.
- **Days 61-90:** Paper Builder, a sample test of duplicate merging, OG images per exam page, an outreach plan using the free link list in `docs/link-building-plan.md`.

## (c) Open questions
1. Which payment accounts can receive Plus payments (JazzCash, Easypaisa, bank)? What price?
2. Should we treat the audience as under 18 for ads?
3. May I run the read-only measurement scripts (no changes) to fill the "To measure" cells?
4. What is the STS verified-on date, and what is the WhatsApp channel URL?
5. Should you test removing duplicate topics on a small sample, accepting some risk to impressions?
