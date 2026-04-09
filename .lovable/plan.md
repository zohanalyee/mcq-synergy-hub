

# Fix Plan: 4 Critical Test Engine Flaws

## Fix 1: Syllabus Percentage Math + Strict Limits

**File**: `src/services/testGenerationService.ts`

**Problem**: When a job test has syllabus with percentages (e.g., English 40%, Math 10%), the engine ignores these weights and just dumps all subjects into one flat query. Also, after fallback cascading, no final `.slice()` enforces the exact count.

**Changes**:
- Add `syllabusWeights` as an optional field on `TestGenerationOptions`: `syllabusWeights?: Record<string, number>`
- When `syllabusWeights` is provided, calculate per-subject quotas (e.g., 20 questions × 0.40 = 8 English). Fetch each subject separately with its exact quota. Merge results.
- Add a final hard `selectedQuestions = selectedQuestions.slice(0, options.questionCount)` after ALL selection logic (line ~163) as an absolute safety net.

**File**: `src/components/mock-tests/JobTestsTab.tsx`
- Parse `test.syllabus` array (which has `{ topic, percentage }`) into a `syllabusWeights` map and pass it into `TestGenerationOptions`.

## Fix 2: Anti-Repetition (Exclude Previously Answered Questions)

**File**: `src/services/testGenerationService.ts`

**Problem**: Users get the same questions repeatedly. No mechanism excludes previously answered questions.

**Changes**:
- Add `excludeQuestionIds?: string[]` to `TestGenerationOptions`.
- Before calling `generateCustomTest`, query `custom_test_sessions` for this user's past sessions, extract all question IDs from the `questions` JSONB column, and pass them as `excludeQuestionIds`.
- In `getQuestionBank` (`questionBankService.ts`), when `excludeIds` filter is provided, append `.not('id', 'in', `(${ids})`)` to the Supabase query. This naturally causes a "cache miss" when fresh DB questions run out, triggering the AI deficit fill.

**Files**: `src/services/questionBankService.ts` (add `excludeIds` filter), `src/components/mock-tests/JobTestsTab.tsx` and `SubjectTestsTab.tsx` (fetch user's past question IDs before generating).

## Fix 3: Fix Difficulty Dropdown in CustomizeTestDialog

**File**: `src/components/mock-tests/CustomizeTestDialog.tsx`

**Problem**: The Shadcn `<Select>` inside a `<Dialog>` has pointer-event conflicts causing the dropdown to appear stuck/unresponsive.

**Fix**: Replace the Shadcn `<Select>` with a native HTML `<select>` element styled with Tailwind, identical to the fix already applied in `ManualOpportunityCreator.tsx`. The `onChange` handler updates state via `setSettings(prev => ({ ...prev, difficulty: e.target.value }))`. This eliminates the Dialog overlay z-index/pointer-event conflict entirely.

## Fix 4: Pakistani Examiner AI Prompt Enhancement

**File**: `supabase/functions/generate-test/index.ts`

**Problem**: The existing prompt (lines 407-491) is already decent but can be tightened. The user wants a more direct, stricter tone matching FPSC/PPSC/STS exam style — shorter questions, no verbose western scenarios.

**Changes** (to the system prompt around line 407):
- Add opening line: "You are a strict examiner for Pakistani competitive exams (PPSC, FPSC, NTS, STS, SPSC, IBA Sukkur)."
- Add explicit instruction: "Generate SHORT, DIRECT, FACTUAL questions. Maximum 2 lines per question. For MS Office: ask specific shortcut keys, ribbon tab locations, formula syntax. For English: direct synonym/antonym, preposition fill-in-blank, sentence correction. Do NOT use long verbose western-style scenarios or paragraphs."
- Add: "Keep strictly to the syllabus topic provided. Do not drift to unrelated subjects."
- Redeploy the edge function after changes.

## Files to Modify

| Action | File |
|--------|------|
| Modify | `src/services/testGenerationService.ts` — syllabus weights, excludeIds, final slice |
| Modify | `src/services/questionBankService.ts` — add excludeIds filter |
| Modify | `src/components/mock-tests/JobTestsTab.tsx` — pass syllabus weights + user's past question IDs |
| Modify | `src/components/mock-tests/SubjectTestsTab.tsx` — pass user's past question IDs |
| Modify | `src/components/mock-tests/CustomizeTestDialog.tsx` — replace Shadcn Select with native select |
| Modify | `supabase/functions/generate-test/index.ts` — stricter Pakistani exam prompt |
| Deploy | `generate-test` edge function |

