# Expired Job/Scholarship Listings — "Application Closed" + 30-Day Grace Plan

## Audit findings (confirmed before planning)

- The 153 expired listings (146 jobs, 7 scholarships) are served at **`/opportunity/<slug>`** via `src/pages/OpportunityDetail.tsx`. The older `/jobs/:slug` and `/scholarships/:slug` pages exist but are **not** in any sitemap — the fix targets `/opportunity/*` only.
- `OpportunityDetail.tsx` already has a thin-content gate: `noindex` when description < 25 words. It shows the deadline as plain text with **no expired state** — a visitor or crawler cannot tell the listing is closed.
- Sitemaps: `scripts/generate-sitemaps.mjs` → `buildOpportunitySitemap()` (jobs.xml, scholarships.xml) and the deployed edge function `supabase/functions/generate-sitemap/index.ts` (jobs/scholarships branches) both list **every approved item regardless of deadline**. Neither selects `deadline_date` today.
- Expiry logic already exists and is reusable: `isExpired()` in `src/lib/opportunitySorting.ts` (Pakistan-time, date-only safe, no-deadline = evergreen). Listing pages already sort expired items last.

## Proposed approach

### 1. Visible "Application Closed" state on the page (OpportunityDetail.tsx only)
- Reuse `isExpired()` from `opportunitySorting.ts` (no new date logic).
- When expired:
  - Show a muted/destructive **"Application Closed"** badge next to the deadline line (existing Badge component, existing color tokens — no new styles).
  - Replace the "Apply Now" button with disabled-looking text: "Applications for this opportunity have closed." (keeps the page honest for visitors and AdSense reviewers; the external link is no longer promoted).
  - JSON-LD `validThrough` already emits the deadline — Google reads expired JobPostings correctly; no schema change needed.
- Active listings: zero visual change.

### 2. Grace period: 30 days past deadline → noindex + sitemap removal (data kept)
- **0–30 days past deadline:** page stays `index,follow` and in the sitemap, with the "Application Closed" label. Rationale: candidates search a listing for weeks after the deadline (result dates, merit lists, "did I miss it"); immediate deindexing would strand that traffic and look like a broken page.
- **>30 days past deadline:** `noindex,follow` on the page + removed from jobs.xml/scholarships.xml. Page still returns **200** with full content (direct links, internal links, and the Announcements feed keep working). **Nothing is deleted** — the row stays approved in the DB and reappears automatically if the deadline is ever extended.
- No-deadline listings: treated as evergreen (unchanged, current behavior).

### 3. Implementation points (on approval)
1. `src/pages/OpportunityDetail.tsx` — add `isExpired` + `isExpiredPastGrace` (deadline + 30 days); render the badge/closed text; pass `noindex={isThinOpp || isExpiredPastGrace}` to SEOHead.
2. `scripts/generate-sitemaps.mjs` — `buildOpportunitySitemap()`: also select `deadline`/`deadline_date`, filter out items expired > 30 days (log the drop count like the existing thin-drop log).
3. `supabase/functions/generate-sitemap/index.ts` — same filter in the jobs and scholarships branches (select the deadline column, drop >30-day-expired). Redeploy the function.
4. Verify: build OK; spot-check one expired and one active listing's rendered HTML (badge present/absent, meta robots correct); confirm sitemap counts drop by roughly the expired count.

## Isolation guarantee
- Only 3 files touched: `OpportunityDetail.tsx`, `generate-sitemaps.mjs`, `generate-sitemap/index.ts` (+ edge function redeploy).
- No changes to: listing pages (/jobs, /scholarships), sorting, the legacy /jobs/:slug and /scholarships/:slug pages, admin curation, DB schema or data, robots.txt, ads, or any other route.
- The 30-day grace value is a single constant in each file, easy to tune later.
