

# Complete Fix: Scraping, UI, Detail Pages, Admin Tools

## Root Cause Analysis

| Problem | Root Cause |
|---------|-----------|
| Jobs: No images/details | Scraper only extracts title, description, URL. No location/salary/qualification extraction |
| Scholarships: Missing fields | Same — no eligibility/amount/scope extraction |
| Board Results: 0 found, 0 saved | BoardResults page reads from `board_result_announcements` table, but scraper writes to `external_opportunities`. Two disconnected systems |
| Tenders: Empty page | All tender sources use Firecrawl which times out at 30s. No tender records exist in DB |
| Admin: Can't edit scraping links | `SourceConfigDialog` exists but only configures Firecrawl settings, not URL/selectors |
| Admin: Can't see/fix extracted data | `OpportunityReviewQueue` exists but edit form only has 6 fields (title, desc, org, url, deadline, image). Missing location, salary, etc. |
| Review tab shows DuplicateReviewQueue | `DuplicateReviewQueue` is for MCQ question deduplication, not scraped content — wrong component in the Review tab |
| Review badge shows wrong count | Badge counts `agent_tasks` with `needs_review=true`, not pending opportunities |

## Implementation Plan

### Step 1: Database Schema — Add Missing Columns
Add columns to `external_opportunities` for enhanced field extraction:
- `qualification TEXT` — e.g. "Masters", "BSc"
- `salary TEXT` — e.g. "BPS-17", "PKR 80,000"
- `experience TEXT` — e.g. "3-5 years"
- `positions INTEGER` — number of vacancies
- `department TEXT`
- `eligibility TEXT`
- `amount TEXT` — scholarship value
- `field_of_study TEXT`
- `education_level TEXT`

### Step 2: Enhanced Scraper (`scrape-hybrid/index.ts`)
- Add field extraction functions: `extractLocation()`, `extractQualification()`, `extractSalary()`, `extractExperience()`, `extractPositions()`, `extractDepartment()`, `extractEligibility()`, `extractAmount()`, `extractTenderNumber()`, `extractTenderValue()`, `extractTenderCategory()`
- Apply extraction to every parsed item based on source type
- Increase Firecrawl timeout from 30s to 60s to fix tender timeouts
- Save all extracted fields in the insert statement
- Add better logging on skip/insert errors

### Step 3: Fix Board Results Flow
Update `BoardResults.tsx` to ALSO query `external_opportunities` where `type = 'board_result'`, merging results from both `board_result_announcements` and `external_opportunities` into a unified display.

### Step 4: Fix Agent Dashboard Review Tab
- **Remove** `DuplicateReviewQueue` from the Review tab (it's for MCQ questions, not scraped content)
- **Fix review badge count**: Change from `agent_tasks.needs_review` count to `external_opportunities.status='pending'` count
- **Enhance** `OpportunityReviewQueue` edit form to include all new fields (location, salary, qualification, eligibility, etc.)

### Step 5: Enhance Source Editor
Update `SourceConfigDialog` (or create `SourceEditor`):
- Add URL editing field
- Add custom CSS selectors editor (JSON textarea)
- Add notes field
- Keep existing Firecrawl config options

### Step 6: Enhance OpportunityDetail Page
Update `OpportunityDetail.tsx` to display all new fields:
- Job details section: qualification, salary, experience, positions, department
- Scholarship details: eligibility, amount, field_of_study, education_level
- Already has tender details (tender_number, tender_value, tender_category)

### Step 7: Redeploy Edge Function
Deploy updated `scrape-hybrid` with enhanced extraction and longer timeout.

---

## Files Summary

| Action | File |
|--------|------|
| Migration | Add 9 columns to `external_opportunities` |
| Modify | `supabase/functions/scrape-hybrid/index.ts` — enhanced extraction + longer timeout |
| Modify | `src/components/admin/AgentDashboard.tsx` — fix Review tab (remove DuplicateReviewQueue, fix badge count) |
| Modify | `src/components/admin/OpportunityReviewQueue.tsx` — add all new fields to edit form |
| Modify | `src/components/admin/SourceConfigDialog.tsx` — add URL/selectors editing |
| Modify | `src/pages/BoardResults.tsx` — also show external_opportunities board_result items |
| Modify | `src/pages/OpportunityDetail.tsx` — display new fields |
| Deploy | `scrape-hybrid` edge function |

