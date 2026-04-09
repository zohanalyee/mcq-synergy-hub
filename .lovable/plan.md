

# Fix Plan: 4 Critical Exam Engine Issues

## Fix 1: Over-fetching + Corrupted Cleaner

**Problem**: After fallback cascading, `availableQuestions` can exceed `questionCount` (e.g., 135 when 100 requested). The corrupted cleaner doesn't catch empty-string options or short titles.

**File**: `src/services/testGenerationService.ts` (after line 127)
- Add Fisher-Yates deep shuffle function replacing `Math.random() - 0.5`
- After all 4 fallback steps (line 127), enforce `availableQuestions = fisherYatesShuffle(availableQuestions).slice(0, options.questionCount * 2)` before selection logic
- Replace the `sort(() => Math.random() - 0.5)` on line 141 with Fisher-Yates

**File**: `src/components/admin/CorruptedDataCleaner.tsx`
- Strengthen filter: also flag items where `!item.title || item.title.trim().length < 5`
- Also flag items where option values are empty strings: `opts.A?.trim() === ''` etc.
- Also flag items with no `correct_option`
- Add a "Scan Again" button using `refetch()`
- Show corruption reason badges per item

## Fix 2: Show Explanations in Test Review

**Problem**: The review section (lines 587-616 in TestSession.tsx) only shows correct/wrong answer text but never displays `question.explanation`.

**File**: `src/pages/TestSession.tsx` (lines 593-614)
- After the "Correct: ..." line (line 609), add an explanation block
- Show `question.explanation` in a styled box with a book icon
- Use distinct styling: blue/info for correct answers, amber for wrong answers to emphasize learning

## Fix 3: Custom Settings Already Work (Minor Shuffle Fix)

The `handleStartJobTest` and `handleStartTest` already correctly pass `customSettings` from the dialog through to `generateCustomTest`. The dialog's `handleDialogStart` passes `{ difficulty, questionCount, duration }` which maps correctly to `settings.questionCount` and `settings.duration`.

**Only fix needed**: The shuffle quality in `testGenerationService.ts` — replace `Math.random() - 0.5` with Fisher-Yates (already covered in Fix 1).

## Fix 4: Syllabus Tracker Sidebar

**Problem**: Users can't see which subject section they're in during a test.

**File**: `src/pages/TestSession.tsx`
- Add a `useMemo` that extracts unique subjects from `questions` array, counts total/attempted per subject, and flags the current question's subject
- In the exam layout (line 459), add a left sidebar `hidden lg:block w-56 border-r` before the main question area
- Sidebar shows: "Syllabus Map" heading, vertical list of subjects with progress bars, active subject highlighted with a colored badge
- On smaller screens, this sidebar is hidden (the existing palette handles mobile)

## Files to Modify

| File | Change |
|------|--------|
| `src/services/testGenerationService.ts` | Fisher-Yates shuffle, enforce slice after fallbacks |
| `src/components/admin/CorruptedDataCleaner.tsx` | Stronger filter (title length, empty strings, correct_option), scan button |
| `src/pages/TestSession.tsx` | Explanation display in review + syllabus sidebar |

