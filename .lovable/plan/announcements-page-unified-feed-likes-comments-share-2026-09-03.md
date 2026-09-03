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

IMPORTANT POINT 

Ye sub mujhe phases m bana k Dena hai aap ko neeche m additional missing stuff Yan points likhi Hain as p dekhen Kitna keya zarori hai mcqsai k lae kaue aap jante Hain or aap build kero 4 credits m jitna banta hai baaki Kal banae ge. 

&nbsp;

&nbsp;

Additional SEO & Organic Growth Requirements

&nbsp;

Keep the entire existing Announcements plan and build order unchanged. Add the following requirements to make "/announcements" a strong organic-traffic, internal-linking, content-discovery, and community-growth system.

&nbsp;

1. SEO Quality Gate — Do Not Use Word Count Alone

&nbsp;

The existing 60-word rule should NOT be the only condition for indexability.

&nbsp;

For announcement detail pages, use a quality gate based on:

&nbsp;

- Meaningful original content

- Clear search/user intent

- Useful information for students/job seekers

- Proper title and context

- No duplicate or near-duplicate content

- No empty/placeholder content

- Preferably at least one relevant internal resource/link

&nbsp;

Short urgent notices can remain publicly accessible and shareable but should be "noindex,follow" when they have insufficient standalone search value.

&nbsp;

Do not create indexable pages merely to increase URL count.

&nbsp;

2. Automatic Related Content / Internal Linking Engine

&nbsp;

This is a priority requirement.

&nbsp;

Every substantial announcement should automatically identify relevant entities/topics and show related MCQsAI resources.

&nbsp;

Examples:

&nbsp;

MDCAT announcement:

&nbsp;

- MDCAT syllabus

- MDCAT past papers

- Biology MCQs

- Chemistry MCQs

- Physics MCQs

- MDCAT mock tests

&nbsp;

SPSC job announcement:

&nbsp;

- SPSC MCQs

- Relevant subject MCQs

- SPSC past papers

- Relevant exam/test preparation

- Related jobs

&nbsp;

Scholarship announcement:

&nbsp;

- Related scholarships

- Relevant educational guides

- Related blog posts

- Relevant exams/resources where appropriate

&nbsp;

Blog announcement:

&nbsp;

- Related blogs

- Related MCQs

- Related exams/topics

&nbsp;

Use existing published/approved content wherever possible.

&nbsp;

Do not create fake or irrelevant links just for SEO.

&nbsp;

3. Topic / Entity Detection

&nbsp;

When an admin creates an announcement, automatically detect useful entities/topics such as:

&nbsp;

- Exam

- Board

- Province

- Subject

- Class

- Job title

- Organization

- Scholarship

- Test

- Career topic

&nbsp;

Store these relationships in a reusable way so the same topic can power:

&nbsp;

- Related content

- Internal links

- Related announcements

- Trending topics

- Future search/discovery features

&nbsp;

Admin should also be able to manually override or add topics.

&nbsp;

4. Related Announcements

&nbsp;

Announcement detail pages should include a "Related Announcements" section based on topic/entity similarity.

&nbsp;

Example:

&nbsp;

MDCAT 2026 date announcement

→ MDCAT syllabus update

→ MDCAT registration announcement

→ MDCAT past paper update

&nbsp;

Do not show unrelated posts.

&nbsp;

5. Related MCQs and Mock Tests

&nbsp;

This should be prominently displayed on relevant announcement pages.

&nbsp;

Add a section such as:

&nbsp;

"Prepare for this exam"

&nbsp;

with relevant:

&nbsp;

- MCQ practice

- Subject MCQs

- Chapter MCQs

- Past papers

- Mock tests

&nbsp;

The goal is to convert informational traffic into MCQ/test traffic.

&nbsp;

6. SEO Metadata

&nbsp;

Every indexable announcement should support:

&nbsp;

- Unique SEO title

- Unique meta description

- Canonical URL

- Open Graph title

- Open Graph description

- Open Graph image

- Social sharing image where available

- "lastmod" / updated date where genuinely applicable

&nbsp;

Do not generate duplicate metadata across announcements.

&nbsp;

Admin should be able to override automatically generated metadata.

&nbsp;

7. Structured Data

&nbsp;

Add appropriate structured data only when it accurately represents the page.

&nbsp;

Consider:

&nbsp;

- Article

- NewsArticle where genuinely appropriate

- BreadcrumbList

&nbsp;

Use FAQPage only when the page actually contains a genuine FAQ section.

&nbsp;

Do not add misleading or artificial structured data.

&nbsp;

Validate generated JSON-LD and ensure it does not contain empty/invalid fields.

&nbsp;

8. Canonical and Duplicate Protection

&nbsp;

The announcements feed aggregates existing Jobs, Scholarships and Blogs.

&nbsp;

Do NOT create duplicate indexable copies of those existing detail pages.

&nbsp;

For Jobs/Scholarships/Blogs:

&nbsp;

Announcement card → canonical existing content URL.

&nbsp;

Only admin-created announcement notices should have their own "/announcements/:slug" detail page.

&nbsp;

Ensure canonical URLs always point to the preferred version.

&nbsp;

9. Filter URL SEO Strategy

&nbsp;

The UI filters:

&nbsp;

- All

- Notices

- Jobs

- Scholarships

- Blog

&nbsp;

must not accidentally create large numbers of duplicate/indexable URLs.

&nbsp;

Initially:

&nbsp;

- Main "/announcements" page can be indexable.

- Filter/query URLs should generally be "noindex,follow" unless we intentionally create dedicated SEO landing pages later.

&nbsp;

Do not allow arbitrary query/filter combinations to generate indexable SEO pages.

&nbsp;

10. Pagination / Infinite Scroll / Crawlability

&nbsp;

The feed should remain fast even with thousands of posts.

&nbsp;

Use pagination or efficient infinite loading.

&nbsp;

Important:

&nbsp;

- Individual valuable announcement detail pages must remain crawlable.

- Do not hide all content behind client-side interaction in a way that prevents discovery.

- Provide normal HTML links to detail pages.

- Avoid creating thousands of crawlable pagination/filter URLs.

&nbsp;

11. Breadcrumb Navigation

&nbsp;

Indexable announcement detail pages should have breadcrumbs such as:

&nbsp;

Home → Announcements → MDCAT 2026 Test Date Announced

&nbsp;

Use matching BreadcrumbList structured data.

&nbsp;

12. Views and Trending System

&nbsp;

Add a lightweight view/unique-view system.

&nbsp;

Use it to support:

&nbsp;

- Trending

- Popular

- Most Discussed

- Most Shared

&nbsp;

Feed options can eventually include:

&nbsp;

Latest | Trending | Popular

&nbsp;

Do not use raw views alone to determine ranking; combine signals such as recent views, engagement, comments and shares with sensible anti-abuse controls.

&nbsp;

13. Community Engagement

&nbsp;

Keep:

&nbsp;

- Likes

- Comments

- Shares

- Reports

&nbsp;

Also consider a contextual discussion prompt for suitable posts.

&nbsp;

Example:

&nbsp;

"What do you think about this announcement?"

&nbsp;

or:

&nbsp;

"Are you preparing for this exam?"

&nbsp;

This should encourage meaningful discussion rather than empty comments.

&nbsp;

14. Comment Safety and Spam Protection

&nbsp;

Rate limiting is good, but add additional protection:

&nbsp;

- Profanity filtering

- Spam phrase detection

- Repeated-character/spam detection

- Suspicious link detection

- Excessive repeated comments detection

- Report-based moderation

- Admin hide/delete

- User delete-own-comment

- Automatic temporary hiding when abuse thresholds are reached

&nbsp;

Do not expose unnecessary user/IP information publicly.

&nbsp;

15. Content Freshness

&nbsp;

For announcements that change over time, support:

&nbsp;

- Published date

- Last updated date

- Update history internally for admin

- Clear "Updated" indicator when content materially changes

&nbsp;

Do not change dates merely to make content appear fresh.

&nbsp;

When an important announcement is updated, regenerate appropriate sitemap "lastmod".

&nbsp;

16. Internal Linking From Existing Content

&nbsp;

Do not make "/announcements" an isolated page.

&nbsp;

Where relevant, existing:

&nbsp;

- Blog pages

- Job pages

- Scholarship pages

- Exam pages

- MCQ/topic pages

&nbsp;

should be able to link back to relevant announcements.

&nbsp;

Example:

&nbsp;

A blog about MDCAT preparation can surface:

&nbsp;

"Latest MDCAT announcements"

&nbsp;

This creates a two-way internal-linking network.

&nbsp;

Avoid excessive automatic links; relevance is more important than link quantity.

&nbsp;

17. Homepage / Discovery Integration

&nbsp;

Where appropriate, add small sections such as:

&nbsp;

- Latest Announcements

- Trending

- Latest Jobs

- Latest Scholarships

- Latest Educational Updates

&nbsp;

These should link to the existing canonical pages.

&nbsp;

Do not overload the homepage with hundreds of links.

&nbsp;

18. Performance

&nbsp;

The announcement feed must not significantly increase initial page load.

&nbsp;

Use:

&nbsp;

- Efficient queries

- Pagination

- Lazy loading where appropriate

- Optimized images

- Proper image dimensions

- Minimal client-side JavaScript for non-essential features

&nbsp;

Ensure important announcement content and links are available to search engines without requiring user interaction.

&nbsp;

19. Analytics / Measurement

&nbsp;

Track meaningful events such as:

&nbsp;

- Announcement view

- Share

- Copy link

- Like

- Comment

- Related-content click

- MCQ click

- Mock-test click

- Job click

- Scholarship click

&nbsp;

This will allow us to determine which announcements actually send users deeper into MCQsAI.

&nbsp;

Do not collect unnecessary personal data.

&nbsp;

20. SEO Success Principle

&nbsp;

The goal is NOT:

&nbsp;

"Create as many announcement URLs as possible."

&nbsp;

The goal is:

&nbsp;

"Create useful, searchable announcements that attract users and intelligently send them to relevant MCQsAI resources."

&nbsp;

The system should therefore optimize for:

&nbsp;

Google Search → Useful Announcement/Content → Related Resources → MCQs → Mock Test → Returning User

&nbsp;

rather than simply increasing indexed page count.

&nbsp;

21. Preserve Existing SEO/AdSense Safeguards

&nbsp;

Do not weaken the existing:

&nbsp;

- 8+ approved MCQ indexability policy

- Thin-page protection

- "noindex,follow" handling

- No-ad treatment for thin pages

- Existing canonical/indexability rules

&nbsp;

The Announcements feature must integrate with these safeguards rather than bypass them.

&nbsp;

Priority

&nbsp;

Treat these as follows:

&nbsp;

P0 — Must Have

&nbsp;

1. SEO quality gate

2. Related content/internal linking

3. Topic/entity relationships

4. Canonical/duplicate protection

5. SEO metadata

6. Crawlable detail-page links

7. Existing thin-content/AdSense safeguards

&nbsp;

P1 — Strongly Recommended

&nbsp;

8. Related MCQs/mock tests

9. Related announcements

10. Structured data

11. Breadcrumbs

12. Filter URL SEO strategy

13. Performance

14. Comment spam protection

15. Analytics

&nbsp;

P2 — Growth Features

&nbsp;

16. Views

17. Trending

18. Popular/Most Discussed

19. Homepage discovery sections

20. Contextual discussion prompts

&nbsp;

Do not remove or replace any part of the original Announcements plan. These are additive requirements intended to make the feature useful for long-term organic traffic growth, user retention, and internal content discovery.