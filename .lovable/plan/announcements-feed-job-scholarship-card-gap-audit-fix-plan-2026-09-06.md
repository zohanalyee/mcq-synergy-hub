# Announcements Feed — Job/Scholarship Card Gap Audit + Fix Plan

## Audit findings

### 1. What FeedCard renders today (all item types)

`src/components/announcements/FeedCard.tsx` renders one generic layout for everything:

- Type badge (Notice / Job / Scholarship / Blog), Pinned, Urgent badges
- Published date (`published_at`)
- Title + 2-line excerpt
- Engagement bar (likes/comments/share) + "Read more" link

That's it — **no organization, no deadline, no location, no image**. A job card and a blog card look identical except for the badge color.

### 2. What `get_announcement_feed` actually returns for jobs/scholarships

From the `external_opportunities` branch of the RPC, only these are selected:
`id, title, left(description,220) as excerpt, image_url, href (slug from title), type, created_at as published_at`.

**Not returned:** `organization`, `deadline_date`, `location`, `sector`, `region`, `scholarship_scope` — even though all of these columns exist on the table. Also, `is_urgent`/`is_pinned` are hardcoded `false` for these rows.

The TypeScript `FeedItem` interface in `announcementService.ts` mirrors this — it has no fields for org/deadline/location, so even a fixed RPC would need a type update.

### 3. The data is there — just not selected

Live DB check on approved rows (124 jobs, 12 scholarships):

- organization: 124/124 jobs, 12/12 scholarships
- deadline_date: 110/124 jobs, 8/12 scholarships
- location: 119/124 jobs, 12/12 scholarships
- sector/region: fully populated for jobs

### 4. Gap vs detail pages

`JobDetailPage` / `ScholarshipDetailPage` show: organization (Building2 icon), location (MapPin), deadline (Calendar), description, Apply Now. The feed card shows none of the three meta facts — the user must open the detail page to learn the deadline or employer, which is exactly why the feed feels "not organized".

## Proposed fix

### A. DB migration — extend `get_announcement_feed` (replace function, same signature)

Add to the external_opportunities SELECT (NULL for announcement/blog branches):

- `organization`, `deadline_date`, `location`, `sector`, `region`, `scholarship_scope`

No signature change needed if we add columns at the end of the existing RETURNS TABLE... — actually the function uses inline OUT params; we add 6 new OUT columns and drop/recreate via `CREATE OR REPLACE` (safe: only adds columns). No table changes, no RLS changes.

### B. Frontend types

Extend `FeedItem` in `announcementService.ts` with the 6 nullable fields.

### C. FeedCard — dedicated job/scholarship layout (existing tokens only)

Keep blog/notice cards exactly as-is. For `job`/`scholarship` items render an enriched variant:

- Meta row under the title using existing patterns (same icon+text style as detail pages):
  - `Building2` + organization
  - `MapPin` + location
  - `Calendar` + deadline, plus a live "N days left" countdown chip; deadline chip turns rose (`text-rose-600`) when ≤ 3 days, muted when passed ("Closed")
- Sector badge (Govt/Private) for jobs, scope badge (National/International) for scholarships — using existing badge variants (`emerald`/`amber` accents already in TYPE_META)
- Image thumbnail (small rounded, right side on desktop / hidden on tiny screens) when `image_url` exists — jobs/scholarships have images in ~93%/100% of rows
- Reuses `border-border/60 bg-card/70 backdrop-blur-sm`, same paddings and 44px touch targets — no new colors or components

### D. Sorting bonus (optional, cheap)

For job/scholarship rows, `published_at` currently = `created_at`. Keep as-is (no change proposed) — deadline-aware sorting can come later if wanted.

## Files touched

1. New migration: extend `get_announcement_feed` RPC
2. `src/services/announcementService.ts` — FeedItem fields
3. `src/components/announcements/FeedCard.tsx` — job/scholarship layout variant

Nothing else: Announcements.tsx, detail pages, engagement logic, realtime hooks all untouched.

## Verification

- Query the RPC for jobs/scholarships filter and confirm new fields populate
- Build check; view feed with jobs filter to confirm layout, countdown chip, and responsive behavior

&nbsp;

Plan approved. Proceed with all three changes together (A: RPC migration adding organization/deadline_date/location/sector/region/scholarship_scope, B: FeedItem type update, C: enriched FeedCard layout for job/scholarship with meta row, countdown chip, sector/scope badge, image thumbnail). Verify: query RPC for populated fields, then view feed with jobs filter to confirm layout, countdown chip, and mobile responsiveness.