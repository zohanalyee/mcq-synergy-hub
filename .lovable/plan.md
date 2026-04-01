

# Hybrid Scraping Infrastructure Plan

## Overview
Add Firecrawl as a fallback scraper behind the existing free deno-dom scrapers. When Cheerio/deno-dom fails (JS-heavy sites), the system automatically falls back to Firecrawl. Includes per-source config, attempt logging, Smart Search All button, and analytics.

## Prerequisites
- **Firecrawl Connector**: You have `MCQSAI_Scraper` (Firecrawl) available but not linked to this project. We need to connect it first so `FIRECRAWL_API_KEY` is available in edge functions.

---

## Step 1: Connect Firecrawl
Link the existing `MCQSAI_Scraper` Firecrawl connection to this project.

## Step 2: Database Migration
- Add columns to `scraping_sources`: `needs_firecrawl` (bool), `scraper_preference` (text), `last_scraper_used` (text), `firecrawl_crawl_enabled` (bool), `firecrawl_max_depth` (int)
- Create `scraping_attempts` table with RLS (admin-only) for tracking every scrape attempt with scraper used, success, items found, execution time, error message
- Enable RLS on `scraping_attempts`

## Step 3: Create `scrape-hybrid` Edge Function
**File**: `supabase/functions/scrape-hybrid/index.ts`

Core logic:
1. Accept `sourceId` (or `sourceUrl`) + optional `forceFirecrawl` flag
2. Load source config from `scraping_sources`
3. **If** `scraper_preference === 'firecrawl'` or `needs_firecrawl === true` or `forceFirecrawl`: go directly to Firecrawl
4. **Else**: try deno-dom first (reuse existing parse functions from scrape-scholarships/jobs/tenders)
5. **If** deno-dom returns 0 items: fallback to Firecrawl, and auto-set `needs_firecrawl = true` on the source
6. Log attempt to `scraping_attempts`
7. Save new items to `external_opportunities` with deduplication
8. Update `scraping_sources` stats

Firecrawl integration uses `FIRECRAWL_API_KEY` env var directly (not gateway, since connector `uses connector gateway: false`). Supports both scrape and crawl modes.

Register in `supabase/config.toml` with `verify_jwt = false`.

## Step 4: Update ScrapingSourcesManager UI
**File**: `src/components/admin/ScrapingSourcesManager.tsx`

Changes:
- Update `ScrapingSource` interface with new fields (`needs_firecrawl`, `scraper_preference`, `last_scraper_used`)
- Change `handleScrapeNow` to invoke `scrape-hybrid` instead of type-specific functions
- Add **Smart Search All** button that iterates all active sources sequentially
- Show scraper badge per source row (lightning for Cheerio, fire for Firecrawl)
- Add settings icon per row to open config dialog
- Update table header to include "Scraper" column

## Step 5: Create SourceConfigDialog Component
**File**: `src/components/admin/SourceConfigDialog.tsx`

Dialog with:
- Scraper preference dropdown (Auto / Cheerio Only / Firecrawl Only)
- Force Firecrawl toggle
- Enable deep crawling toggle
- Max crawl depth input (1-5)
- Save updates to `scraping_sources`

## Step 6: Create ScrapingAnalytics Component
**File**: `src/components/admin/ScrapingAnalytics.tsx`

Simple stats cards (no recharts dependency needed):
- Cheerio stats: attempts, success rate, avg time
- Firecrawl stats: attempts, success rate, avg time
- Total items found
- Queried from `scraping_attempts` table (last 30 days)

Integrate into AgentDashboard Sources tab below the sources table.

---

## Files Summary

| Action | File |
|--------|------|
| Migration | Add hybrid columns to `scraping_sources` + create `scraping_attempts` table |
| Create | `supabase/functions/scrape-hybrid/index.ts` |
| Modify | `supabase/config.toml` - register `scrape-hybrid` |
| Modify | `src/components/admin/ScrapingSourcesManager.tsx` - hybrid UI + Smart Search |
| Create | `src/components/admin/SourceConfigDialog.tsx` |
| Create | `src/components/admin/ScrapingAnalytics.tsx` |
| Modify | `src/components/admin/AgentDashboard.tsx` - add analytics below sources |

