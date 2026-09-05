# Two audits: MDCAT final sprint + Announcements feed fixes

## Part 1 — Announcements feed: findings (verified today)

**1 & 2. Jobs and scholarships missing — confirmed data-source mismatch (root cause).**
The feed function `get_announcement_feed` reads jobs/scholarships from `content_items` where `category in ('job','scholarship')`. That query returns **zero rows** — there are no job/scholarship rows in `content_items` at all. All live jobs and scholarships are stored in `external_opportunities`: 124 approved jobs (newest `4 Sep 2026, 12:07` — the job the user posted "yesterday") and 12 approved scholarships. So the feed can only ever show blog posts (32 published) and admin notices (`announcements` table is currently empty — 0 rows). This is a wrong-table bug, not ingestion and not timing.

**3. Comment box.** `CommentThread` is rendered on `/announcements/:slug`, and it is only reachable for admin notices. Since `announcements` has **0 published rows**, there is no detail page to open today — that is why no comment box was seen. The component itself is wired correctly (guest name input, textarea, post/delete/report). Comment count on the detail page also passes `likeCount={0}` hardcoded, which is a separate display bug.

**4. Share.** Share lives in `EngagementBar`, which is rendered on feed cards and on the notice detail page only. On the feed it is present; on job/scholarship/blog pages it is absent, because those pages (`JobDetailPage`, `ScholarshipDetailPage`, `BlogPost`) never import it. Nothing is broken in the share code itself (Web Share with clipboard fallback).

**5. Links going to `/blog/:slug`.** Intentional in the original build: the feed function returns `href = '/blog/' || slug` for blog posts, `/jobs/<id>` and `/scholarships/<id>` for opportunities, and `/announcements/<slug>` only for admin notices. Engagement UI therefore only exists on notices. Additionally the `/jobs/<id>` href does not match the live slug format (`title-slug-id`), so those links are weaker than the real job URLs.

## Part 1 — fix plan (Announcements)

Order and effort:

1. **Feed source fix (S, ~30 min).** Rewrite the jobs/scholarships branch of `get_announcement_feed` to read `external_opportunities` (status `approved`, type `job`/`scholarship`), with correct `title-slug-id` hrefs matching the live routes, plus deadline-aware ordering. Migration only; no frontend change.
2. **Engagement on aggregated items (M, ~1–2 h).** Add the existing `EngagementBar` + `CommentThread` to `JobDetailPage`, `ScholarshipDetailPage` and `BlogPost`, keyed by their existing `target_type`/`target_id` — so a click from the feed lands on the canonical page and still gets likes, comments and share. This keeps one canonical URL per item (no duplicate `/announcements/<blog-slug>` page, no SEO conflict) and delivers the in-page engagement the feature was built for.
3. **Detail-page count fix (XS).** Pass the real like count into `EngagementBar` on `/announcements/:slug` instead of `0`.
4. **Seed one real notice (XS).** Create one admin notice (e.g. the MDCAT test-day notice) so the notice detail page, comments and share can be verified end to end.

Isolation: item 1 touches only the feed function; item 2 appends a section to three detail pages without altering their existing layout, metadata or JSON-LD; no route changes, no sitemap changes.

## Part 2 — MDCAT sprint (15 days to 20 Sep 2026)

Current state verified in code:

| Item | Page(s) | State today |
|---|---|---|
| 1. Weightage anchor | `/mdcat-syllabus` already has `#mdcat-weightage` with the 200-MCQ table (Bio 68 / Chem 54 / Phys 54 / Eng 18 / LR 6) | Exists on syllabus page; **missing** on `/exams/mdcat` and `/mdcat-past-papers` |
| 2. Countdown block | `/mdcat-syllabus` computes `daysLeft` in prose | No visible countdown block on `/exams/mdcat` or `/mdcat-past-papers` |
| 3. In-body internal links | `/mdcat-syllabus` and `/mdcat-past-papers` link the aggregate calculator | Missing links to `/exams/mdcat`, `/exams/nums`, `/ecat-preparation` in body copy |
| 4. lastmod + IndexNow | `public/sitemaps/static.xml`, `indexnow-submit-recent` | Function exists and is admin/service-guarded; needs a manual fire after the edits |
| 5. Roll-number-slip / test-day block | `/exams/mdcat`, `/mdcat-syllabus` | Not present. Needs sourcing from PM&DC / STS / provincial notices; only already-announced facts get published, unannounced dates stay as "not yet announced" |
| 6. Question pool pre-warm | `system_settings.campaign_surge` (currently `enabled: false`, window ended 30 Aug, keywords already include `mdcat`) | Re-enable with an MDCAT window and MDCAT-subject keywords — no code change needed |

Batch order and effort:

- **Batch A (S, ~45 min):** countdown block + weightage anchor section on `/exams/mdcat` and `/mdcat-past-papers`, reusing the existing syllabus-page table markup and brand tokens.
- **Batch B (S, ~30 min):** in-body contextual links to `/tools/aggregate-calculator`, `/exams/mdcat`, `/exams/nums`, `/ecat-preparation` across the three MDCAT pages.
- **Batch C (S, ~30 min, needs sourcing first):** test-day / roll-number-slip block — facts verified against official PM&DC and STS notices, each claim attributed, nothing guessed.
- **Batch D (XS):** `campaign_surge` re-enabled with `starts_at` = now, `ends_at` = 21 Sep, MDCAT subject keywords, budget kept at the existing 600/day ceiling.
- **Batch E (XS):** lastmod bump for the three MDCAT URLs via the existing sitemap generator, then one IndexNow fire.

Isolation: only the three MDCAT page files plus the sitemap regeneration output are touched; no ad-config changes, no new routes, thin-page and AdSense gating rules untouched.

## Technical notes

- Feed fix is a `CREATE OR REPLACE FUNCTION get_announcement_feed` migration; the `FeedItem` shape stays identical so `fetchFeed`, `FeedCard` and the realtime patcher need no changes.
- Engagement on jobs/scholarships/blog reuses `announcement_reactions` / `announcement_comments` with `target_type` `job` / `scholarship` / `blog`; existing RLS guard functions already accept those types.
- Countdown must be computed at render time (no hardcoded day counts) so prerendered HTML never ships a stale number.
