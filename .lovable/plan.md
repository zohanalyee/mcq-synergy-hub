# Fix Console Warnings

## Issues Found

1. **Debug console.log left in production** — `PlatformStatsSection.tsx` line 70 logs `STATS DATA RESPONSE` on every render, including when data is still `undefined`.
2. **Missing** `DialogDescription` **in multiple dialogs** — Radix UI requires either a `DialogDescription` or an `aria-describedby` attribute on `DialogContent`. Several dialog components are missing this, causing the React warning.

## Plan

### Step 1: Remove debug console.log

**File:** `src/components/home/PlatformStatsSection.tsx`

- Remove line 70: `console.log("STATS DATA RESPONSE:", data);`

### Step 2: Add hidden DialogDescription to dialog.tsx base component

**File:** `src/components/ui/dialog.tsx`

- Import `VisuallyHidden` from Radix or use `sr-only` class
- This is the cleanest fix: update the `DialogContent` component to suppress the warning globally by accepting an optional `aria-describedby` or by documenting that consumers must add `DialogDescription`

**Better approach**: Fix the specific dialogs that trigger warnings on the index page. Based on the console output, the warning fires when dialogs open. The most impactful fix is to add a visually-hidden `DialogDescription` to the base `DialogContent` component so ALL dialogs are covered automatically.

Update `DialogContent` in `dialog.tsx`:

- After the `{children}` render, add a fallback: if no `DialogDescription` is provided, render a visually hidden one
- Simpler alternative: just add `aria-describedby={undefined}` to suppress the warning

### Technical Detail

In `dialog.tsx`, add `aria-describedby={undefined}` as a default prop on `DialogPrimitive.Content` — this tells Radix not to warn about the missing description when one isn't needed.

### Files Modified

1. `src/components/home/PlatformStatsSection.tsx` — remove debug log
2. `src/components/ui/dialog.tsx` — add `aria-describedby={undefined}` default to suppress warning for dialogs that intentionally skip descriptions

&nbsp;

Console Hygiene & Stability" Prompt:

"Clean up Console Warnings and Debug Logs:

1. Remove Debug Logs: In src/components/home/PlatformStatsSection.tsx, remove the console.log on line 70 that triggers 'STATS DATA RESPONSE' on every render. We no longer need this for production.

2. Fix Dialog Accessibility Warnings: > * In src/components/ui/dialog.tsx, update the DialogContent component to suppress the Radix UI accessibility warning.

The Fix: Add aria-describedby={undefined} as a default prop to the DialogPrimitive.Content. This informs Radix that a description is intentionally omitted for these dialogs.

3. Add Loading Guard: In the PlatformStatsSection, ensure that the component handles undefined data gracefully without attempting to map or log it until the Supabase fetch is complete.

4. Verification: After applying, the console should no longer show the 'Missing Description' warning or the constant 'STATS DATA' logs