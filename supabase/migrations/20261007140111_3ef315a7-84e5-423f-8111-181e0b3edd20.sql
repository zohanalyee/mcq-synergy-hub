CREATE OR REPLACE FUNCTION public.auto_merge_duplicate_clusters(_dry_run boolean DEFAULT true)
RETURNS TABLE(groups_merged integer, copies_hidden integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_groups int; v_hidden int;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Access denied: Admin privileges required'; END IF;

  CREATE TEMP TABLE _dup ON COMMIT DROP AS
  WITH n AS (
    SELECT id, status, created_at,
      lower(btrim(regexp_replace(title, '\[FORCE-SAVE-[^]]*\]', '', 'g'))) AS norm,
      md5(lower(regexp_replace(COALESCE(options::text,''), '\s+', '', 'g'))) AS opt_key
    FROM content_items
    WHERE category = 'mcq' AND status IN ('approved','pending','flagged_duplicate')
  ), r AS (
    SELECT id, norm, opt_key,
      row_number() OVER (PARTITION BY norm, opt_key
        ORDER BY (status = 'approved') DESC, created_at ASC) AS rn,
      count(*) OVER (PARTITION BY norm, opt_key) AS c
    FROM n
  )
  SELECT id, norm, opt_key, rn FROM r WHERE c > 1;

  SELECT count(DISTINCT (norm, opt_key))::int, count(*) FILTER (WHERE rn > 1)::int
  INTO v_groups, v_hidden FROM _dup;

  IF NOT _dry_run THEN
    -- Keeper: approved & visible
    UPDATE content_items ci SET status = 'approved', updated_at = now()
    FROM _dup d WHERE d.rn = 1 AND ci.id = d.id AND ci.status <> 'approved';
    -- Extra copies: hidden (rejected), never deleted — restorable from Question Explorer
    UPDATE content_items ci SET status = 'rejected', show_in_subjects = false,
      show_in_mock_tests = false, show_in_syllabus = false, updated_at = now()
    FROM _dup d WHERE d.rn > 1 AND ci.id = d.id;
  END IF;

  RETURN QUERY SELECT v_groups, v_hidden;
END;
$$;
REVOKE ALL ON FUNCTION public.auto_merge_duplicate_clusters(boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.auto_merge_duplicate_clusters(boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_content_health()
 RETURNS TABLE(topic_id uuid, path text, topic_name text, subject_name text, board_name text, class_number text, approved_count bigint, status text, view_count integer, last_content_at timestamp with time zone)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Access denied: Admin privileges required'; END IF;
  RETURN QUERY
  WITH board_topics AS (
    SELECT t.id AS topic_id, t.name AS topic_name, s.name AS subject_name, es.name AS system_name,
      substring(l.name FROM '(\d+)') AS class_number,
      trim(both '-' from lower(regexp_replace(s.name, '[^a-zA-Z0-9]+', '-', 'g'))) || '-' ||
      trim(both '-' from lower(regexp_replace(t.name, '[^a-zA-Z0-9]+', '-', 'g'))) AS canonical_key
    FROM public.topics t
    JOIN public.subjects s ON s.id = t.subject_id
    JOIN public.levels l ON l.id = s.level_id
    JOIN public.educational_systems es ON es.id = l.system_id
    WHERE es.is_active = true AND substring(l.name FROM '(\d+)') IS NOT NULL
  ), topic_counts AS (
    SELECT bt.topic_id, COUNT(ci.id)::bigint AS approved_count, MAX(ci.updated_at) AS last_content_at
    FROM board_topics bt
    LEFT JOIN public.content_items ci ON ci.category = 'mcq' AND ci.status = 'approved'
     AND (ci.topic_id = bt.topic_id OR ci.canonical_topic_name = bt.canonical_key)
    GROUP BY bt.topic_id
  ), traffic AS (
    SELECT lower(eta.topic_name) AS t_name, lower(eta.board_name) AS b_name, SUM(eta.view_count)::integer AS views
    FROM public.empty_topic_analytics eta GROUP BY 1, 2
  )
  SELECT bt.topic_id,
    '/boards/' || trim(both '-' from lower(regexp_replace(bt.system_name, '[^a-zA-Z0-9]+', '-', 'g'))) ||
      '/class-' || bt.class_number ||
      '/' || trim(both '-' from lower(regexp_replace(bt.subject_name, '[^a-zA-Z0-9]+', '-', 'g'))) ||
      '/' || trim(both '-' from lower(regexp_replace(bt.topic_name, '[^a-zA-Z0-9]+', '-', 'g'))),
    bt.topic_name::text, bt.subject_name::text, bt.system_name::text, bt.class_number::text,
    COALESCE(tc.approved_count, 0),
    CASE WHEN COALESCE(tc.approved_count, 0) >= 8 THEN 'filled'
         WHEN COALESCE(tc.approved_count, 0) >= 1 THEN 'thin'
         ELSE 'empty' END::text,
    COALESCE(tr.views, 0), tc.last_content_at
  FROM board_topics bt
  LEFT JOIN topic_counts tc ON tc.topic_id = bt.topic_id
  LEFT JOIN traffic tr ON tr.t_name = lower(bt.topic_name) AND tr.b_name = lower(bt.system_name)
  ORDER BY COALESCE(tr.views, 0) DESC, COALESCE(tc.approved_count, 0) ASC, bt.topic_name;
END;
$function$;