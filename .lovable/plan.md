# Audit report — GSC 403 validation + auto-fill health (12 Sep 2026, 08:20 UTC)

No changes were made. Everything below is measured, not assumed.

## Part 1 — Why the "access forbidden (403)" validation is still stuck

### 1. Live tests of the affected pages

Tested from this sandbox against the live site (`mcqsai.com`):

| Visitor identity | Result |
|---|---|
| Googlebot | 200 on all 8 sampled pages (`/exams/mdcat`, `/exams/nts`, `/exams/css`, `/exams/ppsc`, `/p/mdcat-karachi`, the MDCAT blog post, `sitemap.xml`, `robots.txt`) |
| Bingbot | 200 |
| GPTBot (AI crawler) | 200 |
| **Google-InspectionTool** (Google's checking tool) | **403** |
| **facebookexternalhit** (Facebook/WhatsApp link previews) | **403** |
| AhrefsBot | 403 |
| Plain browser identity from this machine | 403 |

So Google's normal crawler is being let in fine — the pages themselves are healthy. Two blocks still matter:

- **Google-InspectionTool is blocked.** This is the identity Google uses when it re-checks pages during a validation run and for live URL tests. If Google's re-check is refused, the validation can never turn green — which fits it sitting in "Started" for five weeks.
- **facebookexternalhit is blocked**, so link previews on Facebook/WhatsApp are likely broken too (no title/image when someone shares a link).

Note on the "plain browser 403": this machine has a data-centre address, which Cloudflare challenges. Real visitors on home/mobile connections are getting through (the site is receiving traffic and clicks), so this is expected, not a user-facing outage.

### 2/3. Cause

The protection is set up as an **allow-list by visitor name**: Googlebot and Bingbot were named and let through, everything else falls back to the strict block. Google-InspectionTool and Facebook were never added to that list, so they are still refused.

### 4. Was anything actively requested from Google?

Nothing was requested manually. The earlier plan explicitly left "Request Indexing" as your manual step, and the Search Console interface offers no way for me to trigger it — there is no such capability in the API. Sitemaps were re-submitted, but the individual pages are only waiting on Google's own schedule, behind a check that is currently being blocked.

### Proposed fix (not applied)

1. Add Google-InspectionTool, Google's other verified tools, and the social preview fetchers (Facebook, X, LinkedIn, WhatsApp) to the allowed list in Cloudflare — same shape as the existing Googlebot rule.
2. Re-test each of them for a 200.
3. Then press **Validate Fix** again in Search Console (fresh 5-week clock, but with the check no longer blocked) and click **Request Indexing** on the ~10 priority pages; I will hand you the exact list.
4. Re-check the same sample in 7–10 days and only call it fixed when Google reports a clean fetch.

## Part 2 — Auto-fill health, 11–12 Sep

### 1. What "1400" actually is

1400 is the platform-wide **daily AI request guard** (`ai_daily_limit.max_requests`) — a safety ceiling across every AI feature, not an MDCAT or IBA target. So "878/1400" is a spend gauge, not a content goal.

MDCAT priority is intact and verified: the MDCAT sprint is switched on until 21 Sep with a 600/day allowance and biology/physics/chemistry/class-11/12 keywords, and the IBA mock-test batch is explicitly set to stand aside while MDCAT work is active (200 questions per test, 300/day, promotes after 20 Sep).

### 2. Free keys vs paid safety net (today)

- 14 auto-fill cycles ran. Paid safety-net calls used today: **40 of 40** — the daily cap, hit exactly, never exceeded. Per-cycle usage stayed within the 5-call limit (largest observed: 1 call, stopping itself with "paid budget for this run spent").
- The best cycle today (34 questions saved) ran entirely on the **free keys**, with all three healthy.
- Since the cap filled, later cycles are **skipping on purpose** with "no usable free key and no paid budget left — run skipped to protect credits". All three free keys are currently rate-limited by Google until their daily reset.

### 3. Discard rate — genuinely improved

| | Requested | Saved | Approved & visible | Held as duplicates | Awaiting review |
|---|---|---|---|---|---|
| 11 Sep | 910 | 330 | 402 | 126 | 15 |
| 12 Sep (to 08:20) | 470 | 387 | 306 | 115 | 6 |

Today's waste rate is about **27%** (115 of 427 stored), against roughly **93%** before the deficit-first fix. Confirmed improvement, and today's save rate (387 of 470 requested) is the healthiest yet.

### 4. Errors and skips today

- No key-format or configuration errors. Free-key probing is now cheap (3 probe calls all day, 0 on skipped cycles).
- Only genuine Google rate-limit refusals (6) plus the intentional skips once the paid cap filled. One cycle also stopped on its 2-minute time budget and continues next cycle — normal.

### 5. Credits and where the questions landed

- Paid AI spend across 11–12 Sep: roughly **3.5 credits** (~297 paid calls at ~0.012 each). Your billing period total so far is 161 credits.
- Questions added: **708 approved and visible** over the two days (402 + 306), plus 241 held back as duplicates and 21 waiting for review.
- Subjects filled (last 2 days): Physics 202, Chemistry 135, General Knowledge 108, Science & Mathematics 63, Science Subjects 55, Social Sciences 47, English & Aptitude 44, Chemistry Class 9 40, plus smaller amounts — i.e. mostly MDCAT-relevant science, as intended. 67 items are not attached to a topic yet.
- Mock tests: 15 IBA batch sections completed, all still draft/unapproved as agreed.

### Thin pages — the indexing gap you asked about

Topic pages need at least 5 approved questions to be allowed into Google's index. Current state:

- **558 topics with zero questions**
- **58 topics with 1–4** — these are the cheapest wins: about 190 questions total would push every one of them over the line
- 252 topics with 5–9 (indexable, but weak)
- 921 with 10–19, 66 with 20+

Suggested follow-up (after MDCAT, or in parallel on free keys only): a small "threshold sprint" that finishes the 58 near-miss topics first, then lifts the 5–9 group to 10, before touching the 558 empty ones. That converts spend directly into indexable pages.

## Recommended order

1. Cloudflare allow-list fix (Google-InspectionTool + social previews), then re-validate and request indexing — this is what actually unblocks the 403 report.
2. Threshold sprint for the 58 near-miss topics.
3. Leave MDCAT priority and all current spending caps exactly as they are.
