CREATE OR REPLACE FUNCTION public.auto_merge_duplicate_clusters(_dry_run boolean DEFAULT true)
 RETURNS TABLE(groups_merged integer, copies_hidden integer)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_groups int; v_hidden int;
BEGIN
  IF NOT (public.is_admin() OR auth.role() = 'service_role' OR current_user IN ('postgres','supabase_admin')) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  CREATE TEMP TABLE _dup ON COMMIT DROP AS
  WITH n AS (
    SELECT id, status, created_at, show_in_subjects, show_in_mock_tests, show_in_syllabus,
      lower(btrim(regexp_replace(title, '\[FORCE-SAVE-[^]]*\]', '', 'g'))) AS norm
    FROM content_items
    WHERE category = 'mcq' AND status IN ('approved','pending','flagged_duplicate')
  ), r AS (
    SELECT id, norm, status,
      row_number() OVER (PARTITION BY norm ORDER BY (status='approved') DESC, (status='pending') DESC, created_at ASC) AS rn,
      count(*) OVER (PARTITION BY norm) AS c,
      bool_or(status='approved') OVER (PARTITION BY norm) AS any_approved,
      bool_or(COALESCE(show_in_subjects,false)) OVER (PARTITION BY norm) AS v_sub,
      bool_or(COALESCE(show_in_mock_tests,false)) OVER (PARTITION BY norm) AS v_mock,
      bool_or(COALESCE(show_in_syllabus,false)) OVER (PARTITION BY norm) AS v_syl
    FROM n
  )
  SELECT * FROM r WHERE c > 1;

  SELECT count(DISTINCT norm)::int, count(*) FILTER (WHERE rn > 1)::int INTO v_groups, v_hidden FROM _dup;

  IF NOT _dry_run THEN
    -- 1) Hide extras first (never deleted; restorable)
    UPDATE content_items ci SET status = 'rejected', show_in_subjects = false,
      show_in_mock_tests = false, show_in_syllabus = false, updated_at = now()
    FROM _dup d WHERE d.rn > 1 AND ci.id = d.id;

    -- 2) Keeper inherits visibility; status only changes if no other active row shares its exact title
    UPDATE content_items ci SET
      status = CASE
        WHEN ci.status IN ('approved','pending') THEN ci.status
        WHEN EXISTS (SELECT 1 FROM content_items o WHERE o.id <> ci.id AND o.category='mcq'
                     AND md5(o.title) = md5(ci.title)
                     AND o.status NOT IN ('flagged_duplicate','rejected')) THEN ci.status
        WHEN d.any_approved THEN 'approved' ELSE 'pending' END,
      show_in_subjects = d.v_sub, show_in_mock_tests = d.v_mock, show_in_syllabus = d.v_syl,
      updated_at = now()
    FROM _dup d WHERE d.rn = 1 AND ci.id = d.id;
  END IF;

  RETURN QUERY SELECT v_groups, v_hidden;
END;
$function$;