# Point D — Exam guide pages: sitemap readiness

## Findings (checked live, 3 Oct 2026)

All 11 pages return **HTTP 200** to Googlebot with `index,follow` in the raw HTML. None of them is in the sitemap today (exams.xml lists only the hub plus mdcat, ecat, css, ppsc, fpsc, nts and pms).

The exam guide template has **no FAQ section**, so the "3+ FAQs" part of the /p/ check doesn't apply. The test used here: an intro of 60+ words, the core facts filled in (who runs the test, subjects, eligibility, official link), and "not yet announced" only for things the official source hasn't published yet.

| Page | Intro words | "Not yet announced" lines | What's pending | Verdict |
|---|---|---|---|---|
| usat | 103 | 0 | nothing | Ready |
| pieas | 75 | 3 | next dates, merit weightage | Ready |
| sindh-university | 95 | 4 | dates, admit card only | Ready |
| lums | 85 | 2 | next cycle dates | Ready |
| giki | 102 | 4 | duration, next window | Ready |
| aku | 82 | 3 | next cycle (admissions closed) | Ready |
| nat | 90 | 2 | official duration, schedule | Ready |
| uet-lahore | 77 | 3 | merit formula, next session | Ready |
| air-university | 68 | 3 | duration, schedule | Ready (shortest intro, still above 60) |
| hec-gat-subject | 114 | 2 | duration and question pattern (no official page states them) | Ready |
| karachi-university | 89 | 8 | duration, test date, section split, application window, admit card, result | **Hold** |

**Why Karachi University is held:** 8 of its facts say "not yet announced", including the paper itself (duration and section split), not just dates. A reviewer could read it as an empty shell. To fix it later, add the programme-wise test details from the current uok.edu.pk admission notice or sample paper. I won't invent anything.

## What will be built (on approval)

1. Add the 10 ready slugs to the exam list used by the sitemap script, so they appear in `exams.xml`.
2. **lastmod:** for these 10 pages, use each page's own official "verified on" date. Don't use the build date, because that changes every build. This follows the sitemap date rule. The existing entries stay as they are.
3. Rebuild the sitemap, then check that exams.xml lists the hub, the 7 existing exams and the 10 new ones (18 total), and that karachi-university is not there.
4. After you publish, send IndexNow for the 10 new links using the existing ping function.

## Not touched

No page content, routes, ads or other sitemaps. Karachi University's page content stays as it is until you approve a separate fill-in step.

## Technical details

- `scripts/generate-sitemaps.mjs`: add the slugs and a per-slug lastmod taken from `verifiedOn`. Keep the edge function `generate-sitemap` EXAM_SLUGS in sync, because it duplicates the exam list.
- The IndexNow call goes to `supabase/functions/indexnow-ping` with the 10 URLs, after publish, because pinging before the pages are live is useless.
