

## Fix: Everything Appears Too Large / Zoomed-In

### Root Cause

The viewport meta tag and base CSS are fine (`initial-scale=1.0`, `font-size: 14px` only on mobile). The "zoomed in" feeling comes from **oversized spacing, padding, and text sizes** across pages, not a global zoom/scale issue.

### Plan

**1. Tighten global body/page spacing in `src/index.css`**
- Reduce default container padding from `2rem` to `1rem` in the Tailwind config
- Ensure the mobile `font-size: 14px` rule stays as-is (it's correct)

**2. Tighten `tailwind.config.ts` container padding**
- Change container padding from `2rem` to `1.5rem` to give more usable space

**3. Tighten key page layouts**

Pages to adjust (reduce padding, text sizes, gaps):
- `src/pages/Index.tsx` — Hero section text sizes and spacing
- `src/pages/Tools.tsx` — `py-8 space-y-8` → `py-5 space-y-5`, hero heading `text-3xl sm:text-4xl` → `text-2xl sm:text-3xl`
- `src/pages/Notifications.tsx` — already addressed
- `src/components/ui/card.tsx` — Card padding `p-3` is already compact, keep as-is

**4. Reduce card component default padding**
- `CardHeader`: `p-3` → keep (already compact)
- `CardContent`: `p-3 pt-0` → keep
- These are fine; the issue is page-level spacing

**5. Key sizing reductions across pages**
- Hero headings: `text-4xl lg:text-5xl` → `text-2xl lg:text-4xl`
- Page container padding: `py-8` → `py-4 sm:py-6`
- Section gaps: `space-y-8` → `space-y-5`
- Tools grid gap: `gap-3` → `gap-2.5`

### Files to Edit
1. `tailwind.config.ts` — container padding `2rem` → `1.25rem`
2. `src/pages/Index.tsx` — reduce hero text sizes and spacing
3. `src/pages/Tools.tsx` — reduce page padding and heading sizes
4. `src/components/tools/ToolWrapper.tsx` — tighten wrapper spacing

This is a targeted fix addressing the "zoomed in" feel without a full design system overhaul.

