# Junior Office Associate Traffic Sprint (test on Sunday 23 Aug)

Goal: squeeze maximum clicks out of the already-ranking JOA page (position ~6, 2,990 impressions/week) before Sunday, and spread that authority to sibling Sindh High Court / NTS posts.

The single biggest lever is CTR + rank on queries we already appear for. At position 6-7 with 7% CTR, moving into the top 3 on the "past papers" and "syllabus" variants roughly triples clicks without needing any new keywords.

## What the data says

- All 74 clicks come from one page: `/mock-tests/junior-office-associate-bps-13`.
- 100% Pakistan, 76% mobile.
- Intent split: "past papers" (~470 impressions), "syllabus" (~110 impressions), "NTS / Sindh High Court" branded variants (~250 impressions), "test date" (small but rising).
- Zero clicks on every "syllabus" and "test date" query despite impressions — the page ranks but doesn't look like the answer in the SERP.

## Confirmed technical gap

Mock-test detail pages are client-rendered. The build injects only `<title>`/meta into the static HTML (`scripts/inject-meta.mjs`); the body ships as an empty shell. Board topic pages already solved this (`scripts/topic-content.mjs` writes real MCQs + FAQ into the HTML). Mock tests never got that treatment, so crawlers and AI answer engines see a headline with no content behind it.

## Phase 1 — Ship before Friday (highest impact)

1. **Crawler-visible body for mock-test pages.** Extend the prerender step so each `/mock-tests/<slug>` static file contains the real syllabus table, subject weightage, 10-15 approved sample MCQs with answers, and the FAQ block — mirroring the board-topic approach. This is what makes the page eligible for the "past papers" and "syllabus" snippets.
2. **Query-matched sections on the JOA page.** Add three anchored sections to the live page, written from data we already hold (no invented facts):
   - "Past Papers Pattern" — subject-wise breakdown of what previous papers contained, framed honestly as practice built on the official syllabus and past-paper pattern.
   - "Syllabus (subject-wise weightage)" — already present; give it an ID, a summary sentence, and put the weightage in a crawlable table with a one-line takeaway above it.
   - "Test Date & Roll Number Slip" — a short factual block. I need the official date/venue text from you; without it I will link to the official source only and not state a date.
3. **In-body contextual internal links.** Today's cross-links are only chip/card grids at the bottom. Add keyword-anchored links inside the opening paragraphs (e.g. "Sindh High Court Library Associate BPS-13 mock test", "NTS past papers") so authority flows into siblings instead of dead-ending.
4. **Sibling cluster.** Verify each parallel Sindh High Court / NTS post (Library Associate, Caretaker, Junior Translator, Stenographer) has a live page, then cross-link all of them both ways. Any post that is missing gets created from its official syllabus.
5. **Force a re-crawl.** Bump `lastmod` for the affected URLs, regenerate sitemaps, and fire IndexNow (`indexnow-submit-recent`) the moment the content lands so Google re-crawls before Sunday rather than after.

## Phase 2 — Same week, after Phase 1 is live

6. **Print/download view.** A `/mock-tests/<slug>/print` style page (clean, print-stylesheet, syllabus + 50 key MCQs with answer key) that satisfies the "pdf" searches without hosting a stale binary. Browser "Save as PDF" gives the user the file they wanted.
7. **Trending Exams block.** A block on `/mock-tests` (and a compact strip in the header on that route) listing the currently hot exams, ordered from real 7-day view counts rather than a hardcoded list.
8. **Question depth check.** Confirm the JOA pool has enough approved questions per subject to serve a spike without falling back to on-the-fly generation, and pre-warm it if not. The campaign surge window is already active until 30 Aug.

## Not doing / needs your input

- **Claims:** no test date, cut-off, or "official past paper PDF" claim goes live unless you give me the source. Everything else is generated from the syllabus already stored in the database.
- **Social syndication** (WhatsApp / study groups) is yours to run — I will produce short shareable copy plus the exact links once Phase 1 is live.

## Technical notes

- New script step alongside `scripts/topic-content.mjs`, wired into the build after `inject-meta.mjs`, plus a guard in `scripts/verify-prerender.mjs` asserting mock-test HTML contains syllabus and question text (so an empty shell can never ship again).
- Page edits in `src/pages/MockTestDetail.tsx` and the `src/components/mock-tests/*` link blocks; existing FAQ/JSON-LD path via `safeJsonLd` stays unchanged.
- Sitemap: `scripts/generate-sitemaps.mjs` `mock-tests.xml` lastmod refresh, then the IndexNow edge function.
- No schema changes required for Phase 1.
