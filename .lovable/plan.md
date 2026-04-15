

# Fix: Sequential Generation with Progress Dialog

## Problem
The current architecture has a race condition: session is created BEFORE questions are ready, then relies on unreliable async polling to hydrate it. This causes infinite "Generating Questions..." states.

## Solution: Deterministic Sequential Generation

### Part 1: Rewrite `src/components/mock-tests/JobTestsTab.tsx`
- Replace fire-and-forget background generation with **sequential, awaited** calls to `generate-test` per syllabus subject
- Add a **Progress Dialog** showing per-subject generation status (pending/generating/complete/error) with a progress bar
- Create session ONLY after all questions are collected, with `question_count` set to actual yield
- Add 60-second timeout per subject call via `AbortController`
- On partial failure: continue with other subjects, warn user, proceed with available questions
- On total failure (0 questions): show error toast, abort

Key changes:
- New state: `generationProgress` array tracking per-subject status
- New `GenerationProgressDialog` component (inline in same file) with per-subject rows showing progress bars
- `handleStartJobTest` becomes a sequential `for...of` loop that awaits each edge function call
- Remove `TestGenerationLoader` usage for job tests (replaced by progress dialog)
- Session payload uses `allQuestions.length` for `question_count` (no mismatch possible)

### Part 2: Simplify `src/pages/TestSession.tsx` (data layer only)
**Critical instruction**: Only replace data fetching, state management, and polling logic. Keep ALL existing UI intact (Syllabus Map sidebar, Section badges, QuestionCard, ExamNavBar, results, etc.)

Changes:
- Remove all polling logic (`pollForMoreQuestions`, `pollIntervalRef`, `pollAttemptsRef`, `MAX_POLL_ATTEMPTS`, `isLoadingMore`, `remainingCount`)
- Remove `expectedTotal` state — use `questions.length` directly as the source of truth
- Simplify `fetchTestSession`: load once, no deficit calculation, no polling setup
- `canSubmit` becomes simply `true` (session is always complete when created)
- Remove "Generating Questions..." empty-state screen — if session has 0 questions, show error with back button
- Keep: `displayTotal`, `syllabusMap`, `ExamHeader`, `QuestionCard`, `QuestionPalette`, `ExamNavBar`, results section, `SmartFeedbackCard`, `NeuralFocusPlayer`, all answer/flag/submit/retry handlers, persistence hooks, timer

### Part 3: Update `supabase/functions/generate-test/index.ts`
- No structural changes needed — the function already works correctly for individual subject calls
- Ensure `syncQuestionsToSession` is NOT called during sequential generation flow (session doesn't exist yet at call time)
- The edge function continues to support `session_id` for any legacy flows, but the new JobTestsTab won't pass it

## Files to modify
| File | Scope |
|------|-------|
| `src/components/mock-tests/JobTestsTab.tsx` | Full rewrite of `handleStartJobTest`, add progress dialog |
| `src/pages/TestSession.tsx` | Remove polling, simplify data loading, keep UI |

## Flow diagram
```text
User clicks Start Test
        ↓
JobTestsTab calculates per-subject quotas from syllabus
        ↓
Progress Dialog opens
        ↓
FOR EACH SUBJECT (sequential, awaited):
  → Call generate-test edge function (60s timeout)
  → Success: collect questions, update progress
  → Error: log, mark error, continue
        ↓
Any questions? NO → error toast, abort
              YES → create session with actual count
        ↓
Navigate to /test-session/:id
        ↓
TestSession loads session (complete, ready)
        ↓
User takes test immediately
```

