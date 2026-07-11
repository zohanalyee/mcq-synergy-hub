# Audit Report + Fix Plan — /exams, /p & AI Coach discoverability

## Part A — Live audit findings

I fetched the published pages with a Bingbot user-agent and inspected the raw head.

### 1. Duplicate meta-description / canonical (Bing report)

**Status: already resolved in the current deploy — Bing data is stale.**

Live raw HTML today shows exactly ONE of each:


| URL            | `<title>` | `description` | `canonical` |
| -------------- | --------- | ------------- | ----------- |
| /exams/nts     | 1         | 1             | 1           |
| /exams/mdcat   | 1         | 1             | 1           |
| /p/css-karachi | 1         | 1             | 1           |


Reason: `scripts/dedupe-og.mjs` (runs in `build`) already collapses duplicate `title`, `description`, `canonical`, `og:*`, `twitter:*` on every prerendered file. The static defaults in `index.html` + Helmet's appended tags no longer both survive. The Bing "2 instances" warning predates this fix and will clear on the next Bing recrawl. No code change needed — I'll note it for you.

### 2. Title too long — REAL, widespread issue ❌

SEOHead appends `" | MCQsAI"` (9 chars) to every page title. Combined lengths exceed the ~60-char limit Bing/Google flag:

- `/exams/mdcat` → **62** ("MDCAT Preparation 2025 – Free MCQs, Past Papers & Tips | MCQsAI")
- `/exams/css` → **67** ("CSS Exam Preparation 2025 – MCQs, Past Papers & Study Guide | MCQsAI")
- `/p/mdcat-karachi` → **75** ("MDCAT Karachi 2026 — Test Centres, Universities & Free MCQ Practice | MCQsAI")
- Many other `/p/*` titles land in the 66–75 range.

Root cause: `metaTitle` in `src/data/examData.ts` and `title` in `src/data/programmaticSeo.ts` are authored at/above 55–66 chars before the suffix is added.

### 3. AI Coach discoverability — REAL gap ❌

- The only route is `/ai-coach` in `App.tsx`, wrapped in `InstantAuthGuard` and rendering the private `Analytics` dashboard. It is **login-gated → not crawlable/indexable** by Google or AI answer engines.
- Not present in any sitemap (`public/sitemaps/*.xml`); only mentioned in prose inside `llms.txt`.
- No `SoftwareApplication`/`Service` schema anywhere for the feature.
- Result: ChatGPT/Google have nothing public to index → the flagship differentiator is invisible.

---

## Part B — Proposed fixes (build phase, after your approval)

### Fix 1 — Shorten titles on /exams and /p (≤60 incl. suffix)

- `src/data/examData.ts`: rewrite each `metaTitle` to ≤50 chars so the final title stays ≤60. e.g. `CSS Exam Preparation 2025 – MCQs & Past Papers` (→ 55 w/ suffix).
- `src/data/programmaticSeo.ts`: trim each `title` (used as both `<h1>` and `<title>`) to ≤50 chars. Keep city + exam + year keywords; drop the long tail ("Test Centres, Universities & Free MCQ Practice" → "Centres, Merit & Free MCQs").
- No change to `SEOHead` suffix logic; only source data is trimmed.
- Verify with a length check across all exam slugs + all indexable `/p` slugs.

### Fix 2 — New PUBLIC AI Coach landing page (flagship SEO/AEO page)

- Create `src/pages/AICoachLanding.tsx` — a public, **no-auth** marketing/description page explaining the AI Coach & Dashboard: what it does (conversational guidance, recommendations, weak-area detection, spaced repetition), how it helps, and CTAs ("Try the AI Coach" → `/ai-coach` for signed-in flow, "Start free" → sign-up).
- Route it at a public path. Since `/ai-coach` is already the auth-gated app route, use `/features/ai-coach` for the public page (keeps the app route intact and avoids a redirect collision).
- Head/SEO via `SEOHead`: unique ≤60 title (e.g. "AI Study Coach for Pakistan Exams | MCQsAI"), unique meta description, `type="website"`.
- JSON-LD: `SoftwareApplication` (or `Service`) schema — name "MCQsAI AI Study Coach", `applicationCategory: EducationalApplication`, `offers` free, `featureList`, `provider` Organization — so AI answer engines can cite it.
- Add `BreadcrumbSchema` (Home → Features → AI Study Coach) and internal links to `/ai-coach`, `/boards`, `/mock-tests`.

### Fix 3 — Make it crawlable + indexable

- Add `/features/ai-coach` to the sitemap: new `public/sitemaps/static.xml` entry (or the appropriate static sitemap) + include in `generate-sitemaps.mjs` so it regenerates.
- Ensure it renders `robots=index,follow` (SEOHead default) and is prerendered: add `/features/ai-coach` to `PRERENDER_ROUTES` in `vite.config.ts` (it renders SEOHead synchronously, so static prerender works).
- Add a one-line entry/link to `public/llms.txt` pointing at the new URL.

### Fix 4 — Verify

- Run the build locally (`inject-meta` + `verify-prerender` + `verify-sitemap`) to confirm: new page prerenders with correct head, titles are all ≤60, sitemap includes the new URL, single canonical/description everywhere.

---

## Technical notes

- Title suffix is centralized in `SEOHead` (`${title} | MCQsAI`); trimming happens only in the two data files.
- The public AI Coach page is presentation-only — no business-logic/backend changes; it reuses existing `Header`/`Footer`/`SEOHead`/`BreadcrumbSchema`.
- Duplicate-tag warning needs no code change; recommend requesting a Bing recrawl after redeploy.

No further steps beyond the above are expected. Approve to proceed to build.

&nbsp;

# **Audit approved**. Sab 3 fixes k liye proceed karein:

&nbsp;

1. Duplicate meta/canonical — koi action nahi chahiye, sirf note kar liya hai

2. Title-length fix — /exams aur /p data files mein titles ≤50 chars tak trim karein (suffix logic na chhuyen)

3. AI Coach public landing page (/features/ai-coach) banayen — SEOHead + SoftwareApplication schema + sitemap + prerender + llms.txt entry, jaisa propose kiya hai. Asal /ai-coach app-route ko bilkul na chheden.

&nbsp;

Build/verify k baad (inject-meta + verify-prerender + verify-sitemap) mujhe bata dein review k liye.