CREATE OR REPLACE FUNCTION public.get_question_explorer(
  p_pool text DEFAULT 'all',
  p_status text DEFAULT NULL,
  p_subject text DEFAULT NULL,
  p_topic text DEFAULT NULL,
  p_difficulty text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_relationship text DEFAULT NULL,
  p_sort text DEFAULT 'created_at',
  p_dir text DEFAULT 'desc',
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  pool text,
  question_text text,
  status text,
  subject text,
  topic text,
  difficulty text,
  mock_test_count integer,
  mock_test_names text[],
  in_both_pools boolean,
  duplicate_copies integer,
  usage_count integer,
  last_used_at timestamptz,
  created_at timestamptz,
  total_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
WITH guard AS (
  SELECT public.is_admin(auth.uid()) AS ok
), lib AS (
  SELECT ci.id,
         'library'::text AS pool,
         ci.title AS question_text,
         ci.status::text AS status,
         ci.subject,
         ci.topic,
         ci.difficulty,
         COALESCE(ci.usage_count, 0) AS usage_count,
         ci.last_used_at,
         ci.created_at,
         lower(btrim(ci.title)) AS norm
  FROM content_items ci, guard g
  WHERE g.ok AND ci.category = 'mcq'
), mock AS (
  SELECT q.id,
         'mock'::text AS pool,
         q.question AS question_text,
         CASE WHEN q.admin_approved THEN 'approved' ELSE 'unapproved' END AS status,
         q.subject,
         q.topic,
         q.difficulty,
         COALESCE(q.usage_count, 0) AS usage_count,
         q.last_used_at,
         q.created_at,
         lower(btrim(q.question)) AS norm
  FROM job_test_questions q, guard g
  WHERE g.ok
), all_q AS (
  SELECT * FROM lib
  UNION ALL
  SELECT * FROM mock
), norm_stats AS (
  SELECT a.norm,
         count(*)::int AS duplicate_copies,
         bool_or(a.pool = 'library') AND bool_or(a.pool = 'mock') AS in_both_pools
  FROM all_q a
  GROUP BY a.norm
), mock_usage AS (
  SELECT lower(btrim(q.question)) AS norm,
         count(DISTINCT q.job_test_id)::int AS mock_test_count,
         (array_agg(DISTINCT d.job_title) FILTER (WHERE d.job_title IS NOT NULL))[1:10] AS mock_test_names
  FROM job_test_questions q
  LEFT JOIN job_test_definitions d ON d.id = q.job_test_id
  GROUP BY 1
), joined AS (
  SELECT a.id,
         a.pool,
         a.question_text,
         a.status,
         a.subject,
         a.topic,
         a.difficulty,
         COALESCE(mu.mock_test_count, 0) AS mock_test_count,
         COALESCE(mu.mock_test_names, ARRAY[]::text[]) AS mock_test_names,
         ns.in_both_pools,
         ns.duplicate_copies,
         a.usage_count,
         a.last_used_at,
         a.created_at
  FROM all_q a
  JOIN norm_stats ns ON ns.norm = a.norm
  LEFT JOIN mock_usage mu ON mu.norm = a.norm
), filtered AS (
  SELECT * FROM joined j
  WHERE (p_pool IS NULL OR p_pool = 'all' OR j.pool = p_pool)
    AND (p_status IS NULL OR p_status = 'all' OR j.status = p_status)
    AND (p_subject IS NULL OR p_subject = 'all' OR j.subject = p_subject)
    AND (p_topic IS NULL OR p_topic = 'all' OR j.topic = p_topic)
    AND (p_difficulty IS NULL OR p_difficulty = 'all' OR lower(j.difficulty) = lower(p_difficulty))
    AND (p_search IS NULL OR btrim(p_search) = '' OR j.question_text ILIKE '%' || btrim(p_search) || '%'
         OR j.subject ILIKE '%' || btrim(p_search) || '%' OR j.topic ILIKE '%' || btrim(p_search) || '%')
    AND (
      p_relationship IS NULL OR p_relationship = 'all'
      OR (p_relationship = 'multi_mock' AND j.mock_test_count > 1)
      OR (p_relationship = 'both_pools' AND j.in_both_pools)
      OR (p_relationship = 'dup_2' AND j.duplicate_copies >= 2)
      OR (p_relationship = 'dup_3' AND j.duplicate_copies >= 3)
      OR (p_relationship = 'dup_5' AND j.duplicate_copies >= 5)
      OR (p_relationship = 'never_used' AND j.usage_count = 0)
    )
)
SELECT f.id, f.pool, f.question_text, f.status, f.subject, f.topic, f.difficulty,
       f.mock_test_count, f.mock_test_names, f.in_both_pools, f.duplicate_copies,
       f.usage_count, f.last_used_at, f.created_at,
       count(*) OVER () AS total_count
FROM filtered f
ORDER BY
  CASE WHEN p_sort = 'question_text' AND lower(p_dir) = 'asc'  THEN f.question_text END ASC NULLS LAST,
  CASE WHEN p_sort = 'question_text' AND lower(p_dir) <> 'asc' THEN f.question_text END DESC NULLS LAST,
  CASE WHEN p_sort = 'subject' AND lower(p_dir) = 'asc'  THEN f.subject END ASC NULLS LAST,
  CASE WHEN p_sort = 'subject' AND lower(p_dir) <> 'asc' THEN f.subject END DESC NULLS LAST,
  CASE WHEN p_sort = 'topic' AND lower(p_dir) = 'asc'  THEN f.topic END ASC NULLS LAST,
  CASE WHEN p_sort = 'topic' AND lower(p_dir) <> 'asc' THEN f.topic END DESC NULLS LAST,
  CASE WHEN p_sort = 'pool' AND lower(p_dir) = 'asc'  THEN f.pool END ASC NULLS LAST,
  CASE WHEN p_sort = 'pool' AND lower(p_dir) <> 'asc' THEN f.pool END DESC NULLS LAST,
  CASE WHEN p_sort = 'status' AND lower(p_dir) = 'asc'  THEN f.status END ASC NULLS LAST,
  CASE WHEN p_sort = 'status' AND lower(p_dir) <> 'asc' THEN f.status END DESC NULLS LAST,
  CASE WHEN p_sort = 'mock_test_count' AND lower(p_dir) = 'asc'  THEN f.mock_test_count END ASC NULLS LAST,
  CASE WHEN p_sort = 'mock_test_count' AND lower(p_dir) <> 'asc' THEN f.mock_test_count END DESC NULLS LAST,
  CASE WHEN p_sort = 'duplicate_copies' AND lower(p_dir) = 'asc'  THEN f.duplicate_copies END ASC NULLS LAST,
  CASE WHEN p_sort = 'duplicate_copies' AND lower(p_dir) <> 'asc' THEN f.duplicate_copies END DESC NULLS LAST,
  CASE WHEN p_sort = 'usage_count' AND lower(p_dir) = 'asc'  THEN f.usage_count END ASC NULLS LAST,
  CASE WHEN p_sort = 'usage_count' AND lower(p_dir) <> 'asc' THEN f.usage_count END DESC NULLS LAST,
  CASE WHEN p_sort = 'last_used_at' AND lower(p_dir) = 'asc'  THEN f.last_used_at END ASC NULLS LAST,
  CASE WHEN p_sort = 'last_used_at' AND lower(p_dir) <> 'asc' THEN f.last_used_at END DESC NULLS LAST,
  CASE WHEN p_sort = 'created_at' AND lower(p_dir) = 'asc' THEN f.created_at END ASC NULLS LAST,
  f.created_at DESC
LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 500))
OFFSET GREATEST(0, COALESCE(p_offset, 0));
$$;

CREATE OR REPLACE FUNCTION public.get_question_explorer_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
SELECT CASE WHEN public.is_admin(auth.uid()) THEN jsonb_build_object(
  'library', (
    SELECT jsonb_build_object(
      'total', count(*),
      'approved', count(*) FILTER (WHERE status = 'approved'),
      'pending', count(*) FILTER (WHERE status = 'pending'),
      'flagged_duplicate', count(*) FILTER (WHERE status = 'flagged_duplicate')
    ) FROM content_items WHERE category = 'mcq'
  ),
  'mock', (
    SELECT jsonb_build_object(
      'total', count(*),
      'approved', count(*) FILTER (WHERE admin_approved),
      'unapproved', count(*) FILTER (WHERE NOT admin_approved)
    ) FROM job_test_questions
  ),
  'combined_total', (SELECT count(*) FROM content_items WHERE category = 'mcq')
                    + (SELECT count(*) FROM job_test_questions)
) ELSE NULL::jsonb END;
$$;

REVOKE ALL ON FUNCTION public.get_question_explorer(text,text,text,text,text,text,text,text,text,integer,integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_question_explorer_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_question_explorer(text,text,text,text,text,text,text,text,text,integer,integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_question_explorer_stats() TO authenticated, service_role;