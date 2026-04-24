

# Plan — Fix `generate-job-test` Returning Zero Questions

## Root cause

The edge function appears to fail silently (Generated: 0, API calls: 0). Two likely causes, both addressed below:

1. **No visibility** into what's failing — current code swallows errors into a generic `gemini_error` rejection counter with no console output.
2. **Possible API key mismatch** — `generate-job-test` reads `GEMINI_API_KEY`, `EXTERNAL_JOBS_GEMINI_KEY`, `LOVABLE_API_KEY`. All three are confirmed present in secrets, so a missing key is unlikely — but we'll log to confirm.

A third subtle cause that the user's debug plan does **not** catch: when `responseMimeType: "application/json"` is set and the model returns a JSON object (not array), `parseQuestions` returns `[]` because it only looks for `[ ... ]`. We'll harden the parser too.

## Changes — `supabase/functions/generate-job-test/index.ts`

### 1. `getGeminiKeys()` — add diagnostic logging
Log which of the three env vars are present (length only, never the value), and emit a `CRITICAL` error if zero valid keys are found.

### 2. `callGemini()` — log every attempt
- Log how many keys are available.
- For each key: log attempt index, HTTP status, error body (truncated 200 chars), success char count.
- Surface `prompt feedback` blocks (e.g. safety-filter rejections) which currently get silently dropped as "Empty Gemini response".
- Throw a clearly-typed `API key` error when no keys are configured so the batch loop can short-circuit.

### 3. `parseQuestions()` — harden
Currently only extracts content between `[` and `]`. Update to also handle:
- A top-level JSON object containing `{ "questions": [...] }` or `{ "data": [...] }`.
- A bare object (single question) → wrap in array.
- Log a warning + first 200 chars of raw text when parsing yields zero items, so we can see what the model actually returned.

### 4. `generateForSection()` — verbose telemetry
- Banner log at start (subject, target, sample count, forbidden-rule count).
- Per-batch log: requested count, API success/failure, parsed count, accepted count, rejection breakdown.
- On `API key` errors, break out of the batch loop immediately (no point retrying).
- Final summary log: status, generated, accepted, api_calls, elapsed seconds, rejection reasons.

### 5. Top-level `Deno.serve` handler
Log the incoming `job_test_id` + `subject`, the resolved definition's section count, and the final aggregate (`total_accepted`, per-section results) so a single log view tells the whole story.

## What this does NOT change

- No schema changes.
- No change to validator/forbidden-keyword logic (already conservative).
- No change to `MAX_BATCHES`, `BATCH_SIZE`, `DAILY_LOG_CAP`.
- No change to the front-end or admin UI.

## Verification steps after deploy

1. Trigger generation from `JobTestDefinitionEditor` → "Generate" for one subject.
2. Open Supabase → Edge Functions → `generate-job-test` → Logs.
3. Expect to see, in order:
   - `[DEBUG] Checking API keys` with at least one `Found (length: N)`.
   - `[GENERATE] Starting generation for: <subject>`.
   - `[BATCH 1/3] Requesting N questions...` → `Gemini response status: 200` → `✅ Gemini returned X characters`.
   - Final `[COMPLETE]` block with `accepted > 0`.
4. If status ≠ 200 or `accepted = 0`, the logs now show exactly why (HTTP error body, parse failure with raw sample, or forbidden-rule match).

## Technical notes

- Logs use `console.log` / `console.error` — visible in Supabase Edge Function logs and via `supabase--edge_function_logs`.
- No secret values are ever logged, only their presence and length.
- Backward compatible: response shape and DB writes unchanged.

