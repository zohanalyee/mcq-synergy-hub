

## Plan: Standardize Header/Nav Thickness & Modernize Bottom Navigation

### Problem
1. Top header bar and bottom nav bar have inconsistent heights
2. Bottom navigation looks basic — needs modern app-like feel with better icons, animations, and styling

### Changes

**1. Standardize Bar Heights**
- **Top header** (`src/components/Header.tsx`): Already `h-14` (56px) — keep as is
- **Bottom nav** (`src/components/MobileBottomNav.tsx`): Currently `h-16` (64px) — reduce to `h-14` to match header
- **Content padding** (`src/index.css`): Reduce `pb-mobile-nav` from `5rem` to `3.5rem` (56px)
- **Main content** margin `mt-14` stays consistent

**2. Modernize Bottom Navigation (`src/components/MobileBottomNav.tsx`)**

- **Modern filled/outline icon pattern**: Use outline icons for inactive, filled-style icons for active (swap to filled variants via `strokeWidth` and `fill` props)
- **Animated active indicator**: Replace the background pill with a small dot/line indicator above the icon (like iOS/Android modern apps) using `motion.div` with `layoutId`
- **Tap bounce animation**: Wrap each nav button in `motion.button` with `whileTap={{ scale: 0.9 }}` for tactile feedback
- **Active icon pop**: Add `motion.div` with `animate={{ y: -2 }}` for the active icon to "lift" slightly
- **Glassmorphism bar**: Enhance the nav bar with stronger glass effect — `bg-white/70 dark:bg-black/70 backdrop-blur-2xl` with subtle top shadow instead of hard border
- **Cleaner label typography**: Use `text-[9px]` with `tracking-wide` for a sleeker look
- **Profile avatar**: Add a subtle gradient ring animation when active

### Layout (visual)
```text
┌──────────────────────────────────┐  h-14
│  ☰  Logo          🔔 🔍 👤      │  Top header
├──────────────────────────────────┤
│                                  │
│         Page Content             │
│                                  │
├──────────────────────────────────┤
│    ·                             │  Small dot indicator
│  🏠   📚   💼   📋   👤        │  h-14 Bottom nav
│ Home  Sub  Tests Syll  You      │  (glassmorphism)
└──────────────────────────────────┘
```

### Files Modified
- `src/components/MobileBottomNav.tsx` — main redesign
- `src/components/Header.tsx` — no change needed (already h-14)
- `src/index.css` — adjust `pb-mobile-nav` to match new nav height

