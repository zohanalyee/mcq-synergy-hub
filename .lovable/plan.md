# Plan — Fix `generate-job-test` by Aligning It With `generate-test`

## Side-by-side comparison (actual code)

| Feature | `generate-test` ✅ | `generate-job-test` ❌ |
|---|---|---|
| AI call path | `_shared/gemini.ts` → `callAIWithAutoSwitch` | Local `callGemini` (direct Gemini only) |
| Keys used | `GEMINI_API_KEY` only, then **Lovable Gateway** (`LOVABLE_API_KEY`) as fallback | `GEMINI_API_KEY`, `EXTERNAL_JOBS_GEMINI_KEY`, **and `LOVABLE_API_KEY`** all sent as Google `?key=` params |
| Rate limiter | Yes — 4s gap between Gemini calls (`waitForRateLimit`) | None (3 batches back-to-back, only 2s sleep) |
| Daily quota reset | Yes (UTC) | None |
| Quota-error detection | Yes → switches to Lovable Gateway | No fallback at all |
| Model | `gemini-2.0-flash` (auto-switch can promote to `google/gemini-2.5-flash` via gateway) | `gemini-2.0-flash` only |
| `responseMimeType` | not forced | `"application/json"` (stricter, more empty/`finishReason=OTHER` responses) |
| `maxOutputTokens` | 8000 | 4096 |
| Prompt size | small per topic | larger (syllabus + samples + forbidden + style) |

## Root cause

`getGeminiKeys()` includes `LOVABLE_API_KEY` and pushes it into a Google endpoint as `?key=<LOVABLE_API_KEY>`. Google rejects it (401/403). When `GEMINI_API_KEY` itself is briefly throttled, every "fallback" attempt is a guaranteed auth failure — so the loop burns its 3 batches, returns 0 accepted, and the log shows "No questions accepted after retries / API key exhausted." Meanwhile `generate-test` never has this problem because it uses the shared auto-switcher which sends `LOVABLE_API_KEY` to the **Lovable Gateway**, not to Google.

Secondary contributors:
1. `responseMimeType: application/json` + larger prompt → occasional empty responses (finishReason=MAX_TOKENS / OTHER) counted as `gemini_error`.
2. No rate-limit gap → the 2nd/3rd batch can hit a 429 that the function has no way to recover from.
3. Lower `maxOutputTokens` (4096) truncates batches of 10 detailed MCQs.

## The fix (one file: `supabase/functions/generate-job-test/index.ts`)

1. **Replace local `callGemini` with the shared auto-switcher.**
   - Import `callAIWithAutoSwitch` from `../_shared/gemini.ts`.
   - Delete `getGeminiKeys()` and the manual `fetch` to `generativelanguage.googleapis.com`.
   - New `callGemini(prompt)` becomes a thin wrapper:
     ```ts
     const { text, provider, cost } = await callAIWithAutoSwitch(
       '', prompt, { temperature: 0.8, maxOutputTokens: 8000 }
     );
     console.log(`[AI] provider=${provider} cost=${cost} chars=${text.length}`);
     return text;
     ```
   - This automatically gives job-test the same Gemini → Lovable Gateway fallback, the 4s rate gap, and the daily UTC reset that `generate-test` already enjoys.

2. **Drop `responseMimeType: "application/json"`.** The shared helper doesn't force it, and `parseQuestions()` already strips ```` ``` ```` fences and tolerates object/array wrappers. Removing the strict mime cuts most empty-response failures.

3. **Bump `maxOutputTokens` to 8000** to match `generate-test` and prevent truncation when a batch of 10 detailed MCQs runs long.

4. **Keep everything else** (`MAX_BATCHES=3`, `BATCH_SIZE=10`, forbidden filter, insert into `job_test_questions`, telemetry into `job_test_generation_logs`). No DB changes.

5. **Improve a couple of log lines** so future failures are obvious:
   - On AI error inside `generateForSection`, log `provider` if the helper returned one and tag rejection as `ai_quota` vs `ai_error` so the dashboard shows the real cause instead of the generic `gemini_error`.

## What this fixes

- ✅ No more bogus `LOVABLE_API_KEY` → Google calls (the actual cause of "API key exhausted / 401").
- ✅ Real fallback to Lovable Gateway (paid backup) when Gemini is throttled — same behavior as Subject Tests today.
- ✅ Proper rate spacing (4s) prevents self-inflicted 429s across the 3 batches.
- ✅ Bigger token budget + relaxed mime → more parseable responses, fewer empty/`gemini_error` rejections.
- ✅ Single source of truth: both functions now go through `_shared/gemini.ts`, so any future provider/model change applies uniformly.

## Verification (after switch back to default mode)

1. Deploy `generate-job-test`.
2. Trigger generation for one job test, one subject (e.g. "English") with `question_count: 5` for a fast smoke test.
3. Check Edge Function logs — expect:
   - `[AI-Switch] Attempting Gemini (free tier)...` and `✅ Gemini success` (or `🔄 Using Lovable AI Gateway` if Gemini quota is dry).
   - `[BATCH 1] ✅ API call OK (NNNN chars)` and `Parsed N questions`.
   - `[INSERT] ✅ Inserted N questions`.
   - `[COMPLETE] English status=success`.
4. Confirm rows in `job_test_questions` (admin_approved=false) and a corresponding `success` row in `job_test_generation_logs`.
5. Re-run for full syllabus; confirm `total_accepted > 0` for every section.

## Files touched

- `supabase/functions/generate-job-test/index.ts` — only file edited.
- No DB migrations, no secret changes, no frontend changes.
