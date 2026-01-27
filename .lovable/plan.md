
# Plan: Fix Mix Library Colors Not Applying to Webapp

## Problem Identified

The Mix Library color changes appear in the Live Preview but don't apply to the actual webapp background. After analyzing the code:

1. **CSS Variables are set correctly** in `applySettings()` (`--mix-color-1`, `--mix-color-2`, `--mix-color-3`)
2. **BUT** `LiquidBackground` and `StaticBackground` use `getMixColors()` which reads from React state
3. **The `getMixColors` function is memoized** with `useCallback` and has the correct dependencies
4. **Issue**: When clicking preset buttons or "Apply", the state updates trigger `applySettings()` but the components may not be re-rendering due to how Framer Motion handles updates

## Solution

### Part 1: Fix Components to Use CSS Variables Directly

Instead of reading from `getMixColors()`, make the background components read directly from CSS variables. This ensures they always reflect the current applied settings.

**File: `src/components/LiquidBackground.tsx`**
- Remove dependency on `getMixColors()`
- Read colors from CSS variables `--mix-color-1`, `--mix-color-2`, `--mix-color-3`
- Use a state that syncs with CSS variables when settings change

**File: `src/components/StaticBackground.tsx`**
- Same approach - read from CSS variables instead of React state

### Part 2: Ensure Components Re-render on Mix Changes

**File: `src/contexts/AppearanceContext.tsx`**
- The context is working correctly - settings change triggers `applySettings()`
- Ensure `getMixColors` is not over-memoized

### Part 3: Alternative - Force Re-render with Key Prop

If CSS variable approach is complex, use a key prop on background components that changes when colorMix changes, forcing a complete re-render.

---

## Implementation Details

### File: `src/components/LiquidBackground.tsx`

```typescript
// Instead of:
const mixColors = getMixColors();

// Use CSS variables via getComputedStyle or pass colors directly from settings:
const mixColors: [string, string, string] = settings.colorMix === 'custom' 
  ? settings.customMixColors 
  : mixLibrary[settings.colorMix];
```

Or add a unique key to force re-render:
```tsx
// Parent component that renders LiquidBackground
<LiquidBackground key={`${settings.colorMix}-${settings.customMixColors.join('-')}`} />
```

### File: `src/components/StaticBackground.tsx`

Same fix - read colors directly from settings or use CSS variables.

### File: `src/App.tsx` (if using key approach)

Pass a key prop to background components that includes the colorMix state.

---

## Summary of Changes

| File | Changes |
|------|---------|
| `src/components/LiquidBackground.tsx` | Read colors directly from `settings` instead of memoized `getMixColors()` |
| `src/components/StaticBackground.tsx` | Read colors directly from `settings` instead of memoized `getMixColors()` |
| `src/contexts/AppearanceContext.tsx` | Export `mixLibrary` (already done) |
| `src/App.tsx` | Add key prop to background components to force re-render on color changes |

---

## Expected Result

After implementation:
- Clicking any Mix Library preset (Default, Sunset, Ocean, Forest) will immediately update the webapp background
- Picking custom colors and clicking "Apply" will immediately apply those colors to the background
- The Live Preview and actual webapp will always match
- All changes auto-save to localStorage
