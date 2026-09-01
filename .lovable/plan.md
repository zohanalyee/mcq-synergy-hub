# Traffic Crash + AdSense Readiness — Real Data Diagnosis (1 Sep 2026)

Report only. No code changed, AdSense "Confirm fixed" not pressed.

## Headline

The traffic crash is **not** a penalty, not a block, and not the FORCE-SAVE bug. Google's ranking position stayed the same (4.5–5.9) while impressions collapsed — that is **search demand disappearing after the JOA exam (23 Aug)**, not lost rankings.

The real problem is different and confirmed: **content generation has been dead for 7 days (zero new MCQs)** because both generation switches are turned off in the database.

## 1. GSC performance — exact drop date

Property `https://mcqsai.com/`, day-by-day clicks / impressions / avg position:

```text
Aug 14   136 / 1080 / 6.06
Aug 15   149 / 1169 / 5.97
Aug 16   150 / 1075 / 5.70
Aug 17   179 / 1122 / 4.87   <- peak
Aug 18   141 / 1361 / 5.91   <- impressions peak
Aug 19    57 /  544 / 5.82   <- DROP STARTS
Aug 20    12 /   58 / 4.28
Aug 21    10 /   63 / 4.41
Aug 22    17 /   85 / 4.64
Aug 23     0 /   21 / 8.76   <- JOA exam day
Aug 25     2 /   10 / 16.5
Aug 27     3 /   11 / 11.5
Aug 29     0 /    5 /  2.8
```

Drop began **19 August**, finished by **20 August**.

JOA page only (`/mock-tests/junior-office-associate-bps-13`), the page that carried 1173 of 1278 clicks:

```text
Aug 18  135 clicks / 1239 impr / position 5.76
Aug 19   57 /  504 / 5.75
Aug 20    8 /   48 / 4.83   <- position IMPROVED
Aug 22   14 /   82 / 4.73
Aug 23    0 /   14 / 10.9
Aug 26    0 /    1 / 5.0
```

Position went from 5.76 to 4.7–4.8 while impressions fell 96%. If Google had demoted the page, position would drop and impressions would stay. The opposite happened: fewer people are searching "junior office associate past papers" now that the test is over.

Current CTR is also fine, not broken: Aug 20–28 averages 15–28% CTR on the few impressions left. The "100 impressions, 1–2 clicks" feeling comes from total volume being ~5–11 impressions/day, not from a CTR collapse.

## 2. Crawl / indexing state

- Homepage in Google's index: **Submitted and indexed**, `robots_txt_state: ALLOWED`, `indexing_state: INDEXING_ALLOWED`, `page_fetch_state: SUCCESSFUL`, last crawl **27 Aug 2026 01:48 UTC** (crawling is active, well after the drop).
- Google-selected canonical = `https://mcqsai.com` — matches our declared canonical. No canonical conflict.
- Crawl Stats totals are not exposed through the API; the successful 27 Aug crawl plus ALLOWED/SUCCESSFUL states show there is no technical block.

## 3. Live Googlebot fetch (run just now, Googlebot UA)

```text
200  107 KB  /                                        robots: index,follow
200   19 KB  /mock-tests/junior-office-associate-bps-13  robots: index,follow
200   35 KB  /mdcat-syllabus                          robots: index,follow
200   85 KB  /mock-tests                              robots: index,follow
200          /robots.txt
200          /sitemap.xml
```

No 403, no 5xx, no accidental noindex. Cloudflare is not blocking Googlebot.

## 4. Manual actions / security

The Search Console API does not expose manual actions or the Security Issues report — that must be read in the Search Console UI (Security & Manual Actions). Nothing in the data suggests one: rankings held at position 4.7 and Google re-crawled and kept the page indexed on 27 Aug. A manual action would show demotion or removal, which the data does not show.

## 5. Indexable pages (your question 1)

Board topic pages with approved MCQs, by threshold:

```text
>= 5 approved  ->  1060 topics   (current live noindex threshold)
>= 8 approved  ->   867 topics
>= 15 approved ->    99 topics
indexable per live RPC -> 1103 paths
```

Plus roughly 36 mock tests, 21 programmatic, 23 static, 15 tools, 8 exams, 32 blog, 115 jobs/scholarships.
Note: `public/sitemaps/boards-1.xml` currently lists only **580** board URLs versus 1103 indexable — the committed sitemap is behind the database.

## 6. Content-Fill Sprint progress (your question 2)

**Zero new MCQs in the last 7 days.** Total approved MCQs: **13,918**.

```text
Aug 22    56 inserted   <- last day with any inserts
Aug 21  1251
Aug 20     6
Aug 19  1572
Aug 18   183
Aug 17   150
Aug 16  1995
Aug 15   300
Aug 23 -> Sep 1:  0
```

Cause found in `system_settings`:

- `content_fill_sprint.enabled = false`
- `campaign_surge.enabled = false`, window `ends_at 2026-08-30` (expired)

The `nightly-auto-fill` cron still fires every 30 minutes and reports success (144 successful runs in 3 days), but it writes no generation logs and inserts nothing. The only AI log rows for 7 days are `quality_gate_run_summary` with `stop_reason: "No unverified AI questions left"` and `questions_saved: 0`.

## 7. AdSlot `!isThin` gating (your question 3)

Live in source, verified: `src/pages/BoardTopicPage.tsx` line 182 computes `isThin`, line 246 passes `noindex={isThin}` to SEOHead, line 310 renders `{!isThin && <AdSlot surface="board-topic" />}`.

Verified live with Googlebot on a thin-gate candidate: an indexable topic page returns `index,follow` and does serve the ad slot, which is the intended behaviour. The negative case (a thin page serving no ad) still needs one live spot-check against a specific sub-5-MCQ URL before we call it fully verified.

## 8. FORCE-SAVE bug status (your question 6)

Still present, and **not** the cause of the crash:

- 449 rows total carry a `[FORCE-SAVE-xxxx]` title marker; **31 are approved and live**.
- `cleanQuestionText()` in `src/lib/questionUtils.ts` strips `[DUPLICATE]`, `[AI]`, `[ERROR/DUPLICATE-x]` — but **not** `[FORCE-SAVE-x]`. So those 31 questions display the raw debug tag to users and crawlers.
- All 31 are on board science/English topics (Physics, Chemistry, Biology, Computer Science, English), created 11–19 Aug. None are on the JOA page or any page that carried the spike traffic — so they cannot explain a traffic drop that was entirely JOA-query-driven.

It is a quality/AdSense-credibility bug, not a traffic bug.

## 9. AdSense realistic expectation (your question 4)

Yes — hold "Confirm fixed" for now, but the blocker is not time, it is these three items:

1. Generation is off, so the content base has not grown for 7 days. 2–3 weeks of waiting with the switches off adds nothing.
2. 31 live questions still show `[FORCE-SAVE-xxxx]` debug text — a reviewer landing on one sees exactly the kind of unfinished content that triggers "low value content".
3. Only 99 topics have 15+ MCQs; 867 have 8+. Depth per page is still shallow for a reviewer.

Realistic sequence: fix the debug-tag leak, re-enable generation and let it run ~2 weeks to push the 8+ tier toward 15+, refresh the sitemap to match the 1103 indexable pages, then confirm.

## Proposed next steps (for your approval, nothing done yet)

1. Re-enable `content_fill_sprint` (and set a fresh surge window if wanted) and confirm the autofill function actually inserts again.
2. Add `[FORCE-SAVE-x]` to `cleanQuestionText()` and clean the 31 approved titles in the database.
3. Regenerate the board sitemap so it lists all 1103 indexable topic paths.
4. One live spot-check of a sub-5-MCQ topic URL to close out the ad-gating verification.
5. Read Security & Manual Actions in the Search Console UI once, to formally rule out a penalty.
6. Traffic recovery: the JOA spike was event-driven. To replace it, target the next exam windows with the same treatment that worked (prerendered body content + past-papers intent).
