

# Fix: Test Stuck on "Generating Questions..." Forever

## Root Cause (confirmed via DB)

The two most recent Junior Clerk sessions show:
- `question_count: 0`, `actual_q: 8`
- `question_count: 0`, `actual_q: 9`

**What's happening:**
1. `JobTestsTab.tsx` line 76 sets `question_count: generatedTest.questions.length` — when the bank is empty, this is **0**
2. `TestSession.tsx` line 252 sets `expectedTotal = question_count` → **0**
3. Line 253: `remainingCount = max(0, 0 - 0)` → **0**
4. Line 213: polling only starts when `remainingCount > 0` → **never starts**
5. The edge function IS generating and syncing questions (8-9 arrived), but the UI never re-fetches them
6. User sees "Generating Questions..." forever

## Fix (2 files)

### 1. `src/components/mock-tests/JobTestsTab.tsx` — Use requested count, not actual yield

Line 76: change `question_count: generatedTest.questions.length` → `question_count: settings.questionCount`

This ensures the session knows the intended total, so polling starts and picks up AI-generated questions.

### 2. `src/pages/TestSession.tsx` — Allow submit even if not all questions arrive

The previous fix changed `question_count` to actual yield to prevent submit deadlock. Now we're reverting that, so we need a safety valve:

- In `pollForMoreQuestions`, when max poll attempts are exhausted for a Job Test, update `expectedTotal` to match the actual questions received so far. This allows submit even if AI couldn't fill 100% of the quota.
- Add a secondary guard: if `questions.length === 0` on a Job Test, force-start polling regardless of `remainingCount` (edge case where session was just created).

### Files to modify
| File | Change |
|------|--------|
| `src/components/mock-tests/JobTestsTab.tsx` | Set `question_count` to requested target, not 0 |
| `src/pages/TestSession.tsx` | Add max-attempts fallback to adjust expectedTotal; force-poll when questions empty |

