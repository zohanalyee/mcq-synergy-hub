# Phase 2E → 2F → 2G Roadmap

Sequential plan. Each phase ships independently and is verifiable before moving on.

---

## Phase 2E — Real Prerender Output (HIGHEST PRIORITY)

**Goal:** `view-source:` on whitelisted SEO routes shows real `<title>`, `<h1>`, body copy, internal links, and JSON-LD — not an empty `<div id="root">`.

### Step 1 — Identify offending browser-API access at module load
Sweep the eager-imported SEO route tree for top-level `window`, `document`, `localStorage`, `sessionStorage`, `navigator`, `matchMedia` access. Start points:
- `src/pages/Index.tsx`, `Quizzes.tsx`, `Blog.tsx`, `About.tsx`, `Contact.tsx`, `FAQ.tsx`, `Reviews.tsx`, `Boards.tsx`, `MDCATSyllabus.tsx`
- `src/pages/exams/ExamLandingPage.tsx`
- `src/pages/seo/*` (17 landing pages)
- `src/pages/programmatic/ProgrammaticLandingPage.tsx`
- Every context provider mounted in `App.tsx` (`AuthContext`, `AppearanceContext`, `LanguageContext`, `LearningContext`, `LoadingContext`, `UserRoleContext`, `DeviceCapabilityContext`, `FloatingToolsContext`)
- `src/hooks/useScrollDirection.ts`, `use-mobile.tsx`, `useDeviceCapability.ts`
- `src/lib/queryPersister.ts`, `prefetchRoutes.ts`, `guestSession.ts`, `agentQueue.ts`
- `src/utils/analytics.ts`

Tool: `rg -n "^[^/]*\b(window|document|localStorage|sessionStorage|matchMedia|navigator)\b" src --type=ts --type=tsx` plus targeted reads.

### Step 2 — Guard each offender
Wrap with `typeof window !== 'undefined'` (or `typeof document !== 'undefined'`). Pattern:
```ts
const initial = typeof window !== 'undefined' ? window.localStorage.getItem('x') : null;
```
For hooks/effects, move access inside `useEffect` (already client-only). For context defaults, return SSR-safe defaults when `globalThis.__PRERENDER__` is true.

### Step 3 — Tighten prerender shims
Keep `src/prerender-shims.ts` minimal but ensure `document` shim covers anything libraries touch at import time (e.g., `document.documentElement.classList` from theme providers). Still **no `window` global** — framer-motion etc. must take their SSR branch.

### Step 4 — Re-enable prerender for production
`vite.config.ts`: `(process.env.PRERENDER === 'true' || mode === 'production') && vitePrerenderPlugin({...})`. Keep current whitelist untouched.

### Step 5 — Strengthen `verify-prerender`
Currently soft-fails (`process.exit(0)`). Upgrade to:
- Hard-fail when `<div id="root">` content length < 500 chars (catches empty shells).
- Require `<h1` AND `application/ld+json` per whitelisted route.
- Exit 1 on any failure so CI catches regressions.

### Step 6 — Manual verification
`view-source:` on `/`, `/quizzes`, `/mdcat-syllabus`, `/exams/mdcat`, `/blog`, `/reviews` — confirm title, H1, paragraphs, canonical, JSON-LD all present pre-hydration.

**Out of scope:** auth, Supabase client, dashboard, admin, AI edge functions, routing logic.

---

## Phase 2F — Core Web Vitals & Mobile Performance

**Goal:** Lift mobile LCP / CLS / INP on Pakistan 3G–4G. Measured via Lighthouse mobile + PageSpeed Insights on `/`, `/mdcat-syllabus`, top opportunity detail page (currently 56 views/day).

### Step 1 — Audit baseline
Run `browser--performance_profile` on `/` and `/mdcat-syllabus`. Capture LCP element, longest task, CLS sources, total JS bytes per route.

### Step 2 — Image optimization
- Convert hero / above-fold images to AVIF + WebP via `vite-imagetools` (build-time).
- Add explicit `width`/`height` on all `<img>` to kill CLS.
- `loading="lazy"` + `decoding="async"` on below-fold images; `fetchpriority="high"` on LCP image.
- Preload LCP image in `index.html` for landing pages.

### Step 3 — Hydration weight
- Audit current eager bundle (`/` + shared chunks). Re-lazy any heavy SEO page subcomponent that isn't above-the-fold (e.g., long FAQ accordions, animated sections).
- Defer framer-motion-heavy sections behind `IntersectionObserver` mount.
- Verify `manualChunks` split (framer, charts, pdf, excel, markdown) is still effective — add `radix` and `lucide` splits if their combined size > 100KB.

### Step 4 — Font + CSS
- `font-display: swap` on all webfonts (Poppins, Orbitron).
- Preload Orbitron WOFF2 (used in brand mark, above the fold).
- Audit `index.css` for unused tokens; verify Tailwind purge is tight.

### Step 5 — Third-party scripts
- GA4 + any pixels: `async` + `defer`, load after `requestIdleCallback`.
- Move noscript pixels to `<body>` (already a project rule).

### Step 6 — Verify
Lighthouse mobile target: LCP < 2.5s, CLS < 0.1, INP < 200ms on `/` and `/mdcat-syllabus`. Document before/after in commit message.

**Out of scope:** backend, AI quotas, business logic.

---

## Phase 2G — AI Coach + Engagement Audit

**Goal:** Lift session duration, pages/session, and return-visit rate. Current analytics: 1.93 pages/visit, 80% bounce — both have room.

### Step 1 — Funnel audit (read-only)
Map current paths:
- AI Coach entry points (where users discover it)
- Suggestion engine triggers (after test? on dashboard? idle?)
- Dashboard "what's next" CTAs
- Notification / re-engagement loops (email, push, in-app)

Use `code--view` on `src/pages/Analytics.tsx`, `src/services/aiCoachService.ts`, `src/lib/aiCoach.ts`, dashboard widgets, notification service. No edits.

### Step 2 — Identify gaps
For each loop, document: trigger, payload, expected next action, measured CTR (if tracked). Flag missing tracking events.

### Step 3 — Smart-prompt improvements (UI-only)
- Post-test result: always surface 1 AI Coach suggestion + 1 "recommended next test" card.
- Dashboard empty/low-activity state: proactive "Resume MDCAT Biology — 3 weak topics" prompt.
- Idle-tab return: lightweight toast/banner ("Continue where you left off").
- Streak nudges + badge unlock confetti already exist (per memory) — verify they fire on these flows.

### Step 4 — Retention loops
- "Tomorrow's plan" card generated by AI Coach at session end.
- Weekly email digest of weak topics (uses existing edge functions; only template wiring).
- Resume-test deep links (already in place per memory; audit coverage).

### Step 5 — Instrumentation
Add GA4 custom events for: `coach_prompt_shown`, `coach_prompt_clicked`, `recommended_test_started`, `resume_session_clicked`. Required to measure phase impact.

### Step 6 — Measure
2-week A/B-style before/after on pages/session, session duration, 7-day return rate. Document in `.lovable/plan.md`.

**Out of scope:** changing AI Coach model, Supabase schema, quota system, RLS.

---

## Sequencing & checkpoints

```text
Phase 2E ──► verify-prerender hard-passes + 6 routes show real HTML in view-source
   │
   ▼
Phase 2F ──► Lighthouse mobile: LCP<2.5s, CLS<0.1 on / and /mdcat-syllabus
   │
   ▼
Phase 2G ──► +0.5 pages/session, -10pp bounce, instrumented coach events
```

Each phase ends with a verification checkpoint before the next starts. Constraints carried through all phases: no changes to Supabase schema, auth, RLS, AI edge functions, dashboard logic, or routing structure.
