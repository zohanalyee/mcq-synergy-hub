
-- Aggregate circulation stats for content_items + job_test_questions
CREATE OR REPLACE FUNCTION public.get_lifecycle_circulation_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  WITH ci AS (
    SELECT
      COUNT(*)::bigint AS total,
      COUNT(*) FILTER (WHERE COALESCE(usage_count,0) = 0)::bigint AS unused,
      COUNT(*) FILTER (WHERE COALESCE(usage_count,0) BETWEEN 1 AND 5)::bigint AS low,
      COUNT(*) FILTER (WHERE COALESCE(usage_count,0) BETWEEN 6 AND 20)::bigint AS medium,
      COUNT(*) FILTER (WHERE COALESCE(usage_count,0) > 20)::bigint AS heavy,
      COUNT(*) FILTER (WHERE last_used_at IS NOT NULL AND last_used_at < now() - INTERVAL '60 days')::bigint AS stale,
      COUNT(DISTINCT concept_group_id) FILTER (WHERE concept_group_id IS NOT NULL)::bigint AS groups
    FROM public.content_items
    WHERE category = 'mcq' AND status = 'approved'
  ), jq AS (
    SELECT
      COUNT(*)::bigint AS total,
      COUNT(*) FILTER (WHERE COALESCE(usage_count,0) = 0)::bigint AS unused,
      COUNT(*) FILTER (WHERE COALESCE(usage_count,0) BETWEEN 1 AND 5)::bigint AS low,
      COUNT(*) FILTER (WHERE COALESCE(usage_count,0) BETWEEN 6 AND 20)::bigint AS medium,
      COUNT(*) FILTER (WHERE COALESCE(usage_count,0) > 20)::bigint AS heavy,
      COUNT(*) FILTER (WHERE last_used_at IS NOT NULL AND last_used_at < now() - INTERVAL '60 days')::bigint AS stale,
      COUNT(DISTINCT concept_group_id) FILTER (WHERE concept_group_id IS NOT NULL)::bigint AS groups
    FROM public.job_test_questions
    WHERE admin_approved = true
  ), mastery AS (
    SELECT
      COUNT(*)::bigint AS total_records,
      COUNT(DISTINCT user_id)::bigint AS users_tracked,
      COUNT(*) FILTER (WHERE mastery_level = 'learning')::bigint AS learning,
      COUNT(*) FILTER (WHERE mastery_level = 'review')::bigint AS review,
      COUNT(*) FILTER (WHERE mastery_level = 'mastered')::bigint AS mastered
    FROM public.user_question_mastery
  ), topups AS (
    SELECT
      COUNT(*)::bigint AS total,
      COUNT(*) FILTER (WHERE success = true)::bigint AS success,
      COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::bigint AS today,
      COUNT(*) FILTER (WHERE created_at >= now() - INTERVAL '7 days')::bigint AS last_7d,
      COUNT(*) FILTER (WHERE created_at >= now() - INTERVAL '30 days')::bigint AS last_30d,
      COUNT(DISTINCT user_id)::bigint AS unique_users
    FROM public.user_ai_topup_log
  )
  SELECT jsonb_build_object(
    'content_items', to_jsonb(ci.*),
    'job_test_questions', to_jsonb(jq.*),
    'mastery', to_jsonb(mastery.*),
    'topups', to_jsonb(topups.*)
  ) INTO v_result
  FROM ci, jq, mastery, topups;

  RETURN v_result;
END;
$$;

-- Top-up log listing (recent activity)
CREATE OR REPLACE FUNCTION public.get_lifecycle_topup_log(p_limit int DEFAULT 50)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  username text,
  job_test_id uuid,
  subject text,
  questions_generated int,
  success boolean,
  reason text,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT
    l.id,
    l.user_id,
    COALESCE(p.username, 'Unknown')::text,
    l.job_test_id,
    l.subject::text,
    COALESCE(l.questions_generated, 0),
    l.success,
    l.reason::text,
    l.created_at
  FROM public.user_ai_topup_log l
  LEFT JOIN public.profiles p ON p.id = l.user_id
  ORDER BY l.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 500));
END;
$$;

-- Top over-used and stale questions (small sample)
CREATE OR REPLACE FUNCTION public.get_lifecycle_hot_and_stale(p_limit int DEFAULT 10)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_hot jsonb;
  v_stale jsonb;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  SELECT jsonb_agg(row_to_json(t)) INTO v_hot FROM (
    SELECT id, title, subject, topic, usage_count, last_used_at, 'content_items'::text AS source
    FROM public.content_items
    WHERE category = 'mcq' AND status = 'approved' AND COALESCE(usage_count,0) > 0
    ORDER BY usage_count DESC NULLS LAST
    LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 10), 50))
  ) t;

  SELECT jsonb_agg(row_to_json(t)) INTO v_stale FROM (
    SELECT id, title, subject, topic, usage_count, last_used_at, 'content_items'::text AS source
    FROM public.content_items
    WHERE category = 'mcq' AND status = 'approved'
      AND COALESCE(usage_count,0) = 0
    ORDER BY created_at ASC
    LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 10), 50))
  ) t;

  RETURN jsonb_build_object(
    'hot', COALESCE(v_hot, '[]'::jsonb),
    'unused', COALESCE(v_stale, '[]'::jsonb)
  );
END;
$$;
