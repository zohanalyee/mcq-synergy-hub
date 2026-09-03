# Announcements Page (Unified Feed + Likes, Comments, Share)

A new public `/announcements` page: one social-style feed where admin posts general notices (test postponed, date announced, notification issued) and where new jobs, scholarships and blog posts also appear automatically. Every post supports like, comment and share.

## What users get

- `/announcements` — feed of cards, newest first, filter chips: All / Notices / Jobs / Scholarships / Blog.
- `/announcements/:slug` — detail page for admin-written notices (full text, image/PDF attachment, comments). Job/scholarship/blog cards keep linking to their existing detail pages.
- Each card: type badge, title, short excerpt, date, "urgent" highlight for time-critical notices, and an engagement bar — Like (count), Comment (count), Share (Web Share API + copy link).
- Guests can read everything, tap Like, and post a comment with just a display name. Recommended for maximum engagement, with these guards: rate limit per guest (likes 30/hour, comments 3/hour), 500-char comment cap, link/spam stripping, and admin delete + user "Report" on every comment. Signed-in users' comments show their profile name with a verified chip so real accounts look better than guests — a soft nudge to sign up without blocking anyone.
- Comments appear instantly (no approval queue); admin can delete or hide.
- Realtime: like and comment counts update live on the open feed.

## Admin

New "Announcements" tab in the admin panel:
- Create/edit/delete notices: title, body (rich text), type (exam notice / date change / result / general), optional image or document, "urgent" flag, publish/unpublish, pin to top.
- Comment moderation list: newest comments across all posts, with delete and "hide post comments" toggle, plus a Reported filter.

Only admin can post announcements (per your choice).

## SEO

- `/announcements` gets its own title/description and is added to the static sitemap.
- Notice detail pages are indexable only when the body has real substance (≥60 words), otherwise `noindex,follow` — same thin-content guard already used for board topic pages, so AdSense standing is not at risk.
- No ad slots on thin notices.

## Technical notes

New tables (with GRANTs, RLS, and realtime enabled):
- `announcements` — id, slug, title, body, type, is_urgent, is_pinned, image_url, document_url, status (draft/published), published_at, meta_title, meta_description, created_by, timestamps. Public SELECT limited to `status='published'`; insert/update/delete restricted via `is_admin()`.
- `announcement_reactions` — target_type (`announcement` | `job` | `scholarship` | `blog`), target_id, user_id (nullable), guest_key (hashed local id), unique on (target_type, target_id, coalesce(user_id, guest_key)). Anon insert/delete allowed for own guest_key only.
- `announcement_comments` — target_type, target_id, user_id (nullable), guest_name, body, is_hidden, report_count, created_at. Public SELECT where `is_hidden = false`; anon insert allowed; delete/hide via `is_admin()`; owner can delete own comment.
- `announcement_comment_reports` — comment_id, reporter_key, reason.

Feed assembly: a `get_announcement_feed(limit, offset, filter)` SECURITY DEFINER RPC unions published `announcements`, approved `content_items` of category job/scholarship, `external_opportunities` (approved), and published `blog_posts` into one shape (type, id, slug, title, excerpt, image, published_at, href) with counts joined from reactions/comments. Keeps the existing job/scholarship/blog pages and workflows completely untouched — read-only union, no schema changes to those tables.

Rate limiting reuses the existing `guest_rate_limits` table and `check_guest_rate_limit` pattern.

Frontend: `src/pages/Announcements.tsx`, `src/pages/AnnouncementDetail.tsx`, `src/components/announcements/*` (FeedCard, EngagementBar, CommentThread, CommentComposer), `src/hooks/useAnnouncementFeed.ts`, `src/services/announcementService.ts`, admin `src/components/admin/announcements/AnnouncementsManager.tsx`. Routes registered eagerly in `App.tsx` before dynamic routes; nav entry added through the existing DB-driven `navigation_items` so it appears in the standard Header, with Footer unchanged in structure. All styling uses existing brand tokens, PageHeader, Orbitron/Poppins, glass cards and existing gradients — no new colors or fonts.

## Build order

1. Database: tables, GRANTs, RLS, feed RPC, realtime.
2. Feed page + engagement bar (likes/share) + filters.
3. Comments (guest + signed-in, report, rate limits).
4. Notice detail page + SEO/thin-content gate + sitemap entry.
5. Admin manager (posts + comment moderation) and nav entry.
