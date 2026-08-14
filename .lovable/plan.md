# Demand-Driven Content Scaling — Audit + Plan (Larkana banner readiness)

Report first. No code changes in this turn.

## 1. Mock Tests: is the growth target fixed today?

Verified in code — **yes, today it is fixed and it does stop.**

- `job_test_definitions.pool_multiplier` defaults to `2.0` (per-test column; some tests are set higher).
- `get_mock_test_popularity` computes `grow_target = ceil(exam_length * pool_multiplier)` and `pool_deficit = grow_target - approved_pool`.
- `process-jobtest-queue` popularity-fill only enqueues rows where `pool_deficit > 0`, and per section skips when `count >= ceil(section_target * multiplier)`.

Consequence: popularity decides **ordering only**, never the size of the target. Once a test's pool reaches `exam_length × multiplier`, the deficit is 0 and growth stops permanently — even if 100+ students hammer it in one day. This is exactly the "stuck at 300-400" ceiling being worried about.

Also note the growth trigger is `attempts > 0` over a 14-day window, so it is cumulative volume, not velocity: a test with 200 attempts in 24 hours and one with 3 attempts in two weeks are treated the same once both are at target.

## 2. Is there an alert/dashboard signal for "consuming its pool too fast"?

No. Verified: the popularity/engine panels show attempts, distinct users, approved pool, grow target and deficit — all **static-target** views. There is no consumption-rate metric, no burn signal, and no "raise the target" recommendation anywhere.

## 3. Proposal — Dynamic Scaling Rule (velocity-driven target)

Add a demand tier that raises the effective multiplier automatically, with a hard ceiling so cost stays bounded.

Signals per test (computed in SQL, 24h + 7d windows):
- `attempts_24h`, `distinct_users_24h`
- `questions_consumed_24h ≈ attempts_24h × exam_length`
- `burn_rate_24h = questions_consumed_24h / approved_pool`

Tier ladder (applied on top of the test's configured `pool_multiplier`):

```text
burn_rate_24h        demand tier   effective multiplier
< 0.15               steady        base (unchanged)
0.15 – 0.30          warm          base × 1.5
0.30 – 0.60          hot           base × 2.0
> 0.60               surge         base × 3.0  (campaign ceiling)
```

Rules:
- Effective multiplier is capped at an admin-configurable `max_pool_multiplier` (default 6.0) and the pool at an absolute `max_pool_per_test` (default 1500) so nothing runs away.
- Tier can also **cool down**: if burn stays under 0.10 for 7 days, the effective multiplier decays back toward base (target never shrinks the existing pool — it just stops growing).
- Existing reuse order is untouched: alias-aware shared pools and concept-group rotation are tried first; AI only fills the residual deficit. So a hot Sindh-court test still borrows GK/English from sibling tests before spending a single AI call.
- Auto-scaling is gated by an `enabled` flag plus the existing daily AI quota guard, so it can never outrun the budget.

Admin surface:
- New "Demand" column set in the Mock Test Engine panel: attempts 24h, burn %, demand tier badge (Steady / Warm / Hot / Surge), effective target vs current pool.
- A "Scaling up" toast/banner and an admin notification row when a test enters Hot or Surge, so growth is visible rather than silent.
- Manual override per test: pin a multiplier, or exclude a test from auto-scaling.

## 4. Board/Topic Autofill + Sprint Mode: does it ever "finish" and stop?

Verified — **yes, it currently declares completion and stops.**

- `get_autofill_queue` returns only topics below `auto_fill_config.min_threshold`, and `questions_needed = least(batch_size, threshold - current_count)`. Once every in-scope topic reaches the threshold, the queue returns zero rows and every run is a no-op ("No queued topics match…").
- Sprint Mode narrows this further by keyword scope; it does not change the threshold, so a sprint ends as soon as its scoped topics hit the same flat threshold.
- Run size is bounded by `HARD_BATCH_LIMIT = 20`, `DEFAULT_RUN_TARGET = 600`, hard-capped at 1500/run, plus the 1400/day quota guard.

Proposed change — **depth ladder instead of a single flat threshold**, so autofill keeps monitoring and never calls a topic "done" prematurely:

```text
tier    target per topic   promotion condition
T1      8                  baseline (indexability floor)
T2      15                 topic has any pageviews or quiz attempts
T3      30                 topic in a sprint keyword scope, or >100 views/30d
T4      60                 top-traffic topics, or repeat-question signal detected
```

Plus a demand hook: when a topic's questions are being consumed faster than they are added (repeat-rate signal from usage_count/last_used_at), it is promoted one tier automatically. Admin panel shows tier distribution and how many topics sit at each tier, so "genuinely deep enough" becomes a visible number rather than an assumption.

## 5. Larkana campaign — temporary higher budget (pre-buffer, not reactive)

Add a **Campaign Surge window** as an explicit, time-boxed config (not a permanent budget raise):

- `campaign_surge` setting: `{ enabled, label, starts_at, ends_at, daily_budget, min_multiplier, sprint_keywords }`.
- While the window is active: sprint `daily_budget` raised (e.g. 600 → 1200/day, still under the 1400 quota guard), every popular test's effective multiplier floored at `min_multiplier` (e.g. 3.0), and Larkana-relevant scopes (MDCAT, Sindh boards Class 9-12, SPSC/CCE, STS-NTS) put at the front of the sprint queue.
- Auto-expiry at `ends_at` back to normal settings, so nobody has to remember to turn it off.
- Pre-warm run: a one-off admin action that queues pool growth for the top N popular tests **before** the banner goes up, so the buffer exists on day one instead of being generated while students are queuing.
- Countdown + spend-so-far shown in the admin panel during the window.

Recommendation: turn the surge window on 3-4 days before the banner is printed, so generation and manual approval both have runway.

## Suggested phasing

- **Phase 1 (before banner — critical):** velocity metrics RPC + demand tier ladder for mock tests, with caps; Demand columns and Hot/Surge badges in the engine panel; Campaign Surge window + pre-warm run.
- **Phase 2 (campaign week 1):** board/topic depth ladder replacing the flat threshold, with tier distribution in the admin panel.
- **Phase 3 (after data):** cooldown/decay tuning, repeat-rate promotion signal for topics, and per-test manual overrides.

## Technical notes

New DB objects: `get_mock_test_demand(p_hours)` SECURITY DEFINER RPC (admin/service_role only, same gate pattern as `get_mock_test_popularity`) returning attempts/burn/tier/effective target; `system_settings` keys `dynamic_scaling_config` and `campaign_surge`; optional `pool_scaling_events` audit table (admin-read via `is_admin()`, service_role write) so every automatic target raise is traceable. `process-jobtest-queue` popularity-fill reads the effective multiplier instead of the raw `pool_multiplier`; `scheduled-autofill` reads the depth tier instead of the single `min_threshold`. Approval stays 100% manual — generated questions remain drafts. All new tables get explicit GRANTs plus RLS; existing brand tokens and admin panel layout reused, no new colors or components style.
