User reports a critical bug: when generating Junior Clerk test, "Computer (MS Office)" subject yields Science questions, "General Knowledge" yields Science questions. Need topic-specific prompt guidance + post-generation validation to reject off-topic questions, plus a cleanup tool for already-corrupted DB rows.

Let me explore actual edge function structure to plan precisely.

I need to verify:

1. Where `parseAIResponse` / `validateMCQ` / `buildPakistaniExamPrompt` live in `generate-test/index.ts`
2. Whether `getSubjectGuidance` already exists (memory mentions topic-specific behavior)
3. Whether `CorruptedDataCleaner.tsx` exists
4. The exact subject string passed from JobTestsTab — confirmed: `item.subject` = "Computer (MS Office)", "General Knowledge (Pakistan & Current Affairs)" etc. (visible in AI Usage Logs screenshot)

Also user notes: "junior clerk test functions is not generating through edge function" — second concern: cache may be returning bad cached questions and never calling the edge function. AI Usage Logs screenshot confirms: every recent row says **"Cache Hit"** with **0 fetched / 0 saved**. So validation in the edge function alone won't help — corrupted cached rows are being served. Cleanup is mandatory.

Plan:

# Topic Mismatch Hotfix — Edge Function Validation + DB Cleanup

## Root cause (confirmed)

1. **No subject-specific guidance** in the Gemini prompt → AI hallucinates Science when asked for "Computer (MS Office)" or "General Knowledge".
2. **No post-generation topic validation** → bad questions saved + force-tagged with the wrong subject.
3. **Cache is poisoned** — AI Usage Logs show every recent request as "Cache Hit / 0 fetched / 0 saved". The edge function is serving previously-stored bad rows from `content_items`. Fixing the prompt alone won't help existing users until cache is cleaned.

## Scope

1. **Edge fn** `supabase/functions/generate-test/index.ts`
  - Add `getSubjectGuidance(topic)` returning per-subject CRITICAL/FORBIDDEN blocks for: Computer (MS Office), English, Mathematics, General Knowledge.
  - Prepend output to the existing prompt builder.
  - Add `validateQuestionTopic(question, topic)` with science / hardware / programming keyword denylists per subject family.
  - Apply filter in `parseAIResponse` right after `validateMCQ`.
  - Log rejection counter: `⚠️ Rejected N/M for topic mismatch`.
  - **Also gate the cache lookup**: when reading `content_items` for "Computer*" / "General Knowledge*" topics, run the same `validateQuestionTopic` over cached rows; drop and treat as cache-miss if they fail. This is the only way "Cache Hit"-flow rows get unstuck without a separate cleanup pass.
2. **Cleanup utility** `src/components/admin/CorruptedDataCleaner.tsx`
  - If file exists → extend with topic-mismatch detector for Computer/GK + science keywords.
  - If file doesn't exist → create a minimal admin-only page mounted under `/admin/cleanup` that:
    - Queries `content_items` where category='mcq' AND subject ILIKE '%computer%' or '%general knowledge%'.
    - Flags rows whose question text contains science/hardware terms not matching the subject.
    - Shows count + sample + "Delete N flagged" button (uses existing `is_admin()` policy).
3. **Post-fix verification path**
  - User runs cleanup once → next Junior Clerk test triggers genuine generation (cache miss) → new validated questions populate cache cleanly.

## Files


| File                                            | Action                                                                                                          |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `supabase/functions/generate-test/index.ts`     | MODIFY — add `getSubjectGuidance`, `validateQuestionTopic`, prompt prepend, cache-row filter, rejection logging |
| `src/components/admin/CorruptedDataCleaner.tsx` | EXTEND or CREATE — topic-mismatch filter + bulk delete                                                          |
| `src/App.tsx` (only if cleaner page is new)     | ADD `/admin/cleanup` route behind admin guard                                                                   |


## Validation rules (final keyword sets)

- **Computer (MS Office)** — REJECT if question contains: `gas, liquid, solid, particles, matter, molecular, amorphous, crystalline, atom, molecule`. REJECT if `cpu, ram, processor, motherboard, circuit, transistor` AND no MS-Office keyword (`word, excel, powerpoint, outlook, spreadsheet, formula, slide, cell reference, mail merge, pivot, vlookup, sum(`).
- **General Knowledge** — REJECT science keywords above when question lacks GK markers (`pakistan, capital, founded, prime minister, president, river, mountain, year, war, treaty`).
- **English / Mathematics** — pass-through (no false-positive risk reported).

## Risks & mitigations

- **False rejections on legitimate "computer hardware basics" tests** → only triggered when subject string contains "MS Office" OR is exactly "Computer"; broader CS subjects unaffected.
- **Cache-row filtering might empty the cache** → expected and desirable; triggers fresh generation (which is now safer).
- **Rate limit spike from re-generation** → existing fill-the-gap + auto-switcher handles it; no new cost path.

## Out of scope

- Rewriting the entire prompt architecture
- Per-question manual review UI
- Adding new subject taxonomies
- Phase 4 of AI Coach 
  ## **ONE ENHANCEMENT SUGGESTION:**
  ### **Add Regeneration Counter to Prevent Infinite Loops**
  **Problem:**
  ```
  Current flow:
  1. AI generates 8 questions for "Computer"
  2. All 8 fail validation (Science topics)
  3. System has 0 valid questions
  4. What happens next?
     - Does it retry AI generation?
     - Does it return empty?
     - Does it loop forever?
  ```
  **Enhancement:**
  **File:** `supabase/functions/generate-test/index.ts`
  typescript
  ```typescript
  // In generateQuestionsInBatches or main generation loop:

  const MAX_RETRIES = 3;
  let retryCount = 0;
  let validQuestions = [];

  while (validQuestions.length < targetCount && retryCount < MAX_RETRIES) {
    // Generate batch from AI
    const rawQuestions = await callGemini(...);
    
    // Validate MCQ format
    const mcqValid = rawQuestions.filter(q => validateMCQ(q));
    
    // Validate topic match
    const topicValid = mcqValid.filter(q => validateQuestionTopic(q.question, topic));
    
    validQuestions.push(...topicValid);
    
    const rejected = rawQuestions.length - topicValid.length;
    if (rejected > 0) {
      console.warn(`⚠️ Retry ${retryCount + 1}: Rejected ${rejected}/${rawQuestions.length} for topic mismatch`);
      retryCount++;
    } else {
      break; // Success, no need to retry
    }
  }

  if (validQuestions.length === 0 && retryCount >= MAX_RETRIES) {
    console.error(`❌ Failed to generate valid questions after ${MAX_RETRIES} retries`);
    // Return cache-only or throw error
  }
  ```
  **Why this matters:**
  - Prevents infinite loops if AI keeps generating wrong topics
  - Saves API credits (stops after 3 attempts)
  - Clear error messaging for debugging
  - Fallback to cache-only mode