# Duplicate Review + Content Fill: Findings and Proposal

## Item 5 — Thin-content topics status (report only)

Current approved + visible MCQ counts per topic (1,855 topics total):


| Bucket                                    | Topics |
| ----------------------------------------- | ------ |
| 0 questions (empty)                       | 430    |
| 1–4 (below Google's 5-question threshold) | 52     |
| 5–9 (just over the line)                  | 367    |
| 10+                                       | 1,006  |


The near-miss group has moved from 58 to 52, so only a handful crossed the line while most of the fill effort went to empty and already-indexable topics. 52 topics still sit below the threshold and 430 are still completely empty.

## Item 3 — Cross-tag duplicates (report only)

The scan is **not** tag-scoped, so cross-tag copies are already caught. Grouping happens purely on cleaned question text across the whole MCQ library, ignoring subject and topic. Live data confirms it:

- 85 duplicate groups, 265 rows, 180 extra copies
- 59 of those groups span **more than one subject**
- 83 of those groups span **more than one topic**

So the majority of what you're reviewing already is cross-tag duplication.

The real gap is at generation time, not scan time: the duplicate check that runs before saving a new question only searches within the same topic/subject for reworded repeats. Identical and near-identical text is checked library-wide, but a reworded copy under a different tag can slip through and get approved, then only shows up on the next scan.

## Item 4 — Mock-test queue does NOT prioritise empty tests

Confirmed. Of 92 draft mock tests: 14 have zero questions, 9 are partially filled, 69 are at target.

The queue builder walks candidate tests newest-first (creation date) and the worker drains queue rows oldest-first. Nothing looks at how many questions a test already has when ordering, so a partially-filled test created later can be topped up before an empty test created earlier.

## Item 1 + 2 — Proposal

### 1. Automatic silent scan (recommended: daily)

Add a nightly background scan at 03:00 UTC. It only records what it found — it never deletes, hides, or changes a single question. New duplicate groups simply appear in the Duplicate Review tab in the morning.

Why daily rather than hourly: the scan reads the whole MCQ library, and duplicates arrive slowly (generation runs every 30 minutes with a small yield). Daily gives near-zero cost with at most one day of delay. The manual "Scan Library" button stays for on-demand checks.

### 2. Scan summary reporting

Each scan stores a small record, and the tab shows the latest one plus history:

- Total approved and visible questions in the library
- Duplicate groups found, extra copies, groups where more than one copy is approved
- **New since the previous scan** (groups and copies) — this is the "what needs my attention today" number
- Reviewed vs pending, matching the existing Groups / Extra copies / Reviewed / Pending stats

### 3. Cross-tag tightening

Make the pre-save reworded-repeat check search the whole library instead of only the current topic/subject, so a copy under a different subject label gets held for review instead of approved. Keeps a per-run cap so generation speed is unaffected.

### 4. Empty tests first

Reorder both stages so baseline coverage comes first:

- When queueing, sort candidate draft tests by how many questions they already have, ascending — zero-question tests are always picked before partially-filled ones.
- When draining, process rows belonging to emptier tests first instead of pure first-in-first-out.

Result: all 14 empty tests get filled before further top-ups on the 9 partial ones.

## Technical notes

- New table `duplicate_scan_runs` (scanned_at, total_approved, groups, extra_copies, approved_dup_groups, new_groups, new_copies, group_keys jsonb) with admin-read RLS and service_role write.
- New `SECURITY DEFINER` function `run_duplicate_scan()` that computes the same normalized-title grouping as `get_duplicate_clusters` but is callable by `service_role` (the existing RPCs are gated behind `public.is_admin()` and would return nothing under cron). It writes one `duplicate_scan_runs` row and returns the summary; no writes to `content_items`.
- pg_cron job `daily-duplicate-scan` at `0 3 * * *` calling `run_duplicate_scan()` directly in SQL — no edge function needed. One run/day; it reads the MCQ table once.
- `DuplicateReviewQueue.tsx`: add a summary strip fed by the latest `duplicate_scan_runs` row (with "new since last scan"), keep the manual Scan Library button, and reuse the existing groups/reviewed/pending counters.
- `supabase/functions/_shared/dedupe.ts`: drop the `topicId`/`subject` narrowing on the signature layer (keep the row cap) so cross-tag rewordings are caught pre-save.
- `supabase/functions/process-jobtest-queue/index.ts`: in the batch-fill enqueue, fetch existing question counts for candidate drafts and sort ascending before the section loop; in the worker, order pending rows by the parent test's question count ascending, `created_at` as tiebreak. `job_test_definitions` stay draft and generated questions stay unapproved — no change to the manual approval gate.

&nbsp;

Plan approved. Proceed with all 4:

1. Add nightly automatic silent scan (03:00 UTC via pg_cron + new run_duplicate_scan() function) — records only, never deletes/hides/changes anything. Keep manual Scan Library button for on-demand checks.

2. Add scan summary reporting — new duplicate_scan_runs table tracking total approved questions, groups, extra copies, already-approved-dupe groups, and "new since previous scan" (this is the key "needs attention today" number). Show in the Duplicate Review tab.

3. Tighten cross-tag duplicate checking at generation time — drop the topic/subject narrowing on the pre-save reworded-repeat check so it searches the whole library (keep the existing per-run cap so generation speed isn't affected).

4. Reorder the mock-test queue (both queueing and draining stages) so completely empty tests (0 questions) are always filled before partially-filled ones get topped up — sort by existing question count ascending.

Verify after: confirm the 14 empty mock tests get filled before the 9 partial ones in the next few generation cycles; confirm the nightly scan runs and populates duplicate_scan_runs without touching any content_items rows.

&nbsp;

&nbsp;

Separately: the threshold-sprint (57→52 near-miss topics) is moving too slowly — most fill effort is still going to empty/already-indexable topics instead of the 52 remaining near-miss ones. Please check why the sprint's priority isn't being followed strongly enough, and propose a way to genuinely prioritize those 52 topics until they're all resolved, before returning to normal empty-topic filling.