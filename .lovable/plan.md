# Admin-editable exam page facts — audit and proposal

## Findings (current state)

There are two separate kinds of exam pages, both with facts hardcoded:

| Group | Pages | Where facts live |
|---|---|---|
| Generic exam pages | mdcat, ecat, css, ppsc, fpsc, nts, pms (7) | One shared data file, rendered by one shared template |
| Admission-test guides | nums, iba-sukkur, lat, karachi-university, sindh-university, nat, lums, aku, giki, uet-lahore, air-university, pieas, hec-gat-subject, usat (14) | Each page is its own small file passing ~20 fields to one shared template (name, meta title/description, intro, exam body, duration, total marks, test date, subjects, pattern table, eligibility, key dates, tips, official sources, verified-on, related links, mock-test link) |
| MDCAT extras | MDCAT countdown, test-day block | A separate hardcoded test date (still 20 Sep 2026) |

Other places that copy these facts:
- Exam sitemap: slug list + a hand-maintained "verified-on" lastmod map (karachi-university excluded by hand).
- Prerendering: pages are prerendered with a synchronous renderer that **cannot wait for database reads**. This is the main technical constraint.

## 1. Can the facts move to the database? Yes

All 21 pages already funnel through two shared templates, so the fields map cleanly to one table. One new table `exam_pages`, one row per slug:
- Simple fields: slug, name, full name, meta title, meta description, keywords, intro, exam body, duration, total marks, frequency, test date (display text), test date (real date, for countdowns), registration opens/closes, admit-slip info, result date, pattern note, official URL, verified-on date, status (draft / published), include-in-sitemap flag.
- List fields (stored as structured lists): subjects, pattern rows, eligibility points, key dates, tips, official sources, related links, mock-test link.
- Every fact field can be left empty or set to "Not yet announced", shown as a "Not yet announced" label on the page.
- Access: anyone can read published rows; only admins (via the existing `is_admin()` check) can create or edit. A change-history table records who changed what, so mistakes can be undone.

## 2. Admin UI

New "Exam Pages" tab in the existing admin panel:
- **List view:** all exam pages with slug, test date, verified-on date, status, an "in sitemap" indicator, and a warning badge if verified-on is older than 6 months or the test date has passed (shows which pages need a yearly update).
- **Edit view:** form sections for Basics/SEO, Key facts (test date, duration, marks, registration window, admit slip, result), Subjects and pattern table (add/remove/reorder rows), Eligibility, Key dates, Tips, Official sources (label + link, at least one required), Related links.
- "Mark as not yet announced" toggle next to each fact field.
- Live quality check panel in the form (intro word count, FAQ/fact count, official source present) showing whether the page will be indexable before saving.
- "Duplicate for next year" button: copies the row, clears dates, sets them to "Not yet announced", and bumps the year in title text, for the MDCAT 2027 case.
- Save takes effect for visitors right away. Search-engine HTML refreshes on the next publish (see below).

## 3. Quality gate, prerender and sitemap stay safe

- **Visitors:** the page loads the database row; if it is unavailable, it falls back to the current in-code data, so a page is never blank or broken.
- **Crawlers/prerender:** because the renderer cannot wait for the database, facts are fetched **once at build time** (same pattern already used for board topic pages) and baked into the prerendered HTML, title, description and structured data. Effect: admin edits show to visitors instantly; Google sees them after the next Publish. This should be stated clearly in the admin UI.
- **Indexability rules unchanged:** the same rules (substantial intro, official source, not a thin page) are moved into one shared checker used by the page, the sitemap builder and the admin preview, so all three always agree. This follows the existing project rule that sitemap inclusion comes from the real quality gate, not a hand-copied list.
- **Sitemap:** the hand-kept exam slug list and lastmod map are replaced by the published rows that pass the checker; lastmod = verified-on date. Karachi University stays excluded automatically until it passes, with no manual exclusion.
- Routes, URLs, layout, ads and the shared templates' look stay the same.

## 4. Effort and migration plan

Phased, with each phase checked before the next:

1. **Database:** table, access rules, history table. Small.
2. **Data import:** a one-off script reads the 21 existing pages and inserts them unchanged. Then check row by row that every field matches the current pages. Small to medium.
3. **Page wiring:** both templates read from the database with code fallback; MDCAT countdown reads its real test date from the row. Medium.
4. **Build-time bake-in + shared quality checker + sitemap switch.** Then compare the prerendered HTML of all 21 pages before and after; the visible text must be identical. Medium; this is the riskiest step.
5. **Admin tab** (list, edit form, quality panel, duplicate-for-next-year, history). Medium to large; biggest part.
6. **Cleanup** (later, optional): after a stable period, the hardcoded per-page files shrink to fallbacks only.

Rough size: about 3 to 4 build rounds. Steps 1–4 can ship first, keeping today's pages identical. The admin tab can follow.

## Open decisions for you

- Should test dates also have a real calendar date (so pages can auto-show "Test held on…" once it passes), or stay display text only?
- Should page sections other than facts (intro, tips, FAQs) also be editable, or facts only?
- Should edits by other admins need approval before going live, or save directly?

## Technical details

- Table `public.exam_pages` (jsonb for list fields) with GRANT select to anon/authenticated, all to service_role; RLS: anon/authenticated select where status='published'; admin all via `is_admin()`. `exam_pages_history` with an update trigger snapshotting the old row. `updated_at` trigger.
- Client: React Query hook `useExamPage(slug)` with `initialData` = current static props, so the first render (and renderToString) matches today's output and no layout shift happens.
- Build: extend `scripts/inject-meta.mjs` / prerender to fetch published rows with the anon key and inject content + meta; `scripts/generate-sitemaps.mjs` and the `generate-sitemap` edge function derive `/exams/*` from rows passing a shared `examQualityGate()` module.
- Verification: snapshot diff of prerendered HTML for all 21 routes pre/post; sitemap URL set diff must equal today's 18 entries.
