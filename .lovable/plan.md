# Free Gemini quota burn — audit findings + proposed fix

## Part 1 — Audit findings

### 1. Yes, the health probe spends real quota

Every auto-fill cron run (every 30 min = 48/day) sends one real `generateContent`
request per configured key before deciding anything. With 2 keys that is
**96 billable free-tier requests/day spent purely on checking**, and the probe result
is not cached anywhere — each run re-probes from scratch. When a model id answers
404 the probe walks the fallback model list, so a bad-model day costs up to 3
requests per key per run (~288/day).

Verified: `probeFreeGeminiKeys()` in `supabase/functions/_shared/gemini.ts` calls
`callGeminiText` with no caching; `scheduled-autofill/index.ts` calls it once per run.

### 2. Yesterday almost nothing else ran — the keys were already dead

Usage log counts for 10 Sep (UTC):

| Feature | Real generation calls |
|---|---|
| Auto-fill runs (33 runs) | 0 — every run logged `skipped: No usable free Gemini key` |
| Learner/admin generation (`generate-test`) | 3 attempts, all at 10:00 (key #1 503, key #2 503, then 1 paid call) |
| Quality gate (`verify-questions`) | 1 real call (00:20), rest "nothing to verify" |
| Everything else (AI Coach, RAG, blog, converter, jobs) | 0 rows |

So yesterday's burn was **not** feature traffic. Every key-health entry from
05:30 UTC on 10 Sep through 04:20 UTC on 11 Sep reads `status 429 GEMINI_RATE_LIMIT`
for both keys. The keys entered the day already rate-limited and never recovered,
while the probe kept spending ~96 requests/day against a quota that had nothing left.

The actual heavy day was **9 Sep**: 697 attempt rows — 155 rate-limited on key #1,
159 errors on key #2, 300 paid "credits exhausted" and 79 paid successes. That
pre-fix run burned both free keys; 10 Sep was the aftermath.

### 3. Google's free-tier daily limit

Free-tier RPD is per **Google Cloud project per model**, not per API key, and resets
at midnight US-Pacific (07:00–08:00 UTC), not UTC midnight. Published figures differ
by model and have been revised repeatedly — Flash-class free tiers are documented in
the low hundreds to ~1,500 RPD depending on model
([1](https://ai.google.dev/gemini-api/docs/rate-limits)). Two practical consequences
for us:

- If both keys live in the same Google project, they share one quota — the rotation
  buys nothing. Worth confirming the keys come from two separate projects.
- Our "daily" accounting resets at UTC midnight while Google's resets ~07:00 UTC, so
  a 429 seen at 04:00 UTC still belongs to the previous Google day.

### 4. Per-key / per-feature counts for yesterday

| Key | Probe calls | Real generation calls | Outcome |
|---|---|---|---|
| #1 `GEMINI_API_KEY` | ~33 (one per run) | 1 (`generate-test`, 503) | 429 all day |
| #2 `EXTERNAL_JOBS_GEMINI_KEY` | ~33 | 1 (`generate-test`, 503) | 429 all day |
| #3 `GEMINI_API_KEY_3` | 0 — not configured | 0 | absent |

Paid gateway on 10 Sep: 1 successful call. The 500/day paid ceiling was never
approached.

**Root cause summary:** free capacity was destroyed on 9 Sep, and since then the
uncached probe has been the single largest consumer of free quota — 66 requests/day
that produce zero questions, plus it blocks the run when it fails.

## Part 2 — Proposed fixes

### A. Stop the probe wasting quota
- Cache probe results in `system_settings` → `free_key_health` with a per-key
  cooldown: on a 429, mark that key unusable until the next Google reset boundary
  (next 08:00 UTC) instead of re-probing every 30 minutes.
- Cache a healthy result for 6 hours.
- Skip the probe entirely when the run has no deficit work queued.
- Expected saving: ~96 probe requests/day → under 8.

### B. Key #3 everywhere
`getFreeGeminiKeys()` already returns #1 → #2 → #3 and is the only key source used by
the shared text/vision/embedding helpers, so `generate-test`, `generate-job-test`,
`ai_coach`, `generate-from-rag`, `verify-questions`, `generate-blog`,
`fetch-external-jobs`, `process-book` and the document converter all inherit #3 the
moment the secret exists. Action: audit for any direct `Deno.env.get('GEMINI_API_KEY')`
call sites left outside the helper and route them through it. **The
`GEMINI_API_KEY_3` secret itself is still not set — this is the single highest-value
change available.**

### C. Small paid budget for auto-fill (proposed values)

Measured paid cost ≈ 0.044 credits per gateway call (13.97 credits / 321 calls).

Proposal: `auto_fill_paid_budget = { enabled: true, max_paid_calls_per_run: 5,
max_paid_calls_per_day: 40 }`

- 40 paid calls/day ≈ **1.8 credits/day** worst case (~55 credits/month at full burn).
- At batch size 15 that is up to ~600 questions/day of continued background filling
  even with every free key dead.
- Auto-fill paid calls are counted separately from, and also still subject to, the
  learner ceiling.

Alternatives if you want it tighter or looser: 3/run + 24/day (~1.1 credits/day) or
8/run + 80/day (~3.5 credits/day).

### D. Learner-facing safety unchanged
`paid_ai_daily_ceiling = { enabled: true, max_paid_calls_per_day: 500 }` and the
`PAID_DAILY_CEILING` graceful-degrade path in `generate-test` stay exactly as they
are. The auto-fill budget is a separate, smaller gate applied before the learner
ceiling is consulted, so background filling can never eat the learner allowance.

## Technical notes
- `_shared/gemini.ts`: add cached/cooldown-aware `probeFreeGeminiKeys`, persist
  `free_key_health` via the existing service-role log client, add
  `checkAutoFillPaidBudget()` mirroring `checkPaidDailyCeiling()` but reading
  `auto_fill_paid_budget` and counting `metadata->>'source' = 'auto_fill'` paid rows.
- `scheduled-autofill/index.ts`: pass the per-run paid allowance into generation,
  stop after the allowance is used, and log `paid_calls_used` in the run summary.
- One migration-free `system_settings` update for `auto_fill_paid_budget`.
- No UI change required; admin history already renders `stop_reason` and counters.

## Open item for you
Confirm the paid-budget numbers (5/run, 40/day) or pick an alternative, and add the
`GEMINI_API_KEY_3` secret if you have a third Google account available.
