-- =========================================================
-- ANNOUNCEMENTS SYSTEM
-- =========================================================

CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  summary TEXT,
  type TEXT NOT NULL DEFAULT 'general',
  is_urgent BOOLEAN NOT NULL DEFAULT false,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  image_url TEXT,
  document_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  is_indexable BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  content_updated_at TIMESTAMPTZ,
  meta_title TEXT,
  meta_description TEXT,
  og_image_url TEXT,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.announcements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "announcements_public_read_published"
ON public.announcements FOR SELECT
USING (status = 'published' OR public.is_admin());

CREATE POLICY "announcements_admin_insert"
ON public.announcements FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "announcements_admin_update"
ON public.announcements FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "announcements_admin_delete"
ON public.announcements FOR DELETE TO authenticated
USING (public.is_admin());

CREATE INDEX idx_announcements_status_pub ON public.announcements (status, published_at DESC);
CREATE INDEX idx_announcements_type ON public.announcements (type);

CREATE TRIGGER trg_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------
-- TOPICS (entity graph)
-- ---------------------------------------------------------
CREATE TABLE public.announcement_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  topic_slug TEXT NOT NULL,
  topic_label TEXT NOT NULL,
  topic_kind TEXT NOT NULL DEFAULT 'topic',
  source TEXT NOT NULL DEFAULT 'auto',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (announcement_id, topic_slug)
);

GRANT SELECT ON public.announcement_topics TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcement_topics TO authenticated;
GRANT ALL ON public.announcement_topics TO service_role;

ALTER TABLE public.announcement_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "announcement_topics_public_read"
ON public.announcement_topics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.announcements a
    WHERE a.id = announcement_id AND (a.status = 'published' OR public.is_admin())
  )
);

CREATE POLICY "announcement_topics_admin_write"
ON public.announcement_topics FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE INDEX idx_announcement_topics_slug ON public.announcement_topics (topic_slug);

-- ---------------------------------------------------------
-- REACTIONS (likes)
-- ---------------------------------------------------------
CREATE TABLE public.announcement_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  user_id UUID,
  guest_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.announcement_reactions TO anon;
GRANT INSERT, DELETE ON public.announcement_reactions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcement_reactions TO authenticated;
GRANT ALL ON public.announcement_reactions TO service_role;

ALTER TABLE public.announcement_reactions ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX idx_reactions_unique_actor
ON public.announcement_reactions (target_type, target_id, COALESCE(user_id::text, guest_key));

CREATE INDEX idx_reactions_target ON public.announcement_reactions (target_type, target_id);

CREATE POLICY "reactions_public_read"
ON public.announcement_reactions FOR SELECT
USING (true);

CREATE POLICY "reactions_guest_insert"
ON public.announcement_reactions FOR INSERT TO anon
WITH CHECK (user_id IS NULL AND guest_key IS NOT NULL AND length(guest_key) BETWEEN 8 AND 64);

CREATE POLICY "reactions_user_insert"
ON public.announcement_reactions FOR INSERT TO authenticated
WITH CHECK (
  (user_id = auth.uid())
  OR (user_id IS NULL AND guest_key IS NOT NULL AND length(guest_key) BETWEEN 8 AND 64)
);

CREATE POLICY "reactions_guest_delete"
ON public.announcement_reactions FOR DELETE TO anon
USING (user_id IS NULL AND guest_key IS NOT NULL);

CREATE POLICY "reactions_user_delete"
ON public.announcement_reactions FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.is_admin() OR (user_id IS NULL AND guest_key IS NOT NULL));

-- ---------------------------------------------------------
-- COMMENTS
-- ---------------------------------------------------------
CREATE TABLE public.announcement_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  user_id UUID,
  guest_key TEXT,
  display_name TEXT NOT NULL DEFAULT 'Guest',
  body TEXT NOT NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  report_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.announcement_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcement_comments TO authenticated;
GRANT ALL ON public.announcement_comments TO service_role;

ALTER TABLE public.announcement_comments ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_comments_target ON public.announcement_comments (target_type, target_id, created_at DESC);

CREATE POLICY "comments_public_read"
ON public.announcement_comments FOR SELECT
USING (is_hidden = false OR public.is_admin());

CREATE POLICY "comments_guest_insert"
ON public.announcement_comments FOR INSERT TO anon
WITH CHECK (
  user_id IS NULL
  AND guest_key IS NOT NULL AND length(guest_key) BETWEEN 8 AND 64
  AND length(body) BETWEEN 2 AND 500
  AND is_hidden = false
  AND report_count = 0
);

CREATE POLICY "comments_user_insert"
ON public.announcement_comments FOR INSERT TO authenticated
WITH CHECK (
  length(body) BETWEEN 2 AND 500
  AND is_hidden = false
  AND report_count = 0
  AND (user_id = auth.uid() OR (user_id IS NULL AND guest_key IS NOT NULL))
);

CREATE POLICY "comments_owner_or_admin_delete"
ON public.announcement_comments FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "comments_admin_update"
ON public.announcement_comments FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER trg_comments_updated_at
BEFORE UPDATE ON public.announcement_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Spam / rate-limit guard
CREATE OR REPLACE FUNCTION public.guard_announcement_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor TEXT := COALESCE(NEW.user_id::text, NEW.guest_key);
  v_recent INTEGER;
  v_dupe INTEGER;
  v_clean TEXT;
BEGIN
  v_clean := btrim(NEW.body);

  IF length(v_clean) < 2 THEN
    RAISE EXCEPTION 'Comment too short';
  END IF;

  -- strip control chars, collapse whitespace
  v_clean := regexp_replace(v_clean, '\s+', ' ', 'g');

  -- repeated character spam (e.g. aaaaaaaaaa)
  IF v_clean ~ '(.)\1{9,}' THEN
    RAISE EXCEPTION 'Comment looks like spam';
  END IF;

  -- link spam: more than one URL is rejected
  IF (length(v_clean) - length(replace(lower(v_clean), 'http', ''))) / 4 > 1 THEN
    RAISE EXCEPTION 'Too many links in comment';
  END IF;

  NEW.body := v_clean;
  NEW.display_name := COALESCE(NULLIF(btrim(NEW.display_name), ''), 'Guest');
  IF length(NEW.display_name) > 40 THEN
    NEW.display_name := left(NEW.display_name, 40);
  END IF;

  -- rate limit: 5 comments / hour per actor
  SELECT count(*) INTO v_recent
  FROM public.announcement_comments
  WHERE COALESCE(user_id::text, guest_key) = v_actor
    AND created_at > now() - interval '1 hour';

  IF v_recent >= 5 THEN
    RAISE EXCEPTION 'Rate limit: please wait before commenting again';
  END IF;

  -- duplicate comment guard
  SELECT count(*) INTO v_dupe
  FROM public.announcement_comments
  WHERE COALESCE(user_id::text, guest_key) = v_actor
    AND body = NEW.body
    AND created_at > now() - interval '1 day';

  IF v_dupe > 0 THEN
    RAISE EXCEPTION 'Duplicate comment';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_guard_announcement_comment
BEFORE INSERT ON public.announcement_comments
FOR EACH ROW EXECUTE FUNCTION public.guard_announcement_comment();

-- Reaction rate limit: 30 likes / hour per actor
CREATE OR REPLACE FUNCTION public.guard_announcement_reaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor TEXT := COALESCE(NEW.user_id::text, NEW.guest_key);
  v_recent INTEGER;
BEGIN
  SELECT count(*) INTO v_recent
  FROM public.announcement_reactions
  WHERE COALESCE(user_id::text, guest_key) = v_actor
    AND created_at > now() - interval '1 hour';

  IF v_recent >= 30 THEN
    RAISE EXCEPTION 'Rate limit: too many reactions';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_guard_announcement_reaction
BEFORE INSERT ON public.announcement_reactions
FOR EACH ROW EXECUTE FUNCTION public.guard_announcement_reaction();

-- ---------------------------------------------------------
-- REPORTS
-- ---------------------------------------------------------
CREATE TABLE public.announcement_comment_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.announcement_comments(id) ON DELETE CASCADE,
  reporter_key TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (comment_id, reporter_key)
);

GRANT INSERT ON public.announcement_comment_reports TO anon;
GRANT SELECT, INSERT ON public.announcement_comment_reports TO authenticated;
GRANT ALL ON public.announcement_comment_reports TO service_role;

ALTER TABLE public.announcement_comment_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports_anyone_insert"
ON public.announcement_comment_reports FOR INSERT TO anon
WITH CHECK (length(reporter_key) BETWEEN 8 AND 64);

CREATE POLICY "reports_user_insert"
ON public.announcement_comment_reports FOR INSERT TO authenticated
WITH CHECK (length(reporter_key) BETWEEN 8 AND 64);

CREATE POLICY "reports_admin_read"
ON public.announcement_comment_reports FOR SELECT TO authenticated
USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.apply_comment_report()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT count(*) INTO v_count
  FROM public.announcement_comment_reports
  WHERE comment_id = NEW.comment_id;

  UPDATE public.announcement_comments
  SET report_count = v_count,
      is_hidden = (v_count >= 3)
  WHERE id = NEW.comment_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_apply_comment_report
AFTER INSERT ON public.announcement_comment_reports
FOR EACH ROW EXECUTE FUNCTION public.apply_comment_report();

-- ---------------------------------------------------------
-- VIEWS (trending signal)
-- ---------------------------------------------------------
CREATE TABLE public.announcement_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  viewer_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.announcement_views TO anon;
GRANT SELECT, INSERT ON public.announcement_views TO authenticated;
GRANT ALL ON public.announcement_views TO service_role;

ALTER TABLE public.announcement_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "views_anon_insert"
ON public.announcement_views FOR INSERT TO anon
WITH CHECK (true);

CREATE POLICY "views_user_insert"
ON public.announcement_views FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "views_admin_read"
ON public.announcement_views FOR SELECT TO authenticated
USING (public.is_admin());

CREATE INDEX idx_views_target ON public.announcement_views (target_type, target_id, created_at DESC);

-- ---------------------------------------------------------
-- FEED RPC (unified: notices + jobs + scholarships + blog)
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_announcement_feed(
  p_filter TEXT DEFAULT 'all',
  p_sort TEXT DEFAULT 'latest',
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  target_type TEXT,
  target_id TEXT,
  slug TEXT,
  title TEXT,
  excerpt TEXT,
  image_url TEXT,
  href TEXT,
  type_label TEXT,
  is_urgent BOOLEAN,
  is_pinned BOOLEAN,
  published_at TIMESTAMPTZ,
  like_count BIGINT,
  comment_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
    CASE WHEN c.category = 'job' THEN 'job' ELSE 'scholarship' END::text,
    c.id::text,
    NULL::text,
    c.title,
    left(COALESCE(c.description, ''), 220),
    c.image_url,
    CASE WHEN c.category = 'job' THEN '/jobs/' || c.id::text ELSE '/scholarships/' || c.id::text END,
    c.category::text,
    false,
    false,
    c.created_at
  FROM public.content_items c
  WHERE c.status = 'approved'
    AND c.category IN ('job', 'scholarship')
    AND (
      p_filter = 'all'
      OR (p_filter = 'jobs' AND c.category = 'job')
      OR (p_filter = 'scholarships' AND c.category = 'scholarship')
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
$$;

REVOKE ALL ON FUNCTION public.get_announcement_feed(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_announcement_feed(TEXT, TEXT, INTEGER, INTEGER) TO anon, authenticated, service_role;

-- Related announcements by shared topics
CREATE OR REPLACE FUNCTION public.get_related_announcements(
  p_announcement_id UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  title TEXT,
  summary TEXT,
  published_at TIMESTAMPTZ,
  shared_topics BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
SELECT a.id, a.slug, a.title, a.summary, COALESCE(a.published_at, a.created_at), count(*) AS shared_topics
FROM public.announcement_topics t1
JOIN public.announcement_topics t2 ON t2.topic_slug = t1.topic_slug AND t2.announcement_id <> t1.announcement_id
JOIN public.announcements a ON a.id = t2.announcement_id AND a.status = 'published'
WHERE t1.announcement_id = p_announcement_id
GROUP BY a.id, a.slug, a.title, a.summary, a.published_at, a.created_at
ORDER BY shared_topics DESC, COALESCE(a.published_at, a.created_at) DESC
LIMIT GREATEST(1, LEAST(p_limit, 10));
$$;

REVOKE ALL ON FUNCTION public.get_related_announcements(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_related_announcements(UUID, INTEGER) TO anon, authenticated, service_role;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcement_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcement_comments;