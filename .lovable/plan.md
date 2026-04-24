

# Plan — Convert Navigational `onClick` Handlers to Semantic `<Link>` Tags

Goal: make all navigation crawlable by Googlebot and respect browser conventions (middle-click, right-click → "Open in new tab"), without altering visual design.

## The pattern (applied everywhere)

For every clickable element that navigates to an internal route:

```tsx
// BEFORE — invisible to SEO, no middle-click
<div onClick={() => navigate(`/subject-content/${id}`)} className="...">…</div>

// AFTER — real <a href>, identical styling
<Link to={`/subject-content/${id}`} state={{...}} className="block ...">…</Link>
```

Rules:
- Use `react-router-dom`'s `<Link>` (renders `<a href>`). Use `<NavLink>` only where active state is needed.
- Preserve all classes, motion wrappers, and hover styles. When wrapping a `motion.div`, render `<Link>` as the outer element with `className="block"` and keep the motion div inside, OR use `<Link asChild>`-style composition by passing the Link as the wrapper.
- For `framer-motion` cards: switch `motion.div` → `motion(Link)` via `motion.create(Link)` so we keep animation AND get a real anchor. Set `to`, `state`, `className` on it.
- Keep `state` payloads (used by `SubjectCard`, `Subjects`, `GlobalSearchDialog`) by passing them via `<Link state={...}>`.
- Buttons that **trigger an action then navigate** (e.g. "Generate test" → `/test-session/:id` after async work) stay as `<Button onClick>`. Anchors are only for direct navigation to a known URL at render time.
- External URLs (e.g. `JobCard` → `job.fileUrl`) become `<a href={url} target="_blank" rel="noopener noreferrer">`.
- Back buttons (`navigate(-1)`) stay as buttons — they aren't link targets.

## Files to refactor (scope)

### High-impact navigation cards (Phase 1)
1. **`src/components/SubjectCard.tsx`** — wrap card body in `motion(Link)` to `/subject-content/:slug` with `state`. Remove internal `handleClick` for the default case; keep `onClick` prop only as an optional override (when provided, render a button instead).
2. **`src/components/jobs/JobCard.tsx`** — replace `GlassCard onClick` with an external `<a href={job.fileUrl} target="_blank">` wrapper (or internal `<Link to={"/opportunity/" + id}>` when no fileUrl).
3. **`src/components/ui/GlassCard.tsx`** — add optional `to?: string` / `href?: string` props. When provided, render root as `<Link>` / `<a>` instead of `<div>`. Keeps every existing `GlassCard onClick` consumer working but enables semantic upgrades.
4. **`src/components/mock-tests/JobTestCard.tsx`** and **`TestCard.tsx`** — split UI: the card title/body becomes a `<Link to="/mock-tests/job-test/:id">` (deep-link page exists conceptually; if not, link to `/mock-tests?test=:id`). The "Start" CTA stays a button (it triggers async generation).
5. **`src/pages/BoardResults.tsx`** (line 124) — convert opportunity card `onClick` → `<Link to={"/opportunity/" + opp.id}>` wrapper.

### Navigation chrome (Phase 2)
6. **`src/components/PageBreadcrumb.tsx`** — already uses `BreadcrumbLink` but calls `e.preventDefault()` + `navigate()`. Remove the preventDefault/navigate; let the `href` work natively (Breadcrumb component's `BreadcrumbLink` already renders `<a>`).
7. **`src/components/board-topic/RelatedTopics.tsx`** — already uses `<Link>` ✓ (reference pattern).
8. **`src/components/board-topic/PracticeModeButtons.tsx`** — already uses `<Link>` ✓.
9. **Header/nav menus** — audit `src/components/Header.tsx` and any `navigation_items` consumers; convert `onClick={() => navigate(item.href)}` → `<Link to={item.href}>`.

### Search & dashboard (Phase 3)
10. **`src/components/global-search/GlobalSearchDialog.tsx`** — render result rows as `<Link to={...}>`. Keep `onSelect` callback for closing the dialog and analytics, fired from `onClick` on the Link (browser still navigates via href on middle-click).
11. **`src/pages/Subjects.tsx`** `handleSmartSearchSelect` — same pattern: results render `<Link>`s; the imperative `navigate()` only runs as a fallback.
12. **`src/components/dashboard/EmptyDashboard.tsx`**, **`src/components/analytics/AIInsightsPanel.tsx`**, **`src/components/analytics/TopicAnalysis.tsx`**, **`src/pages/exams/ExamLandingPage.tsx`**, **`src/pages/Index.tsx`** (hero + subject grid + "View All") — convert `<Button onClick={() => navigate(...)}>` to `<Button asChild><Link to="...">…</Link></Button>` (shadcn Button supports `asChild` via Radix Slot, preserving all variants/sizes).
13. **`src/components/quizzes/SubjectQuizzesTab.tsx`**, **`TopicQuizzesTab.tsx`** — same `<Button asChild><Link>` pattern for "Start Quiz".

### Action buttons that stay as buttons (no change)
- Test generators in `JobTestsTab`, `SubjectTestsTab`, `SyllabusBuilder`, `RecommendedPractice`, `QuickManualEntry` — they perform async work first, then navigate. Leave as-is. (SEO doesn't need these crawled; they're authenticated user actions.)
- Back buttons (`navigate(-1)`).
- Tool internal actions.

## Key technical notes

- **`Button asChild`** (shadcn) is the cleanest swap — no className duplication, no layout change:
  ```tsx
  <Button asChild className="..."><Link to="/boards">Browse Boards</Link></Button>
  ```
- **`motion(Link)`**: `const MotionLink = motion.create(Link);` then `<MotionLink to="..." whileHover={...} className="block ...">`. Preserves all framer animations on `SubjectCard`.
- **`GlassCard` upgrade** is backward-compatible: existing `onClick` consumers keep working; new `to`/`href` props upgrade the root element to a real anchor. This unlocks `JobCard`, `TestCard`, `JobTestCard` with one prop addition each.
- **State payloads**: `<Link to="/x" state={{...}}>` works identically to `navigate('/x', { state })`. No data loss.
- **Breadcrumb fix**: removing `preventDefault` is the entire change — the `BreadcrumbLink` already produces `<a href>`; the explicit `navigate()` was suppressing native behavior and blocking middle-click.
- **No visual regressions**: `<a>` and `<Link>` are inline by default; we apply `className="block"` (or `inline-flex` matching the original element) plus the original classes verbatim. No new wrapper divs are introduced.
- **Accessibility bonus**: real anchors get keyboard focus, screen-reader "link" role, and `:visited` styling for free.

## Verification checklist (after implementation)

1. Right-click on a subject card → "Open in new tab" works.
2. Middle-click on a mock test card opens it in a background tab.
3. View source / DOM inspector shows `<a href="/subject-content/...">` instead of `<div onClick>`.
4. `curl -s <published-url> | grep -c 'href="/subject-content'` returns >0 in SSR-fetched HTML (or in client-rendered DOM via crawler-friendly hydration).
5. Visual snapshot of `/subjects`, `/mock-tests`, `/`, `/board-results` is identical to before.
6. No TypeScript errors; existing `onClick` callers of `GlassCard`/`SubjectCard` still compile.

