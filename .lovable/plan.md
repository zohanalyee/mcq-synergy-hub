## Goal
Fix Google Search Console JobPosting warnings, improve Jobs list/detail UX, and render Pakistani-style tabular job data as markdown tables.

## 1. JobPosting JSON-LD compliance (`src/pages/OpportunityDetail.tsx`)

Rewrite `buildJsonLd` for `type === "job"` with strict conditional emission:

- **`jobLocation.address`** — only include `streetAddress`, `addressRegion`, `postalCode` if non-empty. Always include `addressCountry: "PK"`. Only include `addressLocality` if `op.location` is a non-empty string.
- **`baseSalary`** — only emit when `op.salary` parses to a numeric value (or numeric range like `50000-80000`). Strings like "BPS-17", "Competitive", "Negotiable" → omit entirely. Add small helper `parseSalaryToMonetary(salary)` returning `null` or `{ value, currency:"PKR", unitText:"MONTH" }`.
- **`experienceRequirements`** — only emit as plain string when `op.experience` looks like a real description (length > 3 and not `"Not specified"`/`"N/A"`). Otherwise omit. Never emit invalid enums.
- Keep `validThrough`, `datePosted`, `hiringOrganization`, `employmentType`, `qualifications` (string) as today, but guard each with truthy check.

## 2. Full-card click on Jobs listing (`src/components/external/ExternalOpportunitiesSection.tsx`)

Make whole card clickable while keeping the visible "Apply →" affordance:

- Wrap the card body with a positioned anchor overlay: add `relative` on `<Card>`, place a `<Link to={detailHref} className="absolute inset-0 z-10" aria-label="...">` covering the card.
- Promote the existing "Apply" pill to `relative z-20` so it still receives clicks (and continues to deep-link to the same detail page — keeps a clear CTA target). Other internal links stay as-is.
- No behavior change for keyboard users (overlay link is focusable).

## 3. Job detail layout — info cards above description (`src/pages/OpportunityDetail.tsx`)

Reorder JSX inside `<CardContent>`:
1. Title
2. Meta row (organization, location, deadline)
3. **Job/Tender/Scholarship structured info cards grid** (moved up)
4. Description (rendered as markdown — see #4)
5. PDF / image viewer
6. Keywords + action buttons + footer (unchanged)

## 4. Markdown rendering + GFM tables (frontend)

`react-markdown` and `remark-gfm` are already in `package.json`. In `OpportunityDetail.tsx`:

- Replace the plain `<p className="whitespace-pre-line">{opportunity.description}</p>` with `<ReactMarkdown remarkPlugins={[remarkGfm]} components={...}>`.
- Add a `prose` wrapper (`prose prose-sm dark:prose-invert max-w-none`) and a scoped table style block:
  - `table`: `w-full border-collapse text-xs`
  - `th/td`: `border border-border/40 px-2 py-1.5 text-left align-top`
  - `tbody tr:nth-child(even)`: `bg-muted/30` (zebra)
  - wrap table in `<div className="overflow-x-auto">` for mobile scroll.

## 5. AI extraction — tables + lists instead of walls of text (`supabase/functions/enhance-content/index.ts`)

Update the `job` category prompt (and add a shared formatting rule for all categories) so the AI returns the `description` field as **GitHub-Flavored Markdown**:

- Use `##` subheadings for sections (Overview, Eligibility, How to Apply, Important Dates).
- Use **markdown tables** whenever the ad lists posts/BPS/vacancies/quota/qualifications side-by-side. Required columns: `Post Name | BPS | Vacancies | Quota / Domicile | Qualifications` (omit columns that don't apply).
- Use **bulleted lists** for eligibility criteria, age limits, required documents.
- Keep prose paragraphs short (≤3 sentences); no wall-of-text.
- Reiterate in the system prompt: "Return JSON only; the `description` field's value is a single markdown string."

No DB schema changes. No changes to `generate-blog` or other functions.

## Files touched

- `src/pages/OpportunityDetail.tsx` — schema rewrite, layout reorder, markdown renderer
- `src/components/external/ExternalOpportunitiesSection.tsx` — full-card link overlay
- `supabase/functions/enhance-content/index.ts` — updated job prompt + formatting rule

## Out of scope

- Re-processing already-stored descriptions (new format applies to newly enhanced jobs going forward; user can re-run AI on existing rows from admin UI).
- Changes to `JobDetailPage.tsx` (separate route for internal job tests) and `BlogStructured.tsx` JobPosting (already conditional).
