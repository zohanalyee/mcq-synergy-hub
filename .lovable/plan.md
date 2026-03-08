

## Add AI Branding to Hero Section

Keep all current layout, cards, stats, and structure exactly as-is. Layer in subtle AI-themed visual enhancements inspired by the admin panel style.

### Changes

#### 1. `src/pages/Index.tsx` — Hero section background enhancements
- Add a subtle animated grid overlay (same pattern as AdminHeader) behind the hero section with very low opacity (`opacity-[0.03]`)
- Add two animated glowing orbs (violet + cyan) using `framer-motion` with `blur-3xl`, positioned absolute in the hero section corners — subtle pulsing animation
- Update the badge pill "Prepare Smarter, Score Higher" to include a `Sparkles` icon and a violet-to-blue gradient background instead of plain `bg-primary/10`
- Add a small `BrainCircuit` + `Sparkles` icon combo above the main heading with a glow effect, establishing the AI brand identity

#### 2. `src/components/home/HeroStatsSection.tsx` — Add AI scan-line overlay
- Add a very subtle scan-line CSS overlay on each stat card (like admin tabs)
- Add a tiny `Zap` or `Sparkles` micro-icon in the corner of each stat card to hint at AI-powered tracking

#### 3. `src/components/TestCategoryCard.tsx` — Subtle AI shimmer
- Add a subtle animated shimmer/shine sweep effect on hover using a pseudo-element or gradient animation
- No layout or color changes — just a premium shine effect on hover

### What stays the same
- All card layouts, gradients, grid structure, typography, spacing
- The test category cards keep their existing `bgClass` colors
- Stats section keeps its existing gradient colors
- Mobile layout unchanged
- Buttons unchanged

### Files to edit
1. `src/pages/Index.tsx` — Hero background orbs, grid, AI badge
2. `src/components/home/HeroStatsSection.tsx` — Micro AI indicators
3. `src/components/TestCategoryCard.tsx` — Hover shimmer effect

