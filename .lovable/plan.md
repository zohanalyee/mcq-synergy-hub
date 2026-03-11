

# Fix: Platform Stats Showing 0s

## Root Cause

The `AnimatedCounter` component has a `hasAnimated` flag that locks after the first animation. The stats section renders the counter with `to=0` while data is loading (when `isLoading` is briefly false or data is undefined), the counter animates 0→0, then when real data arrives the counter refuses to re-animate.

There are two issues working together:
1. **PlatformStatsSection** doesn't gate rendering on data availability — it renders counters with `to=0` before data loads
2. **AnimatedCounter** never re-animates once `hasAnimated` is set, even if `to` prop changes

## Fix

### 1. `PlatformStatsSection.tsx`
- Add `console.log("STATS DATA RESPONSE:", data)` before the return as requested
- Only render `AnimatedCounter` when `data` is available (not just when `!isLoading`). Show skeleton when `isLoading || !data`

### 2. `AnimatedCounter.tsx`
- Reset `hasAnimated` when the `to` prop changes so the counter re-triggers if data arrives after initial mount. This is a safety net.

These two changes together ensure counters only mount once real data is available, and can recover if props change.

