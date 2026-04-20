

# Centralized AI Coach System — Phase 3: Intelligence Dashboard

## Reality check vs. user's spec

| Assumed | Actual | Resolution |
|---|---|---|
| `user_attempt_history` doesn't exist | Confirmed — only `user_performance` exists | Create new table |
| `recommended_tests` table is empty/unused | **Already exists** with subject_name, topic_name, weakness_percentage, status fields | Reuse for "Recommended Actions" instead of duplicating |
| Achievements are net-new | `badges` table exists (name, description, icon, category) | Reuse `badges` + new `user_badges` join, OR computed-only in Phase 3 |
| `getStudyPlan` is net-new | `src/lib/aiCoach.ts` already has `generateStudyPlan()` used by `StudyPlanSection` on Analytics page | Extend existing helper, don't duplicate |
| New `/ai-coach` route | `/analytics` (PersonalCoach) already the post-login destination per memory `ai-personal-coach-dashboard` | Mount dashboard sections on `/analytics`; add `/ai-coach` as alias |
| `time_taken_seconds` per question | TestSession has overall `timeTaken` but no per-question timing — needs new state | Add `questionStartTime` ref, reset on next |
| `test_type` detection | `custom_test_sessions` has no explicit `test_type` column — derive from session_name pattern (`Job Test:`, `Subject:`) | Pass from caller (TestSession knows source) |

## Scope (Phase 3)

1. **DB**: new `user_attempt_history` table (RLS: user own + admin select). Computed achievements only — no new badge table in Phase 3.
2. **Service** (`aiCoachService.ts`): add `trackAttemptDetailed`, `getWeeklyTrend`, `getSubjectBreakdown`, `getDailyStreak`, `getStudyPlan`, `getAchievements` (6 methods).
3. **TestSession**: per-question timing + dual tracking (existing `trackQuestionAttempt` + new `trackAttemptDetailed`); `test_type` inferred from session_name; achievement-unlock toast on submit.
4. **Dashboard**: extend existing `/analytics` page with new sections (Weekly Trend chart, Subject Breakdown bars, Achievements grid). Don't create a duplicate `/ai-coach` page — alias-route `/ai-coach → /analytics` so the user's prompt link works.
5. **JobTestsTab**: post-test toast with "View Dashboard" action.

Out of scope: new badges table, gamification confetti (already exists per memory `universal-gamification-system`), PDF export, social share, push notifications, leaderboards, email digest.

## Plan details

### 1. Migration
```sql
CREATE TABLE public.user_attempt_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id uuid,
  question_fingerprint text NOT NULL,
  question_id text,
  subject text NOT NULL,
  topic text NOT NULL DEFAULT '',
  difficulty text NOT NULL DEFAULT 'medium',
  is_correct boolean NOT NULL,
  time_taken_seconds int,
  test_type text NOT NULL DEFAULT 'practice',  -- 'job_test'|'subject_test'|'practice'|'syllabus'
  attempted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_attempt_user_date ON user_attempt_history(user_id, attempted_at DESC);
CREATE INDEX idx_attempt_user_subject ON user_attempt_history(user_id, subject, attempted_at DESC);
CREATE INDEX idx_attempt_session ON user_attempt_history(session_id);
ALTER TABLE user_attempt_history ENABLE ROW LEVEL SECURITY;
-- INSERT/SELECT/UPDATE: auth.uid() = user_id
-- SELECT for admins via is_admin()
```
No FK to `auth.users` (project rule). No DELETE policy (immutable history).

### 2. `aiCoachService.ts` additions
- **trackAttemptDetailed**: single INSERT, also calls existing `trackQuestionAttempt` so aggregate stays in sync. Safe: returns void, swallows errors.
- **getWeeklyTrend(8 weeks)**: GROUP BY `date_trunc('week', attempted_at)` via SQL or client-side aggregation; returns `{ week, accuracy, totalAttempts }[]`.
- **getSubjectBreakdown**: reuses existing `analyzeUserWeakness` + cross-references attempt counts.
- **getDailyStreak**: reuses existing `getProgressMetrics.streakDays` + computes `longestStreak` from distinct attempt dates.
- **getStudyPlan(7d)**: combines `getTopicsNeedingRetry` + `getWeaknessFocusedTopics`; round-robin schedule across 7 days.
- **getAchievements**: 6 computed achievements from existing data:
  - First Steps (≥1 attempt), Century Club (≥100), Dedicated Learner (streak ≥7), Subject Master (any subject ≥90% with ≥10 attempts), Weakness Warrior (improvement ≥30 in any subject), Perfect Score (any session 100%). Last requires `custom_test_sessions` history scan.

### 3. `TestSession.tsx`
- Add `useRef<number>(Date.now())` for `questionStartTime`.
- On answer submit: compute `timeTaken`, fire `trackAttemptDetailed(...)` non-blocking, reset ref.
- Derive `test_type` from `session_name`: starts with `Job Test:` → 'job_test'; starts with `Subject:` → 'subject_test'; else 'practice'.
- After test ends: call `getAchievements`, diff against pre-test snapshot stored in sessionStorage; if new unlock → `toast.success` with trophy icon (no extra confetti — existing system handles).

### 4. Dashboard sections (extend `src/pages/Analytics.tsx`)
New components in `src/components/ai-coach/`:
- `WeeklyTrendChart.tsx` — recharts LineChart, 8 weeks, color band by accuracy.
- `SubjectBreakdown.tsx` — Tailwind horizontal bars, sorted by weakness DESC.
- `AchievementsGrid.tsx` — 6-card grid with locked/unlocked states + progress %.
- `StudyPlanCalendar.tsx` — 7-day Mon-Sun grid with subject codes (replaces or augments existing `StudyPlanSection`).

Mount order on `/analytics`: Hero stats (existing) → WeeklyTrendChart → SubjectBreakdown → existing ProgressIndicator → StudyPlanCalendar → AchievementsGrid.

### 5. Route alias + nav
- Add `/ai-coach` route in router pointing to same `Analytics` component.
- `JobTestsTab` post-completion: enhance existing toast with `action: { label: 'View Insights', onClick: () => navigate('/analytics') }`.

## Files
| File | Action |
|---|---|
| Migration | CREATE `user_attempt_history` + RLS |
| `src/services/aiCoachService.ts` | EXTEND — 6 new methods |
| `src/pages/TestSession.tsx` | MODIFY — per-q timing + detailed tracking + achievement toast |
| `src/pages/Analytics.tsx` | MODIFY — mount 4 new sections |
| `src/components/ai-coach/WeeklyTrendChart.tsx` | CREATE |
| `src/components/ai-coach/SubjectBreakdown.tsx` | CREATE |
| `src/components/ai-coach/AchievementsGrid.tsx` | CREATE |
| `src/components/ai-coach/StudyPlanCalendar.tsx` | CREATE |
| `src/App.tsx` (or router file) | ADD `/ai-coach` alias route |
| `src/components/mock-tests/JobTestsTab.tsx` | MODIFY — post-test toast action |

## Risks & mitigations
- **Empty data for new users** → all components render skeletons + friendly empty states; achievements show locked with 0% progress.
- **Dual-write divergence** (history vs aggregate) → `trackAttemptDetailed` always calls `trackQuestionAttempt` first; on aggregate failure, history still inserts.
- **Per-question timer reset on tab switch** → `Date.now()` is wall clock, immune to React re-renders; acceptable that pause/resume isn't excluded (Phase 4 problem).
- **Dashboard query cost** → all queries indexed on `(user_id, attempted_at DESC)`; weekly trend pulls last 8w only; cache via React Query 60s stale.
- **`test_type` inference fragile** → naming convention is project-stable per memory; if pattern unknown → 'practice' fallback.

## Out of scope (explicit)
- New `badges` rows or `user_badges` table (achievements computed live)
- PDF export, social share, push notifications, leaderboards, email digest
- Anti-cheat per-question timer (pause/blur handling)
- SubjectTestsTab post-test toast (Phase 1/2 already covered)
- Per-question explanations analytics

