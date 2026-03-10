

## Redesign Auth Page with Premium Glassmorphism

The current Auth.tsx already has basic glassmorphism and mesh gradient blobs. The upgrade will make it look like the user is peering through frosted glass at a blurred dashboard, with richer visual depth.

### Changes to `src/pages/Auth.tsx`

**1. Background — Faux Dashboard + Blur Overlay**
- Replace the current mesh gradient blobs with a two-layer background:
  - **Layer 1**: A rich mesh gradient simulating a colorful dashboard (multiple positioned gradient shapes — cards, sidebar, nav hints — using CSS gradients)
  - **Layer 2**: A `backdrop-blur-md` or direct `blur-sm` overlay on top, giving the "looking at the app through frosted glass" illusion
- Keep `absolute inset-0 z-0` positioning

**2. Glass Card — Enhanced Frost Effect**
- Update the Card classes to: `bg-white/40 dark:bg-slate-900/50 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] rounded-2xl`
- Remove the existing `<Card>` wrapper and use a plain `div` with these glass classes + `p-8` for direct control

**3. Input Fields — Transparent Modern Style**
- Add className overrides on all `<Input>` components: `bg-white/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 border-white/60 dark:border-white/15`

**4. Google Button — Glass Style**
- Update to `bg-white/70 dark:bg-slate-800/60 border-white/50 hover:bg-white/90`

**5. Everything Else Stays**
- Logo, tabs, forgot password link, T&C checkbox, form order — all unchanged functionally

### Files Modified
- `src/pages/Auth.tsx` — background, card, and input styling overhaul

