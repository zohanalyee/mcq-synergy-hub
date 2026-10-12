CREATE OR REPLACE FUNCTION public.dup_norm(_t text)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE SET search_path TO public AS $$
  SELECT btrim(regexp_replace(
    regexp_replace(
      lower(regexp_replace(coalesce(_t,''), '\[FORCE-SAVE-[^]]*\]', '', 'g')),
      '[^[:alnum:][:space:]]+', '', 'g'),
    '\s+', ' ', 'g'));
$$;

CREATE OR REPLACE FUNCTION public.get_duplicate_clusters(_limit integer DEFAULT 200, _offset integer DEFAULT 0)
RETURNS TABLE (cluster_key text, copies integer, sample_title text, subject text, difficulty text,
  approved_count integer, flagged_count integer, members jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO public AS $$
  WITH n AS (
    SELECT id, title, public.dup_norm(title) AS norm, options, correct_option, explanation, status,
      subject, difficulty, created_at, show_in_subjects, show_in_mock_tests
    FROM content_items
    WHERE category = 'mcq' AND status IN ('approved','pending','flagged_duplicate') AND public.is_admin()
  ), g AS (SELECT norm FROM n WHERE norm <> '' GROUP BY norm HAVING count(*) > 1)
  SELECT n.norm, count(*)::int,
    (array_agg(n.title ORDER BY n.created_at))[1],
    (array_agg(n.subject ORDER BY n.created_at))[1],
    (array_agg(n.difficulty ORDER BY n.created_at))[1],
    count(*) FILTER (WHERE n.status='approved')::int,
    count(*) FILTER (WHERE n.status='flagged_duplicate')::int,
    jsonb_agg(jsonb_build_object('id',n.id,'title',n.title,'options',n.options,'correct_option',n.correct_option,
      'explanation',n.explanation,'status',n.status,'subject',n.subject,'difficulty',n.difficulty,
      'created_at',n.created_at,'show_in_subjects',n.show_in_subjects,'show_in_mock_tests',n.show_in_mock_tests)
      ORDER BY (n.status='approved') DESC, n.created_at)
  FROM n JOIN g ON g.norm = n.norm
  GROUP BY n.norm ORDER BY count(*) DESC, n.norm
  LIMIT _limit OFFSET _offset;
$$;

CREATE OR REPLACE FUNCTION public.get_duplicate_cluster_stats()
RETURNS TABLE (total_groups integer, total_rows integer, extra_copies integer, approved_dup_groups integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO public AS $$
  WITH n AS (
    SELECT status, public.dup_norm(title) AS norm FROM content_items
    WHERE category='mcq' AND status IN ('approved','pending','flagged_duplicate') AND public.is_admin()
  ), g AS (
    SELECT norm, count(*) c, count(*) FILTER (WHERE status='approved') ac
    FROM n WHERE norm <> '' GROUP BY norm HAVING count(*) > 1
  )
  SELECT count(*)::int, coalesce(sum(c),0)::int, coalesce(sum(c-1),0)::int, count(*) FILTER (WHERE ac>1)::int FROM g;
$$;

CREATE OR REPLACE FUNCTION public.resolve_duplicate_cluster(_cluster_key text, _keep_id uuid DEFAULT NULL)
RETURNS TABLE(kept_id uuid, copies_hidden integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
DECLARE v_keep uuid; v_hidden int; v_sub bool; v_mock bool; v_syl bool;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Access denied: Admin privileges required'; END IF;

  CREATE TEMP TABLE _grp ON COMMIT DROP AS
    SELECT id, status, created_at, show_in_subjects, show_in_mock_tests, show_in_syllabus
    FROM content_items
    WHERE category='mcq' AND status IN ('approved','pending','flagged_duplicate')
      AND public.dup_norm(title) = _cluster_key;

  IF _keep_id IS NOT NULL AND EXISTS (SELECT 1 FROM _grp WHERE id=_keep_id) THEN v_keep := _keep_id;
  ELSE
    SELECT id INTO v_keep FROM _grp ORDER BY (status='approved') DESC, (status='pending') DESC, created_at ASC LIMIT 1;
  END IF;
  IF v_keep IS NULL THEN RETURN QUERY SELECT NULL::uuid, 0; RETURN; END IF;

  SELECT bool_or(coalesce(show_in_subjects,false)), bool_or(coalesce(show_in_mock_tests,false)), bool_or(coalesce(show_in_syllabus,false))
    INTO v_sub, v_mock, v_syl FROM _grp;

  UPDATE content_items ci SET status='rejected', show_in_subjects=false, show_in_mock_tests=false,
    show_in_syllabus=false, updated_at=now()
  FROM _grp g WHERE ci.id=g.id AND g.id<>v_keep;
  GET DIAGNOSTICS v_hidden = ROW_COUNT;

  UPDATE content_items SET status='approved', show_in_subjects=true, show_in_mock_tests=true,
    show_in_syllabus=coalesce(v_syl,false) OR show_in_syllabus, updated_at=now()
  WHERE id=v_keep;

  RETURN QUERY SELECT v_keep, v_hidden;
END; $$;

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
      public.dup_norm(title) AS norm
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
    FROM n WHERE norm <> ''
  )
  SELECT * FROM r WHERE c > 1;

  SELECT count(DISTINCT norm)::int, count(*) FILTER (WHERE rn > 1)::int INTO v_groups, v_hidden FROM _dup;

  IF NOT _dry_run THEN
    UPDATE content_items ci SET status = 'rejected', show_in_subjects = false,
      show_in_mock_tests = false, show_in_syllabus = false, updated_at = now()
    FROM _dup d WHERE d.rn > 1 AND ci.id = d.id;

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

REVOKE ALL ON FUNCTION public.resolve_duplicate_cluster(text, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.resolve_duplicate_cluster(text, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.dup_norm(text) TO authenticated, service_role;