# MDCAT date answer + exam-page prerender priority list

## Answer first: MDCAT 2026 date

MDCAT 2026 was conducted on **Sunday, 16 August 2026** — that is two days ago. Verified from PMDC's own public notice PDF ("Public Notice Regarding MDCAT-2026 Date Announcement", pmdc.pk) and reported by medicalnews.pk (19 Jun 2026).

So the spike is not upcoming — it already happened. The traffic that is live **right now** is post-exam intent: result date, answer key, aggregate/merit calculation, "kitne marks pe admission". That window lasts roughly 2-6 weeks and is much bigger than the pre-exam window.

I could not verify an official MDCAT 2026 **result** date from a published source, so no result date goes on the page until you give me the source.

## Second finding: MDCAT pages do not have the JOA problem

The JOA fix existed because `/mock-tests/<slug>` pages are DB-driven and client-rendered — crawlers saw an empty shell. MDCAT pages are different: `/mdcat-past-papers`, `/mdcat-syllabus`, `/exams/mdcat` are already in `PRERENDER_ROUTES`, so their body content ships in the static HTML today. Prerendering is not the gap.

The real gap is **content staleness and missing post-exam intent**:

- `/mdcat-syllabus` and `/mdcat-past-papers` both still show a banner saying MDCAT Sindh 2026 "will be conducted on August 16, 2026" and "only 3 months left". Both are now factually wrong and read as abandoned to a visitor who just sat the paper.
- Past-paper years are hardcoded to 2020-2024 — no 2025/2026 row.
- No result / answer-key / aggregate section anywhere in the MDCAT cluster, which is exactly what is being searched this week.

## Phase 1 — MDCAT post-exam cluster (do now, this week)

1. **Fix the stale date banners** on `/mdcat-syllabus` and `/mdcat-past-papers`: switch from countdown wording to post-exam wording ("MDCAT 2026 was held on 16 August 2026"), keep the PMDC source link. No result date, no cut-off, no merit claim until you supply the source.
2. **Add a "MDCAT 2026 — After the Test" section** to `/mdcat-past-papers`, anchored and crawlable: what happens next, how aggregate is calculated (formula only, from the published weightage you already hold), link to the existing aggregate calculator tool, link to `/exams/mdcat` practice. Facts only, no invented dates.
3. **Add 2026 and 2025 rows** to the past-paper year list so the page matches "MDCAT 2026 past paper" queries.
4. **In-body contextual internal links** (not just the chip grid at the bottom): aggregate calculator, `/mdcat-syllabus`, `/exams/nums`, `/ecat-preparation` — anchored on the query wording, placed in the opening paragraphs.
5. **FAQ block matched to live queries**: result date (answer: announced by PMDC, link to source, no date asserted), answer key, re-checking, aggregate formula, retake policy. Single FAQPage schema, existing `safeJsonLd` path.
6. **Force a re-crawl**: bump `lastmod` for the MDCAT URLs in `generate-sitemaps.mjs`, regenerate, then fire `indexnow-submit-recent` so the change is picked up inside days, not weeks.

Guardrails, same as the JOA build: additive only. No URL, canonical, or title change on any page that is currently indexed. Nothing outside the MDCAT page files, the sitemap lastmod, and the verify script.

## Priority list — which exam pages to cover next

Ordering is by when money-intent search volume lands, not by page count.

| # | Cluster | Window | Why now |
|---|---|---|---|
| 1 | **MDCAT post-exam** (`/mdcat-past-papers`, `/mdcat-syllabus`, `/exams/mdcat`, aggregate calculator) | live now, next 2-6 weeks | Exam just happened; result/aggregate intent peaking |
| 2 | **JOA / Sindh High Court siblings** | test 23 Aug | Already ranking, sprint Phase 1 shipped for JOA only; siblings still uncovered |
| 3 | **ECAT + NUMS + university entry tests** (`/ecat-preparation`, `/nust-entry-test`, `/exams/nums`, `/punjab-university-entry-test`) | late Aug - Sep | Engineering/medical cycle runs immediately after MDCAT |
| 4 | **PPSC / NTS** (`/ppsc-past-papers`, `/exams/ppsc`, `/exams/nts`) | rolling, monthly | Continuous ad-hoc postings; steady rather than spiky, and highest long-term volume |
| 5 | **FPSC** (`/fpsc-past-papers`, `/exams/fpsc`) | rolling | Same as above, smaller volume |
| 6 | **CSS / PMS** (`/css-mcqs-practice`, `/exams/css`, `/exams/pms`) | written papers land early in the year | Long runway; low urgency now |

I have **not** verified official dates for ECAT, NUMS, PPSC, NTS, FPSC, CSS or PMS from published sources — the searches I ran returned noise, not schedules. So step one of each cluster above is "confirm the official date from the official portal or your source", and no date text goes live before that. The ordering itself is based on the Pakistan admission/recruitment cycle, not on an asserted date.

## Not doing without your input

- Any MDCAT result date, answer key link, cut-off, or merit figure.
- Clusters 2-6 — those wait until we see what Phase 1 does to MDCAT impressions.

## Technical notes

- Edits confined to `src/pages/seo/MDCATPastPapers.tsx`, `src/pages/MDCATSyllabus.tsx`, and `src/pages/exams/ExamLandingPage.tsx` data for the mdcat slug.
- No new prerender script needed — these routes already render synchronously into static HTML; `scripts/verify-prerender.mjs` gets one extra assertion that the MDCAT HTML contains the post-exam section text.
- `scripts/generate-sitemaps.mjs`: lastmod refresh for the MDCAT entries only; every existing URL stays in the sitemap.
- No schema or database change.
- Post-build smoke check: raw-HTML read of `/mdcat-past-papers`, `/mdcat-syllabus`, one board topic page and one mock-test page to confirm nothing regressed, plus a canonical/title diff on the MDCAT pages.
