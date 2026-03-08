

## Problem Analysis

The "shaking" and sudden scrollbar appearance when clicking/navigating is caused by two issues:

1. **Page transition animation** in `Header.tsx` (line 226-233): The `motion.div` uses `key={window.location.pathname}` which completely unmounts and remounts page content on every route change. During this transition, the old content disappears (scrollbar gone) and new content fades in (scrollbar appears), causing a visible layout shift/shake.

2. **No stable scrollbar reservation**: When content changes height during transitions, the scrollbar appears/disappears, shifting the page ~7px horizontally — this is the "shake."

## Plan

### 1. Fix scrollbar stability (`src/index.css`)
- Add `overflow-y: scroll` to `html` so the scrollbar gutter is always reserved, preventing horizontal shift when content changes height.

### 2. Smooth out page transition (`src/components/Header.tsx`)
- Remove the `key` prop from the `motion.div` wrapping `{children}` — this stops the full unmount/remount cycle that causes the flash.
- Change animation to use `AnimatePresence` with `mode="wait"` only if needed, or simply remove the per-route animation entirely since the `NavigationLoader` already provides visual feedback during navigation.
- If we keep a subtle fade, use a very short duration (0.15s) with no layout-affecting properties (no `y` offset, no scale).

### Files Modified
- `src/index.css` — add `overflow-y: scroll` to `html`
- `src/components/Header.tsx` — remove route-keyed animation that causes layout thrash

