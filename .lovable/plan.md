

# Fill the Gap Hybrid Test Generation

## Problem Summary

The test generation flow has two critical failures:
1. **Hard errors block users** — `generateCustomTest()` in `testGenerationService.ts` throws when DB has fewer questions than requested (lines 94-113)
2. **Navigation mismatch** — Mock test tabs navigate to `/test-session` with `state: { test }`, but the route expects `/test-session/:id` and only reads from DB. The state-based test data is never consumed.

## Solution

### Step 1: Rewrite `generateCustomTest` — Remove Hard Errors, Return Partial Results

**File**: `src/services/testGenerationService.ts`

- Remove both `throw new Error` blocks (lines 94-113)
- If 0 questions found: instead of throwing, return a test with empty questions array + a `deficit` count and `aiGenerationNeeded: true` flag
- If partial questions found (e.g., 10 of 100): return those immediately with metadata indicating the deficit
- Add `deficit` and `aiGenerationNeeded` fields to the `GeneratedTest` interface
- The function never throws — always returns a valid test object

### Step 2: Update Mock Test Tabs — Save Session to DB, Navigate with ID

**Files**: `src/components/mock-tests/SubjectTestsTab.tsx`, `src/components/mock-tests/JobTestsTab.tsx`

- After `generateCustomTest()` returns, save the test as a `custom_test_sessions` row in Supabase (same pattern as `questionBankService.ts` line 164-180)
- Navigate to `/test-session/${sessionId}` instead of `/test-session` with state
- Show a toast: "Starting test with X questions..." (non-blocking)
- If there's a deficit, trigger AI generation in the background via `supabase.functions.invoke('generate-test', { body: { topic, difficulty, question_count: deficit } })`

### Step 3: TestSession — Handle Partial Load + Background AI Fill

**File**: `src/pages/TestSession.tsx`

The existing `pollForMoreQuestions` logic (lines 121-174) and `remainingCount` state already support background loading. The only change needed:
- When `remainingCount > 0` on initial load, show a non-blocking toast: "AI is generating X more questions in the background..."
- The existing polling mechanism already appends new questions as they arrive

### Step 4: AI-Generated Questions Persist to Question Bank

**File**: `supabase/functions/generate-test/index.ts`

This already saves generated questions to `content_items` (the question bank). Verify and confirm this is working — no changes expected here.

### Step 5: Cross-Pollination — Tag-Based Fetching for Job Tests

**File**: `src/components/mock-tests/JobTestsTab.tsx`

- Currently passes `subjects: test.syllabus.map(item => item.topic)` which searches by subject name
- Change to also pass individual syllabus topics as the `topics` filter, so "English Grammar" questions are shared across FPSC, PPSC, NTS etc.
- In `questionBankService.ts`, the query already uses `in('subject', subjects)` and `in('topic', topics)` — this works for cross-pollination as long as topics are passed correctly

**File**: `src/services/testGenerationService.ts`

- In `generateCustomTest`, if no questions found with strict subject+topic filter, retry with just topics (broader search) before falling back to AI

## Files Summary

| Action | File |
|--------|------|
| Modify | `src/services/testGenerationService.ts` — remove hard errors, add deficit metadata, broader fallback queries |
| Modify | `src/components/mock-tests/SubjectTestsTab.tsx` — save to DB, navigate with ID, trigger background AI |
| Modify | `src/components/mock-tests/JobTestsTab.tsx` — save to DB, navigate with ID, cross-pollinate topics |
| No change | `src/pages/TestSession.tsx` — existing polling already handles background fill (minor toast addition) |
| No change | `supabase/functions/generate-test/index.ts` — already persists to question bank |

