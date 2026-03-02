

# Plan: Switch All Edge Functions from Lovable AI Gateway to Direct Gemini API

## Problem
7 edge functions call `https://ai.gateway.lovable.dev/v1/chat/completions` (paid Lovable credits). Credits are exhausted. Need to switch to direct Gemini API using the existing `GEMINI_API_KEY` secret (already configured).

## Affected Files (7 functions)

| File | Usage Type |
|------|-----------|
| `supabase/functions/_shared/gemini.ts` | **NEW** — shared helper |
| `supabase/functions/generate-test/index.ts` | Text generation (MCQ batches) |
| `supabase/functions/generate-from-rag/index.ts` | Text generation (RAG MCQs) |
| `supabase/functions/convert-document-mcqs/index.ts` | Text generation + OCR fallback |
| `supabase/functions/fetch-external-jobs/index.ts` | Text generation (job parsing) |
| `supabase/functions/process-book/index.ts` | Vision/OCR (PDF processing) |
| `supabase/functions/process-pdf-queue/index.ts` | Vision/OCR (PDF queue) |
| `supabase/functions/analyze-pdf-metadata/index.ts` | Text generation (metadata) |

## Implementation

### Step 1: Create shared Gemini helper
**New file: `supabase/functions/_shared/gemini.ts`**

Two exported functions:
- `callGeminiText(apiKey, systemPrompt, userPrompt, config?)` — for text-only generation. Calls `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent` with API key header, configurable temperature/maxOutputTokens.
- `callGeminiVision(apiKey, prompt, base64Data, mimeType, config?)` — for OCR/vision tasks. Same endpoint but with `inlineData` parts.

Both return the text string from `candidates[0].content.parts[0].text`.

### Step 2: Update each function
For each of the 7 files:
1. Replace `LOVABLE_API_KEY` env var usage with `GEMINI_API_KEY`
2. Replace `fetch("https://ai.gateway.lovable.dev/...")` calls with the shared helper
3. Remove OpenAI-format response parsing (`choices[0].message.content`) — the helper returns text directly
4. Keep existing error handling (429 rate limits, etc.)

### Step 3: Deploy all updated functions

## Technical Details

**Gemini direct API format:**
```text
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
Header: x-goog-api-key: <GEMINI_API_KEY>

Body: {
  contents: [{ role: "user", parts: [{ text: "..." }] }],
  generationConfig: { temperature, maxOutputTokens },
  safetySettings: [{ category: "HARM_CATEGORY_*", threshold: "BLOCK_NONE" }]
}
```

System prompts will be sent as a user→model turn pair (Gemini doesn't have a native system role in the REST API).

**Vision calls** (for OCR in `convert-document-mcqs`, `process-book`, `process-pdf-queue`):
```text
parts: [
  { text: "Extract text..." },
  { inlineData: { mimeType: "application/pdf", data: base64 } }
]
```

**Model choice:** `gemini-2.0-flash` (free tier, fast, good quality). Falls within the 1,500 requests/day free limit.

## Files Changed Summary

| Action | File |
|--------|------|
| Create | `supabase/functions/_shared/gemini.ts` |
| Modify | `supabase/functions/generate-test/index.ts` |
| Modify | `supabase/functions/generate-from-rag/index.ts` |
| Modify | `supabase/functions/convert-document-mcqs/index.ts` |
| Modify | `supabase/functions/fetch-external-jobs/index.ts` |
| Modify | `supabase/functions/process-book/index.ts` |
| Modify | `supabase/functions/process-pdf-queue/index.ts` |
| Modify | `supabase/functions/analyze-pdf-metadata/index.ts` |

No database changes needed. `GEMINI_API_KEY` is already configured in Supabase secrets.

