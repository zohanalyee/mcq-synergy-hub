# MDCAT Diagnosis + Remaining Plan Items

## Part 1 — MDCAT diagnosis (data verified today, 2 Sep)

**1. GSC performance (2 Aug – 29 Aug, property-level)**  
Site totals: 1,265 clicks / 11,493 impressions / avg position 6.5.  
MDCAT pages in the top-pages list:


| Page               | Clicks       | Impressions  | Avg position |
| ------------------ | ------------ | ------------ | ------------ |
| /p/mdcat-karachi   | 6            | 509          | 6.3          |
| /p/mdcat-punjab    | 2            | 27           | 7.6          |
| /exams/mdcat       | 2            | 8            | 11.8         |
| /mdcat-syllabus    | not reported | not reported | —            |
| /mdcat-past-papers | not reported | not reported | —            |


Answer to the question: it is **not** a ranking problem for the pages that do appear — `/p/mdcat-karachi` sits at position 6.3 with 509 impressions but only 1.2% CTR. The two main MDCAT pages (`/mdcat-syllabus`, `/mdcat-past-papers`) are below GSC's reporting threshold, i.e. they are getting essentially **no impressions at all** — they are not competing yet, not being clicked-and-lost. Meanwhile 1,165 of 1,265 site clicks still come from the single JOA mock-test page.

**2. Live Googlebot check — content IS real, not a shell**  
Fetched with Googlebot UA today:

- `/mdcat-syllabus` → 200, 34.9 KB raw HTML, contains "20 September 2026" (×4), weightage table text (×4), FAQPage JSON-LD.
- `/mdcat-past-papers` → 200, 29.9 KB raw HTML, contains "200 MCQs" (×6), "20 September 2026" (×3), "Most Repeated", FAQPage JSON-LD.
- `/exams/mdcat` → 200, 75 KB.

So the 25-Aug content additions are genuinely prerendered into raw HTML. This is not the Mock-Test empty-shell problem.

**3. IndexNow / sitemap — this is the actual blocker found**

- `/mdcat-past-papers` is **not present in any sitemap file**. It was never submitted.
- `/mdcat-syllabus` is in `static.xml` but with `lastmod` still `2026-08-11` — it was never bumped after the 25-Aug content additions, so Google had no freshness signal to re-crawl.
- `/exams/mdcat` lastmod is also `2026-08-11`.
- Homepage last crawl recorded by Google: 27 Aug 2026 (property-level inspection). Per-URL last-crawl dates for the MDCAT URLs are not exposed through the API and need the GSC UI URL Inspection tool.

**4. Competitive expectation**  
MDCAT head terms are high-competition and dominated by aged domains. Our only MDCAT visibility today is a long-tail geo page (`mdcat-karachi`, pos 6.3) and `/exams/mdcat` at pos 11.8. Realistic expectation for the next few weeks: long-tail geo/subject/past-paper queries can reach top-20; broad "MDCAT syllabus 2026" / "MDCAT past papers" head terms will not, given current domain authority. The JOA win came from a low-competition, event-spiked niche — MDCAT will not replicate that curve.

**5. Content depth for MDCAT subjects — sufficient, not thin**  
Approved MCQs: Biology 1,387 (69 topics), Chemistry 1,123 (84), Physics 987 (72), English 354 (39), plus class-tagged variants (Biology Class 11: 294, etc.). Total across MDCAT subjects: 4,356 approved. Depth is no longer the constraint for these subjects; discovery/submission is.

**Conclusion:** MDCAT traffic is missing because of **discovery, not content and not penalties** — one key page is absent from the sitemap, the other has a stale lastmod, and head-term competition is out of reach at current authority. CTR on the one ranking page (1.2%) is a secondary title/description issue.

## Part 2 — Remaining approved plan items

**Item 1 — Sitemap regenerate (580 → 1,103)**  
`public/sitemaps/boards-1.xml` holds 580 URLs; `get_indexable_board_topic_paths()` returns 1,103 today. Re-run `scripts/generate-sitemaps.mjs` so boards sitemaps cover all 1,103 indexable paths with fresh lastmod, then run `scripts/verify-sitemap.mjs`.

**Item 1b — Add the missing MDCAT URLs (new, from this diagnosis)**  
Add `/mdcat-past-papers` to the static sitemap and bump lastmod on `/mdcat-syllabus`, `/mdcat-past-papers`, `/exams/mdcat` to reflect the 25-Aug content, then fire IndexNow for those URLs via the existing `indexnow-submit-recent` function.

**Item 2 — FORCE-SAVE cleanup: already complete, verified**  
`cleanQuestionText()` already strips `[FORCE-SAVE-...]` and `[n-...]`. Live DB check today: approved MCQs carrying a FORCE-SAVE tag = **0** (464 such rows exist but all are unapproved/flagged). Approved MCQ total 13,929, with 40 new approved in the last 2 days — generation is running again after the Gemini model fallback fix. No further work needed.

**Item 3 — Thin-page ad-gating negative case**  
Still pending verification. Pick a live board-topic URL with fewer than 5 approved MCQs, fetch it, and confirm (a) no `adsbygoogle` markup in the HTML and (b) `noindex` is present. Positive case (indexable page shows the unit) was already verified.

**Item 4 — GSC UI checks that the API cannot cover**  
Per-URL last-crawl dates for the MDCAT pages, Crawl Stats, and Manual Actions / Security Issues must be read from the Search Console interface. These stay open until inspected there.

**AdSense:** "Confirm fixed" stays unpressed until Item 1, 1b, 3 and 4 are done.

## Technical notes

- Files touched by the pending items: `public/sitemap.xml`, `public/sitemaps/*.xml` (regenerated output), `scripts/generate-sitemaps.mjs` only if the boards query cap is what limits it to 580.
- No changes to `src/config/ads.ts`, `AdSlot.tsx`, or any MDCAT page body — Item 3 is verification only.
- No content or route changes proposed for the MDCAT pages in this batch; CTR/title tuning would be a separate, isolated change.

&nbsp;

Approved — is-order-mein:

&nbsp;

1. Sitemap-regenerate (580→1103) + MDCAT-missing-URLs-add-karein (/mdcat-past-papers) + lastmod-bump + IndexNow-fire.

2. FORCE-SAVE — already-clean-hai (0-approved-tagged-rows), koi-action-nahi-chahiye. Confirm.

3. Thin-page-negative-case-verify-karein (sub-5-MCQ-URL-par-ad-NA-dikhna).

4. GSC-UI-checks (Manual-Actions, per-URL-crawl-dates) — main-khud-Search-Console-mein-check-kar-lunga.

&nbsp;

Publish-karein Item-1-fix.