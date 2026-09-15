# Duplicate Review: scroll bug + repeat-duplicate findings

## What I checked

Live database counts, the review screen code, the grouping function, and every place new MCQs get saved.

## Finding 1 — the copies list genuinely cannot scroll (confirmed bug)

In the group comparison panel the scroll container is given only a *maximum* height (`max-h-[420px]`), while the left-hand group list is given a real fixed height (`h-[440px]`) and scrolls fine. With only a maximum height, the scroll area's inner viewport (which sizes itself to `height: 100%`) never gets a height to fill, so the content grows past the box and is simply clipped — no scrollbar, no wheel scroll. Any group with more copies than fit in 420px (the 14-copy one, and most 4+ copy groups) is partly unreachable.

Fix: give that container a real height (same pattern as the working left list) plus a small "N copies" header so it's clear how many exist.

## Finding 2 — "Keep this one only" does delete, but the group can come back

The action itself is correct: it approves the chosen copy and deletes the other copies by id. Two real gaps:

1. **It only deletes the copies captured in the last scan.** The member list is a snapshot from when you loaded/scanned. Any copy created after that snapshot survives, so the group can legitimately reappear with fresh copies.
2. **The "already reviewed" record is written without checking for errors.** If saving that record fails (it is stored in a settings row), the group silently returns on the next load, looking exactly like the action didn't work.

Current data: 85 duplicate groups / 265 rows remain, and 59 of those groups received a brand-new copy in the last 3 days — so new copies really are still arriving.

## Finding 3 — regenerated duplicates are NOT being auto-approved by the main generator

I checked every group: **no group has more than one approved copy**. The main generator does check the library before saving and marks repeats as duplicates (hidden from learners). So learners are not seeing double questions.

Two real weaknesses behind "it keeps coming back":

- The duplicate check is exact-title plus a first-50-characters prefix match. A reworded version of the same question (different opening words) passes the check and is saved as approved. It also won't show up as a "group", because grouping is exact-text based.
- **One save path has no duplicate check at all**: questions generated from uploaded documents/books are inserted straight as approved. That path can create approved near-copies without review.

## Finding 4 — expected workflow for "Scan Library"

Today the scan is manual-only: the queue shows what existed at load time, so newly generated duplicates only appear after you press Scan Library (and never appear at all if that group was already marked reviewed). It should refresh itself when the tab is opened, and a group that receives new copies after being resolved should come back for review instead of staying permanently hidden.

## Proposed fixes (for a later build turn)

1. Scroll fix: fixed-height scroll container in the group panel + copy count header.
2. Make group actions re-read the group's current copies from the database at click time, so copies created after the last scan are included.
3. Surface failures: if the "reviewed" record fails to save, show an error instead of a success message.
4. Make "reviewed" time-aware — remember when a group was resolved; if new copies arrive afterwards, the group returns to the queue.
5. Auto-refresh the queue when the Duplicate Review tab opens; keep Scan Library as an explicit re-check.
6. Add the same library duplicate check to the document/book generation path so it can no longer insert approved near-copies.
7. Strengthen matching beyond exact/first-50-characters (keyword-signature comparison, same as the generator already uses internally) so reworded repeats are caught.

## Technical notes

- Scroll: `ScrollArea` root needs an explicit height; `max-h-*` leaves the Radix viewport (`h-full`) unresolved so overflow is clipped, not scrollable.
- Actions in `DuplicateReviewQueue.tsx` operate on the stale `cluster.members` array; re-query `content_items` by normalized title before update/delete.
- `persistDismissed` ignores errors from both the update and insert branches on `system_settings`.
- Reviewed markers are text hashes with no timestamp; store `{hash, resolved_at}` and compare against each group's newest `created_at` in `get_duplicate_clusters`.
- `generate-test` calls `checkDuplicate()` before insert (exact title + `ilike` 50-char prefix, excluding `flagged_duplicate` rows); `generate-from-rag` inserts `status: "approved"` with no duplicate check.
