# Notification / Alert UI Audit (audit-only — no code changed)

## Component Inventory

### 1. Toasts — TWO systems run at once


| File                                                                                              | Mounted | Library         | Position                                                                 | z-index                     | Styling / Tokens                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------- | ------- | --------------- | ------------------------------------------------------------------------ | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/ui/sonner.tsx` (`<Sonner>` in `src/App.tsx:257`)                                  | Global  | **sonner**      | `top-right`, `expand`, `visibleToasts=5`, `duration=3000`, `closeButton` | sonner internal (very high) | Wrapper uses tokens (`bg-background`, `text-foreground`, `border-border`) **BUT `richColors={true}**` forces sonner's own green/red/blue success/error/info colors — bypasses brand. ~73 files call `toast` from `sonner`. |
| `src/components/ui/toast.tsx` + `toaster.tsx` + `use-toast.ts` (`<Toaster>` in `src/App.tsx:256`) | Global  | **Radix toast** | `fixed top-0` mobile, `sm:bottom-0 sm:right-0` desktop (bottom-right)    | `z-[100]`                   | Uses tokens. `TOAST_LIMIT=1`, `TOAST_REMOVE_DELAY=1000000` (~16 min → effectively never auto-dismisses). ~28 files use `@/hooks/use-toast`.                                                                                |


Triggers: success/error/info across services, forms, admin actions, quiz/test flows.

### 2. Popups / Modals


| File                                                                                                    | Trigger                                      | Position                                                          | z-index                              | Library                | Branding                                                                                                     |
| ------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| `src/components/ui/dialog.tsx`                                                                          | shared base                                  | center                                                            | overlay `z-[105]`, content `z-[110]` | Radix Dialog           | tokens                                                                                                       |
| `src/components/ui/alert-dialog.tsx`                                                                    | confirmations                                | center                                                            | overlay `z-50`, content `z-50`       | Radix AlertDialog      | tokens — **note: far below dialog/toast**                                                                    |
| `src/components/AIWelcome.tsx`                                                                          | mounted globally (`App.tsx`), shows greeting | `fixed inset-0` center, `bg-black/50 backdrop-blur`               | `z-50`                               | custom + framer-motion | primary/accent gradient, tokens (good)                                                                       |
| `src/components/NoticeBoard.tsx`                                                                        | welcome/feedback card                        | `fixed inset-0` center                                            | `z-50`                               | custom + framer-motion | tokens, but **hardcoded `text-yellow-500`/`text-gray-300**` stars. Appears **not rendered anywhere** (dead). |
| `src/components/credits/CreditExhaustedDialog.tsx` (via `GlobalCreditExhaustedListener`, `App.tsx:275`) | AI daily limit event                         | center (Dialog)                                                   | `z-[110]`                            | Radix Dialog           | **hardcoded `green-500/green-50/green-900**` — not brand                                                     |
| `src/components/auth/GuestChoiceModal.tsx`                                                              | guest vs sign-in choice                      | center (Dialog)                                                   | `z-[110]`                            | Radix Dialog           | tokens (good)                                                                                                |
| `src/components/reviews/ReviewPopup.tsx`                                                                | —                                            | center (Dialog)                                                   | `z-[110]`                            | Radix Dialog           | **hardcoded `yellow-400**` stars. **Not rendered/imported anywhere (dead component).**                       |
| `src/components/FloatingFeedbackButton.tsx`                                                             | floating FAB → modal                         | button `fixed bottom-20 right-4 z-40`; modal `fixed inset-0 z-50` | 40 / 50                              | custom                 | tokens. **Imported in `App.tsx:79` but never rendered (dead).**                                              |


### 3. Streak / Gamification alerts


| File                                                           | Trigger                                       | Position                     | Styling                                                                 |
| -------------------------------------------------------------- | --------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------- |
| `src/components/gamification/StreakCounter.tsx`                | header badge                                  | inline (header, not overlay) | **hardcoded `orange-500`/`red-500` gradient, `orange-600**` — not brand |
| `src/utils/gamification.ts` (`canvas-confetti`)                | `processTestCompletion`, badge earn           | full-screen canvas           | library default; very high implicit z                                   |
| `src/components/admin/AIContentFactory.tsx`                    | admin generation success                      | full-screen confetti         | library default                                                         |
| `src/services/notificationService.ts` → `NotificationBell.tsx` | badge/streak/result events → DB notifications | popover from header bell     | bell **hardcoded `amber-500**`, badge `bg-destructive`                  |


### 4. Other floating / banners / overlays


| File                                                                 | Position                                                | z-index                                  | Branding                                                                                                          |
| -------------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `src/components/UserSatisfactionPopup.tsx` (mounted `Index.tsx:551`) | `fixed bottom-6 right-6` card, timed via `localStorage` | `z-50`                                   | **hardcoded `bg-gradient blue-600→indigo-600 text-white`, `yellow-400` stars** — not brand (brand is violet/cyan) |
| `src/components/MobileBottomNav.tsx`                                 | `fixed bottom-0` nav; sheet overlay                     | nav `z-50`, overlay `z-40`               | tokens                                                                                                            |
| `src/components/TopProgressBar.tsx`                                  | top route loader                                        | `z-[9998]` / `z-[9999]` (highest in app) | brand-gradient, tokens (good)                                                                                     |
| `src/components/NotificationBell.tsx`                                | header popover                                          | popover default                          | amber hardcoded                                                                                                   |


## Positioning Inconsistencies

- **Toasts split across two corners**: sonner = top-right; Radix toast = bottom-right (desktop) / top (mobile). No single rule; a sonner success and a Radix toast can appear in opposite corners simultaneously.
- **Popups have no consistent anchor**: Radix dialogs + AIWelcome + NoticeBoard are centered, while `UserSatisfactionPopup` sits bottom-right and `FloatingFeedbackButton` modal is centered with its FAB bottom-right.
- **Mobile vs desktop drift** for Radix toast (top on mobile, bottom-right on desktop) differs from sonner (always top-right).

## Branding Gaps (look like default/unstyled or off-brand)

- **sonner `richColors**` → default green/red/blue, not brand tokens.
- `**UserSatisfactionPopup**` → blue/indigo gradient + `text-white` (off-brand vs violet/cyan).
- `**CreditExhaustedDialog**` → hardcoded greens.
- `**StreakCounter**` → hardcoded orange/red.
- `**NotificationBell**` → hardcoded amber.
- `**ReviewPopup` / `NoticeBoard**` → hardcoded yellow stars.
- No app logo/typography lockup in any alert/popup header.

## Overlap / Conflict Issues

- **Bottom-right pile-up**: `UserSatisfactionPopup` (`bottom-6 right-6 z-50`), Radix toast (desktop bottom-right `z-[100]`), and `MobileBottomNav` (`bottom-0 z-50`) all occupy the bottom-right/bottom edge. On mobile the satisfaction card can sit on top of the bottom nav; toasts can cover the card.
- **z-index scale is inconsistent and partly inverted**:
  - TopProgressBar `9998/9999` (top) → Radix toast `100` → Dialog `105/110` → **AlertDialog only `50**` (same level as AIWelcome/NoticeBoard/UserSatisfactionPopup/MobileBottomNav). An AlertDialog opened over a Dialog would render **behind** it.
  - sonner toaster uses its own high internal z and can render above dialogs unpredictably.
- **Two welcome-class modals** (`AIWelcome` + `NoticeBoard`, both centered `z-50`) could theoretically both display; no coordination/queue.
- **Dead components still imported/defined**: `FloatingFeedbackButton` (imported, never rendered), `ReviewPopup` (defined, never used), `NoticeBoard` (no render site found) — dead weight and a source of confusion in the alert system.

## Recommendations (for your approval before any code changes)

1. **Consolidate to ONE toast system** (recommend sonner) and remove the Radix `Toaster` + `use-toast`, OR keep Radix only — migrate the 28/73 call sites accordingly. Pick one corner (recommend `top-right`) sitewide.
2. **Replace `richColors` with brand-token toast variants** (success/error/info using design tokens / brand violet–cyan) so toasts stop looking like a default library.
3. **Define a single z-index scale** (e.g. tokens: nav 30, popovers 40, dialogs 100, alert-dialog 110, toasts 120, top-progress 9999) and apply consistently — fix `alert-dialog z-50` being below dialogs.
4. **Standardize off-brand colors** in `UserSatisfactionPopup`, `CreditExhaustedDialog`, `StreakCounter`, `NotificationBell`, star ratings → design tokens / brand gradient.
5. **Resolve bottom-right pile-up**: give floating cards an offset above `MobileBottomNav` and ensure toasts/cards don't share the same anchor (or queue them).
6. **Remove dead components** (`FloatingFeedbackButton` import, `ReviewPopup`, `NoticeBoard`) or wire them in intentionally.
7. **Fix Radix toast auto-dismiss** (`TOAST_REMOVE_DELAY=1000000`) if that system is kept.
8. Optional: add brand logo/typography lockup to global modals (AIWelcome, GuestChoice, CreditExhausted) for consistency.

This is the audit only. Tell me which recommendations to implement and I'll produce a build plan.

&nbsp;

Based on the previous audit, implement the following fixes to my notification/alert UI system. Do this in order, and confirm each step works before moving to the next.

## STEP 1: Remove dead components

Delete these files completely, and remove their imports/references:

- src/components/FloatingFeedbackButton.tsx (and its import in App.tsx)

- src/components/reviews/ReviewPopup.tsx

- src/components/NoticeBoard.tsx

Confirm no other file references them after deletion.

## STEP 2: Consolidate to ONE toast system — keep sonner, remove Radix toast

- Keep src/components/ui/sonner.tsx as the only toast system.

- Migrate all ~28 files currently using `@/hooks/use-toast` (the `toast()` calls from use-toast) to use sonner's `toast` from "sonner" instead, preserving the same message content and success/error/info intent for each call.

- After migration, delete src/components/ui/toast.tsx, src/components/ui/toaster.tsx, src/hooks/use-toast.ts, and remove the `<Toaster>` mount from App.tsx.

- Set sonner's position to `top-right` sitewide (already set — keep it) and keep `duration=3000`.

## STEP 3: Fix toast branding — replace richColors with brand tokens

- Turn OFF sonner's `richColors` prop.

- Create custom toast style variants (success / error / info / warning) using the app's existing design tokens (the same violet–cyan brand palette already used elsewhere, e.g. AIWelcome.tsx and TopProgressBar.tsx) instead of sonner's default green/red/blue.

- Success = brand primary/green-accent if one exists in tokens, Error = destructive token, Info = brand accent/cyan, Warning = brand amber-equivalent IF one exists in tokens (do not invent a new hardcoded color — check tailwind.config / index.css for existing CSS variables first).

## STEP 4: Establish ONE z-index scale and apply it everywhere

Define these z-index levels as a comment block at the top of src/index.css (or tailwind.config) and apply them consistently across every alert/popup/overlay component:

- Base content: 0–10

- Sticky nav / bottom nav: 30

- Floating buttons/FABs: 40

- Popovers/dropdowns/notification bell: 50

- Dialog/Modal overlay + content: 100

- AlertDialog overlay + content: 110 (must render ABOVE regular Dialog since confirmations are usually more urgent — fix the current bug where it's at z-50, same as Dialog)

- Toasts (sonner): 120

- Top progress bar / route loader: 9999 (stays highest, unchanged)

Update every component listed in the audit (dialog.tsx, alert-dialog.tsx, AIWelcome.tsx, CreditExhaustedDialog.tsx, GuestChoiceModal.tsx, UserSatisfactionPopup.tsx, MobileBottomNav.tsx, NotificationBell.tsx) to use this scale via consistent Tailwind z-index classes — no arbitrary one-off values left behind.

## STEP 5: Fix off-brand hardcoded colors

Replace all hardcoded Tailwind color classes with brand design tokens (check tailwind.config / index.css for the existing violet-cyan brand tokens and reuse them — do not invent new colors):

- src/components/credits/CreditExhaustedDialog.tsx — replace hardcoded green-500/green-50/green-900

- src/components/gamification/StreakCounter.tsx — replace hardcoded orange-500/red-500/orange-600

- src/components/NotificationBell.tsx — replace hardcoded amber-500

- src/components/UserSatisfactionPopup.tsx — replace hardcoded blue-600/indigo-600/text-white gradient AND yellow-400 stars

Keep the same layout/behavior — only swap colors to match brand tokens.

## STEP 6: Fix positioning conflicts (bottom-right pile-up)

- src/components/UserSatisfactionPopup.tsx currently sits at `fixed bottom-6 right-6`, same zone as MobileBottomNav `fixed bottom-0`) and desktop toasts. On mobile, add bottom offset so it sits ABOVE the bottom nav bar (not overlapping it) — use a responsive class like `bottom-20` on mobile, `bottom-6` on desktop where there's no bottom nav.

- Ensure toasts (top-right) and UserSatisfactionPopup (bottom-right) don't visually compete since they're now in different corners — confirm this is the case after Step 2.

## STEP 7: Fix Radix toast leftover bug (only if any Radix toast usage remains after Step 2 migration)

N/A if Step 2 fully removes Radix toast — confirm full removal instead.

## STEP 8: Add brand identity to major modals

Add the app logo (small, top-left or centered above title) and use brand typography/heading style already used elsewhere in the app to:

- AIWelcome.tsx

- GuestChoiceModal.tsx

- CreditExhaustedDialog.tsx

Keep this lightweight — don't redesign the modals, just add the logo lockup consistent with the rest of the app.

After all steps, give me a summary of every file changed and confirm: (1) no dead components remain, (2) only one toast system is active, (3) z-index scale is consistent app-wide, (4) no hardcoded off-brand colors remain in the listed components, (5) UserSatisfactionPopup no longer overlaps MobileBottomNav on mobile.

Do not change any unrelated functionality, quiz logic, or business logic — this is UI/UX/branding only.