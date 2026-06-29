# Mock Test Generation Speed Audit (findings only)

This is an investigation report. No code has been changed. Fixes at the bottom are proposals awaiting your approval.

## 1. USER path — what runs when a user starts a mock test

Entry: `src/components/mock-tests/JobTestsTab.tsx` → `handleStartJobTest`.

There are three sub-paths:

- **Isolated/definition path (fast, DB-only):** if `findDefinitionForTest` finds a published definition, it loads `getApprovedQuestionsForDefinition`, does Largest-Remainder quota math, samples questions, inserts a `custom_test_sessions` row, and navigates. No AI. This is the intended fast path.
- **Guest legacy path (DB-only):** `generateCustomTest` → `getQuestionBank` via the `get_practice_questions` RPC.
- **Authenticated legacy path (SLOW, AI):** when no definition exists, it runs a **sequential per-subject loop** that calls the `generate-test` edge function once per syllabus subject.

The slow authenticated loop (`JobTestsTab.tsx` ~lines 288–360) does, per subject, **before** even calling AI:

- `AICoachService.getExcludedQuestionIds(...)`
- `Promise.all([getAdaptiveDifficulty, getWeaknessFocusedTopics])`

then `await supabase.functions.invoke("generate-test", ...)` — **serially, one subject at a time**. Before the loop it also awaits `fetchJobTestProgress`, `findDefinitionForTest`, `getEffectiveSyllabus`, and `getUserAnsweredQuestionIds`.

Inside `supabase/functions/generate-test/index.ts` (2,600 lines), each call performs:

- `checkQuota` — a COUNT query on `ai_usage_logs` (`_shared/quotaManager.ts`).
- A large cache-lookup cascade against `content_items` (exact match, fuzzy match, legacy subject/topic variants, recent-questions) — roughly 10+ `content_items` queries (lines ~1029–1783, 1903).
- AI generation wrapped in `retryWithBackoff` (`maxRetries`, backoff **5s → 15s → 45s** on any 429/quota/rate-limit).
- `deduct_credits` RPC + `content_items` inserts + `ai_usage_logs` insert.

Net: user cost ≈ `N_subjects × (pre-invoke coach queries + full heavy edge-function run)`, fully serial.

## 2. ADMIN path — what runs when an admin generates questions

Entry: `src/components/admin/job-test/GeneratedQuestionsTable.tsx` → `handleGenerate` → `generateForSubject` (`jobTestService.ts`) → edge function `generate-job-test`.

`supabase/functions/generate-job-test/index.ts` (585 lines) is much leaner:

- Reads `job_test_definitions` once, generates in batches (`BATCH_SIZE=10`, `MAX_BATCHES=5`, 2s between batches), inserts into `job_test_questions`.
- **No** `content_items` cache cascade, **no** `checkQuota`, **no** `deduct_credits`, **no** per-subject AI-Coach queries.
- Admin generates **one subject per click** as a deliberate action — never an N-subject blocking chain.

Both paths ultimately call the same `callAIWithAutoSwitch` (Gemini → Lovable Gateway). Raw model speed is essentially equal; the gap is orchestration around it.

## 3. Comparison — what the user path has that admin doesn't


| Overhead                      | User (`generate-test`) | Admin (`generate-job-test`) |
| ----------------------------- | ---------------------- | --------------------------- |
| Calls per test                | N subjects, **serial** | 1 per click                 |
| Pre-AI coach DB queries       | 3 × N subjects         | none                        |
| `content_items` cache cascade | ~10+ queries/call      | none                        |
| `checkQuota` COUNT            | yes/call               | no                          |
| `deduct_credits` RPC          | yes/call               | no                          |
| Backoff on 429                | 5/15/45s sleeps        | none (direct)               |
| Pre-loop awaits               | 4 sequential           | 1                           |


## 4. DB-based (non-AI) loading review

- `testGenerationService.fetchSubjectQuota` is awaited **inside a sequential `for…of` loop** over subjects (no `Promise.all`) — sequential round trips, effectively N+1 by subject. It also issues a second fallback query when the first returns 0.
- `getQuestionBank` (authenticated) uses `content_items.select('*')` — fetches **all columns** including large text fields, then slices client-side (`limit * 3`). The `excludeIds` becomes a potentially huge `.not('id','in','(...)')` list, which is slow to parse/plan.
- Definition path's `getApprovedQuestionsForDefinition` loads the full approved pool and filters/shuffles client-side rather than sampling in SQL.

## 5. Estimate — how much slower, and biggest factor

For a 5-subject authenticated mock test (no definition), user latency ≈ `5 × (≈3 coach queries + quota COUNT + ~10 content_items queries + AI batch + credit deduct)`, all serial, versus admin's single lean call. Rough ballpark: **5–10× slower**, and dramatically worse (tens of seconds) whenever a 429 triggers the 5/15/45s backoff.

**Biggest contributing factor:** serial per-subject invocation of the heavy 2,600-line `generate-test` function, compounded by its `content_items` cache cascade and the multiplied AI-Coach pre-queries. The `retryWithBackoff` sleeps are the worst single latency spike under load.

## Proposed fixes (for your approval — not yet implemented)

1. **Parallelize per-subject generation** in `JobTestsTab` (bounded `Promise.all`) instead of the serial loop.
2. **Batch the AI-Coach pre-queries** once per test (or fetch all subjects' exclusions/difficulty in one round) rather than 3 queries × N subjects.
3. **Slim the `generate-test` cache cascade** — collapse the exact/fuzzy/legacy `content_items` lookups into one indexed query; select only needed columns instead of `*`.
4. **Tune `retryWithBackoff**` for user-interactive calls (shorter/fewer sleeps, fail fast to DB fallback) while keeping long backoff for background/admin jobs.
5. **Push sampling into SQL** for the definition and `getQuestionBank` paths (server-side limit/random, fewer columns) to cut payload and client filtering.
6. **Parallelize `fetchSubjectQuota**` across subjects.

Tell me which of these to implement and I'll switch to build mode with a focused change set.

&nbsp;

# **Approved — implement fixes #1, #2, and #3 only:**

1. Parallelize per-subject generation in JobTestsTab (replace the 

   serial for-loop with bounded Promise.all)

2. Batch the AI-Coach pre-queries once per test instead of 3 

   queries × N subjects

3. Slim the generate-test cache cascade — collapse the exact/

   fuzzy/legacy content_items lookups into one indexed query, 

   select only needed columns instead of *

IMPORTANT CONCERN — Bounded parallelization, not unbounded:

Mock tests can have anywhere from 3 to 10+ subjects. Please confirm 

the parallelization in #1 uses a CONCURRENCY LIMIT (e.g., process 

3-4 subjects at a time in batches), NOT firing all N subjects' AI 

calls simultaneously. Firing too many AI calls at once risks 

triggering MORE 429 rate-limit errors, which would be counter-

productive — the goal is speed without increasing failure risk.

Please tell me the exact concurrency limit you'll use and the 

reasoning behind that number (e.g., based on Gemini's per-minute 

RPM limit) before implementing.

DO NOT touch #4 (retry/backoff timing — the 5s/15s/45s sleeps). 

This backoff is an intentional safety net that keeps the system 

gracefully retrying instead of hard-failing when rate limits are 

hit. We are not changing this until we add multiple Gemini API 

key rotation (separate pending work, not yet implemented). Reducing 

backoff now would make rate-limit failures more frequent and more 

visible to users, not less.

Hold off on #5 and #6 (SQL-side sampling changes) for now — let's 

measure the impact of 1-3 first before going further.

After implementing, please:

1. Confirm the concurrency limit chosen and why

2. Confirm the existing 429 retry/backoff behavior is fully 

   unchanged and still triggers correctly

3. Provide before/after timing estimates for a typical 5-subject 

   and a 10-subject test, if possible

4. Test that test generation still works correctly end-to-end 

   (not just faster, but still produces correct, complete question 

   sets)

&nbsp;

I want concrete before/after numbers, not just "it will be faster" — please estimate based on the actual query/AI-call timings you found in the audit.