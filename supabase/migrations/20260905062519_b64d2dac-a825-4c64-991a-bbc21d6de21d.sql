CREATE OR REPLACE FUNCTION public.get_announcement_feed(
  p_filter text DEFAULT 'all',
  p_sort text DEFAULT 'latest',
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  target_type text,
  target_id text,
  slug text,
  title text,
  excerpt text,
  image_url text,
  href text,
  type_label text,
  is_urgent boolean,
  is_pinned boolean,
  published_at timestamptz,
  like_count bigint,
  comment_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $function$
WITH base AS (
  SELECT
    'announcement'::text AS target_type,
    a.id::text AS target_id,
    a.slug,
    a.title,
    COALESCE(NULLIF(a.summary, ''), left(regexp_replace(a.body, '<[^>]*>', '', 'g'), 220)) AS excerpt,
    a.image_url,
    '/announcements/' || a.slug AS href,
    a.type AS type_label,
    a.is_urgent,
    a.is_pinned,
    COALESCE(a.published_at, a.created_at) AS published_at
  FROM public.announcements a
  WHERE a.status = 'published'
    AND (p_filter IN ('all', 'notices'))

  UNION ALL

  SELECT
    CASE WHEN e.type = 'job' THEN 'job' ELSE 'scholarship' END::text,
    e.id::text,
    NULL::text,
    e.title,
    left(COALESCE(e.description, ''), 220),
    e.image_url,
    CASE WHEN e.type = 'job' THEN '/jobs/' ELSE '/scholarships/' END
      || trim(both '-' from regexp_replace(lower(e.title), '[^a-z0-9]+', '-', 'g')),
    e.type::text,
    false,
    false,
    e.created_at
  FROM public.external_opportunities e
  WHERE e.status = 'approved'
    AND e.type IN ('job', 'scholarship')
    AND (
      p_filter = 'all'
      OR (p_filter = 'jobs' AND e.type = 'job')
      OR (p_filter = 'scholarships' AND e.type = 'scholarship')
    )

  UNION ALL

  SELECT
    'blog'::text,
    b.id::text,
    b.slug,
    b.title,
    left(COALESCE(b.excerpt, ''), 220),
    b.image_url,
    '/blog/' || b.slug,
    COALESCE(b.category, 'blog'),
    false,
    false,
    COALESCE(b.published_at, b.created_at)
  FROM public.blog_posts b
  WHERE b.status = 'published'
    AND p_filter IN ('all', 'blog')
)
SELECT
  base.target_type,
  base.target_id,
  base.slug,
  base.title,
  base.excerpt,
  base.image_url,
  base.href,
  base.type_label,
  base.is_urgent,
  base.is_pinned,
  base.published_at,
  COALESCE(r.cnt, 0) AS like_count,
  COALESCE(cm.cnt, 0) AS comment_count
FROM base
LEFT JOIN (
  SELECT target_type, target_id, count(*) AS cnt
  FROM public.announcement_reactions GROUP BY 1, 2
) r ON r.target_type = base.target_type AND r.target_id = base.target_id
LEFT JOIN (
  SELECT target_type, target_id, count(*) AS cnt
  FROM public.announcement_comments WHERE is_hidden = false GROUP BY 1, 2
) cm ON cm.target_type = base.target_type AND cm.target_id = base.target_id
ORDER BY
  base.is_pinned DESC,
  CASE WHEN p_sort = 'trending'
    THEN COALESCE(r.cnt, 0) * 2 + COALESCE(cm.cnt, 0) * 3
    ELSE 0 END DESC,
  base.published_at DESC NULLS LAST
LIMIT GREATEST(1, LEAST(p_limit, 50))
OFFSET GREATEST(0, p_offset);
$function$;