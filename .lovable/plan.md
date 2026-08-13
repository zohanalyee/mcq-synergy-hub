# Answers: Sprint Scope Bug + Quality Gate Backlog

## 1. Sprint mode "No queued topics match sprint scope"

Keyword matching code is fine. The saved config is the problem:

- `system_settings.content_fill_sprint` currently holds `scope_keywords: ["army","paf","navy"]` (Forces preset), not `mdcat`. A preset button click overwrote MDCAT.
- No LMS topic in the auto-fill queue contains army/paf/navy, so every run correctly stops with "No queued topics match the sprint scope".

Second, deeper limitation: scope matching only sees LMS hierarchy text (system / class / subject / topic). In the current queue of 400 gaps only **3 rows** contain "mdcat" — and presets like `ppsc`, `fpsc`, `nts`, `ecat`, `army` have **zero** matches, because those exams live in the mock-test bank, not in the board LMS tree. So most presets can never produce work.

### Fix
- Reset the sprint scope back to MDCAT (`["mdcat"]`, 15/topic, 600 budget).
- Make preset selection safe: before saving, count matching topics in the queue and show the admin the match count; warn (do not silently save) when a preset matches 0 topics.
- Broaden matching one level: also match against the topic's exam/board tags where available, and treat a keyword hit on the parent subject as scope-in — so "MDCAT Past Papers" style subjects pull all their child topics.
- Add an explicit "Sprint scope preview" list in `SprintModePanel` (top 10 matching topics + total count) so scope drift is visible before a run.

## 2. "Awaiting review: 9220" — are they public?

**Yes, they are already live and visible to users.** Generation writes MCQs with `status: 'approved'` right away (`generate-test`). `quality_verified_at IS NULL` only means the second-pass AI has not looked at them yet. The Quality Gate is a *post-publication* audit: when it flags an item it demotes it to `status='pending'` + `quality_grade='D'`, which removes it from public surfaces.

So the 9220 is a review backlog, not a hidden queue.

### Clearing the backlog faster
- There is **no cron job** for `verify-questions` today — it only runs on the manual 60-per-click button. That is why the backlog grows.
- Add a scheduled run (hourly, `x-cron-token` auth, same pattern as the autofill job) at 10 batches x 20 = 200 questions/run → ~4,800/day, so 9,220 clears in about 2 days and then stays near zero.
- Keep it quota-safe: the function already calls `checkQuota` and stops on exhaustion; add a guard so the cron skips when remaining quota is low so learner-facing generation keeps priority.
- Panel updates: show "auto-review: hourly, ~200/run", an ETA to clear the backlog, and keep the manual button for bursts.

## Technical notes
- Migration: update `system_settings.content_fill_sprint` value; add a `cron.schedule` entry for `verify-questions` with `{"batches":10}` body and the `indexnow_cron_token` header.
- `supabase/functions/scheduled-autofill/index.ts`: extend `inSprintScope` to include subject-level keyword inheritance.
- `src/services/autoFillService.ts`: add a scope-preview helper (count + sample topics) used by the panel.
- `src/components/admin/auto-fill/SprintModePanel.tsx`: scope preview, zero-match warning on presets, auto-review status line.
- No change to how questions are published; approval semantics stay as-is.
