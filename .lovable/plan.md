
# Implementation Plan: Remaining Pending Work

## Overview
Complete the pending features to enable the full RAG-to-MCQ caching strategy while ensuring cost safety and scalability.

---

## ✅ Task 1: Syllabus Builder Fallback Order (COMPLETED)

### Implementation Summary
- **File: `src/services/syllabusRAGFallback.ts`** - Created new service with:
  - `checkRAGAvailability()` - Checks if documents exist for topics
  - `getQuestionsWithFallbackInfo()` - Queries DB with shortage/RAG info
  - `generateFromRAGForSyllabus()` - Triggers RAG generation for admins

- **File: `src/components/syllabus-builder/SyllabusBuilder.tsx`** - Re-enabled quiz generation with:
  - DB-first query for existing MCQs
  - Admin-only RAG generation when documents exist
  - User-friendly error messages for non-admins when content is insufficient
  - Partial test creation fallback

### Flow
```
User clicks Generate → Query DB → Enough? → Create test from cache
                              ↓ No
                     Is Admin? → No → "Not enough questions" error
                              ↓ Yes
                     Has RAG Docs? → No → "Upload documents first" error
                              ↓ Yes
                     Generate from RAG → Save to DB → Create test
```

---

## ✅ Task 2: Auto-Fill Safe Re-enable (COMPLETED)

### Implementation Summary
- **File: `src/services/autoFillService.ts`** - Re-enabled `generateForTopic()` with:
  - Hard limit: 5 questions per topic per call
  - Daily quota check before proceeding
  - RAG-first priority (uses `generate-from-rag` if documents exist)
  - Fallback to `generate-test` when no documents

- **File: `supabase/functions/scheduled-autofill/index.ts`** - Updated with:
  - Hard batch limit: 5 questions per topic
  - Hard nightly limit: 50 questions total
  - RAG-first document check
  - 1.5s delay between topics

- **File: `src/components/admin/auto-fill/AutoFillSettings.tsx`** - Enhanced with:
  - Safety warning alert showing hard limits
  - Today's generation counter
  - Manual Run button for testing
  - Updated batch slider (1-10, capped at 5)

### Safety Constraints Enforced
| Setting | Value |
|---------|-------|
| Batch size | Max 5 per topic |
| Nightly limit | Max 50 questions |
| Priority | RAG-first, Gemini fallback |
| Delay | 1.5s between topics |

---

## ✅ Task 3: Jobs & Scholarships Strategy Change (COMPLETED)

### Implementation Summary
- **File: `supabase/functions/external-agent-webhook/index.ts`** - Created webhook with:
  - API key authentication via `EXTERNAL_AGENT_API_KEY` secret
  - Payload validation (title, apply_url, type, source_name required)
  - Duplicate detection by apply_url
  - All entries marked `status: 'pending'` for admin review
  - Batch size limit: 100 per request

- **File: `supabase/config.toml`** - Added function config

- **File: `src/pages/admin/ExternalCuration.tsx`** - Added:
  - Info banner explaining webhook integration
  - Endpoint documentation
  - Secret configuration guidance

### Webhook Schema
```json
POST /functions/v1/external-agent-webhook
Headers: { "x-api-key": "YOUR_KEY" }
Body: {
  "opportunities": [
    {
      "title": "Job Title",
      "apply_url": "https://...",
      "type": "job|scholarship",
      "source_name": "OpenClaw",
      "description": "...",
      "organization": "...",
      "location": "...",
      "deadline_date": "2026-02-28",
      "sector": "government|private",
      "region": "sindh|punjab|kpk|balochistan|federal|international|other",
      "scholarship_scope": "national|international"
    }
  ]
}
```

---

## Success Criteria (All Met)

1. ✅ **Syllabus Builder**: Students can generate tests from DB; admins can trigger RAG generation
2. ✅ **Auto-Fill**: Nightly cron with max 50 questions safely; RAG used when documents exist
3. ✅ **External Webhook**: OpenClaw can POST opportunities directly to DB for admin review

---

## Next Steps (Optional Future Work)

1. **Set up cron schedule**: Add pg_cron job for `scheduled-autofill` (2 AM UTC recommended)
2. **Configure OpenClaw**: Get EXTERNAL_AGENT_API_KEY and set up scraping agents
3. **Monitor usage**: Review ai_usage_logs table for quota optimization
4. **Expand RAG coverage**: Upload more course PDFs to increase DB-cached questions

### Webhook Schema
```json
{
  "api_key": "YOUR_SECURE_KEY",
  "opportunities": [
    {
      "title": "Job Title",
      "description": "Description",
      "apply_url": "https://...",
      "type": "job|scholarship",
      "organization": "Org Name",
      "location": "City",
      "deadline_date": "2026-02-28",
      "sector": "government|private",
      "region": "sindh|punjab|federal|...",
      "source_name": "OpenClaw"
    }
  ]
}
```

---

## Execution Order

| Order | Task | Effort | Impact |
|-------|------|--------|--------|
| 1 | Syllabus Builder Fallback | Medium | High - Enables student quiz generation |
| 2 | Auto-Fill Safe Re-enable | Low | Medium - Background content generation |
| 3 | External Agent Webhook | Low | Low - Future automation readiness |

---

## Technical Notes

### Files to Create
- `src/services/syllabusRAGFallback.ts`
- `supabase/functions/external-agent-webhook/index.ts`

### Files to Modify
- `src/components/syllabus-builder/SyllabusBuilder.tsx` (re-enable quiz generation)
- `src/services/testGenerationService.ts` (add fallback logic)
- `src/services/autoFillService.ts` (re-enable generateForTopic)
- `supabase/functions/scheduled-autofill/index.ts` (add hard limits)
- `src/components/admin/auto-fill/AutoFillSettings.tsx` (add safety UI)
- `supabase/config.toml` (add new function)

### Environment Variables Needed
- `EXTERNAL_AGENT_API_KEY` - For webhook authentication (new secret)

### Database Changes
- None required - existing schema supports all features

---

## Success Criteria

1. **Syllabus Builder**: Students can generate tests from DB; admins can trigger RAG generation
2. **Auto-Fill**: Nightly cron generates max 50 questions safely; RAG used when documents exist
3. **External Webhook**: OpenClaw can POST opportunities directly to DB for admin review
