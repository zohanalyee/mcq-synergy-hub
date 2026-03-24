

## Fix Universal Shaking/Layout Shift on Dropdowns and Overlays

### Problem
When opening Select dropdowns (and potentially Dialogs/Sheets), Radix UI's scroll-locking injects `padding-right` and `overflow: hidden` on the body, causing the entire page to shift horizontally. The Night Mode, AI Tools, and Language Switcher dropdowns are already stable because they use `DropdownMenu` (which defaults to `modal={false}`) and `Popover` (also `modal={false}`). However, `Select`, `Dialog`, and `Sheet` components still use Radix's default modal behavior.

### Root Cause
- **`Select`** (Radix Select): Always modal, no `modal` prop available — it locks scroll by default
- **`Dialog`** and **`Sheet`** (Radix Dialog): Modal by default, triggers scroll lock with padding-right injection
- The existing CSS overrides in `index.css` (lines 11-30) attempt to counter this, but Radix can still cause brief flickers

### Plan

**1. Harden CSS overrides in `src/index.css`**
- Add `!important` overrides targeting `[data-radix-popper-content-wrapper]` to prevent any transform-based shifts
- Add a universal rule: `body { margin-right: 0 !important; padding-right: 0 !important; }` to completely block any injection regardless of attribute selectors
- Ensure `html` also gets `overflow-y: scroll !important` to prevent any component from hiding the scrollbar

**2. Fix `Dialog` component (`src/components/ui/dialog.tsx`)**
- Add `onOpenAutoFocus` handler with `e.preventDefault()` on DialogContent to prevent focus-triggered scroll adjustments
- Add `will-change: transform` and `backface-visibility: hidden` to DialogContent for GPU compositing stability

**3. Fix `Sheet` component (`src/components/ui/sheet.tsx`)**  
- Similar treatment as Dialog — prevent body scroll lock side effects

**4. Fix `Select` component (`src/components/ui/select.tsx`)**
- The Radix Select primitive doesn't expose a `modal` prop, so the fix relies on the CSS overrides being robust enough to counteract its scroll-locking

### Files to Modify
- `src/index.css` — Strengthen universal anti-shaking CSS rules
- `src/components/ui/dialog.tsx` — Add stability props to DialogContent
- `src/components/ui/sheet.tsx` — Add stability props to SheetContent
- `src/components/ui/select.tsx` — Minor stability enhancements if needed

