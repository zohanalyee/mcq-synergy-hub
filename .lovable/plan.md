# Glassy Dropdown Styling

Apply the brand's glassy/gradient aesthetic to dropdowns using only existing design tokens (no invented values), with zero layout jitter and mobile-safe sizing. No functionality, structure, or component-library changes.

## Brand tokens to reuse (already in `src/index.css`)

- `--radius: 0.75rem` → `rounded-xl`
- `.glass`: `bg-white/80 backdrop-blur-xl border-white/40 shadow-glass` (dark: `bg-black/40 border-white/10`)
- `--gradient-primary` (purple→blue, same as Start Exam button)
- `--shadow-glass`, `--shadow-elegant`

## Scope (per user choices)

1. Modal native `<select>` triggers → glassy trigger only (keep native; OS-rendered option list stays native, avoids jitter/z-index issues per brand memory).
2. Shared Radix `Select` (`src/components/ui/select.tsx`) → glassy trigger + glassy options list + gradient hover, applied globally so every Radix dropdown matches.

## Changes

### 1. `src/pages/MockTestDetail.tsx` (the "Ready to begin?" modal)

- Update the two `<select>` className (lines ~190 and ~204) from the plain `rounded-lg border border-input bg-background` to a glassy trigger:
  - `rounded-xl`, glass background + `backdrop-blur-xl`, subtle border, `shadow-elegant`
  - `min-h-[44px]` for mobile thumb targets (replacing `h-10`)
  - Keep `w-full`, value state, and `onChange` handlers exactly as-is.
- Ensure `DialogContent` is mobile-safe: add `max-h-[90vh] overflow-y-auto` and keep `sm:max-w-md` so it fits small viewports without horizontal scroll. Native option lists never shift modal layout, so no jitter.

### 2. `src/components/ui/select.tsx` (shared Radix Select, global)

- **SelectTrigger**: replace `rounded-md border-2 border-gray-300 ... bg-background shadow-sm` with `rounded-xl`, glass bg + `backdrop-blur-xl`, soft border, `shadow-elegant`, and `min-h-[44px]`. Keep `h-10` baseline via min-height so existing layouts don't shrink. Radix Select already portals the content, so the trigger box does not resize/shift on open.
- **SelectContent**: add `rounded-xl`, glass bg + `backdrop-blur-xl`, `shadow-elegant`, glassy border. Keep existing `position="popper"`, portal, and animation classes (these prevent layout shift). Keep `max-h-[--radix-select-content-available-height]` behavior and viewport-aware sizing so the list never overflows off-screen on mobile.
- **SelectItem**: add `rounded-lg`, `min-h-[44px]` touch target, and a subtle brand-gradient tint on hover/focus (`focus:bg-gradient-to-r from-primary/15 to-accent/15` style using tokens) replacing the current flat `focus:bg-accent`.

## Anti-jitter / mobile guarantees

- Triggers use `min-h` (not changing width) → no resize on open/close.
- Radix `SelectContent` renders in a portal with `position="popper"` → opening never pushes sibling layout.
- Native `<select>` option lists are OS-rendered → cannot affect modal layout.
- `44px` min touch targets on triggers and items; `DialogContent` scrollable; popper content height is viewport-clamped.

## Verification

- Build check.
- Playwright at mobile (372px) and desktop: open the modal, open both selects, capture screenshots before/after open to confirm the trigger box and modal do not shift, and the modal fits without horizontal scroll. Open a Radix Select elsewhere to confirm glassy list + gradient hover.

## Out of scope

No changes to dropdown logic, options, state, or any unrelated component/page. No new colors, fonts, or radius values beyond existing tokens.

&nbsp;

Approved — proceed exactly as planned. The token reuse, native-select-for-modal decision, and anti-jitter guarantees all look correct.

&nbsp;

After implementing, please share the before/after screenshots from your Playwright verification (mobile + desktop) so I can visually confirm before considering this done.