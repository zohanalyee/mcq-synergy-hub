# Mock Test Result Screen — Mobile-First Cleanup

Goal: one clean, scrollable result page. No blocking popup, no duplicate score blocks, and the coaching actions (Practice Weak Areas / Try Again / AI Coach) become real, tappable buttons directly under the "Ustaad Ki Advice" box.

## 1. Remove the "Keep Going" popup

- Delete the `JobTestKeepGoingDialog` render, its state, and its import from the results flow.
- Delete the component file since nothing else uses it.
- The weak-topic list it showed already exists on the page as the "Focus Areas" card, so no information is lost. Its two buttons move into the advice section (step 3).

## 2. Merge the two top cards into one header card

Today there are two stacked cards: a Congratulations/Keep Trying banner and a separate score card. They become a single card:

```text
┌──────────────────────────────────┐
│           [MCQsAI mark]          │
│      Junior Office Associate     │
│               60%                │
│          6 / 10 correct          │
│     [ PASSED ]   Congrats! 🎉    │
└──────────────────────────────────┘
```

- Award / AlertCircle icon stays, smaller, next to the status line instead of its own hero block.
- Pass/fail colour stays token-driven (`success` / `destructive`), border tint kept.
- Percentage keeps the brand gradient; badge sits inline with the short status message.
- On failure the header shows the "You need X% to pass" line under the badge.

## 3. Advice box on top, buttons stacked below

Wrap "Ustaad Ki Advice" and its actions in one section:

- `ResultAdviceCard` first (unchanged wording/gradient).
- Directly below, full-width buttons stacked vertically (`flex-col`, `w-full`, min height 44px):
  1. **AI Coach — View Full Analysis** (primary, brand gradient) → `/analytics`
  2. **Practice Weak Areas** (outline) → mock tests / weak-topic practice, same target the popup used
  3. **Try Again** (outline) → existing retry handler
- Remove the small "Dashboard mein apni detailed performance dekho →" text link from `ResultAdviceCard` when the buttons are shown, so the CTA is not duplicated and no longer looks unclickable. Guest variant keeps its sign-up CTA.
- The old bottom row (Create Another Quiz / Share my score / AI Coach pill) drops the duplicate AI Coach pill; Share and Create Another stay, also full-width on mobile and inline from `sm:` up.

## 4. Typography & spacing pass

- Section spacing normalised to `space-y-3` on mobile, `sm:space-y-4` on larger screens.
- Headings: card titles `text-sm font-semibold`, page status `text-xl sm:text-2xl`, score `text-4xl sm:text-5xl` so it never overflows a 320px screen.
- Stats grid: `grid-cols-2` on mobile, `grid-cols-4` from `sm:` up (4 columns currently squeeze the "2m 28s" value).
- Only semantic tokens (`text-success`, `text-destructive`, `text-brand-gradient`, `bg-brand-gradient`) — no raw colours added.

## Technical notes

- Files: `src/pages/TestSession.tsx` (results branch, ~lines 797-998), `src/components/shared/ResultAdviceCard.tsx` (optional `hideDashboardLink` prop), delete `src/components/jobs/JobTestKeepGoingDialog.tsx`.
- Presentation-only change: scoring, gamification, reward dialog, ad slot, and answer-review logic stay exactly as they are.
- `JobTestRewardDialog` (the 80%+ unlock popup) is kept — only the "Keep Going" one is removed.
