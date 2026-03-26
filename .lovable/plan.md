

# Phase 3: Content & SEO Expansion — Blog, FAQ, Study Guides

## Overview
Create three new database-driven pages (`/blog`, `/faq`, `/study-guides`) plus admin management, all backed by two new Supabase tables so content can be managed without redeployment.

---

## Database Changes (2 new tables)

### Table: `blog_posts`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | default gen_random_uuid() |
| title | text NOT NULL | |
| slug | text NOT NULL UNIQUE | URL-friendly identifier |
| content | text NOT NULL | Markdown body |
| excerpt | text | Short summary for list view |
| category | text | e.g. 'preparation', 'colleges', 'tips' |
| tags | text[] | default '{}' |
| image_url | text | Featured image |
| author_name | text | default 'MCQSAI Team' |
| status | text NOT NULL | default 'draft' ('draft', 'published') |
| published_at | timestamptz | |
| created_at / updated_at | timestamptz | |
| created_by | uuid | |
| meta_title / meta_description | text | SEO fields |

**RLS**: Public SELECT where `status = 'published'`, admin ALL via `is_admin()`.

### Table: `faq_items`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| question | text NOT NULL | |
| answer | text NOT NULL | Markdown |
| category | text | e.g. 'General', 'Exams', 'Technical' |
| sort_order | int | default 0 |
| is_active | boolean | default true |
| created_at / updated_at | timestamptz | |

**RLS**: Public SELECT where `is_active = true`, admin ALL via `is_admin()`.

Seed 5 blog posts and ~8 FAQ items via the migration.

---

## New Pages

### 1. `/blog` — Blog List Page
- Grid of blog post cards (image, title, excerpt, date, category badge)
- Search bar + category filter chips
- SEOHead + breadcrumb
- Links to individual posts

### 2. `/blog/:slug` — Blog Post Detail
- Full markdown-rendered post (use `react-markdown`)
- Author, date, category, tags
- "Related Posts" sidebar/section
- SEOHead with post-specific meta

### 3. `/faq` — FAQ Page
- Accordion layout grouped by category
- Search/filter
- SEOHead + breadcrumb + JSON-LD FAQPage schema

### 4. Study Guides Section
- Add a `/study-guides` route that queries `content_items` where `category = 'mcq'` grouped by subject/topic, showing topic-wise summaries
- Simple cards linking to `/subject/:id` with topic filters
- No new table needed — leverages existing subject/topic data

---

## Admin Management

Add two new tabs in AdminTabs.tsx under the "Content" group:
- **Blog Manager** — CRUD for blog posts (title, slug auto-generation, markdown editor via textarea, status toggle, image URL)
- **FAQ Manager** — CRUD for FAQ items (question, answer, category, sort order, active toggle)

Both use standard Supabase client queries — no edge functions needed.

---

## Routing & Navigation

- Add routes in `App.tsx`: `/blog`, `/blog/:slug`, `/faq`, `/study-guides`
- Add links in Footer under a new "Resources" column: Blog, FAQ, Study Guides
- Update `sitemap.xml` with new routes
- Update `StructuredData.tsx` FAQPage schema to pull from database

---

## New Dependencies
- `react-markdown` — for rendering blog post content

## Files Created (~8)
- `src/pages/Blog.tsx` — blog list
- `src/pages/BlogPost.tsx` — single post
- `src/pages/FAQ.tsx` — FAQ page
- `src/pages/StudyGuides.tsx` — study guides
- `src/components/admin/BlogManager.tsx` — admin blog CRUD
- `src/components/admin/FAQManager.tsx` — admin FAQ CRUD
- `src/hooks/useBlogPosts.ts` — data fetching hook
- `src/hooks/useFAQItems.ts` — data fetching hook

## Files Modified (~5)
- `src/App.tsx` — add routes
- `src/components/admin/AdminTabs.tsx` — add Blog/FAQ tabs
- `src/components/admin/AdminContent.tsx` — exclude new tabs from content table
- `src/components/Footer.tsx` — add Resources column
- `public/sitemap.xml` — add new URLs

