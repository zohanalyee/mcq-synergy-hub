Approved. Proceed with the 3-step plan:

1. Fix SubjectContent.tsx fallback logic

2. Verify useSubjects hook

3. Add optional response validator

Run all 4 verification tests before deployment.

## Audit Findings

### Issue 1 — Subject/Topic display (LOW severity, mostly already correct)

None of the three pages filter by question count. Only filter applied is `approved.eq.true OR approved.is.null` (defaults to `true` in DB), which is intentional for hiding admin-rejected items. Empty topics already show.

- `src/pages/Quizzes.tsx` (line 62-66): topics query uses `approved` filter only — OK, but the subject list comes from a separate `useSubjects` hook (need to verify).
- `src/pages/SubjectContent.tsx` (line 320-374): `loadTopicsFromDB` falls back to `content_items` distinct topics if no rows in `topics` table. This fallback can hide empty topics — but only fires when no `topics` rows exist, so usually fine.
- `src/components/syllabus-builder/hooks/useSyllabusData.ts` (line 54-130): both subjects and topics queries use `approved` filter only — already correct.

**Action:** Verify `useSubjects` hook used by `Quizzes.tsx`. Confirm it doesn't filter by question count. No code changes anticipated unless it does.

### Issue 2 — AI question persistence (ALREADY IMPLEMENTED)

`supabase/functions/generate-test/index.ts` already inserts every AI-generated question into `content_items` (lines 1742-1809) with:

- `category: 'mcq'`, `status: 'approved'` (or `flagged_duplicate` on dup)
- `subject`, `topic`, `topic_id`, `canonical_topic_name`, `difficulty`, `options`, `correct_option`, `explanation`
- LMS linkage via `lmsLinkageFields`
- Three-tier insert (normal → retry with unique title → emergency save) — zero data loss

Questions persist and become reusable across all users.

**Action:** No fix needed. Will confirm by reading the response-builder section to ensure the insert always runs (not skipped on guest path).

### Issue 3 — Structure consistency

`content_items` schema is the single source of truth. Both admin-manual and AI inserts use the same columns. The fields the auditor lists (`source: 'ai_generated'` vs `'admin_created'`) do not exist as a column today — provenance is stored inside `reference_material` JSON (`generator: 'auto_fill' | 'admin_bulk' | ...`). All player fetches read `content_items` and normalize options/correct_option in `SubjectContent.tsx` lines 260-290.

**Action:** No schema change. Optionally add a lightweight `validateQuestionStructure` filter in the edge function before returning to the client (not before insert — we never want to drop AI work).

---

## Plan

### Step 1 — Verify `Quizzes.tsx` subject source

Read `useSubjects` (or whichever hook supplies the dropdown) and confirm no `gt('topics.count', 0)` or similar filter. If found, strip it.

### Step 2 — Tighten `SubjectContent.tsx` topic loader

In `loadTopicsFromDB`, if a matching subject exists in the `subjects` table, **always** use `topics` table results (even when empty array) and skip the `content_items` distinct-topic fallback. Only run the fallback when the subject row itself is missing. This guarantees empty admin-defined topics still appear.

```text
subjects table hit?
 ├─ yes → return topics rows (may be [])
 └─ no  → fallback to distinct topics from content_items (legacy)
```

### Step 3 — Confirm AI persistence path

Read lines around the response builder in `generate-test/index.ts` to confirm the insert is unconditional for every successful AI batch (not gated on auth/guest). No edits expected.

### Step 4 — Add response-side structure validation (optional, safe)

In `generate-test/index.ts`, before returning the questions array to the client, filter with:

```ts
function isValidMCQ(q) {
  return q?.question && Array.isArray(q.options) && q.options.length === 4
      && q.correct_option && q.difficulty;
}
```

Log a warning if any are dropped. **Do not** block the DB insert path on this — bad rows still get saved as `flagged_duplicate` for admin review (existing behavior).

### Step 5 — Manual verification

After deploy:

1. Pick a subject in admin with a topic that has 0 questions → confirm it shows in all 3 pages.
2. Generate a quiz on `/quizzes` for that topic → confirm new rows appear in `content_items` with matching `topic_id`.
3. Re-open `/subjects/:id` and `/custom-syllabus` → confirm count > 0 reflected.

---

## Files to touch (max)

- `src/pages/Quizzes.tsx` — only if `useSubjects` filters by count
- `src/pages/SubjectContent.tsx` — tighten `loadTopicsFromDB` fallback
- `supabase/functions/generate-test/index.ts` — optional response-side validator

No schema migration required. No changes to admin panel inserts (already consistent).