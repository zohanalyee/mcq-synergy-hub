# Part B — Test Player UI/UX + Branding Roadmap

Implements the audit's Top-5 improvements for the Mock/Job Test player experience. **Presentation & UX only — no scoring or business-logic changes.** Built phase-by-phase; after each phase I'll report back before continuing.

## Guardrails

- Zero changes to answer-checking, scoring, quota, or submission logic (`checkAnswer`, `scorePracticeAnswers`, `processTestCompletion`, `recordJobTestProgress` untouched).
- Existing behavior/flows stay identical; only styling, tokens, markup, and result presentation change.
- Reuse existing brand tokens (`--brand-*`, `bg-brand-gradient`, `shadow-brand`) and shadcn primitives.

---

## Phase 1 — Semantic status tokens (color tokenization)

The player currently hardcodes `bg-blue-500`, `emerald-500`, `orange-500`, `text-white`, `red-500` etc. in `TestSession.tsx`, `QuestionCard.tsx`, `QuestionPalette.tsx`, `ExamHeader.tsx`, `ExamNavBar.tsx`.

- Add status tokens in `src/index.css` (light + dark): `--success`, `--success-foreground`, `--warning`, `--warning-foreground`, `--info`, `--info-foreground` (destructive already exists). Map to existing green/amber/blue hues so visuals are unchanged.
- Register them in `tailwind.config.ts` (`success`, `warning`, `info` color families).
- Replace hardcoded utilities in the exam components with the new tokens (e.g. selected option → `ring-info`/`bg-info/10`, answered → `bg-success`, review → `bg-warning`, correct/wrong review alerts → `border-success`/`border-destructive`).
- Result: full dark-mode correctness and one source of truth for player colors.

## Phase 2 — Brand mark in player + results

- Add `BrandMark` (icon-only where space is tight) into `ExamHeader` and into the results header so the exam and result screens carry MCQSAI identity (currently generic).
- Add `BrandMark` to `GuestResultGate` header for brand consistency on the sign-in gate.
- Small brand-gradient accent on the results score number using existing `text-brand-gradient`.

## Phase 3 — Accessibility & touch targets

- Add `aria-label`s to icon-only buttons in the player (music toggle, flag, palette trigger, exit).
- Ensure interactive option cards in `QuestionCard` are real buttons / keyboard-operable with `focus-visible` rings (currently clickable `div`s with `onClick` only).
- Bump tap targets to min 44×44 on mobile for palette cells, nav buttons, and flag/music controls.
- Add `aria-live` to the timer/answered-count region and ensure a single `<main>`/heading order on the result screen.

## Phase 4 — Celebration + weak-area breakdown (results)

- Add a one-shot confetti/celebration animation on pass (reuse the existing gamification confetti util already used in `processTestCompletion`; purely visual trigger on the result view).
- Add a **"Focus Areas"** card on the result screen: compute per-subject/section accuracy from the already-graded `questions` + `answers` (no new scoring — just grouping what's shown) and list weakest sections with progress bars, styled with the new tokens. This surfaces the weak-area data inline instead of only in the AI Coach / keep-going dialog.

## Phase 5 — Share my score

- Add a **"Share my score"** button on the result screen: uses the Web Share API when available (`navigator.share`) with a graceful clipboard-copy fallback + toast.
- Share text: score %, test name, and the site URL — brand-consistent, no PII beyond the display name the user already sees.
- Optional lightweight shareable summary text ("I scored X% on &nbsp; at MCQSAI") — no image generation, no backend.

---

## Files touched (by phase)

- **P1:** `src/index.css`, `tailwind.config.ts`, `src/components/exam/QuestionCard.tsx`, `QuestionPalette.tsx`, `ExamHeader.tsx`, `ExamNavBar.tsx`, `src/pages/TestSession.tsx`
- **P2:** `ExamHeader.tsx`, `TestSession.tsx`, `src/components/quiz/GuestResultGate.tsx`
- **P3:** exam components above + `TestSession.tsx`
- **P4:** `TestSession.tsx` (+ reuse `src/utils/gamification.ts` confetti)
- **P5:** `TestSession.tsx` (small inline share helper)

## Verification per phase

- Typecheck + build after each phase.
- Playwright screenshot of the player and result screen (light + dark) to confirm visuals unchanged where intended and improved where added.

I'll implement Phase 1, report back, then continue through Phase 5 one at a time.

&nbsp;

**Approve B** — jaisa propose kiya hai, Phase 1 se shuru karein. Har phase k baad build/typecheck/screenshot confirm karke report karein, phir agle phase pe barhein.