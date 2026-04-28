# Mobile Bottom Nav Overlap — Global Fix

## Audit Results

Scanned all `fixed`/`sticky` bottom elements in the codebase:

| File | Element | Status |
|------|---------|--------|
| `MobileBottomNav.tsx` | `fixed bottom-0` (h-14 + safe area, ~56–80px) | The overlapping nav itself |
| `QuizPlayer.tsx` (line 372) | `fixed bottom-0 inset-x-0` Next/Finish bar | **Broken — overlapped on mobile** |
| `exam/ExamNavBar.tsx` | `sticky bottom-0` inside scroll container (used in TestSession) | In-flow, but renders on top of mobile nav too — needs verification fix |
| `syllabus-builder/FloatingActionBar.tsx` | `fixed bottom-20 lg:bottom-8` | Already correct ✅ |
| `FloatingFeedbackButton.tsx` | `fixed bottom-20 sm:bottom-6` | Already correct ✅ |
| `ui/drawer.tsx` | Radix drawer | Modal — not affected ✅ |

Job Details, Opportunity Detail, Profile, etc. have no fixed/sticky bottom action bars — they're fine.

## Solution: Two-Part Global Standard

### Part 1 — Immersive Mode (hide MobileBottomNav)

In `src/components/MobileBottomNav.tsx`, add a route check using `useLocation()`. Hide the nav (return `null`) when the pathname matches any immersive route:

- `/quiz-session/...`
- `/test-session/...`
- `/exam-session/...` (if used)

This gives test-takers full screen real estate with zero distractions.

```ts
const IMMERSIVE_PATTERNS = [/^\/quiz-session(\/|$)/, /^\/test-session(\/|$)/, /^\/exam-session(\/|$)/];
const isImmersive = IMMERSIVE_PATTERNS.some(r => r.test(location.pathname));
if (!isMobile || isImmersive) return null;
```

### Part 2 — Defensive padding for QuizPlayer sticky bar

Even though we hide the nav on immersive routes, harden the QuizPlayer sticky Next bar so it never overlaps if a future immersive route is added without updating the list:

In `src/pages/QuizPlayer.tsx` (line 372), change the sticky container so it sits **above** the nav on mobile and at the very bottom on desktop:

```tsx
className="fixed bottom-16 sm:bottom-0 inset-x-0 z-40 ..."
```

And bump the page bottom padding from `pb-28` → `pb-32 sm:pb-28` so the explanation card never hides under the bar.

(Since Part 1 already hides the nav, this is belt-and-suspenders, but matches the project's established `bottom-20` / `bottom-16` mobile-safe pattern used by FloatingActionBar and FloatingFeedbackButton.)

## Files to Edit

1. **`src/components/MobileBottomNav.tsx`** — add `isImmersive` route check, return `null` on `/quiz-session/*` and `/test-session/*`.
2. **`src/pages/QuizPlayer.tsx`** — sticky bar `bottom-16 sm:bottom-0`, page padding `pb-32 sm:pb-28`.

## What stays the same

- `FloatingActionBar`, `FloatingFeedbackButton` — already use the correct `bottom-20`/`sm:bottom-6` pattern.
- `ExamNavBar` — used inside TestSession, which will be an immersive route, so the nav won't overlap.
- All other pages — no fixed/sticky bottom action bars detected.

## Result

- Quiz and Test sessions: full-screen immersive, no bottom nav, Next button always reachable.
- Other pages: bottom nav remains; any future sticky elements should follow the `bottom-16`/`bottom-20` mobile-safe pattern documented here.
