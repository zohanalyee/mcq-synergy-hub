

# AI Content Studio — Implementation Plan

## What We're Building

An "AI Content Studio" inside the Agent Dashboard that lets an admin paste raw text from a job ad, scholarship notice, tender, or board result, click "Enhance with AI Magic", and get back a professionally formatted, SEO-optimized listing — published in under 3 minutes. This replaces unreliable scraping with human-curated, AI-polished content.

## Architecture

```text
Admin pastes raw text + URLs
        │
        ▼
┌──────────────────────────┐
│  enhance-content         │  (new Edge Function)
│  Gemini API (free tier)  │
│  → structured JSON       │
└──────────┬───────────────┘
           ▼
  ManualOpportunityCreator
  (enhanced with AI step)
        │
        ▼
  external_opportunities table
  status = 'approved'
        │
        ▼
  Detail page with embedded PDF/image viewer
```

## Implementation Steps

### Step 1: Create `enhance-content` Edge Function
**File:** `supabase/functions/enhance-content/index.ts`

- Accepts `{ rawText, category, organization?, sourceUrl? }`
- Validates admin auth (JWT check against `user_roles`)
- Calls Gemini API directly (`GEMINI_API_KEY`, fallback to `EXTERNAL_JOBS_GEMINI_KEY`)
- Uses category-specific prompts (job → extract salary/qualification/positions; scholarship → eligibility/amount; tender → tender number/value; board_result → board name/exam type)
- Returns structured JSON: `{ title, description, deadline, keywords[], extractedFields: { organization, location, qualification, salary, ... } }`
- Register in `supabase/config.toml` with `verify_jwt = false`

### Step 2: Upgrade `ManualOpportunityCreator` Component
**File:** `src/components/admin/ManualOpportunityCreator.tsx`

Current state: Simple form with basic fields (title, description, org, URL, deadline, image, location, sector, region). No AI. No raw text input. No document URL. No type-specific fields.

New version:
- **Step 1 — Input**: Category selector (Job/Scholarship/Tender/Board Result), organization, source URL, image URL (with preview), PDF/document URL, and a large raw text area
- **Step 2 — AI Enhancement**: "Enhance with AI Magic" button calls `enhance-content` edge function. Populates all fields automatically from raw text
- **Step 3 — Review & Edit**: Shows AI-generated title, description, keywords (as badges), deadline, location, and type-specific fields (qualification/salary/positions for jobs, eligibility/amount for scholarships, tender_number/tender_value for tenders). All editable
- **Step 4 — Publish**: Inserts into `external_opportunities` with `status: 'approved'`, all extracted fields, and metadata including keywords and source URL
- Dialog size: `max-w-4xl` to accommodate the richer form

### Step 3: Enhance Detail Page with Embedded Media
**File:** `src/pages/OpportunityDetail.tsx`

- Add embedded PDF viewer: If `document_url` ends with `.pdf`, render an `<iframe>` to display it inline so users can read the notice without leaving the site
- Add embedded image viewer: If `image_url` is a newspaper ad/poster, show it full-width in a dedicated "Original Notice" section
- Add SEO keywords from `metadata.keywords` to the `<SEOHead>` component
- Add OG image support using the opportunity's `image_url`

### Step 4: Update SEOHead for Keywords
**File:** `src/components/SEOHead.tsx`

- Accept optional `keywords` and `image` props
- Render `<meta name="keywords">` and `og:image` tags

## Files Summary

| Action | File |
|--------|------|
| Create | `supabase/functions/enhance-content/index.ts` |
| Modify | `supabase/config.toml` — register `enhance-content` |
| Rewrite | `src/components/admin/ManualOpportunityCreator.tsx` — full AI Content Studio |
| Modify | `src/pages/OpportunityDetail.tsx` — embedded PDF/image viewer |
| Modify | `src/components/SEOHead.tsx` — keywords + og:image |

## Technical Notes

- Uses existing `GEMINI_API_KEY` secret (already configured) — $0 cost
- No new database columns needed (all fields already exist from the previous migration)
- No new tables or migrations required
- The existing Review tab in AgentDashboard already works correctly for reviewing scraped content — no changes needed there

