# Auto-Fill Credit Burn vs Question Growth — Audit Report (9 Sep 2026)

No changes made. Findings below are from live database, usage logs, cron table, and credit ledger.

## 1. Are new questions actually being added?

Yes — but very few. Real counts (MCQs, by day created):

| Day | Approved (visible) | Flagged duplicate (hidden) | Pending |
|---|---|---|---|
| 5 Sep | 121 | 9 | 7 |
| 6 Sep | 138 | 0 | 5 |
| 7 Sep | 63 | 5 | 5 |
| 8 Sep | 60 | 33 | 1 |
| 9 Sep (partial) | 49 | 36 | 0 |

Last 3 days: **237 approved and visible**, **74 hidden as flagged duplicates**, 9 pending. So the bank *is* growing, but the rate has dropped by roughly half since 6 Sep, and the share of throwaway output has jumped from ~0% to ~40%.

## 2. Are the AI calls succeeding?

The paid calls succeed. The **free** calls almost all fail. Attempt outcomes, last 2 days:

- Gemini key #1: **447 calls rejected with 429 (quota exhausted)**
- Gemini key #2: **468 calls rejected with 400 — "API key not valid"** (the key is dead/invalid, not rate-limited)
- Gemini key #1: 22 more failed with 503
- Gemini key #1 success: **7**
- Paid Lovable gateway success: **321**

So essentially every generation request now walks through two failing free keys and lands on the **paid** gateway. That is the credit burn. This is confirmed in the live function logs too ("Gemini key #2 error: API key not valid", "Gemini marked unavailable, skipping to Lovable", "Using Lovable AI Gateway (paid backup)").

## 3. Where are the generated questions going?

Not lost to insert errors — lost to **duplicate rejection**, because the auto-fill scheduler keeps hitting topics whose banks are already saturated.

Evidence from the last six auto-fill cron runs (each every 30 min):

- 6–7 topics attempted per run, batch size **15** per topic → ~90–105 questions requested
- **questions_saved: 5, 6, 6, 6, 7, 7** per run
- `stop_reason: "Time budget reached (partial run, continues next cycle)"` every time, against a `run_target` of 600

So roughly **93% of every paid batch is discarded**. Two discard paths:
1. In-batch/near-duplicate fingerprint filter inside `generate-test` silently skips repeats before insert (no log line, no counter).
2. Rows that survive that filter but collide are stored as `flagged_duplicate` with `show_in_subjects=false` and `show_in_mock_tests=false` — 74 in three days. These are invisible in the normal bank, which is why it feels like nothing is being added.

The FORCE-SAVE fix is **not** the cause: no rows are silently dropped by the unique-title index anymore, and no `[FORCE-SAVE-...]` titles were created in this window. The index now only excludes `flagged_duplicate` rows, which is why duplicates now land visibly in that status instead of failing.

Cron is healthy — `scheduled-autofill` runs every 30 minutes and is active; `process-jobtest-queue` every 5 minutes; `verify-questions` hourly. Nothing is stuck. The waste is per-attempt, not per-failure.

## 4. Campaign surge

`campaign_surge` is configured once, correctly, and is not double-firing:

- enabled: true, label "MDCAT Final Sprint", starts 6 Sep, ends 21 Sep 18:59 UTC
- daily_budget: 600, min_multiplier: 3
- sprint keywords: mdcat, biology, physics, chemistry, class 11, class 12

But it is the reason the burn got worse: surge forces the scheduler into a narrow MDCAT/class-11-12 keyword scope (`sprint_scope: punjab, sindh, mdcat, biology, physics, chemistry, class 11, class 12`) — exactly the topics that already have the deepest banks. Multiplier 3 triples the requested volume against the most saturated content. That matches the timeline: duplicates went from 0 on 6 Sep to 33–36/day on 8–9 Sep, and approved output halved.

Also note: `auto_fill_config.run_target` is 600/run while the function's time budget only allows ~6–7 topics per run, so the target is unreachable and every run reports a partial.

## 5. Exact numbers (last 3 days, 6–9 Sep)

| Metric | Value |
|---|---|
| Paid gateway credits consumed (gemini-2.5-flash in+out+cached) | **13.97 credits** |
| Free Gemini attempts that failed (429 / invalid key / 503) | **937** |
| Free Gemini attempts that succeeded | 7 |
| Paid gateway successes | 321 |
| Questions approved + visible | **237** |
| Questions hidden as flagged duplicates | **74** |
| Questions pending | 9 |
| Questions requested but silently discarded as near-duplicates | **~600–700** (est. from 15/topic × ~7 topics × 48 runs/day vs saved counts) |
| Effective yield | **~7% of paid output reaches the visible bank** |

For context on the wallet: workspace daily grant is 5.00 credits with 1.10 remaining today, and total remaining is 7.80 of 355 granted. Of the 65.47 credits used in this window, 51.50 were Lovable build/plan messages and 13.97 were app AI Gateway calls.

## Root causes, in priority order

1. **Gemini key #2 is invalid (HTTP 400).** It contributes nothing and only adds latency.
2. **Gemini key #1 is permanently at its free quota (429).** With both free keys dead, 100% of generation is billed.
3. **Surge scope points at saturated topics**, so ~93% of paid output is thrown away.
4. **Duplicate waste is invisible** — silent fingerprint skips are not counted anywhere, so the dashboard cannot show that a run wasted 90 questions to save 6.
5. **`run_target: 600` is unreachable** within the function time budget, guaranteeing a "partial run" every cycle.

## Recommended fixes (for your approval — nothing built yet)

- Immediate stop-loss: pause `auto_fill_config.enabled` or drop the surge multiplier until keys are fixed, so no further credits burn at 7% yield.
- Replace the invalid `GEMINI_API_KEY_2` secret; verify both keys with a health probe before the scheduler trusts them.
- Add a hard rule: if no free key is usable, auto-fill either skips the run or runs under a small explicit paid budget instead of silently falling back.
- Deficit-first topic selection: skip any topic whose approved bank already meets target, and rank saturated topics last, so surge spends on genuinely thin topics.
- Count and log discarded near-duplicates per run (requested / saved / duplicate-skipped / flagged) and surface it in the admin generation history, plus a visible counter for hidden `flagged_duplicate` rows.
- Lower `run_target` to what one run can actually complete, so partial-run noise stops masking real failures.
