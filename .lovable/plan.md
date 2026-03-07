

## Analysis

Looking at the code, the `FloatingActionBar` is already rendered at the **page level** in `SyllabusBuilder.tsx` (line 642), not inside any card. It also already uses `fixed` positioning. However, on mobile (as shown in the screenshot), it visually overlaps with cards, creating the illusion it's part of a card.

The real issues are:
1. The bar is inside the page's `div` container which may clip or constrain it -- using a React Portal to `document.body` will guarantee independence
2. The bar is too tall vertically on mobile -- needs compacting

## Plan

### 1. Add React Portal to `FloatingActionBar.tsx`
- Wrap the entire rendered output in `createPortal(..., document.body)` so it's fully outside any parent container/grid
- Import `createPortal` from `react-dom`

### 2. Make the bar more compact (same file)
- Reduce outer padding from `px-4 sm:px-6 py-3 sm:py-4` to `px-3 py-2 sm:px-4 sm:py-3`
- Reduce gap between sections from `gap-3 sm:gap-4` to `gap-2 sm:gap-3`
- On mobile, use a single-row horizontal layout: stats badges + input + generate button all in one line
- Shrink badge sizes, input height, and button text
- Remove the "Save" button on mobile (already hidden with `hidden sm:flex`)
- Target ~50% height reduction

### 3. Minor: ensure bottom padding on page
- Already has `pb-28` on the container -- sufficient

### Files to modify
- `src/components/syllabus-builder/FloatingActionBar.tsx` -- Portal + compact layout

