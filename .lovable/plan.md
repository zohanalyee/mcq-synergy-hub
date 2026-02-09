

# Quota Management & API Protection Plan

## Problem Summary

Your Gemini API free tier (1500 requests/day) is being exhausted by background processes. The `scheduled-autofill` and `fetch-external-jobs` functions lack proper quota checks, and `generate-test` has no rate limiting. There are no global safeguards to prevent one function from consuming the quota needed by others.

**Key findings from investigation:**
- `pg_cron` extension is NOT enabled -- so there are no active cron jobs currently running. The scheduled-autofill is only triggered manually.
- `ai_usage_logs` table has zero records in the last 14 days, meaning logging works but usage has been low recently. The quota exhaustion was likely from rapid manual testing/development.
- Auto-fill config shows `enabled: true` with `batch_size: 10` and daily limit of only `max_requests: 5`, which is extremely low.
- All three Gemini API keys are configured: `GEMINI_API_KEY`, `EXTERNAL_JOBS_GEMINI_KEY`, and `LOVABLE_API_KEY`.

---

## Implementation Plan (5 Parts)

### Part 1: Create Shared Quota Manager Utility

**New file:** `supabase/functions/_shared/quotaManager.ts`

A shared module imported by all edge functions that provides:

- **`checkQuota(supabaseClient)`** -- Queries `ai_usage_logs` for today's request count, compares against a 1400-request safety limit (100-request buffer below the 1500 free tier). Throws an error if exhausted, logs a warning below 50 remaining.
- **`getHoursUntilReset()`** -- Calculates hours until midnight UTC.
- **`retryWithBackoff(fn, maxRetries, operation)`** -- Wraps any async function with exponential backoff (5s, 15s, 45s delays) specifically for 429/quota errors. Non-quota errors are thrown immediately.

This utility does NOT make any Gemini calls itself -- it only reads from the database and provides retry logic.

---

### Part 2: Update All Edge Functions with Quota Checks

Each function will import from the shared utility and add guards:

**Functions to update:**

| Function | Changes |
|----------|---------|
| `scheduled-autofill` | Add quota check at start + "already ran today" guard + reduce nightly cap from 50 to 30 |
| `fetch-external-jobs` | Add quota check at start + wrap Gemini call with retryWithBackoff |
| `generate-test` | Add quota check before AI generation (NOT for cache-only requests) + request logging + wrap Gemini calls with retryWithBackoff |
| `generate-from-rag` | Add quota check at start + wrap Gemini call with retryWithBackoff |
| `process-book` | Add quota check at start (before embedding generation) + wrap embedding calls with retryWithBackoff |

**Important nuances:**
- `generate-test` should NOT block cache-only responses -- quota check only triggers when AI generation is needed
- `process-book` needs the quota check before the embedding batch loop (each chunk = 1 API call)
- `scheduled-autofill` gets an extra guard: skip if any `auto_fill` log exists for today

---

### Part 3: Fix scheduled-autofill Safety

**File:** `supabase/functions/scheduled-autofill/index.ts`

Changes:
1. Import and call `checkQuota()` at the start
2. Add "already ran today" check -- query `ai_usage_logs` for `source_type = 'auto_fill'` entries created today. If found, skip with a JSON response `{ skipped: true, reason: 'Already ran today' }`
3. Reduce `HARD_NIGHTLY_LIMIT` from 50 to 30
4. Add detailed startup logging: timestamp, remaining quota, topics count
5. Wrap the internal `fetch()` call to `generate-test`/`generate-from-rag` with `retryWithBackoff`

---

### Part 4: Fix fetch-external-jobs Safety

**File:** `supabase/functions/fetch-external-jobs/index.ts`

Changes:
1. Import and call `checkQuota()` at the start
2. Wrap the `callGeminiWithFallback` call with `retryWithBackoff`
3. Reduce results from 5-10 to max 5 items per call (reduce the prompt to request "exactly 5")
4. Add request logging at the start (timestamp, user-agent, referer)

**Note:** This function does NOT need admin-only auth enforcement because it already returns `200` status with error payloads and requires the `EXTERNAL_JOBS_GEMINI_KEY` secret. Adding auth would break the existing manual trigger from the admin UI.

---

### Part 5: Add Quota Monitor to Admin Dashboard

**New file:** `src/components/admin/QuotaMonitor.tsx`

A dedicated component showing:
- Daily quota usage as a progress bar (X / 1400)
- Remaining requests count
- Hours until midnight UTC reset
- Color-coded alerts: green (below 70%), yellow (70-90%), red (above 90%)
- Today's breakdown by `source_type` from `ai_usage_logs` (auto_fill, admin_bulk_generator, rag_search, document_search, etc.)
- A "Block non-critical operations" warning at 95%

**Integration:** This component will be added to the `AutoFillDashboard.tsx` above the existing stats cards, providing a single view of all AI resource consumption.

---

## Files Changed Summary

| File | Action |
|------|--------|
| `supabase/functions/_shared/quotaManager.ts` | Create new |
| `supabase/functions/scheduled-autofill/index.ts` | Edit (add quota check, already-ran guard, reduce cap) |
| `supabase/functions/fetch-external-jobs/index.ts` | Edit (add quota check, retry logic, reduce batch) |
| `supabase/functions/generate-test/index.ts` | Edit (add quota check before AI calls, request logging) |
| `supabase/functions/generate-from-rag/index.ts` | Edit (add quota check, retry logic) |
| `supabase/functions/process-book/index.ts` | Edit (add quota check before embeddings) |
| `src/components/admin/QuotaMonitor.tsx` | Create new |
| `src/components/admin/auto-fill/AutoFillDashboard.tsx` | Edit (integrate QuotaMonitor) |

No database changes needed -- the `ai_usage_logs` table already has the right schema.

---

## What This Does NOT Change

- No cron jobs are set up (pg_cron is not enabled) -- the "deployment count" you see is from Lovable redeploying functions when code changes, NOT from the functions being called repeatedly
- The `external-agent-webhook` function is excluded because it doesn't call any AI APIs
- The `ai-health` function is excluded because it's a simple connectivity check
- The `search-documents` and `rag-search` functions already have auth + rate limiting, but will get the quota check added for safety. Plan approved with minor clarifications:

PART 1-5: Implement exactly as described ✅

ADDITIONAL REQUESTS:

1. In quotaManager.ts, add a function to log quota usage:

   - logQuotaUsage(operation_type, tokens_used, metadata)

   - This should INSERT into ai_usage_logs automatically

   - All edge functions should call this AFTER successful API calls

2. In QuotaMonitor.tsx:

   - Add a "Refresh" button to manually update stats

   - Add "Test Quota Check" button that calls ai-health endpoint

   - Show last refresh timestamp

3. In generate-test/index.ts:

   - The request logging should include the topic_id and difficulty

   - This will help identify if any specific topics are causing loops

4. Add error notifications:

   - When quota check fails, return a user-friendly error:

     "Daily AI quota exhausted. Service will resume at midnight UTC (X hours)."

   - Include this in all edge function error responses

DEPLOYMENT ORDER:

1. Create quotaManager.ts first

2. Update all edge functions (test each one)

3. Create QuotaMonitor.tsx

4. Integrate into AutoFillDashboard

Please implement in this order and show me the code for quotaManager.ts first.

