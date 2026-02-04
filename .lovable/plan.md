
# Implementation Plan: Remaining Pending Work

## Overview
Complete the pending features to enable the full RAG-to-MCQ caching strategy while ensuring cost safety and scalability.

---

## Task 1: Syllabus Builder Fallback Order (Priority: HIGH)

### Current State
- Syllabus Builder UI works for topic selection
- Quiz generation is completely disabled (line 352-357 in SyllabusBuilder.tsx)
- `testGenerationService.ts` only queries DB, no fallback logic

### Changes Required

**File: `src/components/syllabus-builder/SyllabusBuilder.tsx`**
- Re-enable `handleGenerateQuiz()` function
- Add DB-first logic: query `content_items` for selected topics
- If insufficient questions → show option to generate from RAG (admin-only)
- If user is not admin → show "Not enough questions, please try different topics"

**File: `src/services/testGenerationService.ts`**
- Add `generateWithFallback()` function that:
  1. Query DB for existing MCQs matching topics
  2. If `questions.length >= requestedCount` → return from DB
  3. If insufficient AND user is admin → offer RAG generation
  4. For regular users → throw user-friendly error

**New File: `src/services/syllabusRAGFallback.ts`**
- `checkRAGAvailability(topicIds: string[])` - check if documents exist for topics
- `generateFromRAGForSyllabus(topicIds: string[], count: number)` - call generate-from-rag for each topic
- Save all generated MCQs to DB before returning

### Flow Diagram
```text
User clicks "Generate Test"
         │
         ▼
┌────────────────────────┐
│ Query content_items    │
│ for selected topics    │
└──────────┬─────────────┘
           │
           ▼
     ┌─────────────┐
     │ Enough MCQs?│
     └─────┬───────┘
       Yes │    │ No
           │    │
           ▼    ▼
┌──────────────┐ ┌─────────────────────┐
│ Return from  │ │ Is user admin?      │
│ DB (instant) │ └────────┬────────────┘
└──────────────┘      Yes │    │ No
                          │    │
                          ▼    ▼
           ┌──────────────────┐ ┌─────────────────────┐
           │ Offer RAG option │ │ Show "Not enough    │
           │ → Generate → DB  │ │ questions" message  │
           └──────────────────┘ └─────────────────────┘
```

---

## Task 2: Auto-Fill Safe Re-enable (Priority: MEDIUM)

### Current State
- `AutoFillDashboard.tsx` UI exists with enable/disable toggle
- `scheduled-autofill` Edge Function exists but never triggered
- `generateForTopic()` in `autoFillService.ts` is hardcoded to return failure

### Changes Required

**File: `src/services/autoFillService.ts`**
- Re-enable `generateForTopic()` function
- Add hard limits:
  - Max 5 questions per topic per call (override any batch_size > 5)
  - Check daily quota before proceeding
- Add priority order:
  1. Check if topic has RAG documents → use generate-from-rag
  2. If no documents → use generate-test (Gemini direct)

**File: `supabase/functions/scheduled-autofill/index.ts`**
- Add hard batch size cap: `Math.min(batchSize, 5)`
- Add daily run limit: max 50 questions per night
- Add RAG-first priority check before calling generate-test

**File: `src/components/admin/auto-fill/AutoFillSettings.tsx`**
- Add UI warning: "Max 5 questions per batch for safety"
- Add daily generation counter display
- Add manual trigger button for testing

### Safety Constraints
| Setting | Value | Reason |
|---------|-------|--------|
| Batch size | Max 5 | Prevent quota exhaustion |
| Daily limit | 50 questions | Hard cap for nightly cron |
| Priority | RAG-first | Leverage uploaded documents |
| Fallback | Gemini | Only when no documents exist |

---

## Task 3: Jobs & Scholarships Strategy Change (Priority: LOW)

### Current State
- `fetch-external-jobs` uses Gemini to generate fake/mock opportunities
- No webhook endpoint for external agents
- External Opportunities curation workflow exists (pending/approved/rejected)

### Changes Required

**New File: `supabase/functions/external-agent-webhook/index.ts`**
- Accept POST requests with opportunities data
- Validate payload schema matches `external_opportunities` table
- Insert with `status: 'pending'` for admin review
- Return success/failure count
- Require API key in header for security

**File: `supabase/config.toml`**
- Add function config for `external-agent-webhook`
- Set `verify_jwt = false` (uses API key instead)

**File: `src/pages/admin/ExternalCuration.tsx`**
- Add info banner: "Opportunities are synced from external agents"
- Remove "Sync with AI" button (or mark as deprecated)
- Keep manual entry option

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
