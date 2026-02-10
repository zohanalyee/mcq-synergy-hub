

# Fix: Switch AI Functions to Lovable AI Gateway

## Root Cause

The error is NOT a model availability issue. Your **Gemini API free tier is completely exhausted** -- the logs show `limit: 0` for all models. Every direct Gemini API call returns 429 regardless of which model is used. Changing model names will never fix this.

## Solution

Switch all three AI generation edge functions from direct Gemini API calls (using `GEMINI_API_KEY`) to the **Lovable AI Gateway** (using `LOVABLE_API_KEY`), which has its own separate quota. The gateway is OpenAI-compatible and already configured.

The embedding functions (`process-book`, `search-documents`, `rag-search`) will remain on direct Gemini since they use the embedding API which is different from the chat completions API.

---

## Changes

### 1. Update `generate-from-rag/index.ts`

Replace `callGeminiWithFallback` with a call to `https://ai.gateway.lovable.dev/v1/chat/completions`:

- Use `LOVABLE_API_KEY` instead of `GEMINI_API_KEY`
- Send messages in OpenAI format: `[{role: "system", content: systemPrompt}, {role: "user", content: userPrompt}]`
- Use model `google/gemini-2.5-flash` (default recommended model)
- Keep `retryWithBackoff` wrapper
- Handle 429 and 402 errors from the gateway with user-friendly messages
- Remove the `GEMINI_MODELS` array and `callGeminiWithFallback` function entirely

### 2. Update `generate-test/index.ts`

Same pattern -- replace `callGeminiWithFallback` with Lovable AI Gateway call:

- Use `LOVABLE_API_KEY`
- Model: `google/gemini-2.5-flash`
- Keep the existing prompt structure but format as chat messages
- Handle 429/402 gateway errors

### 3. Update `fetch-external-jobs/index.ts`

Same pattern:

- Switch from `EXTERNAL_JOBS_GEMINI_KEY` to `LOVABLE_API_KEY`
- Use Lovable AI Gateway endpoint
- Model: `google/gemini-2.5-flash`

### 4. Improve Frontend Error Handling in `SyllabusBuilder.tsx`

In the `handleGenerateQuiz` function, parse error responses from `generateFromRAGForSyllabus` and show specific messages:

- If error contains "quota": Show "Daily quota reached. Try again later."
- If error contains "no_rag_data" or "No RAG documents": Show "No study material found. Upload PDFs first."
- Default: Show the raw error message

---

## Technical Details

**Lovable AI Gateway call pattern:**
```text
POST https://ai.gateway.lovable.dev/v1/chat/completions
Authorization: Bearer {LOVABLE_API_KEY}
Content-Type: application/json

{
  "model": "google/gemini-2.5-flash",
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "..."}
  ],
  "temperature": 0.7,
  "max_tokens": 8192
}
```

**Response format:**
```text
{
  "choices": [{
    "message": {"content": "...the generated text..."}
  }]
}
```

**Files to edit:**

| File | Change |
|------|--------|
| `supabase/functions/generate-from-rag/index.ts` | Switch to Lovable AI Gateway |
| `supabase/functions/generate-test/index.ts` | Switch to Lovable AI Gateway |
| `supabase/functions/fetch-external-jobs/index.ts` | Switch to Lovable AI Gateway |
| `src/components/syllabus-builder/SyllabusBuilder.tsx` | Better error messages based on error type |

**What stays unchanged:**
- `process-book/index.ts` -- uses embedding API, not chat completions
- `search-documents/index.ts` -- uses embedding API
- `rag-search/index.ts` -- uses embedding API
- `quotaManager.ts` -- no changes needed
- `QuotaMonitor.tsx` -- no changes needed
Perfect analysis! The Gemini free tier is exhausted (limit: 0), so switching to Lovable AI Gateway is the right solution.

Plan approved. Please implement all changes:

1. ✅ Update generate-from-rag/index.ts
   - Switch to Lovable AI Gateway
   - Use LOVABLE_API_KEY
   - Model: google/gemini-2.5-flash
   - OpenAI format messages

2. ✅ Update generate-test/index.ts
   - Same switch to gateway
   - Keep existing prompt logic
   - Better error handling

3. ✅ Update fetch-external-jobs/index.ts
   - Switch from EXTERNAL_JOBS_GEMINI_KEY to LOVABLE_API_KEY
   - Use gateway endpoint

4. ✅ Improve SyllabusBuilder.tsx error messages
   - Parse error types
   - Show user-friendly messages

IMPORTANT NOTES:
- Keep embeddings functions unchanged (they use different API)
- Maintain retryWithBackoff wrapper
- Handle 429 and 402 gateway errors gracefully
- Test thoroughly after deployment

Please implement and deploy all changes now.
