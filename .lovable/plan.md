# Plan: remove the "[FORCE-SAVE-<hash>]" tag, keep flagged duplicates reviewable

## Audit recap (verified)

- Only one place writes the tag: `supabase/functions/generate-test/index.ts` line 2045, the "emergency save" branch of `forceSaveQuestion`. When the normal insert keeps failing, it re-inserts the question with the title rewritten as `[FORCE-SAVE-<8-char-id>] …`, status `flagged_duplicate`, hidden from subjects and mock tests.
- Reason it exists: a unique index blocks a second MCQ with the same title — `content_items_mcq_title_unique_idx`, unique on `md5(title)` where `category = 'mcq'` (applies to every status, including `flagged_duplicate`). A second index, `idx_content_items_title_mcq_unique`, is unique on `title` where `category = 'mcq' AND status = 'approved'`.
- 307 MCQ rows currently carry the prefix: 306 `flagged_duplicate` (hidden, created 4–6 Sep 2026) and 1 `pending` that is still visible to learners (created 11 Aug 2026).
- Display-time strip already exists (`cleanQuestionText()` in `src/lib/questionUtils.ts`, already covers this tag) and is used in the players, question bank and previews — but not in the admin Review Queue or admin content lists, which is why you see the raw tag.

## Point 1 — proposed technical approach for new questions

**Change the constraint's scope, not the text.**

Replace `content_items_mcq_title_unique_idx` with the same unique index restricted to non-duplicate rows:

```text
unique on md5(title)  where category = 'mcq' and status <> 'flagged_duplicate'
```

Why this is the right shape:

- The live bank stays protected exactly as today — two `approved` / `pending` / `question_bank` MCQs still cannot share a title, so duplicate content can never reach learners.
- Rows the system judges as duplicates can be stored with the clean question text as their title, because the index no longer covers them. No hash, no tag, no extra column needed in the visible text.
- The second index (`title` unique where status = 'approved') stays untouched. That means when you approve a flagged duplicate whose text truly matches an already-approved question, the approval is still refused — which is the existing safety net, unchanged.

**Function change (small, isolated):** in `forceSaveQuestion`, drop the emergency retitle entirely. On the duplicate path the row is inserted once with `title = q.question`, `status = 'flagged_duplicate'`, `show_in_subjects = false`, `show_in_mock_tests = false`, and the duplicate evidence stays where it already goes — in `reference_material` (`duplicate_of_id`, `duplicate_of_title`, `emergency_save`, error message). Retry/return values (`approved` / `flagged` / `failed`) keep their current meaning, so generation counters stay honest.

Nothing in the duplicate-detection logic, difficulty mapping, subject/topic tagging, quality gates or queue processing changes.

Considered and rejected: a separate `dedup_hash` column plus `unique(md5(title), dedup_hash)` — it works, but it adds a column and rewrites the index for every MCQ row just to solve a case the scoped index already covers.

## Point 2 — existing 307 rows

- No deletions. All 306 flagged rows stay in the Review Queue with the identical Approve / Discard workflow.
- One-time data update: strip the `[FORCE-SAVE-…]` prefix from the stored title of those rows where the cleaned title does not collide with a still-indexed row; after the index is re-scoped, all 306 `flagged_duplicate` rows qualify, so their stored text becomes clean. Add `force_save_legacy: true` into `reference_material` so they remain findable.
- The single visible `pending` row: set to `flagged_duplicate` with `show_in_subjects = false` and `show_in_mock_tests = false` — off the learner surface, still reviewable by you.
- Display safety net: run titles through `cleanQuestionText()` in `DuplicateReviewQueue.tsx` and the admin content table, so even if a tagged row ever appears again you see clean text.

## Execution order

1. Migration: drop and recreate the MCQ title unique index with the `status <> 'flagged_duplicate'` scope (no table rewrite of data).
2. Data update: strip prefixes from the 306 flagged rows, flag them `force_save_legacy`, and hide/flag the one `pending` row.
3. Edge function: remove the emergency retitle branch in `generate-test/index.ts`.
4. Admin display: apply `cleanQuestionText()` in `src/components/admin/DuplicateReviewQueue.tsx` and `src/components/admin/content/EnhancedContentTable.tsx`.

## Technical notes

- 467 MCQ rows are currently `flagged_duplicate`, covering 235 distinct cleaned questions — so after the index is re-scoped, repeated flagged copies of the same question are allowed by design and remain individually reviewable.
- All SQL is scoped to `category = 'mcq'`; no other category, column or pipeline step is touched.
