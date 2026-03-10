

## Fix Webapp Shaking/Jerking Issue

The app already has `overflow-y: scroll` on `html` (line 241), but is missing `scrollbar-gutter: stable` and GPU acceleration for Radix UI overlay elements.

### Changes to `src/index.css`

1. **Add `scrollbar-gutter: stable`** to the existing `html` rule (line 239-242) — this is the primary fix, reserving scrollbar space so content doesn't shift when scrollbar appears/disappears.

2. **Add `overflow-x: hidden`** to the `body` rule (line 208-214) to prevent horizontal overflow.

3. **Add GPU acceleration rules** for all Radix UI overlay components (dialogs, dropdowns, popovers, selects) — append after the existing scrollbar styles (~line 201):

```css
/* Prevent shaking on Radix UI overlays */
[data-radix-dropdown-menu-content],
[data-radix-dialog-content],
[data-radix-dialog-overlay],
[data-radix-popover-content],
[data-radix-select-content],
[data-radix-popper-content-wrapper],
[role="dialog"],
[role="menu"] {
  transform: translateZ(0);
  backface-visibility: hidden;
  will-change: transform, opacity;
}
```

4. **Add modal-open body class** CSS for preventing background scroll when modals are open:

```css
body.modal-open {
  overflow: hidden;
  padding-right: 15px;
}
```

These are minimal, targeted changes. Steps 1-2 fix 99% of shaking issues (scrollbar layout shift). Steps 3-4 handle edge cases with overlays.

