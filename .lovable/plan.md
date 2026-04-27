# Dedicated Quiz Player — Decouple from Mock Test UI

The Quizzes page currently routes into `TestSession.tsx` (the formal Mock Test player with Syllabus Map sidebar, Question Palette, global timer, and end-of-test results). Quizzes need a casual, gamified, fast-paced experience instead.

## Approach

Create a brand-new route + page **`QuizPlayer.tsx`** at **`/quiz-session/:id`**, leaving `TestSession.tsx` (Mock Tests, Job Tests, Syllabus Builder) completely untouched. Quizzes will continue to persist into the existing `custom_test_sessions` table — only the player surface changes.

This keeps risk low (zero regressions to Mock Tests) and gives Quizzes a totally separate UI/UX track.

## What the new Quiz Player looks like

```text
┌──────────────────────────────────────────────┐
│  ← Exit         Topic Quiz · Famous Battles  │
│  ▰▰▰▱▱▱▱▱▱▱  Q 4 / 10                        │
│  🔥 3 streak     ⭐ Score: 30                 │
│                                              │
│      ⏱ 00:18  (per-question countdown)       │
│                                              │
│   ┌────────────────────────────────────┐     │
│   │  Which angel delivered revelations │     │
│   │  to Prophet Muhammad?              │     │
│   │                                    │     │
│   │  [ A · Angel Mika'il ]             │     │
│   │  [ B · Angel Israfil ]             │     │
│   │  [ C · Angel Jibreel ] ✅ green     │     │
│   │  [ D · Angel Azrael  ]             │     │
│   │                                    │     │
│   │  💡 Explanation: Jibreel (Gabriel) │     │
│   │     is the angel of revelation...  │     │
│   │                                    │     │
│   │              [ Next Question → ]   │     │
│   └────────────────────────────────────┘     │
└──────────────────────────────────────────────┘
```

No left sidebar. No right palette. Centered, large typography, big tap-friendly option buttons.

## Feature specification

1. **Clean centered layout** — single column, max-w-2xl, no Syllabus Map, no Question Palette, no flag/review controls. Linear progression only (no jumping back).

2. **Instant feedback on click**
   - User taps an option → the option locks in immediately.
   - Correct option turns green with a check; if the user picked wrong, their pick turns red and the correct one is revealed in green.
   - Explanation card slides in below the options.
   - "Next Question →" button appears (auto-advance after 4s as a fallback so it stays fast-paced).

3. **Per-question timer (Time Attack)**
   - Default: **20 seconds per question** (derived from session `time_limit / question_count`, clamped to 10–45s).
   - Visual ring/bar countdown above the question.
   - Timer expiring = auto-mark as wrong, reveal answer, show "Next" button.
   - No global exam timer.

4. **Gamification**
   - **Streak counter** with flame icon, increments on consecutive correct, resets on wrong/timeout. Shows "🔥 3 in a row!" toast at 3, 5, 10.
   - **Score counter** — +10 per correct, +5 bonus if answered in <5s ("⚡ Speed bonus!").
   - **Confetti** on quiz completion if score ≥ 80%.
   - Light haptic-feel animations (scale/pulse) on correct answers using existing framer-motion.

5. **Results screen** (replaces in-place at end)
   - Large score, accuracy %, max streak, time taken.
   - Buttons: "Play Again" (back to /quizzes), "Review Answers" (collapsible list), "Try Another Topic".
   - Reuses the existing `processTestCompletion` gamification util so XP/badges/achievements stay consistent with the rest of the platform.

## Files to add / change

**New**
- `src/pages/QuizPlayer.tsx` — the new player (loads from `custom_test_sessions`, runs the gamified UI, writes results back via the same evaluation utilities `resolveCorrectAnswer` / `checkUserAnswer` from `src/lib/testEvaluation.ts`).
- `src/components/quiz/QuizOption.tsx` — the large option button with idle/correct/incorrect/revealed states.
- `src/components/quiz/QuizTimerRing.tsx` — circular per-question countdown.
- `src/components/quiz/QuizHUD.tsx` — top bar with streak + score + progress.
- `src/components/quiz/QuizResultScreen.tsx` — end screen.

**Edited**
- `src/App.tsx` — register `const QuizPlayer = lazy(() => import("./pages/QuizPlayer"))` and add route `/quiz-session/:id` wrapped in `InstantAuthGuard` (mirroring the existing `/test-session/:id` registration).
- `src/pages/Quizzes.tsx` — change the final `navigate('/test-session/${session.id}')` call (in `startQuiz`) to `navigate('/quiz-session/${session.id}')`. No other changes — the session row format stays identical.

**Untouched**
- `src/pages/TestSession.tsx` and all `src/components/exam/*` (Syllabus Map, Question Palette, ExamHeader) remain unchanged so Mock Tests, Job Tests, and Syllabus Builder are not affected.

## Technical details

- **Data source**: identical to TestSession — fetch `custom_test_sessions` by `:id`, normalize via `normalizeQuestion`, iterate `questions[]`.
- **Answer evaluation**: reuse `checkUserAnswer` and `resolveCorrectAnswer` from `src/lib/testEvaluation.ts` so correctness logic matches the rest of the app exactly.
- **Persistence**: on completion, update the same `custom_test_sessions` row (`is_completed`, `score`, `completed_at`, `answers`) so AI Coach / Analytics / streaks pick it up just like Mock Tests do today. Call `processTestCompletion` from `src/utils/gamification.ts` for XP + badges.
- **Per-question timer math**: `perQuestionSeconds = clamp(round((session.time_limit * 60) / question_count), 10, 45)`.
- **No exam-style features**: no flag-for-review, no question palette navigation, no save-and-resume mid-quiz (quizzes are short and casual — if abandoned, restart fresh).
- **Theming**: uses existing design tokens (`primary`, `success`, `destructive`) — no hardcoded colors. Mobile-first, fully responsive.
- **RTL**: respects existing language context (Urdu/Sindhi) — no special handling needed beyond existing global CSS.

## Out of scope
- No changes to MCQ generation, edge functions, or DB schema.
- No changes to Mock Tests / Job Tests / Syllabus Builder players.
- No new gamification database tables — reuses existing XP/badge system.
