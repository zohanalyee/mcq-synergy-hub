ALTER TABLE public.ai_usage_logs DROP CONSTRAINT IF EXISTS ai_usage_logs_source_type_check;
ALTER TABLE public.ai_usage_logs ADD CONSTRAINT ai_usage_logs_source_type_check
CHECK (source_type = ANY (ARRAY[
  'user_test_session','admin_bulk_generator','auto_fill','auto_fill_run_summary',
  'generate-test','generate-from-rag','generate-job-test','ai_attempt','job_test_queue','content_health_fill'
]));

CREATE INDEX IF NOT EXISTS idx_content_items_topic_id_mcq ON public.content_items (topic_id) WHERE category = 'mcq' AND status = 'approved';
CREATE INDEX IF NOT EXISTS idx_content_items_topic_subject_lower ON public.content_items (lower(topic), lower(subject)) WHERE category = 'mcq' AND status = 'approved';

CREATE OR REPLACE FUNCTION public.get_autofill_queue(limit_count integer DEFAULT 20)
RETURNS TABLE (
  topic_id uuid,
  topic_name text,
  subject_id uuid,
  subject_name text,
  level_name text,
  system_name text,
  current_count bigint,
  questions_needed integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_threshold INTEGER;
  v_batch_size INTEGER;
  v_is_service BOOLEAN;
BEGIN
  v_is_service := (COALESCE(current_setting('request.jwt.claim.role', true), current_setting('role', true), '') = 'service_role')
                  OR (current_user = 'service_role')
                  OR (auth.uid() IS NULL AND current_setting('request.jwt.claims', true) IS NULL);

  IF NOT v_is_service AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  SELECT (value->>'min_threshold')::INTEGER, (value->>'batch_size')::INTEGER
  INTO v_threshold, v_batch_size
  FROM system_settings WHERE key = 'auto_fill_config';

  v_threshold := COALESCE(v_threshold, 10);
  v_batch_size := COALESCE(v_batch_size, 20);

  RETURN QUERY
  WITH approved AS (
    SELECT ci.topic_id, lower(ci.topic) AS topic_l, lower(ci.subject) AS subject_l
    FROM content_items ci
    WHERE ci.category = 'mcq' AND ci.status = 'approved'
  ),
  by_id AS (
    SELECT a.topic_id AS tid, count(*)::bigint AS c
    FROM approved a WHERE a.topic_id IS NOT NULL GROUP BY 1
  ),
  by_name AS (
    SELECT a.topic_l, a.subject_l, count(*)::bigint AS c
    FROM approved a WHERE a.topic_id IS NULL GROUP BY 1, 2
  ),
  counted AS (
    SELECT
      t.id AS tid, t.name::text AS tname,
      s.id AS sid, s.name::text AS sname,
      l.name::text AS lname, es.name::text AS esname,
      (COALESCE(bi.c, 0) + COALESCE(bn.c, 0))::bigint AS cnt
    FROM topics t
    LEFT JOIN subjects s ON t.subject_id = s.id
    LEFT JOIN levels l ON s.level_id = l.id
    LEFT JOIN educational_systems es ON l.system_id = es.id
    LEFT JOIN by_id bi ON bi.tid = t.id
    LEFT JOIN by_name bn ON bn.topic_l = lower(t.name) AND bn.subject_l = lower(s.name)
  )
  SELECT
    c.tid, c.tname, c.sid, c.sname, c.lname, c.esname,
    c.cnt,
    LEAST(v_batch_size, v_threshold - c.cnt::integer) AS questions_needed
  FROM counted c
  WHERE c.cnt < v_threshold
  ORDER BY
    CASE
      WHEN COALESCE(c.lname,'') || ' ' || COALESCE(c.esname,'') ILIKE '%MDCAT%' THEN 1
      WHEN COALESCE(c.esname,'') ILIKE '%Punjab%' OR COALESCE(c.esname,'') ILIKE '%Sindh Text%' THEN 2
      WHEN COALESCE(c.lname,'') ILIKE '%PPSC%' OR COALESCE(c.lname,'') ILIKE '%FPSC%' OR COALESCE(c.lname,'') ILIKE '%NTS%' THEN 3
      WHEN COALESCE(c.esname,'') ILIKE '%Competitive%' THEN 4
      WHEN COALESCE(c.esname,'') ILIKE '%Forces%' OR COALESCE(c.esname,'') ILIKE '%Federal Board%' THEN 5
      ELSE 6
    END,
    c.cnt ASC
  LIMIT limit_count;
END;
$function$;