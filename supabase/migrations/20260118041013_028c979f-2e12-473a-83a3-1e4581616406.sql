-- Create backfill_topic_ids function to link existing content_items to LMS topics
CREATE OR REPLACE FUNCTION backfill_topic_ids()
RETURNS TABLE(updated_count INTEGER, matched_topics TEXT[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INTEGER := 0;
  v_matched TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can run backfill';
  END IF;

  -- Update content_items where topic_id is NULL
  -- Match by topic name = topics.name AND subject = subjects.name
  WITH matches AS (
    UPDATE content_items ci
    SET topic_id = t.id
    FROM topics t
    JOIN subjects s ON t.subject_id = s.id
    WHERE ci.topic_id IS NULL
      AND ci.category = 'mcq'
      AND (
        lower(trim(ci.topic)) = lower(trim(t.name))
        OR ci.topic ILIKE '%' || t.name || '%'
      )
      AND (
        lower(trim(ci.subject)) = lower(trim(s.name))
        OR ci.subject ILIKE '%' || s.name || '%'
      )
    RETURNING ci.id, t.name AS topic_name
  )
  SELECT 
    COALESCE(COUNT(*)::INTEGER, 0),
    COALESCE(ARRAY_AGG(DISTINCT topic_name), ARRAY[]::TEXT[])
  INTO v_updated, v_matched
  FROM matches;
  
  RETURN QUERY SELECT v_updated, v_matched;
END;
$$;

-- Grant execute permission to authenticated users (admin check is in function)
GRANT EXECUTE ON FUNCTION backfill_topic_ids() TO authenticated;