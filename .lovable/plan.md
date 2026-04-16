

# Fix: Ensure Edge Function is Fully Synchronous for Job Tests

## Problem
The edge function at line 991 auto-enables `autoPartial` mode when `qc > 20`. In partial mode (line 1364), it returns only cached questions and generates the rest via `EdgeRuntime.waitUntil` — those background-generated questions are lost because `JobTestsTab` creates the session AFTER collecting all responses.

Even for smaller quotas, if the cache has some questions, the partial mode returns them immediately and generates the rest in the background — breaking syllabus weightage.

## Root Cause
```
const isLargeRequest = qc > 20;
const autoPartial = usePartialMode || isLargeRequest;
```
This means any subject requesting >20 questions silently enters partial mode and returns incomplete results.

## Fix (2 changes)

### 1. `src/components/mock-tests/JobTestsTab.tsx` — Pass `partial_mode: false`
In the `supabase.functions.invoke("generate-test")` call (line 104-111), add `partial_mode: false` to the body. This explicitly tells the edge function: "Do NOT use background generation — wait for all questions synchronously."

### 2. `supabase/functions/generate-test/index.ts` — Respect explicit `partial_mode: false`
Change line 991 from:
```
const autoPartial = usePartialMode || isLargeRequest;
```
to:
```
const autoPartial = partial_mode === false ? false : (usePartialMode || isLargeRequest);
```
This ensures when `partial_mode` is explicitly set to `false`, the large-request auto-partial is disabled and the function waits for full AI generation before responding.

## Files to modify
| File | Change |
|------|--------|
| `src/components/mock-tests/JobTestsTab.tsx` | Add `partial_mode: false` to generate-test invoke body |
| `supabase/functions/generate-test/index.ts` | Respect explicit `partial_mode: false` override |

## Impact
- Job Tests will always get the EXACT number of questions requested per subject
- Other callers (Subject Tests, auto-fill) are unaffected — they don't pass `partial_mode: false`
- No structural rewrite needed — the architecture is already correct, just needs this flag

