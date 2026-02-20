# Fix: MCQs Not Saving to Database

## Root Cause

A database CHECK constraint on the `content_items` table requires `difficulty` values to be Title Case: `'Easy'`, `'Medium'`, or `'Hard'`.

```text
CHECK (difficulty IS NULL OR difficulty IN ('Easy', 'Medium', 'Hard'))
```

The `generate-test` edge function converts difficulty to lowercase (`difficulty.toLowerCase()`) before inserting, producing `'easy'`, `'medium'`, `'hard'`. This violates the constraint, causing every INSERT to fail silently.

The "zero loss" retry logic retries 3 times but uses the same lowercase difficulty each time, so all retries also fail. The code then counts the failure as "flagged" anyway (returns `'flagged'` even when the emergency save fails), so the API response reports 20 "saved" per batch when 0 rows actually reach the database.

## Evidence

- AI usage logs show: `approved: 0, flagged_duplicates: 20` for all 5 batches
- Database has 0 rows with `topic = 'Blessings of Allah'`
- Database has 0 rows with `status = 'flagged_duplicate'`
- The constraint: `content_items_difficulty_check` requires Title Case values

## Fix

### File: `supabase/functions/generate-test/index.ts`

**Change 1**: Fix difficulty casing in `forceSaveQuestion` (around line 964)

Replace:

```text
difficulty: difficulty.toLowerCase(),
```

With:

```text
difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase(),
```

This converts `'easy'` to `'Easy'`, `'medium'` to `'Medium'`, `'hard'` to `'Hard'`.

**Change 2**: Fix same issue in `saveQuestionsInBackground` (around line 565)

Same replacement -- this function is used for non-bank-only mode background saves.

**Change 3 (UI)**: Fix misleading "Saved" counter in `AIContentFactory.tsx`

The UI currently shows `data.questions_saved` (which is approved + flagged total) as "Saved". After the fix, change to use `data.questions_approved` for the Saved counter so users see the actual approved count.

In `AIContentFactory.tsx`, update the batch result mapping:

```text
// Before:
saved: data.questions_saved || 0,

// After:
saved: data.questions_approved || 0,
```

### Files Modified

- `supabase/functions/generate-test/index.ts` -- fix difficulty Title Case in 2 locations
- `src/components/admin/AIContentFactory.tsx` -- show approved count instead of total

### After Deployment

Re-run the same generation (Blessings of Allah, 100 questions) and verify questions appear in the Question Bank with `status = 'approved'`.  Perfect diagnosis! Approved for immediate deployment.

CONFIRMED:

✅ Root cause: Case sensitivity (lowercase vs Title Case)

✅ Fix 1: forceSaveQuestion() - Title Case difficulty

✅ Fix 2: saveQuestionsInBackground() - Title Case difficulty

✅ Fix 3: AIContentFactory.tsx - Show questions_approved (not questions_saved)

TESTING PLAN:

After deployment:

1. Hard refresh browser

2. Re-generate: Blessings of Allah, 100 questions

3. Verify in database: Should see ~100 rows

4. Check status: Should be 'approved'

5. Check difficulty: Should be 'Easy', 'Medium', 'Hard' (Title Case)

6. Generate different topic: Should work

7. Generate same topic again: Should catch duplicates properly

8. Test bulk (500): Should save + confetti

This fix unblocks the entire launch!

Please deploy immediately.