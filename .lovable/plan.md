

## Hero Section Redesign: AI Branding + Pakistani Heritage

### Files to Edit

**1. `src/pages/Index.tsx`** (Hero section, lines 183-290)
- Replace the light gradient background with a dark slate-to-indigo gradient: `bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950`
- Add a background image layer with the Unsplash Pakistani monument photo at 10-15% opacity using `mix-blend-overlay`
- Replace the pill badge text with "✨ AI-Powered Platform" and style it with a glowing blue/purple border (`shadow-[0_0_15px_rgba(99,102,241,0.5)] border border-indigo-400/50`)
- Update H1 to: "Conquer Your Exams with AI-Driven Precision" — wrap "AI-Driven" in a vibrant gradient span
- Update subheadline text to the Pakistan-focused copy
- Force all text in the hero to white (`text-white`) since the background is now dark
- Update CTA buttons: primary gets a bright gradient style, outline gets `border-white/30 text-white`
- Update `testCategories` bgClass from solid gradients to glassmorphism: `bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/20 text-white`
- Replace floating blur circles with subtle indigo/emerald glow orbs

**2. `src/components/TestCategoryCard.tsx`**
- Since bgClass now passes glass styles, ensure the Card properly applies them (it already does via `${bgClass}`)
- No structural changes needed — the glass classes will flow through

**3. `src/components/home/HeroStatsSection.tsx`**
- Update stat card gradients to glass style: replace solid gradients with `from-white/10 to-white/5` and add `backdrop-blur-md border border-white/20`
- Keep the progress bar and icon styling but ensure white text contrast

### Visual Result
- Dark, immersive hero with a faint Pakistani monument texture
- Glowing "AI-Powered Platform" badge
- Bold headline with gradient "AI-Driven" text
- Glass-effect action cards and stat cards floating over the dark background
- Premium, futuristic EdTech feel rooted in Pakistani identity

