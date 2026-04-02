
Goal: force the missing updates into the actual files that currently still power the app, because the codebase shows a partial/misaligned implementation.

What I found
- The route already exists in `src/App.tsx`: `/opportunity/:id` is present.
- The Review tab already exists in `src/components/admin/AgentDashboard.tsx`, and it already renders `ManualOpportunityCreator` + `OpportunityReviewQueue`.
- The public pages are still wired to old components/services:
  - `src/pages/Scholarships.tsx` and `src/pages/Jobs.tsx` still call `getApprovedOpportunities(...)`, which hard-filters `status = 'approved'`.
  - `src/components/external/ExternalOpportunitiesSection.tsx` still renders an external `Apply Now` button, which is why the live UI still shows old behavior.
- `src/pages/Tenders.tsx` is partially updated, but still shows a mixed CTA pattern (`Details` + external `View`) rather than the requested forced “View Details” flow.
- `supabase/functions/scrape-hybrid/index.ts` still blocks inserts by title:
  - save loop checks `existingTitles.has(titleKey)` and skips
  - URL collision logic can still continue/skip
  - title cleanup is incomplete, which is why broken HEC markdown like `![](...)` can survive
- Database evidence confirms the issue:
  - `HEC Scholarships` has a saved row with title `![](https://www.hec.gov.pk/_layouts/15/images/spcommon.png?rev=43)`
  - PPRA/BISE sources show `last_scrape_found > 0` and `last_scrape_saved = 0`, confirming dedup/save logic is still blocking them
  - current DB currently has only approved jobs/scholarships and no tender rows, so public invisibility is also caused by page/service filtering

Implementation changes to apply
1. `supabase/functions/scrape-hybrid/index.ts`
- Add a strict title sanitizer used everywhere before dedup/save:
  - strip all `![...]()` image markdown
  - strip all `[text](url)` link markdown down to `text`
  - strip raw leftover `[]()` noise
  - collapse whitespace
- Update `parseMarkdown(...)` so every extracted title and description is sanitized before returning items.
- Change save logic to the user-requested rule:
  - if sanitized title is empty/too short, skip
  - only use normalized title for duplicate prevention
  - do not let `apply_url` block a new title
  - if URL is missing, equals source URL, or collides, synthesize a unique URL suffix from title hash instead of skipping
- Keep insert status as `pending` unless you explicitly want auto-publish later.
- Result: PPRA/BISE/HEC items with new titles will insert even if they share base URLs.

2. `src/services/externalOpportunitiesService.ts`
- Replace `getApprovedOpportunities` behavior so public opportunity feeds query:
  - `.in('status', ['approved', 'pending'])`
  - retain type and existing filters
- This is necessary because `Jobs.tsx` and `Scholarships.tsx` still depend on this service.

3. `src/components/external/ExternalOpportunitiesSection.tsx`
- Replace the external-only CTA with internal detail navigation:
  - primary button/link to `/opportunity/:id`
  - label “View Details”
- Optionally keep a small secondary external link, but the requested forced behavior is detail-page-first.
- Add pending badge so mixed-status content is visible.

4. `src/pages/Scholarships.tsx`
- Keep internal scholarship cards as-is if desired, but external scholarship cards section will now show pending+approved and “View Details” after the shared section is updated.
- If you want the page itself fully forced, also convert page-level external display to detail-first behavior and avoid any remaining “Apply” wording.

5. `src/pages/Jobs.tsx`
- Same fix path as Scholarships:
  - because it uses `ExternalOpportunitiesSection`, the visible “Apply Now” issue will be resolved there
  - pending + approved will start showing after service update

6. `src/pages/Tenders.tsx`
- Force the card CTA copy and flow:
  - make the main button `View Details` linking to `/opportunity/:id`
  - keep optional secondary external button only if needed
- Keep `.in("status", ["approved", "pending"])`
- Preserve image card layout and pending badge

7. `src/components/admin/AgentDashboard.tsx`
- Since the Review tab is already present in code, I would verify/fix only if there is a rendering/import issue:
  - ensure `ManualOpportunityCreator` and `OpportunityReviewQueue` imports are correct
  - ensure the review tab remains in the rendered `TabsList`
- The more likely reason you “don’t see it” is stale frontend deployment rather than missing source code, but I would still rewrite this section cleanly to remove doubt.

Files to overwrite
- `supabase/functions/scrape-hybrid/index.ts`
- `src/services/externalOpportunitiesService.ts`
- `src/components/external/ExternalOpportunitiesSection.tsx`
- `src/pages/Jobs.tsx`
- `src/pages/Scholarships.tsx`
- `src/pages/Tenders.tsx`
- `src/components/admin/AgentDashboard.tsx`
- `src/App.tsx` only to reassert the route if you want a no-ambiguity rewrite

Technical notes
- Root cause of “Apply Now still visible” is not `App.tsx`; it is `ExternalOpportunitiesSection.tsx`.
- Root cause of missing pending jobs/scholarships is not the scraper alone; it is `getApprovedOpportunities()` filtering approved only.
- Root cause of PPRA/BISE “Saved 0” is the current save loop in `scrape-hybrid/index.ts`:
  - `existingTitles.has(titleKey)` hard-skips
  - URL collision path can still skip
- Root cause of broken HEC markdown title is incomplete sanitization in `parseMarkdown`, plus already-bad rows in DB.
- Important limitation: fixing code will not retro-clean already-saved broken rows in Supabase. If you want old malformed titles corrected too, that needs a follow-up data cleanup migration/update job.

Order of execution after approval in build mode
1. Rewrite scraper sanitizer + save loop
2. Rewrite public service status filter
3. Rewrite external cards CTA to internal detail route
4. Rewrite Jobs/Scholarships/Tenders pages to ensure detail-first behavior
5. Re-save AgentDashboard review tab section
6. Reconfirm `/opportunity/:id` route in `App.tsx`

Expected outcome
- New scrapes stop saving markdown garbage titles
- PPRA/BISE new-title items save instead of `Saved 0`
- Jobs/Scholarships/Tenders show `pending` + `approved`
- External cards show `View Details` instead of `Apply Now`
- Review tab remains visible with Manual Creator + Opportunity Review Queue
