

# Phase 2 Parts 3-5: Status & Implementation Plan

## Current Status

| Part | Status | Details |
|------|--------|---------|
| Part 1: Database + Scholarships | DONE | `scraping_sources` table created, `scrape-scholarships` edge function deployed |
| Part 2: Jobs Scraping | DONE | `scrape-jobs` edge function deployed |
| Part 3: UI + Integration | NOT DONE | No `ScrapingSourcesManager` component exists |
| Part 4: Tenders Scraping | NOT DONE | No tender columns, no `scrape-tenders` function, no `/tenders` page |
| Part 5: Board Results | NOT DONE | No `board_result_announcements` table, no `detect-board-results` function, no `/results` page |

---

## Implementation Plan

### Step 1: Database Migration

Add tender-specific columns to `external_opportunities`:
- `tender_number TEXT`
- `tender_value TEXT`
- `tender_category TEXT`
- `document_url TEXT`
- `pre_bid_meeting DATE`

Create `board_result_announcements` table with RLS (admin-only management, public read for announced results).

Insert tender sources (PPRA Federal/Sindh/Punjab, WAPDA, SNGPL, Railways) and board result sources (BISE Karachi, Hyderabad, Sukkur, Larkana, Lahore, FBISE) into `scraping_sources`.

### Step 2: ScrapingSourcesManager Component

Create `src/components/admin/ScrapingSourcesManager.tsx`:
- Table showing all scraping sources with name, type, URL, frequency, last scraped, items found/saved, active toggle
- "Scrape Now" button per source that invokes the appropriate edge function
- Add/edit source dialog
- Filter by type (scholarship, job, tender, board_result)
- Integrate into `AgentDashboard.tsx` as a new "Sources" sub-tab

### Step 3: scrape-tenders Edge Function

Create `supabase/functions/scrape-tenders/index.ts`:
- Same architecture as scrape-scholarships/jobs (fetch + deno-dom)
- PPRA-specific table parsing (multi-column tender tables)
- Extract tender number, title, category, value, deadline, document URL
- Deduplicate by `apply_url` or `tender_number`
- Insert as `type: 'tender'`, `status: 'pending'`

### Step 4: detect-board-results Edge Function

Create `supabase/functions/detect-board-results/index.ts`:
- Fetch board websites, scan for result keywords ("result announced", "declared")
- Record new announcements in `board_result_announcements`
- Trigger `generate-blog` for breaking result news
- Update `scraping_sources` metadata

### Step 5: Public Pages

**Tenders Page** (`src/pages/Tenders.tsx`):
- Search by title/organization/tender number
- Filter by category (Construction, IT, Consultancy, Supply, Services, Equipment)
- Cards with tender number, organization, deadline, download document link
- SEO meta tags for "Pakistan government tenders"

**Board Results Page** (`src/pages/BoardResults.tsx`):
- List of announced results with board name, exam type, year
- "Check Result Now" external link buttons
- SEO optimized for "[Board Name] result 2026"

Add both routes to `App.tsx`.

### Step 6: Update process-agent-tasks Dispatcher

Add `tender` task type routing to `scrape-tenders` function. The `job` and `scholarship` routes are already wired.

### Step 7: Config & Registration

Register `scrape-tenders` and `detect-board-results` in `supabase/config.toml` with `verify_jwt = false`.

---

## Files Summary

| Action | File |
|--------|------|
| Migration | Add tender columns + `board_result_announcements` table + seed sources |
| Create | `src/components/admin/ScrapingSourcesManager.tsx` |
| Modify | `src/components/admin/AgentDashboard.tsx` — add Sources tab |
| Create | `supabase/functions/scrape-tenders/index.ts` |
| Create | `supabase/functions/detect-board-results/index.ts` |
| Create | `src/pages/Tenders.tsx` |
| Create | `src/pages/BoardResults.tsx` |
| Modify | `src/App.tsx` — add `/tenders` and `/board-results` routes |
| Modify | `supabase/config.toml` — register new functions |
| Modify | `supabase/functions/process-agent-tasks/index.ts` — add tender routing |
| Modify | `src/types/externalOpportunities.ts` — add tender fields |

## Credit Estimate
- ~80-100 Lovable credits total for all three parts combined

