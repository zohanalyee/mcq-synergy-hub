# Streak Reminder Emails — Root Cause + Fix Plan

## Diagnosis (verified today)

1. **Cron chala** — job `send-streak-reminders-daily` (`0 8 * * *` UTC = 13:00 PKT) ran at `2026-08-11 08:00:00 UTC` and also on 10 Aug. `cron.job_run_details` = `succeeded` (that only means the SQL ran, not that the email function succeeded).

2. **Function ne request REJECT kar di — 401.** The HTTP response stored for that run is:
   `{"error":"Unauthorized: invalid cron token"}` (status 401).
   Cause: the cron command builds the header as
   `(select value::text from public.system_settings where key = 'indexnow_cron_token')`.
   `value` is `jsonb`, so `value::text` returns the token **with surrounding double quotes** (`"5f6d3cb3-…"`), which never matches the plain `CRON_TOKEN` secret the function compares against. So the function was never even invoked — that's why there are no edge-function logs, no Resend sends, and only your 4 manual `[TEST]` emails.

3. **Opt-in defaults are fine.** `email_prefs` has 247 rows for 247 profiles and all 247 have `streak_reminders = true`; the `seed_email_prefs` trigger on `auth.users` inserts the row at signup with default ON.

4. **`email_send_log` is empty (0 rows)** — consistent with "function never ran". No failed attempts, kuch bhi log nahi hua, because the 401 happens at the gateway/guard before any logging.

5. **Eligibility ke numbers (aaj):** exactly **1** user is inactive 2–4 days with a prior attempt. 117 users have **never** attempted a test, so under the current rule they are permanently ineligible. So even after the fix, today's real send would be ~1 email.

## Fix

### A. Cron token bug (the actual blocker)
Re-create job 6 so the header carries the raw token, using `value #>> '{}'` instead of `value::text` (same style as the other jobs which hardcode the raw string and work fine). Verify by inspecting `net._http_response` after a manual trigger — expect `200` with a JSON summary instead of `401`.

### B. Observability so this can't fail silently again
- Write one summary row per run (candidates found, sent, skipped, errors) into `email_send_log` (or a small `email_run_log`), so an empty table again immediately means "cron never reached the function".
- Include the run summary in the function's JSON response so the cron's stored `net._http_response` is self-explanatory.

### C. Optional — widen eligibility (needs your decision)
Current rule catches only 1 user. Options:
- Keep as-is (safe, tiny volume).
- Add a separate "never started" nudge for the 117 signed-up-but-never-practiced users (different copy: "pehla test shuru karein"), capped at 1 email per user per 7 days.

## Technical notes
- Job 6 command changes only the header expression; schedule (`0 8 * * *` UTC) stays — that is already 13:00 PKT.
- No change needed to `email_prefs`, its trigger, or the unsubscribe flow.
- After the fix I will trigger one real run and report the actual send count and Resend result.
