# Question Duplication — Audit + Smart Repetition Design

Audit-only. Findings first (with file/function names + DB measurements), then the proposed mechanism and exact selection algorithm. No code is changed until you approve.

## PART A — Audit Findings

### 1. AI generation DOES check for duplicates — but only against text, and only at insert time

`supabase/functions/generate-test/index.ts`:

- `generateQuestionFingerprint()` (line 131) builds an order-independent **top-8 keyword** fingerprint; `isDuplicateByFingerprint()` (145) blocks near-dupes **within the same generation run** (cross-batch memory via `fingerprints` Set, pre-seeded from existing questions at ~711).
- `checkDuplicate()` (~1026) checks the DB for an **exact title match** and a **first-50-char prefix** match. On hit it does NOT discard — it inserts the row with `status='flagged_duplicate'` and a `[POTENTIAL DUPLICATE]` title prefix (Human-in-the-Loop, "zero data loss").

Gaps:

- The prompt only tells the AI to avoid existing questions for the **current topic/subject scope** (avoid-list at ~736). Generic prompts like "English vocabulary" reliably steer the model to obvious words ("Diligent", "Meticulous"), so two independent calls for **different subjects** (IQ vs Vocabulary vs English) produce the same item — and each is a *different* subject scope, so neither sees the other's avoid-list.
- Detection is **lexical only** (keyword overlap / prefix), no semantic/embedding comparison. "Synonym of Diligent" vs "Antonym of Diligent" are different items but feel duplicative to users.

### 2. Duplicates survive as separate rows across subjects

Confirmed in the DB for the exact example you gave:

```
"What is the synonym of 'Diligent'?"          subject=IQ          exam=CSS   [flagged]
"What is the synonym of 'Diligent'?"          subject=Vocabulary  exam=CSS
"What is the antonym of the word 'Diligent'?" subject=English     exam=NULL
"...Junior Clerk's diligent maintenance..."   subject=Junior Clerk exam=FPSC
```

So the same/near text lives under **multiple ids, subjects and exam_categories**. Anti-repetition is keyed on **question id** (see #3), so excluding one id does nothing for its text-twins under other subjects.

### 3. DB-bank anti-repetition is id-based and leaks/under-covers

- `questionBankService.getQuestionBank()` excludes via `.not('id','in',(...))` using `filters.excludeIds` only.
- `getUserAnsweredQuestionIds()` reads the user's **last 50 `custom_test_sessions**` and unions every question id — a permanent, ever-growing exclusion (not a rolling window), which slowly **depletes small pools**.
- `AICoachService.getExcludedQuestions()` returns both ids AND `question_fingerprints`, but callers pass **only ids** into the query; the fingerprints are never used to block text-twins. So cross-row duplicates evade exclusion entirely.
- Exclusion is effectively cross-subject (the 50-session union isn't scoped per-subject in `getUserAnsweredQuestionIds`), so it both over-excludes globally and under-excludes per text.

### 4. Tracking is wired correctly, and is the right foundation

- `TestSession.tsx` (~374) calls `AICoachService.trackAttemptDetailed(...)` per question → writes `user_attempt_history` rows with `question_id`, `question_fingerprint`, `subject`, `topic`, `difficulty`, `is_correct`, `attempted_at`, `session_id`. **This is exactly the per-question correctness+timestamp history the new algorithm needs.**
- `getReinforcementPlan()` (~271) already does spaced repetition off `user_attempt_history`, but caps reinforcement at ~20% and is only consumed on the SubjectTests path, not uniformly.
- `gamification.processTestCompletion()` separately upserts `user_question_attempts` (id only, no correctness) — redundant with the richer history table.

DB row counts: `content_items` mcq = **8168**, `user_attempt_history` = **4951**, `user_performance` = **822**, `user_question_attempts` = **959**.

### 5. Small pools + subject fragmentation are a major root cause (not just a bug)

Subjects are stored as long descriptive strings, fragmenting the pool into tiny buckets:

```
"English Language: Grammar, vocabulary, synonyms, antonyms..."  → 3 rows
"General Knowledge & Everyday Science"                          → 1 row
"Vocabulary (English)" / "IQ (English & Reasoning)"            → handful
```

`fetchSubjectQuota()` filters `topic = subjectName` (exact) then falls back to `subject = subjectName` (exact). With 1–4 matching rows, **the same few questions are drawn every attempt regardless of exclusion** — statistically guaranteed repeats for vocabulary/GK.

### 6. Quantified duplication

- **Exact normalized-text duplicates:** 16 redundant rows (~0.2%) — small.
- **Near-duplicate keyword-fingerprint groups:** ~**222 rows / 8168 (≈2.7%)** sit in groups sharing the same significant-keyword set — concentrated in English (vocab/synonym/antonym), IQ/Reasoning, and Everyday Science/GK.
- Biggest contributor to the *felt* repetition is **#5 (tiny fragmented pools)** combined with **#3 (id-only exclusion that can't see text-twins)** — not the raw duplicate percentage.

## PART B — Proposed Smart Repetition System (design, not yet built)

### B1. Rolling-window "recently seen" (replace permanent exclusion)

Stop using the 50-session union. Derive a per-user, **per-subject** rolling window from `user_attempt_history`:

- Define a window of the user's **last N=3 attempts** (distinct `session_id`s) within that subject.
- Exclude a question id (and its **fingerprint twins**) only if it appears in those last 3 sessions.
- After 3 newer attempts pass, it becomes eligible again → no permanent depletion.

Implementation choice (no schema change needed): compute the window with a windowed query over `user_attempt_history` (rank distinct `session_id` by max `attempted_at` per subject, keep top 3, collect their `question_id` + `question_fingerprint`). Optionally add a `last_seen_attempt_no` helper later if we want O(1) lookups, but the query approach reuses existing data.

### B2. Correctness weighting (spaced repetition)

- **Correct** answers: deprioritized strongly — excluded for the full 3-attempt window, then return at lowest frequency, oldest-correct-first.
- **Wrong** answers: shorter cooldown (eligible after ~1 attempt) and boosted priority — they can resurface sooner. Reuse the existing `RETRY_INTERVALS_DAYS` spacing as a secondary signal.

### B3. Fingerprint-aware exclusion (kills cross-subject text-twins)

Extend exclusion to fingerprints, not just ids:

- Carry `question_fingerprint` (already stored on every `user_attempt_history` row and `content_items` can be fingerprinted) into selection.
- A candidate is rejected if its id **or** normalized fingerprint matches a recently-seen one — so "Synonym of Diligent" under a different subject id is correctly skipped.
- Requires either a `content_fingerprint` column on `content_items` (preferred, indexed, backfilled once) or computing it in the RPC. I recommend the **column + backfill migration** so the exclusion is cheap and the duplicate-flagging in `generate-test` can also dedupe across subjects.

### B4. Grow small pools instead of starving them

When, after applying the rolling window, the eligible pool for a subject/topic is below the requested count (the existing `deficit`), trigger the existing `generate-test` fill — but pass the recently-seen **avoid-list across the whole subject** (not just current scope) so AI produces genuinely new items rather than re-deriving "Diligent". This directly addresses the finite-vocabulary topics.

### B5. Target composition algorithm (per returning user, per subject/topic)

For each new test of size `Q`, build three buckets from `user_attempt_history` (scoped to subject/topic):

```text
WRONG  pool: questions last answered incorrectly, outside the wrong-cooldown,
             ordered OLDEST-wrong-first (oldest attempted_at first)
FRESH  pool: content_items the user has NEVER seen (id+fingerprint not in history)
CORRECT pool: questions last answered correctly, OUTSIDE the 3-attempt window,
             ordered oldest-correct-first
```

Target mix (then normalize to availability):

```text
wantWrong   = round(Q * 0.35)
wantCorrect = round(Q * 0.12)
wantFresh   = Q - wantWrong - wantCorrect      // ~0.53 nominal, absorbs slack
```

Proportional rebalancing rules:

1. If `WRONG` has fewer than `wantWrong`, take all available wrong; **redirect the shortfall to FRESH** (no artificial repeats).
2. If `FRESH` runs short (small pool), take the FRESH deficit from `CORRECT` (oldest-first); if still short, trigger B4 AI fill for the remainder.
3. If the user has many wrong answers (e.g. 10+ tests), `WRONG` is capped at `wantWrong` but ordered oldest-first so nothing stays permanently unrevisited.
4. `CORRECT` never exceeds `wantCorrect` and is always the lowest-priority filler.

All three queries filter by the same subject/topic and apply the B1 window + B3 fingerprint exclusion, so buckets never cross-contaminate unrelated subjects.

Scoring form (single weighted query alternative): rank candidates by
`priority = w_wrong*isWrongDue + w_fresh*isUnseen + w_correct*isCorrectEligible`, tie-broken by `attempted_at ASC` (oldest first), `usage_count ASC` (existing freshness rotation), then random — selecting top `Q`.

### B6. Where it plugs in

- New method `AICoachService.getSelectionPlan(userId, subject, topic, Q)` returning `{ wrongIds, freshFilter, correctIds, avoidFingerprints }`.
- `testGenerationService.generateCustomTest` / `fetchSubjectQuota` consume it: fetch FRESH via `getQuestionBank` (now fingerprint-excluding), prepend WRONG, backfill CORRECT, then AI-fill any residual deficit.
- Applies on all returning-user paths: `JobTestsTab`, `SubjectTestsTab`, `useStartQuickTest`.

### Technical notes / required changes (for the build phase)

- Migration: add `content_items.content_fingerprint text` + index; backfill via normalized-keyword fingerprint; optionally a `get_practice_questions` RPC param `p_exclude_fingerprints text[]` so guests/auth share one exclusion path.
- Reuse existing `user_attempt_history` (no new tracking table needed) — the rolling window and buckets are all derivable from it.
- Consider a one-time cleanup pass to set `status='flagged_duplicate'` (or merge) on the ~222 near-dup rows so they leave the active reuse pool. (Optional, reversible — they are never hard-deleted, per project memory.)
- Keep `retryWithBackoff` and quota logic untouched.

Confirm the target percentages (35 / 53 / 12), the window size (N=3), and whether to add the `content_fingerprint` column, and I'll implement.

&nbsp;

# **Confirmed decisions on the Smart Repetition design:**

1. TARGET PERCENTAGES (adjusted from your proposal, for better 

   user retention/motivation):

   - Wrong: 30% (not 35%) — avoid making tests feel punitive

   - Fresh: 55% (not 53%) — maximize the "this feels new" effect

   - Correct: 15% (not 12%) — occasional easy wins keep confidence up

   

   Reasoning: too much "wrong repeat" weight risks discouraging 

   struggling users into churning. This mix biases toward freshness 

   and confidence-building while still reinforcing mistakes.

2. ROLLING WINDOW — make it ADAPTIVE, not fixed N=3:

   - For subjects/topics with LARGE pools (e.g., 1000+ questions): 

     use a longer window (e.g., N=5)

   - For subjects/topics with SMALL pools (e.g., under 20-30 

     questions, like the fragmented vocabulary/GK ones you found): 

     use a shorter window (e.g., N=2)

   - This prevents the rolling window itself from starving small 

     pools while still maximizing freshness where there's enough 

     content.

   - Please propose the exact threshold logic (what counts as 

     "large" vs "small" pool) before implementing.

3. content_fingerprint column — YES, add it. This is needed to 

   catch cross-subject text-twins like the "Diligent" example, 

   which is the actual root cause of the felt repetition you found 

   in the audit (not just raw duplicate %).

4. GUESTS — explicitly OUT OF SCOPE for this repetition system. 

   Guests already have a different intentional strategy (smaller 

   question caps + sign-in prompts to encourage account creation) — 

   adding repetition-control complexity for guests isn't worth it 

   given that existing design intent. Leave guest behavior exactly 

   as-is.

5. Also proceed with B4 (AI-fill for small pools) as proposed — 

   this is important for subjects like vocabulary/GK where the 

   pool is too small regardless of exclusion logic.

Please propose the adaptive window thresholds, then proceed with 

implementation once confirmed.