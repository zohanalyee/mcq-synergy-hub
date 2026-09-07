CREATE OR REPLACE FUNCTION public.get_duplicate_clusters(_limit integer DEFAULT 200, _offset integer DEFAULT 0)
RETURNS TABLE (
  cluster_key text,
  copies integer,
  sample_title text,
  subject text,
  difficulty text,
  approved_count integer,
  flagged_count integer,
  members jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  WITH n AS (
    SELECT
      id,
      title,
      lower(btrim(regexp_replace(title, '\[FORCE-SAVE-[^]]*\]', '', 'g'))) AS norm,
      options,
      correct_option,
      explanation,
      status,
      subject,
      difficulty,
      created_at,
      show_in_subjects,
      show_in_mock_tests
    FROM content_items
    WHERE category = 'mcq'
      AND public.is_admin()
  ),
  g AS (
    SELECT norm
    FROM n
    GROUP BY norm
    HAVING count(*) > 1
  )
  SELECT
    n.norm AS cluster_key,
    count(*)::int AS copies,
    (array_agg(n.title ORDER BY n.created_at))[1] AS sample_title,
    (array_agg(n.subject ORDER BY n.created_at))[1] AS subject,
    (array_agg(n.difficulty ORDER BY n.created_at))[1] AS difficulty,
    count(*) FILTER (WHERE n.status = 'approved')::int AS approved_count,
    count(*) FILTER (WHERE n.status = 'flagged_duplicate')::int AS flagged_count,
    jsonb_agg(
      jsonb_build_object(
        'id', n.id,
        'title', n.title,
        'options', n.options,
        'correct_option', n.correct_option,
        'explanation', n.explanation,
        'status', n.status,
        'subject', n.subject,
        'difficulty', n.difficulty,
        'created_at', n.created_at,
        'show_in_subjects', n.show_in_subjects,
        'show_in_mock_tests', n.show_in_mock_tests
      ) ORDER BY n.created_at
    ) AS members
  FROM n
  JOIN g ON g.norm = n.norm
  GROUP BY n.norm
  ORDER BY count(*) DESC, n.norm
  LIMIT _limit OFFSET _offset;
$$;

CREATE OR REPLACE FUNCTION public.get_duplicate_cluster_stats()
RETURNS TABLE (
  total_groups integer,
  total_rows integer,
  extra_copies integer,
  approved_dup_groups integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  WITH n AS (
    SELECT id, status,
      lower(btrim(regexp_replace(title, '\[FORCE-SAVE-[^]]*\]', '', 'g'))) AS norm
    FROM content_items
    WHERE category = 'mcq' AND public.is_admin()
  ),
  g AS (
    SELECT norm, count(*) AS c, count(*) FILTER (WHERE status = 'approved') AS ac
    FROM n GROUP BY norm HAVING count(*) > 1
  )
  SELECT
    count(*)::int,
    coalesce(sum(c), 0)::int,
    coalesce(sum(c - 1), 0)::int,
    count(*) FILTER (WHERE ac > 1)::int
  FROM g;
$$;

REVOKE ALL ON FUNCTION public.get_duplicate_clusters(integer, integer) FROM public;
REVOKE ALL ON FUNCTION public.get_duplicate_cluster_stats() FROM public;
GRANT EXECUTE ON FUNCTION public.get_duplicate_clusters(integer, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_duplicate_cluster_stats() TO authenticated, service_role;