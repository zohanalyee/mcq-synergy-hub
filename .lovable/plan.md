

# Root Cause Analysis & Fix Plan

## Problem 1: Data Invisibility (CONFIRMED)

**Root cause**: All three public pages filter by `status = 'approved'`, but the scraper saves items with `status: 'pending'`.

| Page | File | Line | Filter |
|------|------|------|--------|
| Tenders | `src/pages/Tenders.tsx` | 26 | `.eq("status", "approved")` |
| Scholarships | `src/services/externalOpportunitiesService.ts` | 86 | `.eq('status', 'approved')` |
| Jobs | `src/services/externalOpportunitiesService.ts` | 86 | Same function |

The scraper inserts with `status: 'pending'` (line 360 of `scrape-hybrid/index.ts`). The RLS policy also only allows public SELECT for `status = 'approved'`.

**Fix**: This is by design (admin review before publishing). The fix is NOT to change the filter, but to give admins a way to bulk-approve scraped items. We should also show pending count on the public pages so admins know items are waiting.

**Two options**:
- **Option A (Recommended)**: Add a one-click "Approve All Pending" button in the admin ScrapingSourcesManager or AgentDashboard, so after scraping, admins can quickly approve items.
- **Option B**: Change the scraper to save items as `status: 'approved'` directly (skip review). Faster but less safe.

## Problem 2: Zero-Item Fetching for FPSC/BISE Larkana

**Root cause**: The `parseMarkdown` function (line 227-246 of `scrape-hybrid/index.ts`) only splits by `## ` or `### ` headings and checks for keywords. Pakistani government sites like FPSC and BISE boards:

1. Don't structure content with markdown headings — they use tables, PDFs, and flat HTML
2. The keyword lists are too narrow: `board_result` keywords are `['result', 'announcement', 'gazette']` but BISE sites use terms like "matric", "intermediate", "SSC", "HSC", "annual", "supplementary"
3. The Cheerio fallback also requires keyword matches in headings, missing table-based layouts

**Fix**:
- Expand keyword lists for `board_result` and `job` types
- Add broader content extraction in `parseMarkdown`: also split by `\n\n` (paragraphs), `|` (table rows in markdown), and bullet points
- For Cheerio: add `dl, dd, dt, li` to the table-row fallback selectors
- Add site-specific patterns for known Pakistani portals (FPSC uses specific CSS classes)

## Problem 3: Deduplication

**Root cause**: Line 346-348 of `scrape-hybrid/index.ts`:
```
const { data: existing } = await adminClient
  .from('external_opportunities').select('apply_url').eq('type', source.type);
const existingUrls = new Set((existing || []).map((e: any) => e.apply_url));
```

This loads ALL existing URLs of that type across ALL sources, then checks `item.applyUrl`. The problem: when Cheerio or Firecrawl can't extract a specific link, it falls back to the source page URL itself (e.g., `https://www.fpsc.gov.pk/jobs`). So the first item saves with that URL, and all subsequent items from the same page are treated as duplicates.

**Fix**: Change deduplication to use `title + organization` as the key instead of (or in addition to) `apply_url`. Also prevent saving items where `applyUrl === source.url` (the base page URL) as-is — append a title hash to make it unique.

## Problem 4: "Ani Quota" Issue

This is not a code issue. There is no "Ani quota" in the codebase. This likely refers to **Lovable AI credit quota** — the platform's usage limit for AI-assisted code generation. This is managed at the account level in Lovable's billing settings, not in the project code.

---

## Implementation Steps

### Step 1: Fix Deduplication Logic
**File**: `supabase/functions/scrape-hybrid/index.ts`
- Change dedup key from `apply_url` alone to `title.toLowerCase() + '|' + type`
- When `applyUrl === source.url`, append `#item-{index}` or a title-based hash to differentiate
- Query existing by both `apply_url` and `title` to prevent both kinds of duplicates

### Step 2: Expand Keyword Lists & Parsing
**File**: `supabase/functions/scrape-hybrid/index.ts`
- Add to `board_result` keywords: `'matric', 'intermediate', 'SSC', 'HSC', 'annual', 'supplementary', 'exam'`
- Add to `job` keywords: `'apply', 'advertisement', 'notice', 'employment', 'opportunity'`
- In `parseMarkdown`: also split by double-newlines and table-row markers (`|`)
- In Cheerio fallback: add `li, dd, dt, .notice, .notification` selectors

### Step 3: Add Bulk Approve in Admin
**File**: `src/components/admin/ScrapingSourcesManager.tsx`
- Add "Approve All Pending" button that calls `externalOpportunitiesService` to bulk-update status
- Show count of pending items per type

### Step 4: Redeploy Edge Function
Deploy updated `scrape-hybrid` function.

---

## Files Summary

| Action | File |
|--------|------|
| Modify | `supabase/functions/scrape-hybrid/index.ts` — fix dedup + expand keywords + improve parsing |
| Modify | `src/components/admin/ScrapingSourcesManager.tsx` — add bulk approve button |
| Deploy | `scrape-hybrid` edge function |

