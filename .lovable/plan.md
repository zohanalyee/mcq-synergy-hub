
I reviewed the current flow and I do know what the issue is.

Root cause:
- `src/pages/TestSession.tsx` checks answers using `question.answer` or `question.correct_option`.
- But some test sessions are saved with `correctOption` instead, especially from:
  - `src/components/syllabus-builder/SyllabusBuilder.tsx`
  - `src/services/questionBankService.ts`
- In those sessions, the result page cannot resolve the correct answer text, so:
  - every answer can be marked wrong
  - the `Correct:` line appears empty
- `QuestionCard` stores the user’s selected value as option text, so result checking must always resolve the stored correct key/text into comparable option text first.

Implementation plan:
1. Create one shared answer-normalization path
- Add a small utility for test evaluation logic (either in `src/lib/` or directly reused inside `TestSession.tsx`).
- It will:
  - read correct answer from `answer`, `correct_option`, or `correctOption`
  - resolve `A/B/C/D` keys to option text
  - support options stored as arrays or `{ A, B, C, D }` objects
  - normalize both user answer and correct answer with `trim().toLowerCase()`

2. Fix `TestSession.tsx` to use the shared evaluator everywhere
- Use the same helper for:
  - submit scoring
  - top result counts
  - pass/fail percentage
  - review-answer red/green styling
  - `Correct:` display text
- This removes duplicated comparison logic and prevents the summary and review from disagreeing.

3. Normalize loaded session questions on fetch
- When `custom_test_sessions.questions` is loaded, map each question into one consistent shape before rendering.
- That ensures older sessions and mixed sources still work even if they were saved with different field names.

4. Harden session creation for future tests
- Update session writers so newly saved sessions include a canonical correct-answer field as well:
  - `src/components/syllabus-builder/SyllabusBuilder.tsx`
  - `src/services/questionBankService.ts`
- I’ll keep backward compatibility, but make future sessions less error-prone.

5. Tighten edge-function compatibility without changing the DB-first strategy
- `supabase/functions/generate-test/index.ts` already follows the intended order: DB first, AI second, cache fallback if AI is unavailable.
- I’ll keep that behavior and make the response shape more explicit/consistent so the client can safely evaluate both cached and AI-generated questions.

6. Add temporary targeted debugging for verification
- Keep concise console logs around:
  - raw correct field found
  - resolved correct text
  - selected user answer
  - final match result
- This will help verify the exact format during the next end-to-end test and can be removed once confirmed stable.

Files likely affected:
- `src/pages/TestSession.tsx`
- `src/components/syllabus-builder/SyllabusBuilder.tsx`
- `src/services/questionBankService.ts`
- `supabase/functions/generate-test/index.ts`

No database migration is needed for this fix.
