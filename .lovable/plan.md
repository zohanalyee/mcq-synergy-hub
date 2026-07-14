## Plan

### 1. Add live progress in both admin views

- In **Mock Test Analytics**, subscribe to `job_test_generation_queue` Realtime changes.
- In the individual test **Section Coverage Dashboard**, subscribe to the same table filtered by the current `jobTestId`.
- On every queue insert/update/delete, refresh:
  - active queue list
  - in-queue counts
  - coverage totals
- Show clearer row states: `pending`, `processing`, `done/skipped/failed`, plus accepted count / error when available.
- Keep the existing polling as a fallback, but Realtime will drive the UI so refresh is not needed.

### 2. Fix the systemic “last item stuck” root cause

- Update `process-jobtest-queue` so each invocation processes **one queue row only** instead of a batch of two.
- Reason: logs show successful subject generation can take ~60–70s; processing multiple rows in one Edge Function run risks Supabase execution shutdown before the final status commit. The current logs also show shutdown right after processing, matching a timeout window.
- Add a stale-processing recovery step at the start of each run:
  - rows stuck in `processing` beyond a safe threshold get moved back to `pending` if attempts remain
  - rows past max attempts become `failed`
- Use conditional claim logic (`pending` → `processing`) to avoid two cron/browser kicks claiming the same row.
- Ensure every path awaits the final status update before returning.
- Keep the existing deficit guard so already-complete subjects are marked `skipped` without spending AI.

### 3. Add master stop/cancel for a test

- Add a service method that cancels all **pending** rows for one test.
- Do not delete or cancel currently `processing` rows by default, because an Edge Function may already be running and deleting that row cannot stop the in-flight AI call reliably.
- Add a **Stop background generation** button in:
  - Mock Test Analytics expanded queue area
  - individual Section Coverage Dashboard queue area
- The button will immediately mark/delete all pending rows for that test, refresh live UI, and leave the current processing row to finish/fail safely.

### 4. Database / Realtime compatibility

- Realtime is already enabled for `job_test_generation_queue`, so no schema migration is needed unless existing RLS blocks the current admin update/delete operations.
- I’ll keep changes inside frontend service/components and the existing Edge Function.

### 5. Validation

- Check current active queue rows and logs again after implementation.
- Deploy/test the updated `process-jobtest-queue` function.
- Verify that queue status transitions update in UI without manual refresh and that pending rows can be stopped in one click.
  &nbsp;

**Plan approved** — sab kuch implement karein jaisa propose kiya hai:

1. Realtime live progress (dono dashboards mein)

2. Root-cause fix: batch-size 1 kar dein, stale-processing recovery add karein

3. Master "Stop background generation" button (pending rows ke liye; processing wale ko safely finish hone dein)

Implementation ke baad, purane atke hue rows dobara check kar lein aur function dobara deploy/test karein. Build/typecheck clean hone ke baad batayen, review kar ke publish karunga.