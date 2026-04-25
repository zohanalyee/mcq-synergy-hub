# Plan — Raise Job Test Batch Limit + SEO-Friendly Opportunity URLs

Two independent changes, both backward-compatible.

---

## 1. Raise `MAX_BATCHES` from 3 → 5

**File:** `supabase/functions/generate-job-test/index.ts` (line 16)

```ts
const MAX_BATCHES = 5; // Allow up to ~50 questions (5 × 10)
```

No other change. The existing 4 s rate-limit gap, Lovable Gateway fallback, and stop-early logic are preserved. Loop bound and progress logs (`[BATCH n/MAX_BATCHES]`) update automatically.

---

## 2. SEO-friendly ( scholarship and job pages) "slug-uuid" URLs for opportunities

Pattern (Medium / StackOverflow style):
`/opportunity/teachers-staff-army-public-school-eadc0e16-e642-4c61-8e2f-0ea5731f07ea`

Route stays `/opportunity/:id`. The UUID is always the last 36 chars, so old UUID-only links keep working.

### 2a. New utility — `src/utils/slugify.ts`

```ts
export function generateSlug(title: string): string {
  return (title || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, ''); // avoid trailing hyphen after slice
}

export function generateSlugUrl(title: string, id: string): string {
  const slug = generateSlug(title);
  return slug ? `${slug}-${id}` : id;
}

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function extractIdFromSlug(slugId: string): string {
  if (!slugId) return '';
  const match = slugId.match(UUID_RE);
  return match ? match[0] : slugId; // fallback: assume raw UUID
}
```

### 2b. Update every internal link to `/opportunity/...`

Replace `/opportunity/${X.id}` with `/opportunity/${generateSlugUrl(X.title, X.id)}` in:

- `src/components/jobs/JobCard.tsx` (line 36, the `to` prop)
- `src/components/external/ExternalOpportunitiesSection.tsx` (line 190)
- `src/pages/BoardResults.tsx` (line 123, uses `opp.title`)
- `src/pages/Scholarships.tsx` (line 189, uses `scholarship.title`)
- `src/pages/Tenders.tsx` (line 99, uses `tender.title`)

Each gets `import { generateSlugUrl } from '@/utils/slugify';`.

### 2c. Update `src/pages/OpportunityDetail.tsx`

```ts
import { extractIdFromSlug } from '@/utils/slugify';

const { id: slugId } = useParams();
const id = extractIdFromSlug(slugId || '');
```

Then the existing `.eq("id", id)` query and `queryKey: ['opportunity', id]` work unchanged. Old bookmarks `/opportunity/<uuid>` still resolve because `extractIdFromSlug` returns the bare UUID when no slug prefix is present.

### 2d. Router

No change. `src/App.tsx` line 241 already uses `:id` which now carries the full `slug-uuid` string.

### 2e. Breadcrumbs

Skipped — `OpportunityDetail` builds breadcrumbs from the loaded `opportunity.title` (post-fetch), so they remain correct.

---

## Verification

1. Edge Function logs show `[BATCH 4/5]` / `[BATCH 5/5]` when 40+ questions requested; 40-question generation reaches 40 accepted.
2. Job/scholarship/tender/board-result cards render `<a href="/opportunity/<slug>-<uuid>">` (right-click → Open in new tab still works — preserves the prior semantic-Link refactor).
3. Visiting both `/opportunity/<uuid>` (legacy) and `/opportunity/<slug>-<uuid>` (new) loads the same detail page.
4. No DB migration, no schema change, no broken external inbound links.

## Files touched

- `supabase/functions/generate-job-test/index.ts` (1 line)
- `src/utils/slugify.ts` (new)
- `src/components/jobs/JobCard.tsx`
- `src/components/external/ExternalOpportunitiesSection.tsx`
- `src/pages/BoardResults.tsx`
- `src/pages/Scholarships.tsx`
- `src/pages/Tenders.tsx`
- `src/pages/OpportunityDetail.tsx`