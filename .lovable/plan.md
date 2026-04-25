## Goal
Stop Google from receiving 404 HTML pages at `/sitemap.xml` and `/sitemaps/*.xml`. Reuse the already-deployed `generate-sitemap` edge function (which returns valid XML, verified working) and switch the opportunity URLs in the sitemap to the slug-uuid format the app actually uses.

## Root cause (confirmed)
- The edge function `generate-sitemap` is deployed and returns valid XML (verified: `content-type: application/xml`, real job/scholarship data).
- But the public sitemap URLs (`https://mcqsai.com/sitemaps/jobs.xml` etc.) point to paths that don't exist as files. Lovable's SPA fallback serves `index.html`, React Router shows 404, Google sees HTML.
- A static `public/sitemap.xml` exists but only references the broken `/sitemaps/*.xml` paths.

## Fix

### 1. Replace `public/sitemap.xml` with a redirect-style stub
Lovable hosting can't do server-side rewrites via `_redirects`. Instead, replace the static `public/sitemap.xml` with one that lists the **edge function URLs directly** as `<loc>` entries — Google follows them as sub-sitemaps wherever they live.

```xml
<sitemapindex>
  <sitemap><loc>https://pzhvipkcssxrsxxljbbz.supabase.co/functions/v1/generate-sitemap?type=static</loc></sitemap>
  <sitemap><loc>.../generate-sitemap?type=tools</loc></sitemap>
  <sitemap><loc>.../generate-sitemap?type=jobs</loc></sitemap>
  <sitemap><loc>.../generate-sitemap?type=scholarships</loc></sitemap>
  <sitemap><loc>.../generate-sitemap?type=blog</loc></sitemap>
  <sitemap><loc>.../generate-sitemap?type=exams</loc></sitemap>
  <sitemap><loc>.../generate-sitemap?type=boards&page=1</loc></sitemap>
</sitemapindex>
```
Google fully accepts cross-host sub-sitemaps when they're listed in a sitemap index referenced from `robots.txt`. No SPA interception, no 404s, always-fresh data.

Delete the unreachable `/sitemaps/*.xml` references entirely.

### 2. Update `generate-sitemap` edge function to emit `/opportunity/<slug>-<uuid>` URLs
Currently emits `https://mcqsai.com/jobs/<slug>` and `/scholarships/<slug>`, but those routes resolve via title-lookup and don't match the canonical card links. Change the `jobs` and `scholarships` branches to:
- Select `id, title, updated_at` from `external_opportunities` and `content_items`.
- Build URL with the same helper used in the app: `/opportunity/<slug>-<uuid>` (mirroring `src/utils/slugify.ts`).
- Keep deduplication on the final URL.

This guarantees Google indexes the exact URLs `JobCard` / `ExternalOpportunitiesSection` link to, matching `OpportunityDetail.tsx`'s `extractIdFromSlug` lookup.

### 3. Keep `robots.txt` as-is
Already points to `https://mcqsai.com/sitemap.xml` — no change needed.

### 4. Optional follow-up (not in this change)
After deploy, in Google Search Console → Sitemaps, resubmit `https://mcqsai.com/sitemap.xml`. The "Couldn't fetch" errors should clear within 1–7 days.

## Files to change
- `public/sitemap.xml` — replace `/sitemaps/*.xml` entries with full edge-function URLs.
- `supabase/functions/generate-sitemap/index.ts` — rewrite the `jobs` and `scholarships` branches to query `id + title + updated_at` and emit `/opportunity/<slug>-<uuid>` URLs using a `generateSlug()` helper inlined into the function.

## Why not the prebuild script
- The proposed `scripts/generate-sitemaps.js` references tables that don't exist in your schema (`opportunities`, `education_systems`, `published` flag) — it would fail on first run.
- Sitemaps would be stale until the next deploy; new jobs/scholarships scraped daily wouldn't appear until you rebuild.
- Edge function already works and is faster to fix.

## Verification after deploy
1. `curl -I https://mcqsai.com/sitemap.xml` → 200, `content-type: application/xml`, lists 7 sub-sitemap URLs.
2. Open one sub-sitemap URL in a browser → valid XML with `/opportunity/<slug>-<uuid>` links.
3. GSC → Sitemaps → Resubmit. Status should flip from "Couldn't fetch" to "Success".
