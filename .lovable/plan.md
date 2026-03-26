

# Phase 3: Advanced Performance & Scaling

## Overview
Three enhancements: dynamic sitemap generation via edge function (splitting 2000+ URLs across multiple sitemaps), an admin analytics dashboard for empty topic traffic, and proper canonical tag handling in SEOHead.

---

## 1. Dynamic Sitemap Index + Sub-Sitemaps (Edge Function)

**Problem**: The static `public/sitemap.xml` has ~25 URLs. With programmatic SEO pages (`/boards/{board}/class-{N}/{subject}/{topic}`), there could be 2,000+ URLs. Google limits sitemaps to 50,000 URLs / 50MB, but best practice is to split at ~1,000 URLs.

**Solution**: Create a Supabase edge function `generate-sitemap` that dynamically queries the database and returns XML sitemaps.

### Architecture

```text
/sitemap.xml          → sitemap index (links to sub-sitemaps)
/sitemap-static.xml   → static pages (~25 URLs)
/sitemap-boards-1.xml → board topic pages (up to 1000 per file)
/sitemap-boards-2.xml → overflow if > 1000 topics
/sitemap-blog.xml     → published blog posts
```

### Implementation

- **Edge function**: `supabase/functions/generate-sitemap/index.ts`
  - Accepts query param `?type=index|static|boards&page=1`
  - `type=index`: Returns a `<sitemapindex>` listing all sub-sitemaps
  - `type=static`: Returns the current static URLs hardcoded
  - `type=boards`: Joins `educational_systems → levels → subjects → topics` to generate `/boards/{board}/class-{N}/{subject}/{topic}` URLs, paginated at 1000 per page
  - `type=blog`: Queries `blog_posts` where `status = 'published'`
  - Returns `Content-Type: application/xml`
  - Uses service role key to bypass RLS for topic counts

- **Frontend proxy**: Since the edge function URL is different from mcqsai.com, update `public/sitemap.xml` to be a sitemap index pointing to the edge function URLs. Alternatively, keep a static sitemap index in `public/` and add `_redirects` rules for sub-sitemaps.

- **Practical approach**: Replace `public/sitemap.xml` with a sitemap index file. Create a client-side page `/sitemap-boards` that the edge function serves (or use edge function URLs directly in the index). Update `robots.txt` to point to the index.

- **`_redirects` update**: Add rewrite rules for `/sitemap-*.xml` to the edge function.

### Edge Function Config
Add to `supabase/config.toml`:
```toml
[functions.generate-sitemap]
verify_jwt = false
```

---

## 2. Empty Topic Traffic Analytics (Admin Dashboard)

**Problem**: Need to identify which "empty" topics (0 MCQs) receive the most traffic to prioritize content creation.

**Solution**: Track page views for board topic pages and surface analytics in the admin panel.

### Implementation

- **Track empty topic visits**: In `BoardTopicPage.tsx`, when `mcqs.length === 0`, fire a custom GA4 event:
  ```ts
  trackEvent('empty_topic_view', {
    board: names.board,
    subject: names.subject,
    topic: names.topic,
    class: classNumber,
    url: window.location.pathname
  });
  ```

- **Database table**: Create `empty_topic_analytics` table to persist these hits server-side (since GA4 data isn't queryable from the app):
  - `id`, `board_name`, `subject_name`, `topic_name`, `class_number`, `page_path`, `view_count`, `last_viewed_at`, `created_at`
  - Upsert on each empty topic page view (increment `view_count`)

- **Admin component**: Create `src/components/admin/EmptyTopicAnalytics.tsx`
  - Query `empty_topic_analytics` ordered by `view_count DESC`
  - Show table: Topic, Subject, Board, Views, Last Viewed
  - Add "Generate MCQs" action button linking to AI generation

- **Admin integration**: Add an "Empty Topic Traffic" tab in the admin panel.

- **RLS**: Admin-only read, service role insert (via edge function or direct client upsert with anon).

---

## 3. Canonical Tags (Duplicate Content Protection)

**Problem**: The same topic content may be accessible via multiple URL patterns or query params (`?lang=ur`, sorting params, etc.), which can cause duplicate content issues.

**Solution**: Ensure every page has a correct, clean canonical URL.

### Implementation

- **Update `SEOHead.tsx`**:
  - Accept an explicit `canonicalUrl` prop
  - When not provided, auto-generate by stripping query params (except meaningful ones) and normalizing the path
  - Always use `https://mcqsai.com` as the base (not `window.location`)
  
  ```tsx
  const cleanCanonical = canonicalUrl || `https://mcqsai.com${pathname}`;
  // Strip all query params for canonical (lang variants handled via hreflang)
  ```

- **Update `BoardTopicPage.tsx`**: Pass explicit canonical URL:
  ```tsx
  url={`https://mcqsai.com/boards/${boardSlug}/class-${classNumber}/${subjectSlug}/${topicSlug}`}
  ```

- **Update other pages**: Ensure Blog, FAQ, StudyGuides, and subject pages pass clean canonical URLs without query params.

- **Self-referencing canonicals**: Every page's canonical should point to itself (without query params), which is the SEO best practice.

---

## Files Summary

| Action | File |
|--------|------|
| Create | `supabase/functions/generate-sitemap/index.ts` |
| Create | `src/components/admin/EmptyTopicAnalytics.tsx` |
| Modify | `supabase/config.toml` — add generate-sitemap config |
| Modify | `public/sitemap.xml` — convert to sitemap index |
| Modify | `public/_redirects` — add sitemap sub-file rules |
| Modify | `public/robots.txt` — update sitemap reference |
| Modify | `src/components/SEOHead.tsx` — fix canonical logic |
| Modify | `src/pages/BoardTopicPage.tsx` — add empty topic tracking + explicit canonical |
| Modify | `src/utils/analytics.ts` — add trackEmptyTopicView helper |
| Modify | Admin panel — add EmptyTopicAnalytics tab |
| DB Migration | Create `empty_topic_analytics` table with RLS |

---

## Technical Details

- **Sitemap pagination**: Edge function counts total topics, divides by 1000, generates that many `<sitemap>` entries in the index
- **Empty topic upsert**: Uses Supabase `upsert` with `onConflict: 'page_path'` to increment view counts without duplicates
- **Canonical normalization**: Strips `?lang=`, `?page=`, and other query params; keeps only the clean path
- **No breaking changes**: Static sitemap continues to work; dynamic sitemap supplements it

