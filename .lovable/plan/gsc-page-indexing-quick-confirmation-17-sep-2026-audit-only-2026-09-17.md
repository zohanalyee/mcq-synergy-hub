# GSC Page Indexing — quick confirmation (17 Sep 2026, audit only)

Checked live pages as Googlebot, the built sitemaps, and current database counts. Nothing is broken by the tools fix, but one real limit turned up.

## 1. "Excluded by noindex" (270, was 251) — no accidental noindex, but one real cap

Live checks on the flagged examples:


| Page                                                 | Live state                                                                    | Verdict                            |
| ---------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------- |
| /tools/grade-calculator, /tools/color-picker         | noindex,follow                                                                | Intentional (utility-tool policy)  |
| /tools/pdf-compressor                                | noindex,follow                                                                | The 28 Aug fix is live and working |
| /tools/aggregate-calculator                          | index,follow                                                                  | Correctly untouched                |
| /analytics                                           | app page, never in sitemap                                                    | Intentional                        |
| /boards/... topic pages, /boards/.../class-9/biology | noindex because they were below the 8-approved-question bar at the last build | Not new — but see below            |
| /mock-tests/elementary-school-teacher-social-studies | index,follow today                                                            | Stale GSC snapshot                 |


So no real content page was accidentally noindexed. The rise from 251 to 270 is board topic/subject pages that were still thin when the site was last built.

**The real issue found:** which board topics count as indexable is decided at build time from a database lookup that returns at most 1000 rows. That lookup currently reports 1100 qualifying topics, and the sitemap contains exactly 1000. So roughly 100+ topics that already have enough questions are being left out of the sitemap and left marked noindex purely because of the row limit — and every topic that crosses the bar stays noindex until the next build and publish.

Fix (small, when you approve): page through the lookup instead of taking a single 1000-row batch, then rebuild and publish. Nothing else changes.

## 2. "Crawled – currently not indexed" (274) — yes, consistent with the thin-topic sprint

Current topic distribution: 358 with no approved questions, 70 with 1–4, 412 with 5–9, 1015 with 10+. Pages in this bucket are the low-question topic pages plus empty mock-test shells — exactly what the threshold sprint is filling. As topics cross the bar (and once the row-limit fix above ships) they move into the sitemap and become eligible. No separate action needed.

## 3. Soft 404 (6) and canonical mismatch (11) — noise, with two small cleanups

- /subject-content/mathematics and /subject-content/&nbsp;: return 200 with real titles today. Stale.
- /ask-document: still a "coming soon" placeholder with no real content — Google is right to call it soft 404. Cleanest handling is to mark it noindex until the feature ships.
- /tenders: the route exists but the page carries little content; same treatment or real content.
- /quizzes returns 200 today, so its "page with redirect" entry is stale.
- Canonical-mismatch examples are ?lang=ur / ?lang=sd variants and are handled by design.

Nothing here needs urgent work; the only two worth a line of code are the noindex on /ask-document and /tenders.

## Bottom line

Nothing new is broken. One genuine limit: the 1000-row cap is holding ~100 ready topic pages out of the sitemap and keeping them noindex. Suggested next step (needs your go-ahead): fix the row limit, add noindex to /ask-document and /tenders, then rebuild and publish. No changes were made in this turn.

&nbsp;

Please proceed with all three:

1. Fix the 1000-row cap — page through the topic-lookup instead of taking a single batch, so all qualifying topics (currently 1100+) make it into the sitemap, not just the first 1000

2. Add noindex to /ask-document (coming-soon placeholder)

3. Add noindex to /tenders (thin content)

Then rebuild and publish.