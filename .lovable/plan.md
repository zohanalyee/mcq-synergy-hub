# Mock Test Generation: Root Cause + Unified Popularity-Driven Fill

## What I found (verified against live data)

**The popular test is "Junior Office Associate (BPS-13)"** — 65 attempts by 4 users in the last 14 days (next highest test: 3 attempts). Last attempt was minutes ago.

**Quota is NOT the problem.** Today's AI usage: 107 of the 1400 daily budget. Board-topic autofill and mock tests do share the same `ai_usage_logs` budget, but there is plenty of headroom, and no rate-limit rejections appear in the logs.

**The real blocker: the generator thinks the test is already full.**
`generate-job-test` computes `deficit = target - existing_approved` per section, where `target` is the section's share of the test's 100 questions. That test currently has **200 approved questions** — every section is already at or above its target:

```text
section                      target(100Q test)   existing
English (30%)                       30              60
Basic Computer & MS Office (30%)    30              30  (+30 more under legacy name "Basic Computer")
Mathematics (15%)                   15              30
General Knowledge (15%)             15              30
Analytical Reasoning (10%)          10              20
```

So every generation run — manual or queued — logs `status=success, requested=0, generated=0`. Nothing is broken and nothing errors; the system simply refuses to grow a pool past `target × pool_multiplier`. The Aug 11 log rows confirm exactly this: five sections, all "success", all zeros.

Consequence: a user taking the test repeatedly cycles a 200-question pool for a 100-question exam → repeat questions, exactly what was reported.

**Secondary issue found:** section names have drifted — questions exist under both `Basic Computer` and `Basic Computer & MS Office`. Coverage counting matches by exact subject string, so 30 questions are invisible to coverage/selection for that section.

## The plan

### Phase 1 — Unblock growth for popular tests (fixes tomorrow's problem)
- Add an explicit **growth target** to generation: instead of `target - existing`, use `max(target, desired_pool) - existing`, where `desired_pool` comes from the request (admin "Grow pool" input) or from `pool_multiplier`.
- Admin one-click **"Grow pool to N×"** on a mock test (default 5× the test length, i.e. 500 for a 100-Q test), which queues per-section deficits in the background queue that already exists.
- Immediate action for Junior Office Associate: grow to ~500 approved questions so 4-5 attempts stay non-repeating.
- Merge the drifted section names (`Basic Computer` → `Basic Computer & MS Office`) so existing questions count and get served.

### Phase 2 — Popularity-first background filling (Sprint Mode for mock tests)
- Build a popularity view from `job_test_progress` (attempts + distinct users, last 14 days) plus recent test sessions.
- A scheduled worker picks the top-N popular tests whose pool is below their growth target and enqueues section deficits, highest-popularity first, capped by a daily budget shared with board-topic autofill.
- Sudden spikes then self-heal: a test that jumps in attempts automatically rises to the front of the fill queue.

### Phase 3 — One dashboard for both systems
- Extend the existing Auto-Fill dashboard with a unified "Content Engine" view:
  - shared daily AI budget bar (board topics + mock tests in one place),
  - two worklists side by side: *Topics needing fill* and *Popular mock tests needing pool growth*,
  - Sprint Mode presets extended with mock-test scopes (e.g. Sindh Court / FIA / Teaching),
  - per-row action: enqueue, stop, and live queue status (reusing the existing realtime queue subscription).
- The current Mock Test Analytics dashboard stays, but the daily driving is done from the unified view.

### Guardrails kept
- Everything stays pre-generated and admin-approved — no on-demand AI during a user's test.
- Quality Gate keeps reviewing newly generated mock questions before they count as approved.
- Reuse-first stays: cross-test/board reuse is attempted before spending AI calls.

## Technical notes
- `supabase/functions/generate-job-test/index.ts`: replace the `deficit = target - existingApproved` gate with a `growTarget` parameter (falls back to `ceil(target * pool_multiplier)`); keep `reuseNeed` logic ahead of AI.
- `src/services/jobTestService.ts`: add `growJobTestPool(testId, multiplier)` that writes per-section rows into `job_test_generation_queue`.
- New DB function `get_mock_test_popularity()` (attempts/users per test, 14-day window) — note `job_test_progress.job_test_id` stores the slug, so it must be joined to `job_tests` by slug, not UUID.
- New cron-driven path inside the existing queue processor (`process-jobtest-queue`) for popularity-based enqueueing, sharing the `x-cron-token` auth already in place.
- Data cleanup migration for the `Basic Computer` → `Basic Computer & MS Office` subject rename.
