

# Implementation Plan: 3 Features

## Request 1: Fix Difficulty-Wise Question Counts (Quick Fix)

### Root Cause
In `src/components/admin/QuestionBankManager.tsx` (lines 171-184), the `fetchStats` function queries difficulty values in **lowercase** (`'easy'`, `'medium'`, `'hard'`), but the database stores them in **Title Case** (`'Easy'`, `'Medium'`, `'Hard'`).

Database proof:
- Easy: 932
- Medium: 2420
- Hard: 489
- Total: 3841

All queries return 0 because `.eq('difficulty', 'easy')` doesn't match `'Easy'`.

### Fix
**File:** `src/components/admin/QuestionBankManager.tsx` (lines 171-184)

Change the three difficulty filter values to Title Case:
- `'easy'` to `'Easy'`
- `'medium'` to `'Medium'`
- `'hard'` to `'Hard'`

Also add `.eq('category', 'mcq')` and `.eq('status', 'approved')` to each difficulty count query so stats are consistent (currently counting ALL content_items, not just approved MCQs).

---

## Request 2: Exclude Previously Attempted Questions

### Overview
Track which questions each user has attempted, and exclude them from future test generation so users always get fresh questions.

### Database Migration
Create a new `user_question_attempts` table:

```text
user_question_attempts
- id: UUID (PK)
- user_id: UUID (NOT NULL)
- question_id: UUID (NOT NULL)
- attempted_at: TIMESTAMPTZ (default NOW())
- UNIQUE(user_id, question_id)
- INDEX on user_id
- INDEX on question_id
```

RLS policies:
- Users can INSERT their own attempts (`auth.uid() = user_id`)
- Users can SELECT their own attempts (`auth.uid() = user_id`)
- Users can DELETE their own attempts (`auth.uid() = user_id`) -- for reset functionality

### Code Changes

**1. Record attempts after test submission**

**File:** `src/utils/gamification.ts` -- `processTestCompletion` function

After saving the test_attempt, also insert into `user_question_attempts`:
- Extract question IDs from the test session
- Upsert into `user_question_attempts` with `onConflict: 'user_id,question_id'`

**File:** `src/pages/TestSession.tsx` -- `handleSubmit` function

Pass the question IDs from the current test session to `processTestCompletion`, which will record them.

**2. Exclude attempted questions in query functions**

**File:** `src/services/syllabusRAGFallback.ts`

- Add `userId?: string` parameter to `getQuestionsWithFallbackInfo`
- If `userId` is provided, fetch attempted question IDs from `user_question_attempts`
- Pass `excludeQuestionIds` to `fetchQuestionsForTopic`
- In `fetchQuestionsForTopic`, add `.not('id', 'in', ...)` filter when exclusion list is provided

**File:** `src/components/syllabus-builder/SyllabusBuilder.tsx`

- Pass `userId: user.id` to `getQuestionsWithFallbackInfo` calls

### Edge Cases
- If user has attempted ALL available questions, the exclusion returns 0 results, triggering AI generation of fresh questions
- The `user_question_attempts` table uses UPSERT so duplicate attempts don't cause errors

---

## Request 3: Auto-Feed Practice Tests for Weak Areas

### Overview
After test completion, automatically detect weak areas and create recommended practice tests that appear on the Dashboard.

### Database Migration
Create a `recommended_tests` table:

```text
recommended_tests
- id: UUID (PK)
- user_id: UUID (NOT NULL)
- topic_name: TEXT (NOT NULL)
- subject_name: TEXT
- reason: TEXT (NOT NULL) -- 'weakness', 'review'
- weakness_percentage: NUMERIC
- question_count: INTEGER (NOT NULL)
- question_ids: JSONB (array of question UUIDs)
- status: TEXT (default 'pending') -- 'pending', 'started', 'completed', 'skipped'
- session_id: UUID (nullable, linked test session)
- created_at: TIMESTAMPTZ (default NOW())
- completed_at: TIMESTAMPTZ (nullable)
```

RLS policies:
- Users can SELECT their own (`auth.uid() = user_id`)
- Users can INSERT their own (`auth.uid() = user_id`)
- Users can UPDATE their own (`auth.uid() = user_id`)
- Users can DELETE their own (`auth.uid() = user_id`)

### Code Changes

**1. Auto-generate recommendations after test completion**

**File:** `src/utils/gamification.ts`

Add a new function `generateWeaknessRecommendations(userId, testResults)`:
- After test completion, check if any subject scored below 50%
- For each weak subject, check if a pending recommendation already exists
- If not, fetch fresh questions (using exclusion logic from Request 2) for that subject
- Insert into `recommended_tests`

Call this function at the end of `processTestCompletion`.

**2. Dashboard UI -- Recommended Practice section**

**File:** Create `src/components/dashboard/RecommendedPractice.tsx`

A new component that:
- Queries `recommended_tests` for the current user where `status = 'pending'`
- Shows cards with weak area name, score percentage, question count, and a "Start Practice" button
- "Start Practice" creates a `custom_test_sessions` entry from the recommended question IDs and navigates to `/test-session/{id}`

**File:** `src/pages/Dashboard.tsx`

- Import and render `RecommendedPractice` in the overview tab, between WeaknessSection and SavedTestsList

**3. Mark recommendation as completed**

**File:** `src/pages/TestSession.tsx`

- On test submission, check if the session was created from a recommendation
- If so, update the recommendation status to `'completed'`

---

## Technical Details

### Files Modified

| File | Changes |
|---|---|
| `src/components/admin/QuestionBankManager.tsx` | Fix difficulty case: `'easy'` to `'Easy'`, etc. |
| `src/services/syllabusRAGFallback.ts` | Add `userId` param + exclusion logic |
| `src/components/syllabus-builder/SyllabusBuilder.tsx` | Pass `userId` to query functions |
| `src/utils/gamification.ts` | Record attempts + generate weakness recommendations |
| `src/pages/TestSession.tsx` | Pass question IDs to completion handler + mark recommendations done |
| `src/pages/Dashboard.tsx` | Add RecommendedPractice component |

### New Files

| File | Purpose |
|---|---|
| `src/components/dashboard/RecommendedPractice.tsx` | UI for recommended practice tests |

### Database Migrations

1. Create `user_question_attempts` table with RLS
2. Create `recommended_tests` table with RLS

### Implementation Order

1. Fix difficulty counts (standalone, no dependencies)
2. Create both database tables (single migration)
3. Implement question attempt tracking (Request 2)
4. Implement auto-feed practice tests (Request 3, depends on #2 for fresh questions)

