# Fix recurring "too many requests" (429) on AI generation

## Problem (confirmed from code + data)

The Gemini→Gateway fallback is wired correctly but still surfaces 429s because:

1. **Thundering herd.** The 4s spacer (`lastGeminiCallTime`) and the `providers.gemini.available` flag in `_shared/gemini.ts` are per-isolate in-memory globals. Concurrent invocations (bulk job/scholarship/blog imports) don't coordinate — they all hit Gemini at once, all 429, then all stampede the Lovable Gateway at once, which 429s on its own per-workspace limit.
2. **Gateway leg has no retry.** A single transient Gateway 429/5xx kills the request — there's no backoff around the fallback call.
3. **No observability.** Failed AI calls and which provider failed aren't logged; every exhaustion is mislabeled `ALL_MODELS_FAILED / source:google_gemini`, even when the Gateway was the thing that failed.

## Fix plan (backend only, `supabase/functions/_shared/gemini.ts` + light per-function wiring)

### 1. Add a second Gemini key to the text path (rotation)

`callAIWithAutoSwitch` currently uses only `GEMINI_API_KEY`. Add `EXTERNAL_JOBS_GEMINI_KEY` (already present, used by vision) to the text rotation: try key 1, on 429 try key 2, only then fall to the Gateway. This roughly doubles free-tier RPM headroom before paid credits are touched.

### 2. Add retry/backoff to the Gateway leg

Wrap the `callLovableGateway` call in bounded exponential backoff (e.g. 2 retries: 2s, 6s) for 429/5xx only. 400/402 are terminal and must NOT be retried (402 = credits exhausted → surface immediately). This absorbs transient Gateway rate-limit blips that currently hard-fail.

### 3. Real backoff before declaring exhaustion

When both Gemini keys 429, do one short backoff-and-retry of key 1 (Gemini per-minute limits clear in ~60s) before switching to the Gateway, instead of permanently flipping `providers.gemini.available=false` for the isolate lifetime. Keep the daily-reset logic.

### 4. Distinct, honest error signaling

Return separate error types so the frontend and logs can tell them apart:

- `GEMINI_RATE_LIMIT` (both Gemini keys 429)
- `GATEWAY_RATE_LIMIT` (Gateway 429)
- `CREDITS_EXHAUSTED` (Gateway 402)
- `ALL_PROVIDERS_FAILED` (everything failed)

Stop labeling Gateway failures as `source:google_gemini`.

### 5. Observability for failures

Log every AI attempt outcome to `ai_usage_logs` metadata: `{ provider, key_index, outcome, status }` — including failures — so the next occurrence is diagnosable from the DB instead of guesswork. Currently only successful saves/cache hits are logged.

## Optional follow-up (not in this pass unless you want it)

- **Request queueing / concurrency cap** for bulk imports (`fetch-external-jobs`, `scrape-*`, blog batch) so they serialize AI calls through a small concurrency limit rather than firing all at once. This attacks the herd at the source but is a larger change; items 1-3 already give substantial relief.

## What this does NOT change

- No frontend/UI behavior changes beyond the existing toasts already reading error messages (they'll now get more accurate ones).
- No model swaps; keeps direct-Gemini-first / Gateway-as-paid-backup per project policy.

## Verification

- Deploy and run `generate-test`, `generate-blog`, `fetch-external-jobs` via the edge-function test/curl tool; confirm success and inspect logged `provider`/`outcome`.
- Simulate exhaustion by temporarily forcing key failure to confirm: key1 429 → key2 → Gateway-with-retry → correct distinct error type if all fail.
- Confirm `ai_usage_logs` now records provider + outcome on both success and failure.

&nbsp;

# **Approved — proceed with the fix plan exactly as outlined (items 1-5).** 

Skip the optional queueing follow-up for now — items 1-3 should 

give substantial relief as you noted.

After implementing, please run the verification steps (test 

generate-test, generate-blog, fetch-external-jobs; confirm 

ai_usage_logs records provider + outcome on both success and 

failure) and report back.