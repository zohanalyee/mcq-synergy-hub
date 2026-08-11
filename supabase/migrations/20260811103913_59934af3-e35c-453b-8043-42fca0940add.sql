CREATE OR REPLACE FUNCTION public.get_autofill_queue(limit_count integer DEFAULT 10)
 RETURNS TABLE(topic_id uuid, topic_name text, subject_id uuid, subject_name text, level_name text, system_name text, current_count bigint, questions_needed integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_threshold INTEGER;
  v_batch_size INTEGER;
  v_is_service BOOLEAN;
BEGIN
  -- Service role (scheduled edge functions) is always allowed.
  v_is_service := (COALESCE(current_setting('request.jwt.claim.role', true), current_setting('role', true), '') = 'service_role')
                  OR (current_user = 'service_role')
                  OR (auth.uid() IS NULL AND current_setting('request.jwt.claims', true) IS NULL);

  IF NOT v_is_service AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  SELECT
    (value->>'min_threshold')::INTEGER,
    (value->>'batch_size')::INTEGER
  INTO v_threshold, v_batch_size
  FROM system_settings WHERE key = 'auto_fill_config';

  v_threshold := COALESCE(v_threshold, 10);
  v_batch_size := COALESCE(v_batch_size, 20);

  RETURN QUERY
  SELECT
    t.id as topic_id,
    t.name::TEXT as topic_name,
    s.id as subject_id,
    s.name::TEXT as subject_name,
    l.name::TEXT as level_name,
    es.name::TEXT as system_name,
    COALESCE(COUNT(ci.id) FILTER (WHERE ci.category = 'mcq' AND ci.status = 'approved'), 0)::BIGINT as current_count,
    LEAST(v_batch_size, v_threshold - COALESCE(COUNT(ci.id) FILTER (WHERE ci.category = 'mcq' AND ci.status = 'approved'), 0)::INTEGER) as questions_needed
  FROM topics t
  LEFT JOIN subjects s ON t.subject_id = s.id
  LEFT JOIN levels l ON s.level_id = l.id
  LEFT JOIN educational_systems es ON l.system_id = es.id
  LEFT JOIN content_items ci ON (
    ci.topic_id = t.id
    OR (ci.topic_id IS NULL AND LOWER(ci.topic) = LOWER(t.name) AND LOWER(ci.subject) = LOWER(s.name))
  )
  GROUP BY t.id, t.name, s.id, s.name, l.name, es.name
  HAVING COALESCE(COUNT(ci.id) FILTER (WHERE ci.category = 'mcq' AND ci.status = 'approved'), 0) < v_threshold
  ORDER BY
    CASE
      WHEN COALESCE(l.name,'') || ' ' || COALESCE(es.name,'') ILIKE '%MDCAT%' THEN 1
      WHEN COALESCE(es.name,'') ILIKE '%Punjab%' OR COALESCE(es.name,'') ILIKE '%Sindh Text%' THEN 2
      WHEN COALESCE(l.name,'') ILIKE '%PPSC%' OR COALESCE(l.name,'') ILIKE '%FPSC%' OR COALESCE(l.name,'') ILIKE '%NTS%' THEN 3
      WHEN COALESCE(es.name,'') ILIKE '%Competitive%' THEN 4
      WHEN COALESCE(es.name,'') ILIKE '%Forces%' OR COALESCE(es.name,'') ILIKE '%Federal Board%' THEN 5
      ELSE 6
    END,
    COALESCE(COUNT(ci.id) FILTER (WHERE ci.category = 'mcq' AND ci.status = 'approved'), 0) ASC
  LIMIT limit_count;
END;
$function$;