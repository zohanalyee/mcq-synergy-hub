# Aggregate Calculator — Page-1 Audit & Improvement Plan

Report only. No code changes in this turn.

Target page: `/tools/aggregate-calculator`
Prize keywords (Semrush, `pk` database):

| Keyword | Volume | KD | Our position |
|---|---|---|---|
| aggregate calculator | 12,100/mo | 12 | 73 |
| mdcat aggregate calculator | 12,100/mo | 12 | 75 |
| aggregate formula for mdcat 2020 | 260/mo | — | 60 |
| aggregate calculator for mbbs | 260/mo | — | 83 |
| pmc aggregate calculator 2022 | 170/mo | — | 82 |
| nums aggregate | 170/mo | — | 41 |
| aggregate percentage calculator | 140/mo | — | 66 |
| uhs merit calculator | 50/mo | — | 65 |

Difficulty is only 12/100 and the current SERP is weak (nearpeer.org, mdcatmentor.org, eprepare.org, maqsad.io, result-pedia.net, plus a Facebook post at #10). This is winnable.

## 1. Why the page sits at ~73

**What the page actually has today**
- A working calculator: 5 exams (MDCAT/PMC, UHS, NUMS, ECAT, NUST NET), correct published weightages, matric/FSc/test inputs, aggregate %, admission-chance band, copy button.
- Good technical SEO already in place: indexable in `toolsSeo.ts`, in `sitemaps/tools.xml`, in `prerender-routes.mjs`, self-referencing canonical, og:image, and WebApplication + BreadcrumbList + HowTo + FAQPage JSON-LD via `ToolWrapper`.

So this is not a technical or indexing problem. Three real causes:

**a. Thin on-page text (primary cause).** The whole page is roughly a form plus ~120 words: one formula line, three band notes, one disclaimer, three FAQs, three how-to steps. Competitors ranking above us pair the same calculator with several hundred words: per-university formulas, last-year closing merits, worked examples, and year-specific sections. Google has almost no text on our page to match against "aggregate calculator" intent.

**b. Keyword mismatch in the title.** Current title renders as `Aggregate Calculator — Free Online Student Tools`. Both 12,100/mo money keywords are "aggregate calculator" and "**mdcat** aggregate calculator" — MDCAT appears nowhere in the title or H1, only in the description. Every top-5 result has MDCAT in its title/URL.

**c. Domain authority (structural, not fixable on this page).** Authority Score **2/100**, 15 backlinks from 12 domains — and the profile is mostly spam (`atomizelink.icu`, `nivira.shop`, PBN anchors like "premium backlinks"). At AS 2, a KD-12 keyword is reachable but only with a page that clearly out-answers the competition. No page-1 result here is a strong domain, which is why this is still realistic.

Note: the page has zero measured traffic share because positions 60–83 are past where anyone clicks — so the fix is position, not demand.

## 2. What to improve (proposed scope)

**A. Title, H1, and meta (highest leverage, smallest change)**
- Title: `MDCAT Aggregate Calculator 2026 — MDCAT, NUMS, UHS, ECAT & NUST` (under 60 chars, leads with the money keyword).
- H1 to match; keep the "Free Online" cue in the subheading instead of the title.
- Meta description rewritten around MDCAT/NUMS/UHS formulas + admission-chance band.
- This needs a per-tool title/H1 override in `ToolWrapper` (it currently hardcodes `${title} — Free Online ${category}` for every tool), driven from `toolsData.ts` — additive, no other tool changes.

**B. Real content depth below the calculator (the actual ranking fix)**
Added as page sections, all grounded in published formulas already in the code:
- "How the MDCAT aggregate is calculated" — PMC formula written out with a worked example (e.g. 1000/1100 matric, 950/1100 FSc, 160/200 MDCAT → step-by-step to the final %).
- A formula comparison table: MDCAT (PMC), UHS Punjab, NUMS, ECAT (UET), NUST NET — weightage per component, one row each.
- "What aggregate do I need?" — the existing indicative cut-off bands presented per exam, with the same "verify with official prospectus" caveat kept visible.
- Common mistakes section (using marks instead of percentage, wrong total, counting improvement marks).
- Only verifiable facts. No invented closing merits, no new cut-off numbers beyond the ones already in the file. Anything we cannot source gets left out.

**C. FAQ expansion (3 → 8–10)**
Built from real question-style searches around this cluster: "aggregate formula for MDCAT", "PMC aggregate calculator", "aggregate calculator for MBBS", "NUMS aggregate", "UHS merit calculator", "is NUST aggregate different". These flow automatically into the existing FAQPage schema — no schema work needed.

**D. Internal links in (currently the weak spot)**
The page is mostly reachable only via `/tools`. Add contextual links from high-intent existing pages:
- `/mdcat-past-papers`, `/mdcat-syllabus`, `/exams/mdcat`, `/ecat-preparation`, `/exams/nums`
- Reciprocal links from the calculator to those prep pages ("calculated your aggregate? now practice"), which also helps those pages.

**E. Sibling calculators cross-link**
`/tools/merit-calculator` targets `uhs merit calculator` intent too. Cross-link the two so they reinforce instead of competing, with the aggregate page as the cluster hub.

**Explicitly out of scope for this phase:** the spam backlink profile (already covered by the disavow file), and any new backlink outreach.

## 3. Realistic expectation

Positions 73 → page 1 in one step is not typical. With A+B+C+D shipped, the honest expectation is a move into the 15–35 range within 4–8 weeks, then page 1 on the long-tail variants (`aggregate formula for mdcat`, `nums aggregate`, `aggregate calculator for mbbs`) first, with the two 12,100/mo head terms following only as domain authority grows. Semrush estimates are directional, not guarantees.

## Technical notes

- `src/data/toolsData.ts` — add optional `seoTitle` / `h1` / `contentSections` for `aggregate-calculator`; extend its `faq` array.
- `src/components/tools/ToolWrapper.tsx` — honour optional per-tool `seoTitle`/`h1` overrides, falling back to today's generated string so all other tools are untouched.
- `src/pages/tools/AggregateCalculator.tsx` — render the new content sections below the calculator; brand tokens only, no hardcoded colours; existing heading hierarchy respected (single H1, sequential H2s).
- No database, edge function, or schema changes. JSON-LD is already emitted by `ToolWrapper`; expanded FAQs feed it automatically.
- After the change: verify prerendered HTML contains the new title and body text via `scripts/verify-prerender.mjs`, and bump `lastmod` in `public/sitemaps/tools.xml`.

## Noted for later (not implementing now)

- **MDCAT past papers cluster** — `mdcat past papers` 4,400/mo (KD 13) hub plus sub-pages for `mdcat past papers pdf` (880), `mdcat papers` (480), `sindh mdcat 2023` (480), `mdcat past papers with answers` (320), `uhs past papers` (320), `szabmu past papers` (320).
- **Class-wise repositioning** — reposition 9th/10th class pages as "notes + past papers + MCQ practice" rather than MCQ-only, since `9th class mcqs` is just 140/mo while notes/past-paper phrasing holds the larger volume pool.

Source for all keyword, SERP, and backlink figures: Semrush (`pk` database).
