

# Centralized AI Coach System — Phase 2: Adaptive Intelligence

## Reality check vs. user's spec

| Assumed | Actual | Resolution |
|---|---|---|
| `getTopicsNeedingRetry()` exists | Not built yet | Add as part of Phase 2 |
| `subjectName` field on deficit | Code uses `item.subject` | Use existing variable name |
| Edge fn supports `weakTopics` param | Doesn't yet | Add + thread into prompt |
| TestSession has clean "after test ends" hook | Submit handler exists; tracking already wired in Phase 1 | Reuse same hook for retry suggestions |
| 50+ attempts already collected | Phase 1 just shipped — likely 0–few | Phase 2 will work but recommendations will be weak until data accumulates. Acceptable. |
| Progress chart UI | No charting lib confirmed for this surface | Use existing `recharts` (already in `WeeklyProgressChart`) |

## Scope (Phase 2 only)

1. Extend `AICoachService` with 5 new methods (adaptive difficulty, weak-topic focus, spaced repetition, progress metrics, retry queue).
2. Edge function `generate-test`: accept optional `weakTopics: string[]` and inject focused-instruction block into prompt.
3. Wire `JobTestsTab` to pass `adaptiveDifficulty` + `weakTopics` per subject and show a one-line toast describing the focus.
4. New component `src/components/ai-coach/ProgressIndicator.tsx` — weakness bars + retry queue. Mount on `/analytics` (AI Personal Coach page) only for now (avoid sprinkling everywhere).
5. `TestSession`: after submit, fire `getTopicsNeedingRetry` and show one non-blocking toast.

Out of scope: rewriting SubjectTestsTab, SyllabusBuilder, dashboard widgets, full charting page.

## Plan details

### 1. `aiCoachService.ts` — new methods (no DB schema changes needed)
All 5 read from existing `user_performance` rows.

```ts
getAdaptiveDifficulty(userId, subject): 'easy'|'medium'|'hard'
  // last 20 attempts via aggregated wrong/correct on subject rows
  // 24h cooldown stored in localStorage key `aicoach:diff:{userId}:{subject}` → {level, ts}

getWeaknessFocusedTopics(userId, subject, count): { topic, weaknessScore, lastAttemptedAt }[]
  // ORDER BY weakness_score DESC LIMIT count, only topics with total_attempts > 0

shouldRetestTopic(userId, subject, topic): { due: boolean, nextRetry: Date }
  // intervals [1,3,7,14] days, picked by # of times topic was wrong-dominant
  // base = last_attempted_at

getTopicsNeedingRetry(userId, limit=3): { subject, topic, daysAgo }[]
  // wrapper: scan all weak rows (score > 60), filter by shouldRetestTopic.due

getProgressMetrics(userId, subject?): { totalAttempts, accuracyRate, weaknessImprovement, streakDays }
  // weaknessImprovement = avg(score) - avg(score from rows older than 7d) — best-effort with current schema (no per-attempt history yet)
  // streakDays computed from distinct days in last_attempted_at across all rows
```
All methods safe-by-default (return zeros / empty arrays on error).

### 2. Edge function `generate-test/index.ts`
- Parse `weakTopics?: string[]` from body. Sanitize: strings only, max 10 items, max 80 chars each.
- In the prompt builder block (where Pakistani-exam standards are appended), insert when array non-empty:
  ```
  CRITICAL — focus 70% of questions on these weak topics:
  - <t1>
  - <t2>
  Make them progressively harder within these topics.
  ```
- Backward compatible (omitted → behaves as today).

### 3. `JobTestsTab.tsx`
- Inside the per-subject loop, before invoke:
  ```ts
  const adaptive = user ? await AICoachService.getAdaptiveDifficulty(user.id, item.subject) : null;
  const weak = user ? await AICoachService.getWeaknessFocusedTopics(user.id, item.subject, 5) : [];
  ```
- Pass `difficulty: settings.difficulty === 'mixed' && adaptive ? adaptive : <existing>` and `weakTopics: weak.map(w=>w.topic)`.
- Single aggregated toast (after all subjects resolved, before navigate) listing top 1–3 focus topics, only if any.

### 4. `src/components/ai-coach/ProgressIndicator.tsx`
- Props: `userId`, optional `subject`.
- Renders:
  - Top weakest topics list with horizontal weakness bars (Tailwind, no extra lib).
  - Retry queue (next 3 from `getTopicsNeedingRetry`).
  - Compact metrics row: Attempts · Accuracy · Streak.
- Mount on `src/pages/PersonalCoach.tsx` (or whatever `/analytics` page file is — I'll confirm path before wiring).

### 5. `TestSession.tsx`
- In existing submit handler (where Phase 1 tracking fires), after tracking calls:
  ```ts
  AICoachService.getTopicsNeedingRetry(user.id, 1)
    .then(rows => rows[0] && toast.info(`Tip: revisit ${rows[0].topic} (last seen ${rows[0].daysAgo}d ago)`, { duration: 6000 }))
    .catch(()=>{});
  ```
- Non-blocking; never delays result screen.

## Files
| File | Action |
|---|---|
| `src/services/aiCoachService.ts` | EXTEND — add 5 methods + localStorage cooldown helper |
| `supabase/functions/generate-test/index.ts` | MODIFY — accept + inject `weakTopics` |
| `src/components/mock-tests/JobTestsTab.tsx` | MODIFY — fetch adaptive + weak, pass to invoke, summary toast |
| `src/components/ai-coach/ProgressIndicator.tsx` | CREATE |
| `src/pages/PersonalCoach.tsx` (or `/analytics` page) | MODIFY — mount `<ProgressIndicator />` |
| `src/pages/TestSession.tsx` | MODIFY — retry-suggestion toast post-submit |

## Risks & mitigations
- **Sparse data** → all methods degrade gracefully (empty arrays, neutral difficulty `'medium'`).
- **Difficulty thrashing** → 24h localStorage cooldown.
- **Prompt length blow-up** → cap `weakTopics` server-side at 10 × 80 chars.
- **Edge fn cache hits ignore weakTopics** → expected; weak-focus only affects newly generated questions, not cached ones. Acceptable for Phase 2.
- **Analytics page path unknown** → will read `src/pages/` to confirm correct file before mounting `ProgressIndicator`.

## Out of scope for Phase 2 (explicit)
- SubjectTestsTab / SyllabusBuilder integration
- Per-attempt history table (would enable proper trend graphs — Phase 3)
- Server-side cooldown (localStorage is fine for single-user-device scope)
- Recharts-based trend line (deferred until per-attempt history exists)

