

## Fix: Center Floating Action Bar on Mobile

### Problem
From the screenshots, the floating bar appears offset/not fully centered on mobile. It uses `w-[92%] max-w-2xl` but on small screens the `max-w-2xl` (672px) isn't the issue — the bar just needs to stretch wider and be properly centered.

### Change

**File:** `src/components/syllabus-builder/FloatingActionBar.tsx` (line 84)

Change the container classes from:
```
fixed bottom-20 lg:bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-2xl
```
To:
```
fixed bottom-20 lg:bottom-8 left-4 right-4 lg:left-1/2 lg:-translate-x-1/2 lg:w-auto lg:max-w-2xl lg:right-auto z-[100]
```

On mobile: uses `left-4 right-4` (16px padding on each side) — this stretches the bar edge-to-edge with equal margins, guaranteeing true centering regardless of screen width. No `translate` trick needed.

On desktop (lg+): reverts to the centered `left-1/2 -translate-x-1/2` approach with `max-w-2xl`.

This is a single-line class change.

