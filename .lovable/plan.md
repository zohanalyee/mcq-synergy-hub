# SEO Indexing Fix — Tools, /quizzes Redirect, Canonicals

## Diagnosis (what's actually wrong)

1. **Tools (57 URLs not indexed)** — Reason root cause: **none of the 65 files in `src/pages/tools/*` render `<SEOHead>`**. Every tool URL serves the exact same `<title>` and `<meta description>` from `index.html`, with no canonical pointing back to itself. Google's crawler (which doesn't execute JS reliably enough to re-read the SPA's per-route meta) sees ~65 pages with identical metadata → buckets them as duplicates → only the `/tools` index gets indexed. This is exactly the pattern in your screenshot (only `/tools` listed under `site:mcqsai.com/tools`).

2. **/quizzes "Redirect error"** — `<Route path="/quizzes">` is wrapped in `<InstantAuthGuard>` which `<Navigate to="/auth" replace />` for any unauthenticated visitor. Googlebot is unauthenticated, so it follows the client-side redirect to `/auth`, which is `Disallow`-ed in `robots.txt` → GSC reports "Redirect error". The page is effectively invisible to search.

3. **"Alternative page with proper canonical tag" on `https://www.mcqsai.com/`** — The www variant is being canonicalised to the non-www variant, which is *correct behaviour*. GSC's "Not indexed" status here just means "we picked the canonical and skipped the duplicate". Once we click "Validate fix" it will close. **No code change needed** — but we'll add a hard www→non-www guard in `<SEOHead>` to make it impossible for any rogue page to leak a www canonical.

4. **`/tools?lang=ur` "Page with redirect"** — `SEOHead` emits `<link rel="alternate" hreflang="ur" href=".../tools?lang=ur">` but the app doesn't actually consume `?lang=ur` — visiting that URL likely re-renders without the param, looking like a redirect to Google. Fix: make the canonical strip `?lang=` and either honour the param on mount or drop the hreflang param variants in favour of an `x-default` self-canonical.

5. **Bonus issue I found** — `src/pages/tools/AgeCalculator.tsx` (and all 64 others) have **no `<h1>`** with the tool name and no semantic structured data. Even after we add `SEOHead`, ranking will be weak. We'll add a minimal `<SEOHead>` + `<h1>` pattern via a small `ToolPageHead` helper to keep the diff small.

## Files to change

### A. Make all 57+ tool pages indexable (the main fix)

- **New** `src/components/tools/ToolPageHead.tsx` — tiny wrapper around `<SEOHead>` that takes `{ tool: ToolDefinition }` and emits a unique title/description/canonical/keywords + JSON-LD `WebApplication` schema using the existing `ALL_TOOLS` data.
- **Edit** `src/data/toolsData.ts` — confirm every tool has a meaningful `seoDescription`; fill in the missing ones (a one-liner per tool, derived from `name` + `description`).
- **Edit** every file in `src/pages/tools/*.tsx` (65 files) — add a single line near the top of the JSX:
  ```tsx
  <ToolPageHead toolId="age-calculator" />
  ```
  Done as a deterministic codemod (one-line insert just inside the returned `<Header>` for each file). No layout/UI changes.

### B. Fix `/quizzes` redirect error

Two options — I recommend Option 1:

- **Option 1 (recommended)**: Make `/quizzes` publicly viewable. Move `InstantAuthGuard` *inside* `Quizzes.tsx` so it only gates the "Start Quiz" action (the same pattern several other pages already use). Result: Googlebot gets HTML 200 with full meta + content; only clicking "Start" prompts sign-in. Edit: `src/App.tsx` (drop the guard wrapper for `/quizzes`) + `src/pages/Quizzes.tsx` (gate the start handlers with `if (!user) saveIntent + navigate('/auth')`).
- **Option 2 (fallback)**: Add `noindex,follow` to `Quizzes.tsx`'s SEOHead and put `Disallow: /quizzes` in `robots.txt`. Loses the SEO opportunity but kills the GSC error.

I'll go with **Option 1** unless you prefer Option 2.

### C. Canonical hardening

- **Edit** `src/components/SEOHead.tsx`:
  - Force-strip `www.` and `?lang=…` from the computed `canonicalUrl` so no page can ever emit `https://www.mcqsai.com/...` or `?lang=ur` as canonical.
  - Strip trailing slash (except root) for consistency.
  - Drop the `?lang=ur` / `?lang=sd` `hreflang` alternates and replace with a single `x-default` self-canonical until the app actually serves a different rendering for those URLs. This prevents GSC from reporting them as "Page with redirect".

### D. Sitemaps already correct — light touch

- Verify `public/sitemaps/boards-1.xml` is non-empty (it exists; build re-generates it from Supabase). No change needed.
- `public/sitemap.xml` and `robots.txt` are correct.

### E. (Optional, safe) Add JSON-LD to `/tools` index

- `src/pages/Tools.tsx`: add `ItemList` JSON-LD listing all 65 tools so Google's site-links surface picks them up faster.

## What you need to do in Google Search Console after deploy

1. URL Inspection → Test Live URL on `https://mcqsai.com/tools/age-calculator` → confirm new title/canonical render → click "Request indexing".
2. Repeat for 5–10 representative tools (the rest will be picked up via the sitemap).
3. On the three "Why pages aren't indexed" rows → click **Validate fix**.
4. Resubmit `https://mcqsai.com/sitemap.xml`.
5. Wait 3–14 days. Expected outcome: 50–60 of the 65 tool pages indexed, `/quizzes` indexed, the three error rows close.

## Out of scope

- No new sitemap infra (already correct).
- No prerendering / SSR — Google has indexed the SPA's board pages fine, so the issue is metadata, not rendering.
- No changes to hosting redirects (already correct per your test).

## Risk

- The 65-file tool edit is mechanical (one-line insert per file). Worst case any failed edit just leaves that one tool without SEO meta — no runtime breakage.
- Removing `InstantAuthGuard` from `/quizzes` exposes the page UI to logged-out users; we re-gate the action handlers so no protected data is exposed.

Approve and I'll implement A–D in one pass (E if you want it).
