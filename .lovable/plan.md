# Audit: "[FORCE-SAVE-<hash>]" prefix in question text

## 1. Where the tag comes from

One single place writes it: the MCQ generation edge function `supabase/functions/generate-test/index.ts`, line 2045, inside the `forceSaveQuestion` helper.

Flow: the function tries to save a generated question. If the insert fails 4 times (initial + 3 retries), it runs an "emergency save" that re-inserts the same question with the title rewritten as `[FORCE-SAVE-<8-char-id>] <question text…>`, status `flagged_duplicate`, and both `show_in_subjects` / `show_in_mock_tests` set to false.

Why it exists: the table has a unique index on the question title for MCQs (`content_items_mcq_title_unique_idx` on `md5(title)` where category = 'mcq'). When a generated question repeats an existing one, the insert is rejected. The prefix made the title artificially unique so the row could still be stored ("zero data loss"), instead of being dropped.

The two other, older tag styles (`[n-…]`, `[POTENTIAL DUPLICATE]`) were already removed from the save paths: both save paths now comment "Never mutate the learner-visible title with admin-only debug tags" and use the clean question as the title. The emergency branch is the last remaining leak.

## 2. Internal-only or not?

Internal-only. It is a storage-uniqueness workaround, never intended for learners. Display-time protection already exists — `cleanQuestionText()` in `src/lib/questionUtils.ts` strips it — and it is applied in the exam player, quiz player, question bank table, mock-test preview and board topic pages. It is NOT applied in the admin Review Queue (`DuplicateReviewQueue.tsx`) or in the admin content lists, which is why you see the raw prefix there.

## 3. How many rows are affected

307 MCQ rows carry the prefix in the stored title:

- 306 rows: status `flagged_duplicate`, hidden from subjects and mock tests, created 4–6 Sep 2026
- 1 row: status `pending`, still visible (`show_in_subjects = true`), created 11 Aug 2026 — this is the only genuinely user-facing one

Important finding for the cleanup: all 307 rows, once the prefix is stripped, exactly match a question that already exists in the bank (and 187 of them also duplicate each other). So none of them is unique content — they are all copies of questions already stored, and the prefix is the only thing that let them be inserted.

## 4. Proposed fix

### a. Stop new writes (code)

In `generate-test/index.ts`, remove the emergency retitle. When the retries are exhausted, do not insert a re-titled row: log the failure and return `failed` (already an existing return value, counted separately, so generation stats stay honest). The title stays exactly the generated question text in every path. Nothing else in the function changes — no difficulty, subject, topic, options, quality or dedup logic touched.

### b. Clean up existing rows (one-time)

Stripping the prefix in place is not possible for these rows: every cleaned title collides with the unique MCQ title index, so an in-place `UPDATE` would fail. Given that, and your instruction not to delete, the cleanup does this instead:

1. The one visible `pending` row: set it to `flagged_duplicate` with `show_in_subjects = false` and `show_in_mock_tests = false`, so nothing with the prefix can reach a learner.
2. All 307 rows: record `force_save_legacy: true` in their `reference_material` JSON so admins can find them later.
3. Review Queue and admin lists: pass titles through the existing `cleanQuestionText()` before rendering, so admins see the clean question instead of the raw tag.

Net effect: no learner ever sees the tag, admins see clean text, no question row is deleted, and no new tagged rows can be created.

If you would rather physically remove these 307 pure-duplicate rows (they add nothing to the bank), say so and I will add a delete step instead of step 2 — but the default plan keeps them.

## Technical summary

- Write site: `supabase/functions/generate-test/index.ts` line 2045 (emergency-save branch of `forceSaveQuestion`).
- Constraint driving it: `content_items_mcq_title_unique_idx` — unique on `md5(title)` where `category = 'mcq'`.
- Display strip already available: `cleanQuestionText()` in `src/lib/questionUtils.ts` (already handles `[FORCE-SAVE-…]`).
- Admin surfaces to patch for display: `src/components/admin/DuplicateReviewQueue.tsx` and the admin content list row rendering.
- Data change delivered as one migration (status/visibility + `reference_material` flag), scoped by `title ~* '^\s*\[FORCE-SAVE-'` and `category = 'mcq'` only.
