

# Plan: AI Provider Auto-Switcher (Gemini → Lovable Fallback)

## Problem
When Gemini free-tier quota (1,500 req/day) is exhausted, all AI functions fail with 429 errors. System is completely down until midnight UTC reset.

## Solution
Add `callAIWithAutoSwitch` to the shared helper that tries Gemini first (free), then automatically falls back to Lovable AI Gateway (paid) on 429 errors. Resets Gemini availability at midnight UTC.

## Files to Change

| Action | File |
|--------|------|
| Modify | `supabase/functions/_shared/gemini.ts` |
| Modify | `supabase/functions/generate-test/index.ts` |
| Modify | `supabase/functions/generate-from-rag/index.ts` |
| Modify | `supabase/functions/convert-document-mcqs/index.ts` |
| Modify | `supabase/functions/fetch-external-jobs/index.ts` |
| Modify | `supabase/functions/process-book/index.ts` |
| Modify | `supabase/functions/process-pdf-queue/index.ts` |
| Modify | `supabase/functions/analyze-pdf-metadata/index.ts` |
| Migrate | `ai_usage_logs` table (add `ai_provider` + `cost_estimate` columns) |

## Implementation Details

### 1. `_shared/gemini.ts` — Add `callAIWithAutoSwitch` + `callVisionWithAutoSwitch`

New exported functions that:
- Maintain in-memory provider status (`gemini.available`, `lovable.available`)
- Call `checkDailyReset()` before each request to re-enable Gemini on new UTC day
- Apply 4-second rate-limit delay before Gemini calls
- On Gemini 429/quota errors: mark unavailable, fall through to Lovable Gateway
- Lovable Gateway uses OpenAI-compatible format (`/v1/chat/completions` with `google/gemini-2.5-flash`)
- Return `{ text, provider, cost }` tuple for logging
- Vision variant calls Gemini Vision directly, falls back to Lovable for text-only if OCR fails

### 2. Update each edge function

**Pattern for text-generation functions** (`generate-test`, `generate-from-rag`, `fetch-external-jobs`, `analyze-pdf-metadata`, `convert-document-mcqs`):
- Replace `callGeminiText(apiKey, ...)` → `callAIWithAutoSwitch(systemPrompt, userPrompt, config)`
- Remove manual `GEMINI_API_KEY` env reads (handled inside the auto-switcher)
- Log `provider` in `ai_usage_logs` inserts

**Pattern for vision/OCR functions** (`process-book`, `process-pdf-queue`, `convert-document-mcqs` OCR path):
- These use inline PDF data and can't go through Lovable Gateway's chat API
- Keep direct Gemini Vision calls but add the fallback Gemini key (`EXTERNAL_JOBS_GEMINI_KEY`) cycling that already exists
- No Lovable fallback for vision (Gateway doesn't support inline PDF)

**Special: `convert-document-mcqs`** already has `generateWithAdaptiveFallback` with dual-key cycling — will add Lovable Gateway as a final fallback after all Gemini keys are exhausted.

**Special: `scheduled-autofill`** doesn't call Gemini directly (it calls `generate-test`/`generate-from-rag` via HTTP). No AI call changes needed.

### 3. Database migration

```sql
ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS ai_provider TEXT;
ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS cost_estimate NUMERIC DEFAULT 0;
```

### 4. Environment

`LOVABLE_API_KEY` already exists in secrets. `GEMINI_API_KEY` already exists. No new secrets needed.

### 5. Deploy all 7 updated edge functions

