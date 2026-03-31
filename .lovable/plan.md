

# Phase 2: Web Scraping Infrastructure (Free deno-dom approach)

## Overview
Create a `scraping_sources` configuration table and two Edge Functions (`scrape-scholarships`, `scrape-jobs`) that use free HTML fetching + deno-dom parsing to extract opportunities from Pakistani government/education sites. Results flow into the existing `external_opportunities` table as `pending` items for admin review.

---

## Step 1: Database Migration — `scraping_sources` table

Create a configuration table to track scraping targets:
- Columns: `id`, `type` (scholarship/job/tender/board_result), `name`, `url` (unique), `scraping_frequency`, `last_scraped_at`, `last_scrape_found`, `last_scrape_saved`, `is_active`, `custom_selectors` (JSONB), `notes`, timestamps
- Indexes on `type`, `is_active`, and composite `(type, is_active)`
- RLS: admin-only via `is_admin()` with `WITH CHECK`
- Seed data: HEC, NUST, LUMS, PM Youth (scholarships) + PPSC, FPSC, NTS, SBP (jobs)
- Enable RLS

---

## Step 2: Edge Function — `scrape-scholarships`

**File:** `supabase/functions/scrape-scholarships/index.ts`

- Uses `fetch()` to download HTML from source URLs
- Parses with `deno-dom` (`https://deno.land/x/deno_dom/deno-dom-wasm.ts`)
- Three parsing strategies:
  1. Custom CSS selectors from `scraping_sources.custom_selectors`
  2. Keyword-based heading scan (scholarship, fellowship, grant, aid)
  3. Table row parsing (common on .gov.pk sites)
- Extracts: title, description, deadline, organization, apply URL, scholarship_scope
- Deduplicates against existing `external_opportunities` by `apply_url`
- Inserts as `status: 'pending'`, `type: 'scholarship'`
- Updates `scraping_sources` with `last_scraped_at`, `last_scrape_found`, `last_scrape_saved`
- Auth: admin JWT or service role key
- Accepts optional `{ sourceUrl }` body to scrape a single source, otherwise processes all active scholarship sources
- Register in `config.toml` with `verify_jwt = false`

---

## Step 3: Edge Function — `scrape-jobs`

**File:** `supabase/functions/scrape-jobs/index.ts`

- Same architecture as `scrape-scholarships`
- Job-specific keyword parsing: vacancy, post, position, recruitment
- Table parsing tuned for PPSC/FPSC formats (multi-column tables)
- Extracts: title, organization, location, deadline, qualification, salary/BPS, testing_service
- Location detection for Pakistani cities → region mapping (reuses `detectRegion` logic from `fetch-external-jobs`)
- Sector auto-detection (government vs private)
- Inserts as `status: 'pending'`, `type: 'job'`
- Register in `config.toml`

---

## Step 4: Integration with Agent Dispatcher

Update `process-agent-tasks` to handle `scholarship` and `job` task types by invoking the new scraper functions instead of logging "unsupported". This connects the scrapers to the existing agent queue.

---

## Files Summary

| Action | File |
|--------|------|
| Migration | `scraping_sources` table + indexes + RLS + seed data |
| Create | `supabase/functions/scrape-scholarships/index.ts` |
| Create | `supabase/functions/scrape-jobs/index.ts` |
| Modify | `supabase/config.toml` — register both functions |
| Modify | `supabase/functions/process-agent-tasks/index.ts` — route scholarship/job tasks to scrapers |

No new secrets needed. Uses existing Supabase service role. No Firecrawl dependency.

