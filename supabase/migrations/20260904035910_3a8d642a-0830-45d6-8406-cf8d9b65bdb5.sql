-- 1) Comment rate limit: 3 per hour (approved plan)
CREATE OR REPLACE FUNCTION public.announcement_comment_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_recent int;
  v_dupe int;
BEGIN
  SELECT count(*) INTO v_recent
  FROM public.announcement_comments
  WHERE (NEW.user_id IS NOT NULL AND user_id = NEW.user_id
         OR NEW.user_id IS NULL AND guest_key = NEW.guest_key)
    AND created_at > now() - interval '1 hour';

  IF v_recent >= 3 THEN
    RAISE EXCEPTION 'Rate limit: too many comments in the last hour';
  END IF;

  SELECT count(*) INTO v_dupe
  FROM public.announcement_comments
  WHERE target_type = NEW.target_type
    AND target_id = NEW.target_id
    AND body = NEW.body
    AND created_at > now() - interval '1 day';

  IF v_dupe > 0 THEN
    RAISE EXCEPTION 'Duplicate comment';
  END IF;

  IF (length(NEW.body) - length(replace(lower(NEW.body), 'http', ''))) / 4 > 1 THEN
    RAISE EXCEPTION 'Comment looks like spam: too many links';
  END IF;

  RETURN NEW;
END;
$$;

-- 2) Reaction privacy: never expose guest_key / user_id to visitors
REVOKE SELECT ON public.announcement_reactions FROM anon, authenticated;
GRANT SELECT (id, target_type, target_id, created_at) ON public.announcement_reactions TO anon, authenticated;

-- 3) Views: require a real visitor key and cap per-visitor inserts
DROP POLICY IF EXISTS "views_anon_insert" ON public.announcement_views;
DROP POLICY IF EXISTS "views_user_insert" ON public.announcement_views;

CREATE POLICY "views_anon_insert" ON public.announcement_views
FOR INSERT TO anon
WITH CHECK (viewer_key IS NOT NULL AND length(viewer_key) BETWEEN 8 AND 64);

CREATE POLICY "views_user_insert" ON public.announcement_views
FOR INSERT TO authenticated
WITH CHECK (viewer_key IS NOT NULL AND length(viewer_key) BETWEEN 8 AND 64);

CREATE OR REPLACE FUNCTION public.announcement_view_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_recent int;
BEGIN
  SELECT count(*) INTO v_recent
  FROM public.announcement_views
  WHERE viewer_key = NEW.viewer_key
    AND created_at > now() - interval '1 hour';

  IF v_recent >= 60 THEN
    RAISE EXCEPTION 'Rate limit: too many views recorded';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_announcement_view_guard ON public.announcement_views;
CREATE TRIGGER trg_announcement_view_guard
BEFORE INSERT ON public.announcement_views
FOR EACH ROW EXECUTE FUNCTION public.announcement_view_guard();