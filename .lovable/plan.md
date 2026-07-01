# Smart Repetition for Mock Tests (JobTestsTab)

## Short answer

For **now**, the rolling-window-only approach in `JobTestsTab` is **sufficient and correct** — the exact 30/55/15 mix is **not** a drop-in fit, and forcing it in would be a separate, larger follow-up task. Recommendation: **keep JobTestsTab on rolling-window-only for this milestone**, and treat the full-mix integration as an opt-in follow-up (design below).

## Why the mix doesn't drop in cleanly

The two tabs use fundamentally different engines:


| &nbsp;                    | SubjectTestsTab                                              | JobTestsTab (Mock Tests)                                                  |
| ------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Source of questions       | Question **bank** (real stored rows)                         | **AI-generated** per subject via `generate-test` edge fn                  |
| "Wrong"/"Correct" buckets | Real previously-answered questions pulled by id from history | No equivalent — questions are freshly generated, not recalled             |
| Composition unit          | One subject/topic, single `composeSmartTest` call            | Many subjects, per-subject quota + per-subject AI call, run in waves of 3 |
| Recency handling          | `excludeFingerprints` + `excludeIds`                         | Rolling-window `excludeIds` from `getBatchCoachData` (already wired)      |


`composeSmartTest` assumes a single subject/topic and a bank to draw wrong/fresh/correct from. JobTestsTab is multi-subject and AI-first, so the wrong/correct buckets would frequently be empty or tiny, collapsing the mix back toward "all fresh" anyway.

## If you DO want the full mix in Mock Tests (follow-up task)

This is the proposed integration, scoped as its own task:

### Approach: per-subject hybrid (bank buckets + AI fresh-fill)

Replace each subject's single `generate-test` call with a `composeSmartTest`-style flow, run inside the existing wave-of-3 parallelism:

```text
for each subject (in waves of 3):
  plan = getSelectionPlan(user, subject, undefined, subjectQuota)
     -> wrong/correct buckets from user_attempt_history (already exists)
  wrongQs   = getQuestionsByIds(plan.wrongIds)        // 30%
  freshFromBank = bank query, excl ids+fingerprints   // part of 55%
  correctQs = getQuestionsByIds(plan.correctIds)      // 15%
  deficit = subjectQuota - (wrong + freshFromBank + correct)
  if deficit > 0:
     call generate-test for `deficit` only            // AI fills remaining fresh
  assemble + dedup by id AND fingerprint
```

### Concrete changes

1. `**composeSmartTest` generalization** (`testGenerationService.ts`): accept an optional per-subject quota and return the same `{questions, deficit, freshExcludeIds, freshExcludeFingerprints, mix}` shape it already returns — reuse as-is per subject.
2. `**JobTestsTab` authenticated legacy path**: in `generateForItem`, call `composeSmartTest(user.id, item.subject, undefined, item.requested, {difficulty, examCategory})` first; only invoke `generate-test` for the returned `deficit` (mirrors how SubjectTestsTab already bridges deficit → AI).
3. **Keep the isolated `job_test_definitions` path unchanged** — it serves curated approved questions and should not be reshaped by spaced-repetition.
4. **Guests unchanged** — out of scope per prior decision.
5. **Progress dialog**: `GenerationProgress` per subject should reflect bank-pulled + AI-filled counts (minor wording/state update).

### Risks / trade-offs

- Mock Tests would shift from "always-fresh AI" to "spaced-repetition reuse," which changes their feel — users may re-see prior wrong questions inside a job mock. Confirm that's desired for exam-style mocks (some users expect mocks to always be new).
- Per-subject bucket sizes are small, so the realized mix will often rebalance toward fresh anyway (same rebalancing logic as `composeSmartTest`).
- Slightly more DB reads per subject (history lookups), offset by fewer AI calls (deficit-only).

## What I'd expect you to confirm

- **Option A (recommended):** Leave JobTestsTab on rolling-window-only now; log the full-mix integration as a future task.
- **Option B:** Implement the per-subject hybrid above as the next task.

No code changes are made under this plan until you pick A or B.

&nbsp;

# **Confirmed — going with Option A: leave JobTestsTab (Mock Tests) on** 

rolling-window-only. The full 30/55/15 mix is intentionally NOT 

applied here, since Mock Tests should feel like fresh exam 

simulations, not spaced-repetition practice. This matches the 

real-world expectation that a mock exam paper is always new.

The full mix stays exclusive to SubjectTestsTab (topic-wise practice/

revision), where repetition is actually beneficial for learning.

No further changes needed here — this task (Smart Repetition) is 

complete. Log the per-subject hybrid (Option B) as a potential 

future task only if we decide later that Mock Tests should also 

support revision-style repetition.