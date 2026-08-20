# AI Coach — Personalized Greeting, Intent Routing & Premium Advice UI

Two additions to the existing `/ai-coach` page (Dashboard & AI Coach). Nothing else on the page moves, and the test/credit flows stay untouched.

## Part 1 — Greeting + intent quick-select

New card placed directly under the existing page header, above the stats row. Ads, charts, study plan, achievements, history all stay exactly where they are.

Contents:

- Time-of-day greeting with the user's first name: "Good morning, Zohaib" / afternoon / evening (Karachi-local time from the browser clock).
- One conversational Coach line, generated locally (no AI call, no credits):
  - New user (no attempts): invite to pick a test type.
  - Returning user: reference to the most recent attempt already loaded on the page, e.g. "Last test: Pakistan Studies 60% — let's push that up."
- 4 quick-select buttons (44px touch targets, wrap on mobile): **Job Test**, **Admission Test**, **Board Exam**, **Suggest for me**.

Routing (entry point only, no flow logic changed):

- Job Test → `/mock-tests`
- Admission Test → `/exams`
- Board Exam → `/boards`
- Suggest for me → opens the **existing** `QuickTestGenerator` dialog by flipping the page's existing `testDialogOpen` state — the same dialog the current Zap FAB opens, with its own confirmation and credit/deduct behaviour completely unchanged.

### Data availability

- **Name**: available client-side already — `profile` from `AuthContext`, with fallback chain `profile.full_name → user.user_metadata.full_name → email prefix → "Student"`. `AuthContext` only fetches the profile on the `SIGNED_IN` event, so on a hard page reload `profile` can be null; the fallback chain covers that. **No new query needed.**
- **Last test**: already available — `useAnalyticsData()` returns `recentAttempts` (up to 50) plus `totalTests`, `averageScore`, `subjects`. The greeting line reads `recentAttempts[0]`. **No new query needed.**

## Part 2 — Premium, mood-aware Ustaad advice

Currently the advice edge function returns `{ advice: string }` and the page renders it as a plain paragraph with one fixed Sparkles icon.

**Can the AI call return a mood tag? Yes, easily.** The `ai_coach` branch of the `generate-test` edge function builds one prompt and returns `result.text`. We add a required last line to the prompt (`MOOD: motivational|urgent|informative|celebratory|neutral`), parse that line off the text server-side, and return `{ advice, mood, credits_deducted }`. Additive only — existing callers that ignore `mood` keep working, and if the model omits the line we default `mood: "neutral"`. Credit cost stays 10, single call, no extra tokens of consequence.

Frontend (new `CoachAdviceCard` component used only on this page):

- Fixed mood map → icon + accent token: motivational `Flame`, urgent `AlertTriangle`, informative `Lightbulb`, celebratory `PartyPopper`, neutral `Sparkles`. Accents come from existing design tokens only — no new colors, no generated icons.
- Typing/streaming reveal of the advice text (character-batched interval over the already-received string — a reveal effect, not real token streaming), with a "skip animation" behaviour if the user taps the card and automatic full-text render for reduced-motion users.
- Card entrance: fade + slight slide.
- Mood icon change: gentle scale/fade crossfade.
- Soft accent glow/border tied to mood, deliberately subtle.

### Animation approach

**CSS-only** — Tailwind's existing `animate-fade-in` / `animate-scale-in` keyframes plus `transition-*` classes. `framer-motion` is already in the bundle and used on this page, but no new motion components are needed here, so this adds zero JS weight. The typing effect is one `setInterval` on a string, cleared on unmount — no measurable Core Web Vitals impact. `prefers-reduced-motion` respected.

## Files touched


| File                                         | Change                                                                                                             |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `src/components/coach/CoachGreetingCard.tsx` | New — greeting + coach line + 4 intent buttons                                                                     |
| `src/components/coach/CoachAdviceCard.tsx`   | New — mood icon, entrance/typing animation, accent glow                                                            |
| `src/pages/Analytics.tsx`                    | Insert greeting card under `PageHeader`; swap the inline advice `<p>` for `CoachAdviceCard`; store `mood` in state |
| `supabase/functions/generate-test/index.ts`  | `ai_coach` branch only: prompt gains a MOOD line, response gains `mood`                                            |


Not touched: `QuickTestGenerator`, credit deduction, `deduct_credits`, `useUserCredits`, `useAnalyticsData`, `AIInsightsPanel`, ads/`AdSlot`, routing table, SEO/meta, any other page.

## Build sequence

**Batch 1 — Greeting + intent entry point**

1. Build `CoachGreetingCard` (name fallback chain, time-of-day, last-attempt line, 4 buttons).
2. Mount it in `Analytics.tsx` under the header; wire "Suggest for me" to the existing `setTestDialogOpen(true)`.
3. Verify in the preview: signed-in name renders, buttons route correctly, dialog opens as it does from the FAB.

**Batch 2 — Mood tag backend**
4. Add the MOOD instruction + parser to the `ai_coach` branch; return `mood`.
5. Deploy and invoke once for real to confirm `{ advice, mood }` and that 10 credits still deduct exactly once.

**Batch 3 — Premium advice UI**
6. Build `CoachAdviceCard` with the mood map, CSS entrance, typing reveal, icon crossfade, accent glow.
7. Replace the inline advice paragraph; store the returned `mood`.
8. Mobile check at 390px + reduced-motion check.

## Effort & risk

- **Scope: medium** (small for Batch 1, small for Batch 2, medium for Batch 3). Roughly 4 files, ~2 new components.
- **Credits**: build-time only; runtime cost unchanged — the greeting is zero-AI, and advice stays one 10-credit call per attempt.
- **Risk: low and contained.**
  - `Analytics.tsx` is rendered only at `/ai-coach`; both new components are used nowhere else.
  - The only shared-surface edit is the `ai_coach` branch of `generate-test`. That function also serves question generation, so the change stays strictly inside the `mode === 'ai_coach'` block and is additive to the JSON response.
  - Other advice consumers (`ResultAdviceCard` on the test-result screen) read `advice` only and are unaffected.
  - No layout/ad changes, no new queries, no schema change, no route change.

&nbsp;

Plan approved. Proceed with Batch 1 only (CoachGreetingCard + mounting in Analytics.tsx). Stop after Batch 1 for verification before starting Batch 2.