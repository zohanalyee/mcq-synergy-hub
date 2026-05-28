# AI Blog System — Global Quality Upgrade

Refines the existing dual-path AI blog workflow without touching auth, branding, routing, MCQ engine, or the syllabus builder. All upgrades apply to every generated post (jobs, scholarships, study guides, exam updates, etc.).

## 1. Edge Function — `supabase/functions/generate-blog/index.ts`

Rewrite the prompt + response contract so each draft returns a **structured editorial bundle** (not just markdown).

New JSON shape returned to client:

```text
{
  title, slug, excerpt, content_markdown,
  category, tags[5..10],
  meta_title, meta_description,
  og_title, twitter_title,
  highlights: { type: "job"|"scholarship"|"guide"|"generic", items: [{label, value}] },
  tables: [{ title, headers[], rows[][] }],
  faqs: [{ q, a }] (4–6),
  internal_links: [{ anchor, href, context }] (max 8, from allow-list),
  prep_blocks: [{ title, description, href, cta }] (2–4),
  sources: [{ label, url }],
  jobposting: { ...optional fields, only when category=jobs },
  schema_type: "Article" | "JobPosting" | "HowTo",
  reading_time_minutes,
  last_updated_iso  // stable; the function uses `new Date().toISOString()` ONCE at generation time and stores it in DB — never re-computed at render
}
```

System prompt improvements:
- Editorial Pakistani educational tone; ban a fixed list of clichés (`golden opportunity`, `unlock your future`, etc.).
- Enforce sentence/paragraph variety, no duplicate H2s.
- Strict "never fabricate" rule for dates/salaries/phone numbers — omit if unknown.
- Force category from a curated taxonomy (jobs, scholarships, mdcat, fpsc, ppsc, css, nts, study-guides, board-exams, admissions, government-jobs).
- Tags: 5–10, Pakistan-focused, slug-safe, deduped, no generic words.
- Internal-link allow-list passed into the prompt (built server-side from a static map of MCQSAI routes by category — NTS/FPSC/PPSC MCQs, MDCAT syllabus, Aggregate/Age/Merit/Percentage calculators, Custom Syllabus Builder, etc.).
- For `from_content` mode: extract structured fields (deadline, organization, location, BPS, salary, quota, eligibility, qualification, apply_url, testing_body) from the row and pass as a structured context block so the model fills `highlights`, `tables`, and `jobposting` accurately.

Server-side validation layer before returning the draft:
- Reject/repair: missing slug, meta_title >60, meta_description >160, malformed markdown headings, duplicated H2s, fabricated `tel:` or unknown URLs (only allow `internal_links` from allow-list and `sources` from the source row's `apply_url`/`document_url`).
- Strip invalid `experienceRequirements` enum values from `jobposting`.
- Graceful JSON-repair fallback (already partly present in `extractJson`).
- Persist `cost_estimate` + structured metadata in `ai_usage_logs` (unchanged).

## 2. DB — `blog_posts` extension

One small migration to persist the new structured fields without breaking existing rows:

- Add nullable columns: `highlights jsonb`, `tables jsonb`, `faqs jsonb`, `internal_links jsonb`, `prep_blocks jsonb`, `sources jsonb`, `jobposting jsonb`, `schema_type text`, `reading_time_minutes int`, `last_updated_at timestamptz`, `og_title text`, `twitter_title text`.
- No RLS/grant changes (existing policies cover new columns).
- Regenerate Supabase types after migration.

## 3. Admin UI

### `AIGeneratePanel.tsx`
- On generate, store the **entire** draft bundle (including new structured fields) and pass it up via `onApplyDraft`.

### `BlogManager.tsx`
- Extend `form` state with the new structured fields.
- `applyDraft` writes all of them (fixes the **tags-not-saving** bug — current `applyDraft` does set tags but `saveMutation` payload only spreads `form`; we'll guarantee tags + new fields are part of `form` and the insert/update payload).
- `saveMutation` persists the new columns. `startEdit` rehydrates them.
- Add small read-only previews under the form for: highlights, FAQs count, internal links count, sources, schema type.

## 4. Frontend Article Rendering — `src/pages/BlogPost.tsx` (+ small new components under `src/components/blog/`)

Render the structured bundle when present; fall back gracefully to plain markdown for legacy posts.

New presentational components (no branding changes, semantic tokens only):
- `BlogHighlightsCard` — top summary card driven by `highlights`.
- `BlogTOC` — auto-generated from `##`/`###` headings; shown only when content has ≥4 headings.
- `BlogTable` — semantic `<table>` with responsive overflow wrapper.
- `BlogFAQ` — accessible accordion; emits **single** FAQPage JSON-LD.
- `BlogPrepFunnel` — 2–4 contextual cards ("Practice NTS MCQs", "Try Aggregate Calculator", etc.), placed mid-article and before conclusion.
- `BlogSources` — official source block at the end.
- `BlogTrustStrip` — "Reviewed by MCQSAI Editorial Team · Last updated {stable date} · Educational purpose" line near the top.
- `ReadingTime` — uses `reading_time_minutes`.

Typography polish (CSS-only, semantic tokens):
- Tighten `prose` overrides: `max-w-[72ch]` reading width, balanced line-height, consistent H2/H3 spacing, mobile padding fix, list/blockquote indentation, table overflow scroll.

### Markdown rendering
- Add `remark-gfm` to support tables / autolinks (already in repo? if not, add via package install during build).
- Post-process markdown to inject internal links from `internal_links` only when anchor text occurs in body and isn't already linked (max one injection per anchor, ≤8 total).

## 5. SEO Schemas — `src/components/seo/schemas/*` + `BlogPost.tsx`

Centralised, no duplicates:
- Always: `ArticleSchema` (existing) + `BreadcrumbSchema` (existing).
- If `faqs.length > 0`: emit `FAQPageSchema` **once** from `BlogFAQ`. Ensure global `StructuredData` does not re-emit FAQPage on `/blog/*` (already guarded to `/` only — verify).
- If `schema_type === "JobPosting"`: emit `JobPostingSchema` with only fields present in `jobposting` (streetAddress, addressRegion, postalCode, baseSalary, validThrough, employmentType, hiringOrganization, jobLocation). Omit missing/invalid.
- If `schema_type === "HowTo"`: emit `HowToSchema` from parsed steps.

`SEOHead` / `BlogPost`:
- Use `og_title` / `twitter_title` when present, else fall back to `meta_title`.
- Use stored `last_updated_at` for `dateModified` (never `new Date()` at render).

## 6. Internal-link + prep-funnel catalogue

New file `src/lib/blogLinkCatalogue.ts`:
- Static map: category → list of `{ anchor, href, description, cta }` (NTS MCQs `/exams/nts`, FPSC MCQs, MDCAT syllabus `/mdcat-syllabus`, Aggregate Calculator `/tools/aggregate-calculator`, etc.).
- Exported helper `pickLinksForCategory(category, max)` consumed both by the edge function (passed into prompt) and by the renderer (to validate AI-suggested links and source prep blocks).

## 7. Out of scope (explicitly untouched)

Auth, RLS, branding, dashboards, AI provider switching, routing structure, landing pages, MCQ engine, syllabus builder, payments. Existing dual-path AI workflow and review-before-publish flow remain intact.

## Files

- `supabase/functions/generate-blog/index.ts` — rewrite prompt + validation + structured response.
- `supabase/migrations/<new>.sql` — add structured columns to `blog_posts`.
- `src/lib/blogLinkCatalogue.ts` — new.
- `src/components/admin/blog/AIGeneratePanel.tsx` — pass full draft up.
- `src/components/admin/BlogManager.tsx` — persist + rehydrate new fields, fix tag pipeline.
- `src/pages/BlogPost.tsx` — render structured bundle, schemas, trust strip, prep funnel.
- `src/components/blog/{BlogHighlightsCard,BlogTOC,BlogTable,BlogFAQ,BlogPrepFunnel,BlogSources,BlogTrustStrip,ReadingTime}.tsx` — new.
- `src/components/seo/schemas/` — add `JobPostingSchema`, `HowToSchema`, `FAQPageSchema` (if missing); audit duplicates.
- `src/index.css` / blog-prose overrides — typography polish.
