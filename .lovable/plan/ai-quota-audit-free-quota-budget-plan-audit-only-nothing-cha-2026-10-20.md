# AI quota audit + free-quota budget plan (audit only, nothing changed)

All figures below are from live `ai_usage_logs`, `system_settings`, `cron.job` and the code, read on 20 Oct 2026 around 06:10 UTC. Anything I could not verify is labelled **unverified**.

## Part 1 — Audit findings

### 1. Who uses the quota, and what a "row" means

There are two kinds of rows:

| Row kind | source_type | What one row is |
|---|---|---|
| **Attempt row** (`metadata.ai_attempt = true`) | `generate-test`, `quality_gate`, `ai_attempt` | One real HTTP request to Gemini (or to the paid gateway), including requests rejected with a 429 error |
| **Summary row** | `admin_bulk_generator`, `user_test_session`, `auto_fill_run_summary`, `quality_gate_run_summary` | One logical run. It makes no extra request. |

**How to count real requests per day:** count rows where `metadata->>'ai_attempt' = 'true'` and `provider = 'gemini'`, grouped by `key_index`. Some requests are never logged as rows:
- model-404 fallbacks inside `callGeminiText`
- the auto-fill health probe

So the true total is slightly higher than the row count.

**Last 7 days (UTC):**

| Day | generate-test attempts (429s) | verify-questions "quality_gate" attempts (429s) | Questions saved: bulk / auto-fill summary |
|---|---|---|---|
| 13 Oct | 262 (243) | 41 (12) | 5 / 0 |
| 14 Oct | 513 (450) | 68 (45) | 302 / 275 |
| 15 Oct | 816 (681) | 102 (51) | 865 / 339 |
| 16 Oct | 563 (464) | 67 (44) | 306 / 265 |
| 17 Oct | 470 (383) | 88 (56) | 518 / 518 |
| 18 Oct | 410 (316) | 68 (46) | 305 / 264 |
| 19 Oct | 405 (304) | 65 (50) | 120 / 113 |
| 20 Oct (to 06:00) | 266 (225) | 42 (36) | 26 / 26 |

Every day, **roughly 75–85% of attempts are 429 rejections**.

**Last 24 hours, generate-test attempts:**
- 300 rate-limited: key #1 118, key #2 100, key #3 82
- 54 free successes, 18 per key
- **38 paid gateway successes**
- 4 `free_only_exhausted`

### 2. generate-test: why 400 rows show 0 saved

- **Not users, not the job-test queue.**
  - The queue (`process-jobtest-queue`, every 5 minutes) has had nothing pending since 16 Oct (888 done, 0 pending).
  - User sessions made only 4 summary rows.
- **The real caller is `scheduled-autofill`.**
  - It runs every 30 minutes (cron `nightly-auto-fill`).
  - It calls generate-test with `mode: bank_only`. Each call produces one `admin_bulk_generator` summary row (86 in 24 hours) plus many attempt rows under `generate-test`.
  - Saved questions are recorded only on the summary row. That is why the attempt rows always show 0 saved. **This part is expected.**
- **The volume is a retry storm (a bug).** Each auto-fill batch calls the AI through three nested retry layers:
  1. `callAIWithAutoSwitch` (`_shared/gemini.ts`) tries keys #1→#2→#3. If all three answer 429, it **waits 8 seconds and tries all three again**. That is up to 6 requests.
  2. generate-test repeats the batch up to `MAX_RETRIES = 3` times (`generate-test/index.ts` around line 768). When a result fails for a reason other than auth/free-only/all-models-failed, it does `continue`.
  3. `scheduled-autofill` wraps each call in `retryWithBackoff` (`_shared/quotaManager.ts`). That retries every 429 up to 3 times, after 5 s and 15 s.
  - Worst case is 6 × 3 × 3 ≈ 54 requests per batch, and most of them land on keys already known to be out of quota.
- **The key cooldown is ignored here.** `callAIWithAutoSwitch` never reads `free_key_health.cooldown_until`. Only the auto-fill health probe respects it. A key parked until 08:00 UTC is still called on every batch.
- **Paid fallback is still on for auto-fill.** The setting `auto_fill_paid_budget` is `{enabled: true, 5/run, 40/day}`, and the latest bulk summary rows show `free_only: false`. That explains the 38 paid generate-test successes in 24 hours. **This breaks your "free keys only for background jobs" rule.**

### 3. Do the three keys share one Google project?

- The code cannot tell. `getFreeGeminiKeys()` only reads three secrets: `GEMINI_API_KEY`, `EXTERNAL_JOBS_GEMINI_KEY`, `GEMINI_API_KEY_3`. Nothing stores a project ID. `system_settings.free_key_health` stores only status, reason and cooldown per key index.
- What the data suggests (**unverified hypothesis**):
  - All three keys hit 429 in the same probe (`free_key_health` at 19 Oct 14:00 UTC, all parked until 20 Oct 08:00 UTC).
  - Their success counts are identical (18/18/18).
  - That fits one shared project quota, or simply rotation through equally loaded keys. **It is not proof.**
- **Check it yourself on a phone:**
  1. Open aistudio.google.com and sign in with each Google account you used.
  2. Go to **Get API key**. Each key is listed with its **Project** name and number.
  3. If two keys show the same project number, they share one daily quota.
  4. Go to **Usage / Rate limits** (or console.cloud.google.com → APIs → Generative Language API → Quotas) to see that project's per-model limits and today's use.

### 4. Models and free-tier limits

| Job | Model used |
|---|---|
| generate-test, quality-gate, verify-questions, auto-fill (all through `callAIWithAutoSwitch`) | `gemini-flash-latest`, falling back to `gemini-2.0-flash`, then `gemini-2.5-flash` |
| Document converter | `gemini-2.0-flash`, then `gemini-2.0-flash-lite` |
| Embeddings | `gemini-embedding-001` |
| Paid fallback | `google/gemini-3-flash-preview` |

- No background job asks for a lighter "lite" model. Quality checks and short verification would likely work on a Flash-Lite model, which Google usually gives a higher free daily allowance. **Quality on our questions is unverified until tested.**
- **Per-model limits: unverified.** Google publishes them per project per model and changes them often. I will not quote numbers as fact. Please read the current table at ai.google.dev/gemini-api/docs/rate-limits and the Usage page in AI Studio. Google's daily reset is midnight Pacific time (07:00–08:00 UTC, which matches the 08:00 UTC cooldown), not midnight UTC.
- `gemini-flash-latest` is an alias whose underlying model can change without notice, so its limits can change too.

### 5. Do all jobs respect the 1,400/day limit and the key cooldown?

| Guard | How it works today | Who respects it |
|---|---|---|
| `ai_daily_limit` (1,400 requests) | Code uses a hard-coded `DAILY_QUOTA_LIMIT = 1400`; the database setting is not read. It counts **every** row since midnight UTC, including summary rows and 429 rows, so it measures neither real requests nor any single key. | generate-test, verify-questions, scheduled-autofill, generate-from-rag, fetch-external-jobs, process-book. **The new quality-gate does not use it**; it has its own `quality_daily_ai_cap` (300). |
| `free_key_health` cooldown | Written and read only by the auto-fill health probe. A 429 parks a key until the next Google reset. | **Only scheduled-autofill's probe.** generate-test, quality-gate, verify-questions and every other caller still hit cooled-down keys. |
| Free-only flag | quality-gate (`mock_quality_gate`) and verify-questions both pass `allowPaidFallback: false` in the code. | However, verify-questions logged **8 paid successes**, every hour at :20, the last at 05:20 UTC today. The Batch 4B free-only change landed right after that, so those were most likely made by the old version. I will confirm at the next :20 run. auto-fill is paid-enabled (see section 2). |

- **Run times:**
  - verify-questions: every hour at :20 (`hourly-quality-gate`)
  - quality-gate: every 2 hours at :40
  - auto-fill: every 30 minutes, at :00 and :30
  - These runs never start in the same minute, but they all draw on the same keys.
- **Quality Gate:** I found **no `mock_quality_gate` attempt rows in the last 24 hours**, although you saw 1 call. That could be a labelling or logging mismatch; I will check it during Build. Wave 1 has **3,021 questions, 0 reviewed so far**.

## Part 2 — Plan (design only)

### a) Daily free-quota budget per job group

New setting `ai_free_budget` in `system_settings`:

```text
{ enabled: true,
  reset: "google_pacific",          // resets at 07:00/08:00 UTC like Google
  groups: {
    user:         { reserve: 150 },  // learner sessions, AI Coach, guest
    quality_gate: { max: 100 },      // mock quality-gate + verify-questions
    auto_fill:    { max: 120 },
    admin_bulk:   { max: 60 } },     // manual admin bulk / converter
  total_max: 450 }                  // proposed values, owner can change
```

- **Priority:** user, then quality gate, then auto-fill, then admin bulk.
- Background groups can never use the `user` reserve: a background call is refused if `total used + user reserve still unused ≥ total_max`.
- A real request is counted only from attempt rows with `provider = gemini`, for the current Google day.
- **When a background group runs out:** the run stops cleanly with `BUDGET_EXHAUSTED`, logs one summary row, and makes no calls until the reset.
- **When the user reserve runs out:** learner behaviour stays exactly as today. The existing learner paid ceiling (500/day) and the graceful message are untouched.

### b) Stop retry storms

- **Inside `callAIWithAutoSwitch`:**
  - Skip any key whose `free_key_health.cooldown_until` is in the future (cached for 60 seconds per worker).
  - On a daily-quota 429, write that key's cooldown.
  - For background callers, remove the 8-second "retry all keys" pass.
- **Circuit breaker:** when every key is cooling down, background callers fail immediately with `FREE_ONLY_EXHAUSTED` and make 0 requests.
- **generate-test:** in bank_only/auto-fill mode, stop the whole run on the first all-keys 429 (no 3× batch retry).
- **scheduled-autofill:** remove the `retryWithBackoff` wrap around 429s.
- **Paid fallback for background jobs:** set `auto_fill_paid_budget.enabled = false` and force `free_only: true` for every background caller.
- **Expected effect:** about 1 attempt per useful batch instead of up to 54. The roughly 300 wasted 429 requests a day should drop to under 10. **This is an estimate, to be checked after Build.**

### c) Quality gate: cheapest model, batching, run times

- quality-gate and verify-questions request a Flash-Lite model first (exact model ID to be confirmed in AI Studio), then fall back to the current chain.
- Keep batches of 10 questions per call.
- **Before switching:** run 20 known Wave 1 questions through both models (about 4 calls) and compare their verdicts. Switch only if they agree.
- **New run times:** verify-questions at :50 and quality-gate at :10 past odd hours, so neither starts within 10 minutes of auto-fill (:00/:30).

### d) Admin "AI quota today" mini-panel (mobile)

A read-only card at the top of the existing AI quota screen (`QuotaMonitor.tsx`). It shows:
- each group: used / limit / remaining (progress bar)
- per key (#1/#2/#3): requests today, 429s today, "cooling until 13:00 PKT" or OK
- paid calls today (should read 0 for background jobs)
- the next reset time, in PKT

It reads data through one new admin-only database function (`is_admin()` check). It has no buttons that spend AI calls.

### e) Free ways to get more quota (Google's rules)

- **Allowed:** each Google Cloud project gets its own free quota. If keys #2/#3 sit in the same project as key #1, create a new project in your own account (AI Studio → Create API key → New project) and replace that key. Google's terms state limits apply per project. Using several projects for one app to get round limits may be treated as abuse under Google's terms. **This risk is unverified either way; read Google's Gemini API terms before adding more.** I recommend at most three projects, all on your own real account.
- **Free and no risk:**
  - stop wasted 429 requests (point b)
  - use Flash-Lite for checks (point c)
  - reuse approved questions before generating new ones (auto-fill already does this)
- **Do not:** create fake accounts, use other people's keys, or create projects in bulk.

### f) Expected effect on Wave 1

- 3,021 questions in batches of 10 ≈ 303 AI calls, or about 600 if every batch needs a second answer-verification pass. The rules-only checks cost 0 calls.
- With `quality_gate.max = 100` a day and the retry storm fixed: **about 3–6 days**, provided the keys are not already out of quota from earlier use. Today the keys are cooling down, so day 1 starts after 13:00 PKT.

### g) Files, rollout, rollback, tests

**Files and migrations:**
- `supabase/functions/_shared/gemini.ts` — cooldown-aware key skip, background no-retry, `checkFreeBudget(group)`
  - **This is the shared Gemini helper you asked me not to touch. I need your explicit OK to change it here.**
- `supabase/functions/_shared/quotaManager.ts` — `retryWithBackoff` stops retrying 429s for background jobs; checkQuota counts attempt rows only
- `supabase/functions/generate-test/index.ts` — stop the run on the first all-keys 429 in bank_only/auto-fill; tag each call with its group
- `supabase/functions/scheduled-autofill/index.ts` — remove the 429 retry wrap, force free-only
- `supabase/functions/quality-gate/index.ts`, `supabase/functions/verify-questions/index.ts` — group tag, Flash-Lite first
- New migration:
  - `ai_free_budget` setting
  - `auto_fill_paid_budget.enabled = false`
  - admin-only function `get_ai_quota_today()`
  - cron reschedule for the two quality jobs
- `src/components/admin/QuotaMonitor.tsx` — add the mini-panel
- `supabase/functions/_shared/qualityChecks_test.ts` or a new `budget_test.ts` — tests

**Tests (one per rule):**
- A background call is refused when its group's limit is used up.
- A background call is refused when it would eat into the user reserve.
- A key in cooldown is never called.
- With all keys cooling down, a background call makes 0 requests.
- Background callers never use the paid fallback.
- A learner call still reaches the paid fallback under the 500 ceiling.

**Rollout:**
1. Run the migration.
2. Deploy the functions.
3. Watch one hour of runs: expect 0 paid background calls and fewer than 5 429s an hour.
4. Then try Flash-Lite with the 20-question check.

**Rollback:**
- Set `ai_free_budget.enabled = false`, which restores today's behaviour.
- Re-enable `auto_fill_paid_budget` only if you decide to.
- Restore the old cron times.
- The code changes are guarded by settings, so no data needs to be undone.

**Not touched:** live questions, pages, SEO, titles, meta, sitemaps, third-party scripts, and the learner paid ceiling.

### h) Risks and what not to do

- **Risk:** auto-fill will fill fewer questions a day without paid calls. You accepted this with the zero-budget rule.
- **Risk:** Flash-Lite may judge some questions differently. That is why the switch only happens after the comparison.
- **Do not:**
  - raise the 1,400 figure
  - add keys in bulk or through other people's accounts
  - re-enable paid fallback for the Quality Gate
  - lower learner limits

## Owner checklist (phone)

1. AI Studio → Get API key: write down the project number next to each of the 3 keys. Same number = shared quota.
2. Reply with OK, or with changes, for these budget numbers: user 150, quality 100, auto-fill 120, admin 60, total 450.
3. Confirm that auto-fill's paid budget gets switched off.
4. Confirm I may edit the shared Gemini helper for this batch.
5. After Build: Admin → AI Quota should show 0 paid background calls and "cooling until …" for each key.

## Open questions

- Budget numbers in (a): accept or change?
- Is it OK to change the shared Gemini helper, which you previously asked me to leave alone?
- Are all 3 keys on your own Google account?
