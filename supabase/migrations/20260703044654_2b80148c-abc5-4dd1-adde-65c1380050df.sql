
CREATE OR REPLACE FUNCTION public.get_content_health()
 RETURNS TABLE(
   topic_id uuid,
   path text,
   topic_name text,
   subject_name text,
   board_name text,
   class_number text,
   approved_count bigint,
   status text,
   view_count integer,
   last_content_at timestamp with time zone
 )
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  WITH board_topics AS (
    SELECT
      t.id AS topic_id,
      t.name AS topic_name,
      s.name AS subject_name,
      es.name AS system_name,
      substring(l.name FROM '(\d+)') AS class_number
    FROM public.topics t
    JOIN public.subjects s ON s.id = t.subject_id
    JOIN public.levels l ON l.id = s.level_id
    JOIN public.educational_systems es ON es.id = l.system_id
    WHERE es.is_active = true
      AND substring(l.name FROM '(\d+)') IS NOT NULL
  ), topic_counts AS (
    SELECT
      bt.topic_id,
      COUNT(ci.id)::bigint AS approved_count,
      MAX(ci.updated_at) AS last_content_at
    FROM board_topics bt
    LEFT JOIN public.content_items ci
      ON ci.category = 'mcq'
     AND ci.status = 'approved'
     AND (
       ci.topic_id = bt.topic_id
       OR (
         ci.topic_id IS NULL
         AND ci.canonical_topic_name = trim(both '-' from lower(regexp_replace(bt.topic_name, '[^a-zA-Z0-9]+', '-', 'g')))
       )
     )
    GROUP BY bt.topic_id
  ), traffic AS (
    SELECT
      lower(eta.topic_name) AS t_name,
      lower(eta.board_name) AS b_name,
      SUM(eta.view_count)::integer AS views
    FROM public.empty_topic_analytics eta
    GROUP BY lower(eta.topic_name), lower(eta.board_name)
  )
  SELECT
    bt.topic_id,
    '/boards/' ||
      trim(both '-' from lower(regexp_replace(bt.system_name, '[^a-zA-Z0-9]+', '-', 'g'))) ||
      '/class-' || bt.class_number ||
      '/' || trim(both '-' from lower(regexp_replace(bt.subject_name, '[^a-zA-Z0-9]+', '-', 'g'))) ||
      '/' || trim(both '-' from lower(regexp_replace(bt.topic_name, '[^a-zA-Z0-9]+', '-', 'g'))) AS path,
    bt.topic_name::text,
    bt.subject_name::text,
    bt.system_name::text AS board_name,
    bt.class_number::text,
    COALESCE(tc.approved_count, 0) AS approved_count,
    CASE
      WHEN COALESCE(tc.approved_count, 0) >= 5 THEN 'filled'
      WHEN COALESCE(tc.approved_count, 0) >= 1 THEN 'thin'
      ELSE 'empty'
    END::text AS status,
    COALESCE(tr.views, 0) AS view_count,
    tc.last_content_at
  FROM board_topics bt
  LEFT JOIN topic_counts tc ON tc.topic_id = bt.topic_id
  LEFT JOIN traffic tr
    ON tr.t_name = lower(bt.topic_name)
   AND tr.b_name = lower(bt.system_name)
  ORDER BY COALESCE(tr.views, 0) DESC, COALESCE(tc.approved_count, 0) ASC, bt.topic_name;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_content_fill_progress()
 RETURNS TABLE(
   filled_this_week bigint,
   filled_this_month bigint,
   week_start date,
   week_count bigint
 )
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  WITH weeks AS (
    SELECT generate_series(
      date_trunc('week', CURRENT_DATE) - INTERVAL '11 weeks',
      date_trunc('week', CURRENT_DATE),
      INTERVAL '1 week'
    )::date AS wk
  ), totals AS (
    SELECT
      COUNT(*) FILTER (WHERE ci.created_at >= CURRENT_DATE - INTERVAL '7 days')::bigint AS wtd,
      COUNT(*) FILTER (WHERE ci.created_at >= CURRENT_DATE - INTERVAL '30 days')::bigint AS mtd
    FROM public.content_items ci
    WHERE ci.category = 'mcq' AND ci.status = 'approved'
  )
  SELECT
    (SELECT wtd FROM totals) AS filled_this_week,
    (SELECT mtd FROM totals) AS filled_this_month,
    w.wk AS week_start,
    COUNT(ci.id)::bigint AS week_count
  FROM weeks w
  LEFT JOIN public.content_items ci
    ON ci.category = 'mcq'
   AND ci.status = 'approved'
   AND date_trunc('week', ci.created_at)::date = w.wk
  GROUP BY w.wk
  ORDER BY w.wk;
END;
$function$;
