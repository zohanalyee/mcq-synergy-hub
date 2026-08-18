# Comprehensive Issue Audit — Diagnosis only (no code this turn)

## 1. URGENT — numeric class segment (`/12/` instead of `/class-12/`)

**Verdict: not purely stale GSC data. A live source still exists in the code today.**

Confirmed by reading the code:

- `src/components/quick-test/useSeoLmsCoverage.ts` (lines 149 and 151) builds its deep links with the **raw class number**, not the canonical segment:
  - `practicePath: /boards/${boardSlug}/${ctx.classNumber}/${subjectSlug}/${topicSlug}`
  - `subjectPath: /boards/${boardSlug}/${ctx.classNumber}/${subjectSlug}`
  Every other builder in the app correctly wraps the class in `toClassSegment(...)` (`RelatedTopics`, `ExploreMore`, `BoardClassPage`, `BoardSubjectPage`, `BoardLandingPage`, `Boards`, `BoardTopicPage`). This one hook was missed.
- Those two paths are rendered as real `<Link>` elements by `src/components/quick-test/QuickTestChip.tsx` (lines 114 and 126) — which appears on the SEO landing pages. So Googlebot, which does execute JS, keeps discovering `/boards/<board>/12/...` as a crawlable href.
- Secondary, non-SEO: `BoardTopicPage.tsx` line 203 writes the numeric path into `empty_topic_analytics.page_path`. Harmless for Google, but it means analytics rows are keyed on a non-canonical path and can double-count against the `class-12` form.

What is **not** broken:

- The canonical itself is correct. `GlobalCanonical.tsx` normalizes the class segment to `class-N`, and `BoardTopicPage` does a `navigate(..., { replace: true })` to the canonical form. So the numeric URL resolves and points at the right canonical.
- No numeric-class URL exists in any sitemap (`rg` over `public/sitemaps/*.xml` returns none).
- The prerendered static HTML does not contain the numeric hrefs — the chips are fetched via react-query at runtime, so only JS-rendering crawlers see them.

Consequence: the numeric URLs are a self-inflicted crawl-budget and "Alternate page with proper canonical" / "Page with redirect" source. They are **not** an indexing risk (canonical is right), which is why this looked fixed.

**Root cause:** the earlier fix normalized page-level and canonical-level URL building but never touched `useSeoLmsCoverage`. This is a leftover from the original implementation, not a fresh regression introduced by a recent build.

**One thing I cannot assert:** whether the specific GSC row you saw was crawled recently or months ago. That needs a URL Inspection read on that exact URL (`lastCrawlTime`) in Search Console — the API cannot run a live test. Step 1 of any fix should be that check, so we know whether it is active discovery or a historical row.

## 2. `/subject/:id?topic=...&count=...` — what it is

**Verdict: not orphaned. It is a live, intentionally-blocked internal app route.**

- Two routes point at the same component in `src/App.tsx`: `/subject/:id` (line 350) and `/subject-content/:id` (line 351), both → `SubjectContent`.
- `/subject/:id` is actively linked from four places: `src/components/board-topic/PracticeModeButtons.tsx` (lines 15, 21 — with `?topic=&count=10` and `?count=50&timed=true`), `src/pages/BoardTopicPage.tsx` line 280, `src/pages/StudyGuides.tsx` line 83, `src/components/dashboard/SubjectsMasteryTab.tsx` line 157, plus `readingPath` in `useSeoLmsCoverage`.
- `public/robots.txt` disallows `/*?*count=`, `/*?*topic=`, `/*?*timed=`. So every practice-mode link is deliberately blocked. The "Blocked by robots.txt" rows for this pattern are **expected and correct** — these are practice launchers, not content pages.
- Real issues worth cleanup later, both minor:
  - The bare `/subject/<uuid>` links (StudyGuides, SubjectsMasteryTab) are **not** query-blocked, so a UUID URL can be crawled and is a duplicate of `/subject-content/<uuid>`. `SubjectContent` sets `noindex` only for the runner variant and 404s, so a plain UUID reader URL is currently indexable in principle.
  - Two aliases for one component means two crawlable forms of the same page.

No fix is urgent here. It is hygiene, not a leak.

## 3. AdSense "Low value content" — one concrete contributor found

**Verdict: partly "wait for content to grow", but there is a specific fixable issue.**

`src/pages/BoardTopicPage.tsx` line 307 renders `<AdSlot surface="board-topic" />` **unconditionally**, including on pages where `isThin` is true (line 182: path not in `INDEXABLE_TOPIC_PATHS`, i.e. below the approved-MCQ threshold). Those pages already carry `noindex` — so we are serving ad code on pages we ourselves have judged too thin to index. That is exactly the pattern the AdSense reviewer flags.

The rest of the ad surfaces look policy-clean: one unit per page, and `ads.ts` restricts serving to the published host only. `BlogPost`, `MockTests` hub and `test-results` are all substantive.

So the honest answer: content volume is a real factor and does need time, but "ads on our own noindex pages" is a defect, not a waiting game. Gating `AdSlot` behind `!isThin` is the cheapest single improvement and is fully isolated to one line.

## 4. The other three GSC categories

- **Blocked by robots.txt** — expected. Driven by the deliberate `?count= / ?topic= / ?timed= / ?q=` and `/subjects?*` disallow rules, which is the `/subject/:id` pattern from item 2. No action.
- **Alternate page with proper canonical** — expected *and* partly self-inflicted by item 1. `GlobalCanonical` strips queries and normalizes the class segment, so `?lang=` variants and `/12/` variants correctly report as alternates. Fixing item 1 shrinks this bucket over time.
- **Page with redirect** — expected. Two known sources: `www.mcqsai.com` → apex (302) and the client-side `navigate(replace)` from numeric class to `class-N`. Again, item 1 is the reducible half.

None of the three shows a signature I would call a genuine new bug.

## MDCAT roadmap — corrected for 20 September

You have the date as **20 September 2026**, roughly 4-5 weeks out. That changes my earlier read: the window is **pre-exam**, not post-exam. (For the record, the PMDC public notice I found says 16 August 2026 — likely a different sitting or a revised schedule. Before any date text ships I need your source for 20 September, since a wrong date on a ranking page is worse than no date.)

Working backwards from 20 September:

| When | Action |
|---|---|
| **This week (by 22 Aug)** | Fix the stale banners on `/mdcat-syllabus` and `/mdcat-past-papers` — both currently say "will be conducted on August 16, 2026" and "only 3 months left". Both are wrong today and read as abandoned. Replace with the confirmed date once you supply the source. |
| **By 25 Aug** | Add the crawlable pre-exam content block: subject-wise weightage table (already on the page, needs an anchor + summary), "MDCAT 2026 in <N> days — what to revise", 2025/2026 past-paper rows, in-body contextual internal links (aggregate calculator, `/exams/mdcat`, `/exams/nums`, `/ecat-preparation`), FAQ block matched to live queries. Then bump `lastmod` and fire `indexnow-submit-recent`. |
| **~29 Aug** | Verify in GSC that the updated pages were re-crawled. This is why the content must land ~3-4 weeks before the exam: Google needs a crawl cycle plus a ranking-settle cycle before the search spike. |
| **1-10 Sep** | Peak-window additions: "roll number slip / test day" block (facts only), practice-volume pre-warm so the MDCAT question pool can absorb a spike without on-the-fly generation. |
| **After 20 Sep** | Post-exam swing: result / answer key / aggregate section. Content prepared in advance, published the day after the paper. |

Cluster priority after MDCAT stays as previously proposed: JOA/Sindh High Court siblings (23 Aug) → ECAT/NUMS/entry tests → PPSC/NTS → FPSC → CSS/PMS. I have not verified official dates for any of those from a published source, so date confirmation is step one of each.

## Suggested fix order, when you approve code

Each item is independently shippable and touches no shared system:

1. `useSeoLmsCoverage.ts` — wrap the two paths in `toClassSegment` (2 lines, no URL that currently ranks changes).
2. `BoardTopicPage.tsx` — gate `AdSlot` behind `!isThin` (1 line).
3. MDCAT banner date correction — after you give me the 20 September source.
4. MDCAT content block + sitemap lastmod + IndexNow.
5. Optional hygiene: decide whether `/subject/:id` stays as an alias or gets consolidated on `/subject-content/:id`.

Items 1 and 2 are one-line, zero-regression-risk changes that reduce two of the four GSC buckets and the AdSense flag. I would ship those first, separately from any MDCAT content work.
