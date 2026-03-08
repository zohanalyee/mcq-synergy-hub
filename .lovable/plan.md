## Premium UI/UX Enhancement Plan

The codebase already has a solid foundation: Framer Motion is used throughout, glass effects exist, the design system has good bones. The enhancements below focus on **high-impact, low-risk polish** across the 4 priority pages.

---

### 1. Staggered Card Animations on Home Page

**File:** `src/pages/Index.tsx`

Currently, all cards in each section animate individually with the same delay pattern. Wrap each grid section (subjects, features, testimonials) in a `motion.div` with `staggerChildren` variants so cards cascade in smoothly rather than popping in simultaneously. Apply to the 3 grid sections (~lines 288, 334, 415).

---

### 2. Enhanced Card Hover Effects

**Files:** `src/components/SubjectCard.tsx`, `src/components/FeatureCard.tsx`, `src/components/TestimonialCard.tsx`

- **SubjectCard**: Already has `whileHover={{ y: -3 }}`. Add `whileTap={{ scale: 0.97 }}` for tactile feedback and a subtle glow shadow on hover via inline style (`boxShadow` using the subject's theme color).
- **FeatureCard**: Add `whileHover={{ y: -4, scale: 1.02 }}` and `whileTap={{ scale: 0.98 }}` with spring transition. Currently has no hover motion.
- **TestimonialCard**: Add `whileHover={{ y: -4 }}` with spring transition. Currently static.

---

### 3. Smooth Section Reveal Animations on Home

**File:** `src/pages/Index.tsx`

Wrap each major `<section>` in a reusable `motion.section` with `whileInView` fade-up + `viewport={{ once: true, margin: "-80px" }}`. Currently individual headings animate but the section containers don't, causing a slightly jarring load of content blocks.

---

### 4. Hero Section Polish

**File:** `src/pages/Index.tsx`

- Add a subtle gradient text shimmer animation to "Precision" and "Confidence" (the `text-gradient` spans) using a CSS keyframe that moves a highlight across the gradient.
- Add `whileHover={{ scale: 1.03 }}` to the two hero CTA buttons for tactile feel.

**File:** `src/index.css`

Add a `@keyframes gradient-shimmer` and `.text-gradient-animated` class that shifts background-position.

---

### 5. Improved Stats Counter Section

**File:** `src/pages/Index.tsx` (lines 349-389)

The gradient stats bar is solid but flat. Add slight glassmorphism: make each stat column a mini glass card with `bg-white/10 backdrop-blur-sm rounded-xl p-4` inside the gradient section, giving depth.

---

### 6. Premium Skeleton Loaders for Subjects Page

**File:** `src/pages/Subjects.tsx`

Replace the simple `Loader2` spinner (line 134) with a skeleton grid that mirrors the actual `SubjectGrid` layout: a `grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5` of skeleton cards (rounded-2xl, with icon placeholder + 2 text lines), matching `SubjectCard` dimensions. This gives a perceived-performance boost.

---

### 7. Tools Page Card Enhancement

**File:** `src/pages/Tools.tsx`

Add `whileHover={{ y: -4 }}` and `whileTap={{ scale: 0.97 }}` to each tool card's `motion.div`. Currently they only have `hover:shadow-md` via CSS. The motion hover will feel more premium.

---

### 8. Global Page Transition Wrapper

**File:** `src/App.tsx`

No route-level `AnimatePresence` exists. The `PageLoader` overlay runs for 600ms but there's no content transition. This is too invasive to add everywhere safely, but we can add a simple fade-in wrapper: create a `PageTransition` component that wraps each page's content with `motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}`. Apply it inside `Header` component's `<main>` tag so every page fades in.

**File:** `src/components/Header.tsx` (line 224)

Wrap `{children}` inside `<main>` with a keyed `motion.div` using `location.pathname` as key.

---

### 9. Micro-interaction: Button Shine Effect

**File:** `src/index.css`

Add a `.btn-shine` utility class with a CSS-only diagonal shine sweep on hover (using `::after` pseudo-element with `translateX` animation). Apply to primary CTA buttons on the home page.

---

### 10. Bottom Nav Active Indicator Polish

**File:** `src/components/MobileBottomNav.tsx`

Add a small animated dot/pill indicator below the active icon using `motion.div` with `layoutId="bottomNavIndicator"` so it smoothly slides between tabs (the "magic move" pattern). Currently it uses a background pill glow but no sliding animation.

---

### Summary of Files to Modify


| File                                 | Changes                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------- |
| `src/pages/Index.tsx`                | Staggered grids, section reveals, hero shimmer, stats glass, button hover |
| `src/index.css`                      | Gradient shimmer keyframe, btn-shine utility                              |
| `src/components/FeatureCard.tsx`     | Add hover/tap motion                                                      |
| `src/components/TestimonialCard.tsx` | Add hover motion                                                          |
| `src/components/SubjectCard.tsx`     | Add tap + glow shadow                                                     |
| `src/pages/Subjects.tsx`             | Skeleton grid loader                                                      |
| `src/pages/Tools.tsx`                | Card hover motion                                                         |
| `src/components/Header.tsx`          | Page fade-in transition wrapper                                           |
| `src/components/MobileBottomNav.tsx` | Sliding active indicator                                                  |


Estimated scope: ~9 focused edits across 9 files. No new dependencies needed (Framer Motion already installed).   My additions:

Add #11:

11. Input Focus Glow Effect

File: src/components/ui/input.tsx

Add focus:ring-4 focus:ring-primary/10 for premium input feel

(Mentioned in their plan but not numbered)

Add #12:

12. Toast Notification Polish

File: Verify toast library styling

Ensure toasts have slide-in animation + backdrop blur

(Quick win if toasts exist)