

## Problem Analysis

The SubjectCard has **4 competing background layers** in dark mode, causing the teal/green bleed and flickering:

1. **Inline style** on the card div: `linear-gradient(135deg, ${theme.pastel} 0%, rgba(var(--card-rgb), ...))` — this injects subject-colored gradients (teal for Biology) even in dark mode
2. **`.glass-card` CSS class** — in dark mode sets `bg-card border-border`, but gets overridden by inline styles
3. **`.themed-card` CSS class** — sets `background: rgba(var(--card-rgb), var(--cards-opacity))` 
4. **`[data-atmosphere="aero"] .glass-card`** — forces background with `!important`, creating flash conflicts
5. **Dark overlay div** with `z-index: -10` — supposed to fix dark mode but sits behind everything and doesn't actually cover the inline gradient

The flickering comes from Framer Motion's stagger animation triggering repaints while these competing styles fight for priority.

## Fix Plan

### 1. Fix SubjectCard dark mode background (`src/components/SubjectCard.tsx`)

**Remove the broken dark overlay div** (lines 159-165) — it's ineffective at `-z-10`.

**Fix the inline background style** to use a proper dark-mode-aware approach:
- In dark mode, use a solid dark navy base (`rgba(15, 23, 42, 0.95)`) with only a very subtle color tint (opacity ~0.08)
- In light mode, keep the current pastel gradient
- Achieve this by removing the inline `style={{ background: ... }}` and instead using Tailwind dark: classes with a simpler background approach

**Specifically:**
- Remove the inline `background` style from the card div
- Remove the dark overlay div entirely
- Add proper dark mode classes: `bg-white/80 dark:bg-slate-900/95` on the card
- Keep the subtle color accent only on the icon squircle (which already works well)

### 2. Remove animation flicker (`src/components/subjects/SubjectGrid.tsx`)

- Reduce `staggerChildren` from `0.1` to `0.03` to minimize visible color transitions
- Use `opacity` only animation (no `y` offset) to reduce repaint-triggered flashing

### 3. Card border cleanup (`src/components/SubjectCard.tsx`)

- Replace `border-white/50 dark:border-white/20` with `border-border/40 dark:border-white/10` for subtler dark mode borders consistent with the home page

### Summary of Changes

| File | Change |
|------|--------|
| `SubjectCard.tsx` | Remove inline gradient background, remove dark overlay div, use Tailwind dark classes for solid dark navy card backgrounds |
| `SubjectGrid.tsx` | Reduce stagger timing to minimize flicker |

This makes the Subjects page dark mode match the Home page: dark navy cards, no colored gradients bleeding through, no flickering.

