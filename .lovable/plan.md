## Goal

Add premium, performance-safe text animations across 4 hero pages and upgrade the Auth left panel with count-up stats + sequential typewriter effect on feature blocks — without causing layout shift (CLS).

## 1. New Reusable Component: `src/components/TypewriterText.tsx`

A lightweight, dependency-free typewriter (uses `setTimeout`, no framer-motion needed for the typing itself — keeps it cheap):

- Props: `phrases: string[]`, `prefix?: string`, `typeSpeed?: number` (default 55ms), `deleteSpeed?: number` (default 30ms), `pauseMs?: number` (default 1600), `className?: string`, `cursorClassName?: string`, `minHeightClass?: string` (e.g. `min-h-[2.5em]`).
- Behavior: type → pause → delete → next phrase → loop.
- CLS safeguards:
  - Outer wrapper has `min-height` (passed via prop or sensible default).
  - Uses `inline-block` + `align-top` so cursor `|` doesn't reflow surrounding text.
  - Text rendered inside a `<span>` with `whitespace-pre-wrap break-words` so emoji/long lines don't widen layout.
- Respects `prefers-reduced-motion`: when set, just shows the first phrase statically.
- Cleans up timers on unmount; pauses when tab hidden (`document.visibilityState`).

## 2. New Reusable Component: `src/components/AnimatedNumber.tsx`

A small number count-up using `requestAnimationFrame` (similar to existing `AnimatedCounter` but simpler, supports separate prefix/suffix that stay fixed and don't animate):

- Props: `value: number`, `duration?: number` (default 2200ms), `prefix?: string`, `suffix?: string`, `className?: string`.
- Renders: `{prefix}{animatedNumber}{suffix}` — symbols (`+`, `%`) are static text, only the digits tick.
- Uses `useInView` from framer-motion to start on visibility (already in stack).
- Existing `AnimatedCounter.tsx` is kept as-is (used elsewhere); this new one is purpose-built for the auth panel where the suffix must stay anchored.

## 3. Page Integrations

### a) `src/pages/Index.tsx` (Home `/`)
- Replace the static `greeting` `<motion.h2>` (lines 209–221) with `<TypewriterText />` cycling:
  - `['Good afternoon, {userName}! 👋', 'Ace your Board Exams 📚', 'Crack Govt Job Tests 🏢', 'Generate Custom AI Tests 🤖']`
  - When logged out, drop the personalized phrase, keep the other 3.
  - Greeting time-of-day ("Good morning/afternoon/evening") computed from local hour for accuracy.
- `min-h-[2.25rem] md:min-h-[2.75rem]` to lock height.

### b) `src/pages/Tools.tsx`
- Below the H1 "Free Online AI Tools", replace the static description `<p>` with `<TypewriterText prefix="Access 50+ Premium AI Tools to " phrases={[...]} />` using the supplied array (with the trailing empty/typo entries cleaned).
- `min-h-[3rem]` wrapper.

### c) `src/pages/CustomSyllabus.tsx`
- The page currently has no hero text — only the breadcrumb + `<SyllabusBuilder />`. Add a small hero block above `<SyllabusBuilder />` containing:
  - H1 "Custom Syllabus Builder"
  - `<TypewriterText prefix="Build a custom syllabus to crack " phrases={['Sindh Board Exams', 'FPSC & Public Service', 'Cambridge O/A Levels']} />`
  - Wrapped in the same `max-w-7xl mx-auto px-4` container.

### d) `src/pages/Analytics.tsx` (Dashboard & AI Coach `/ai-coach`)
- Inside the existing gradient hero (line 82–104), under the "Personalized insights to boost your performance" line, add:
  - `<TypewriterText prefix="Your AI Coach is " phrases={['Analyzing your weak points...', 'Building your study plan...', 'Tracking your daily streak...']} className="text-xs md:text-sm text-muted-foreground" />`
  - `min-h-[1.5rem]` so it doesn't shift the rest of the hero.

## 4. Auth Page Upgrade — `src/components/landing/JoinSection.tsx`

### Count-up stats (bottom row)
- Replace the static `{value}` in `StatItem` with `<AnimatedNumber />`:
  - `'50K+'` → `<AnimatedNumber value={50000} suffix="+" />` formatted as `50,000+` (or compact `50K+` via a `format: 'compact'` prop — we'll add a compact mode that returns `50K`, `10K`, etc. while still animating).
  - `'10K+'` → `value={10000} suffix="+"`.
  - `'95%'` → `value={95} suffix="%"`.
- Suffix sits in a separate `<span>` so it never moves while digits tick.
- Duration ~2.4s, starts on mount (panel is above the fold).

### Sequential typewriter for feature blocks
- New small internal hook/state `useSequentialTyper(items, { typeSpeed, holdMs })`:
  - Tracks `activeIndex` (0–3) and `displayedText` for that index.
  - When active item finishes typing, holds `holdMs` (~1400ms), then advances to next index; loops back to 0 after the 4th.
  - Only ONE block animates at a time; the others show their **completed** text statically (so user can read them) — OR per the user's spec, show empty text until typed and keep typed text after. We'll go with: **once typed, text stays visible**; on loop restart, all four reset simultaneously and re-type sequentially. (Cleaner visual, no jarring deletes.)
- CLS safeguards in `FeatureItem`:
  - Each card gets `min-h-[68px]` (icon + 2 lines of text reserved).
  - Title element: `min-h-[1.25rem]`.
  - Description element: `min-h-[2.25rem]` (2 lines reserved at current font size).
  - Icons render immediately and never animate out — only text reveals.
- Implementation: lift state into `JoinSection`, pass `displayTitle` / `displayDescription` / `isTyping` props into each `FeatureItem`. A blinking cursor `|` shows only on the currently-typing block.

## 5. Performance & Safeguards (applies to all)

- All timers cleared in `useEffect` cleanup.
- `prefers-reduced-motion` → static first-phrase fallback for typewriter, instant final value for counters.
- No new npm dependencies.
- All animated containers have explicit `min-height` to prevent CLS.
- Components are `React.memo`'d where props are stable.

## Files to create

- `src/components/TypewriterText.tsx`
- `src/components/AnimatedNumber.tsx`

## Files to edit

- `src/pages/Index.tsx` — swap greeting block for `TypewriterText`.
- `src/pages/Tools.tsx` — swap description for `TypewriterText`.
- `src/pages/CustomSyllabus.tsx` — add hero with `TypewriterText`.
- `src/pages/Analytics.tsx` — add `TypewriterText` line in hero.
- `src/components/landing/JoinSection.tsx` — animated stats + sequential typewriter on features.

No translation files, routes, or backend changes needed.
