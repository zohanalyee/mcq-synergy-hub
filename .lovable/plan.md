# Part A Follow-up — Bulk Approve + Background Generation + Global Analytics

Three additions to the Mock Test admin system. All keep the core guardrail intact: **generation can run in the background, but no question ever reaches the player without your manual approval.**

## 1. Bulk Approve (Approval Queue)

File: `src/components/admin/job-test/GeneratedQuestionsTable.tsx` + a helper in `jobTestService.ts`.

- Add a per-question checkbox and a "Select all (filtered)" checkbox in the header row. Selection respects the active filter (pending/approved/subject), so "select all" only picks what's visible.
- Add a sticky action bar when ≥1 selected: **"Approve Selected (N)"** and **"Unapprove Selected"** + a clear button.
- Add a one-click **"Approve ALL pending for this test"** button (with a confirm dialog) for when you trust every draft.
- New service helpers:
  - `bulkSetQuestionApproval(ids: string[], approved: boolean)` — single `.update().in('id', ids)`.
  - `approveAllPendingForTest(jobTestId: string)` — `.update({admin_approved:true}).eq('job_test_id',id).eq('admin_approved',false)`.
- After any bulk action: update local state + `toast.success`.

## 2. Background / Gradual Generation (trigger-and-forget)

Modeled on the board-topic nightly autofill (`scheduled-autofill` + `pg_cron`).

**New table** `job_test_generation_queue`:

```
id, job_test_id, subject, target_count, status ('pending'|'processing'|'done'|'failed'|'skipped'),
attempts (int, default 0), accepted_count, error_message, created_at, updated_at, processed_at
```

- GRANTs (authenticated read/insert for admins via RLS, service_role all) + RLS using `is_admin()` + realtime enabled so the dashboard live-updates.

**New edge function** `process-jobtest-queue` (cron-driven, service-role or `x-admin-trigger`):

- Picks the oldest 1–2 `pending` rows, marks `processing`, calls the existing per-subject `generate-job-test` (deficit-only, credit-safe), records `accepted_count`, marks `done`/`failed`. Small batch per run = "dheere dheere" gradual fill. Respects existing daily quota.

**pg_cron job** (every ~5 min) → `net.http_post` to `process-jobtest-queue` (inserted via the insert tool, not migration, since it embeds the project URL + anon key).

**Enqueue instead of wait:** `SectionCoverageDashboard` "Generate All Sections" gets a companion **"Generate in Background"** button that calls a new `enqueueGeneration(jobTestId, subjects?)` service (inserts deficit sections as `pending` queue rows, deduping rows already pending/processing). The synchronous button stays for admins who want to watch it run. Dashboard shows a small "In queue: N sections · last run …" status line, polling coverage every few seconds while queue rows are active.

## 3. Global Mock-Test Analytics Dashboard

New admin section (a new tab in `AdminContent`), file `src/components/admin/job-test/MockTestAnalyticsDashboard.tsx`, styled like the boards Content Health dashboard (same tokens/cards, brand-consistent).

- One table of ALL mock tests: **Test name | Overall coverage % (progress bar) | Per-subject deficit chips | Pending-approval count | Ready/Incomplete badge**.
- Data: reuse `useJobTestReadiness` pattern but expanded to also return per-section deficit + pending. Add `getAllTestsCoverage()` in `jobTestService.ts` that resolves each test's definition + `getSectionCoverage` (batched with `Promise.all`).
- Row actions **without opening the test**:
  - **"Generate in Background"** (enqueues all deficit sections for that test).
  - Expand row → per-subject deficit list with an individual **"Queue"** button per subject.
  - **"Review queue →"** links into that test's editor Questions tab.
- Sort by largest deficit first (worklist feel), matching the boards dashboard.

## Guardrail summary

- Queue only performs GENERATION. Every generated question stays `admin_approved=false`.
- Publishing/approval remains 100% manual (now faster via bulk approve).
- Deficit-only generation everywhere → credit-safe, respects existing quota manager.

## Technical notes

- No business/scoring-logic changes to the player.
- One migration (queue table + GRANTs + RLS + realtime). One insert-tool call for the cron schedule. One new edge function. Service + two React components edited/created.
  &nbsp;

Plan: bulk-approve UI, background queued generation (new table + cron edge function), and a global mock-test coverage/analytics dashboard — all keeping approval 100% manual.

&nbsp;

Plan approved — teeno parts implement karein:

1. Bulk approve (checkboxes + approve-selected + approve-all-pending)

2. Background/gradual generation (queue table + cron + "Generate in Background" button)

3. Global Mock-Test Analytics Dashboard (ek hi jagah sab tests ki coverage)

&nbsp;

Build/verify hone k baad batayen, review kar k publish karunga.