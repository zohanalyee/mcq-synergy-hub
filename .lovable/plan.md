## Plan — Tools Expansion, EEAT Trust Layer, Final SEO Cleanup

Three sequential prompts, executed in one build pass. No redesign, no auth/favicon/dashboard/AI changes.

---

### Part A — Four new high-value tools

Create the following tool pages with consistent structure (ToolWrapper + `inputMode="decimal"` on numeric inputs, PKR formatting where applicable, error/empty states, copy buttons on result blocks):

1. **`src/pages/tools/AggregateCalculator.tsx`** → `/tools/aggregate-calculator`
   - Exam selector: MDCAT / ECAT / NUST / NUMS / UHS
   - Inputs: Matric (obtained/total), FSc (obtained/total), Entry test (obtained/total)
   - Per-exam weightage formulas (e.g. MDCAT: 10% Matric + 40% FSc + 50% MDCAT; NUST: 75% NET + 15% FSc + 10% Matric; etc.)
   - Output: aggregate %, admission-chance band (High/Moderate/Low based on historical cut-offs), formula display

2. **`src/pages/tools/MeritCalculator.tsx`** → `/tools/merit-calculator`
   - Open merit %, hafiz bonus (+20 marks toggle), sports/special quota selector
   - Output: final merit + merit category

3. **`src/pages/tools/PakistanTaxCalculator.tsx`** → `/tools/pakistan-tax-calculator`
   - FBR 2025-26 salaried slabs (0/5/15/25/30/35%)
   - Monthly ⇄ Annual toggle, PKR formatting
   - Output: total tax, effective rate, slab-wise breakdown table, take-home

4. **`src/pages/tools/ZakatCalculator.tsx`** → `/tools/zakat-calculator`
   - Inputs: cash, gold (g), silver (g), business assets, liabilities
   - Hardcoded current nisab values (gold 87.48g, silver 612.36g) with editable PKR/gram prices
   - 2.5% calculation, nisab eligibility check, Ramadan note

**Registration for all four:**
- `src/data/toolsData.ts` — add entries with `keywords`, `seoDescription`, `howToUse`, `faq`, `relatedTools`, icon, category
- `src/App.tsx` — lazy route imports
- `scripts/generate-sitemaps.mjs` (drives `public/sitemaps/tools.xml`) — add entries with priority 0.9/0.9/0.8/0.8
- `scripts/verify-prerender.mjs` prerender list — add the four routes

---

### Part B — EEAT trust layer

1. **`src/pages/EditorialPolicy.tsx`** at `/editorial-policy`
   - Reuse the rich content already in `src/pages/legal/EditorialPolicy.tsx` (sourcing, authorship, corrections, independence, AI disclosure, contact). The existing file is at `/editorial-policy` already wired in `App.tsx` — verify the route. If already mounted, skip duplication and only ensure footer link + sitemap entry exist.
   - Add link to footer "Legal/Trust" column
   - Add `/editorial-policy` to `public/sitemaps/static.xml` via generator

2. **`src/pages/About.tsx`** — append Person JSON-LD for Zohaib Ali Channa (Founder & Developer) alongside existing AboutPage schema.

3. **`src/components/StructuredData.tsx`** (or wherever the sitewide Organization schema lives — verify location) — upgrade `@type` to `["Organization", "EducationalOrganization"]`, add `foundingDate`, `areaServed: "Pakistan"`, `teaches: [...]`, `publishingPrinciples: ".../editorial-policy"`.

4. **Last-updated stamps** — add a small `Last updated: <date>` line near the H1 of every `src/pages/seo/*.tsx` landing page using a per-page constant (not `new Date()` — must be stable for crawlers).

5. **`src/pages/Reviews.tsx`** — already emits `AggregateReviewSchema` from live DB data. Add a fallback static `AggregateRating` (4.8 / 500) only when DB returns zero reviews, so the page always carries the schema.

---

### Part C — Final SEO cleanup

1. **Exam-contextual MCQ CTA in `ToolWrapper.tsx`**
   - Add `examContext` map keyed by `toolId` → `{ label, url }`
   - Defaults preserved: aggregate/merit → MDCAT, gpa → ECAT, age → NTS, percentage → FPSC; fallback `/subjects`
   - Replace the static CTA card content with contextual label + url

2. **Broken-link reconciliation** — `programmaticSeo.ts` previously redirected `/tools/aggregate-calculator` to `/tools/marks-calculator` as a stop-gap. Revert that redirect back to `/tools/aggregate-calculator` now that the real page exists. Same audit for `merit-calculator`.

3. **Sitemap & prerender** — entries from Part A also satisfy Prompt 3 Fix 4. The static-page sitemap gets `/editorial-policy`.

---

### Verification

- `node scripts/verify-sitemap.mjs`
- `node scripts/verify-prerender.mjs`
- Confirm no duplicate FAQPage / WebApplication JSON-LD
- Confirm no `noindex` regressions on new tool pages
- Spot-check console for Helmet warnings

### Out of scope (untouched)

Auth flows, favicon assets, dashboards, AI generation pipelines, branding, color palette, gradients, animations, layout structure.
