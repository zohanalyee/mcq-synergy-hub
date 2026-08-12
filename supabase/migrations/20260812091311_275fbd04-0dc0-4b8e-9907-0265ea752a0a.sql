CREATE OR REPLACE FUNCTION public.get_mock_test_popularity(p_days integer DEFAULT 14)
RETURNS TABLE (
  definition_id uuid,
  test_id uuid,
  title text,
  slug text,
  attempts bigint,
  distinct_users bigint,
  last_attempt_at timestamptz,
  exam_length integer,
  approved_pool bigint,
  pool_multiplier numeric,
  grow_target integer,
  pool_deficit integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH gate AS (
    SELECT (auth.role() = 'service_role' OR public.is_admin()) AS ok
  ),
  pop AS (
    SELECT public.mock_test_slug(jt.title) AS slug,
           jt.id AS test_id,
           jt.title,
           jt.definition_id,
           COALESCE(jt.questions, 100) AS exam_length
    FROM public.job_tests jt
    WHERE (SELECT ok FROM gate)
  ),
  prog AS (
    SELECT p.job_test_id AS slug,
           SUM(COALESCE(p.total_attempts, 0))::bigint AS attempts,
           COUNT(DISTINCT p.user_id)::bigint AS distinct_users,
           MAX(p.last_attempt_at) AS last_attempt_at
    FROM public.job_test_progress p
    WHERE p.last_attempt_at >= now() - (p_days || ' days')::interval
    GROUP BY p.job_test_id
  ),
  pool AS (
    SELECT q.job_test_id AS definition_id, COUNT(*)::bigint AS approved_pool
    FROM public.job_test_questions q
    WHERE q.admin_approved = true
    GROUP BY q.job_test_id
  )
  SELECT pop.definition_id,
         pop.test_id,
         pop.title,
         pop.slug,
         COALESCE(prog.attempts, 0),
         COALESCE(prog.distinct_users, 0),
         prog.last_attempt_at,
         pop.exam_length,
         COALESCE(pool.approved_pool, 0),
         COALESCE(d.pool_multiplier, 2.0),
         CEIL(pop.exam_length * GREATEST(COALESCE(d.pool_multiplier, 2.0), 1))::integer AS grow_target,
         GREATEST(
           0,
           CEIL(pop.exam_length * GREATEST(COALESCE(d.pool_multiplier, 2.0), 1))::integer
             - COALESCE(pool.approved_pool, 0)
         )::integer AS pool_deficit
  FROM pop
  LEFT JOIN prog ON prog.slug = pop.slug
  LEFT JOIN public.job_test_definitions d ON d.id = pop.definition_id
  LEFT JOIN pool ON pool.definition_id = pop.definition_id
  ORDER BY COALESCE(prog.attempts, 0) DESC, COALESCE(prog.distinct_users, 0) DESC;
$$;

REVOKE ALL ON FUNCTION public.get_mock_test_popularity(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_mock_test_popularity(integer) TO authenticated, service_role;