## Issue 1 — `[POTENTIAL DUPLICATE]` tag leak (systemic)

**Scan result:** 414 rows in `content_items` have `[POTENTIAL DUPLICATE]` / `[DUPLICATE]` prefixed into `title`, all with `status = 'approved'` — so they flow into the learner pool via Phase 3 reuse. `job_test_questions` is clean (0 rows).

**Root cause:** `supabase/functions/generate-test/index.ts` prepends the tag directly into the `title` column in two places:

- Line 1118 (main insert path) — also flips status to `flagged_duplicate`, so these are contained.
- Line 1968 (`forceSaveQuestion` fallback path) — prepends the tag but leaves `status = 'approved'`. This is the leak: approved rows carry an admin-only debug tag into learner UIs.

`cleanQuestionText` exists in `src/lib/questionUtils.ts` but is not applied at the Mock Test player rendering path (JobTestsTab → TestSession pulls raw `title`).

### Fix (three layers, same migration + code change)

1. **Backfill (data)** — strip the prefix from all 414 existing approved rows:
  - `UPDATE content_items SET title = regexp_replace(title, '^\s*\[?(POTENTIAL DUPLICATE|DUPLICATE|AI|ERROR/DUPLICATE-[a-z0-9]+)\]?[:\s]*', '', 'i') WHERE title ~* '^\s*\[?(POTENTIAL DUPLICATE|DUPLICATE|ERROR/DUPLICATE)'` (run via `supabase--insert`).
  - Also refresh `content_fingerprint` for these rows (trigger already does this on update).
2. **Root-cause code fix** — in `generate-test/index.ts`:
  - Stop mutating `title`. Move the flag into a dedicated column already available: set `status = 'flagged_duplicate'` + `show_in_subjects = false` and add the admin note in `description` or a new `admin_note` metadata field instead of `title`. Simpler: keep the raw `q.question` as title, always, and rely on `status` + `show_in_subjects` for admin surfacing. The retry-uniqueness case (line 1120/1973) already has no reason to hit users because it's paired with duplicate handling — remove the title prefix there too.
3. **Defensive display layer** — Apply `cleanQuestionText()` in the two Mock Test render paths (`TestSession` question render + results review) as a belt-and-braces guard so any future prefix leak never reaches learners.

## Issue 2 — Mastery ranking priority (design change)

**Confirmation:** Current order in `JobTestsTab.tsx` sampling loop is `unseen → learning → review → mastered`. This was chosen for variety, but with the Phase 3.5 enlarged pool, unseen questions crowd out learning (wrong-answered) ones, defeating the primary practice goal.

**Agreed new order:** `learning → unseen → review → mastered`

Why this is the right call:

- Practice-first: an incorrectly-answered question is the highest-value repeat.
- Variety preserved: after learning items are exhausted, unseen fills the rest.
- Spaced-repetition intent stays intact (review then mastered at the tail).

### Fix

- `src/components/mock-tests/JobTestsTab.tsx`: swap the tier priority weights in the mastery-sort so `learning` bucket ranks above `unseen`. Keep the same RPC call, only the sort key changes.
- No DB or edge function changes needed.

## Manual test steps (after both fixes)

1. Open any Mock Test → start attempt → intentionally get 5–6 questions wrong → submit.
2. Retake the same test.
3. **Expected:** the 5–6 wrong ones appear in the first ~10 slots; new unseen questions fill the rest.
4. Open browser console — the existing `[Mastery]` log should show `learning: N` and those IDs at the top of the selected list.
5. Spot-check 5 random questions across any Mock Test — none should show `[POTENTIAL DUPLICATE]` or `[DUPLICATE]` prefix.

## Files touched

- `supabase/functions/generate-test/index.ts` — remove title-prefix writes (2 locations).
- `src/components/mock-tests/JobTestsTab.tsx` — reorder mastery tiers.
- `src/pages/TestSession.tsx` (+ results view) — wrap question text with `cleanQuestionText`.
- One `supabase--insert` migration to backfill 414 rows.

**Dono fixes approved:**

&nbsp;

1. Duplicate-tag: backfill (414 rows clean) + root-cause fix (title-mutation rokein, alag field use karein) + defensive cleanQuestionText layer TestSession mein — sab teen layers implement karein.

&nbsp;

2. Mastery-ranking: naya order (learning → unseen → review → mastered) implement karein.

&nbsp;

Build/typecheck clean hone ke baad, manual-test-steps khud follow karunga (5-6 galat karke retake, console check, aur 5 random questions mein tag check). Result confirm karne ke baad publish karunga.