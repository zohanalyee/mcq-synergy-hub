
-- Add canonical_topic_name column
ALTER TABLE public.content_items 
ADD COLUMN IF NOT EXISTS canonical_topic_name TEXT;

-- Create index for fast lookups on approved MCQs
CREATE INDEX IF NOT EXISTS idx_content_items_canonical_topic 
ON public.content_items(canonical_topic_name) 
WHERE status = 'approved' AND category = 'mcq';

-- Backfill existing data
UPDATE public.content_items
SET canonical_topic_name = LOWER(REGEXP_REPLACE(topic, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE topic IS NOT NULL AND canonical_topic_name IS NULL;

-- Create get_topic_inventory RPC function
CREATE OR REPLACE FUNCTION public.get_topic_inventory(
  board_filter TEXT DEFAULT 'all',
  class_filter TEXT DEFAULT 'all',
  subject_filter TEXT DEFAULT 'all'
)
RETURNS TABLE (
  canonical_name TEXT,
  display_name TEXT,
  subject_name TEXT,
  board_count BIGINT,
  board_names TEXT[],
  total_questions BIGINT,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify caller is an admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  WITH topic_stats AS (
    SELECT 
      LOWER(REGEXP_REPLACE(t.name, '[^a-zA-Z0-9]+', '-', 'g')) as canonical,
      t.name as t_display,
      s.name as s_name,
      es.name as board,
      COUNT(DISTINCT ci.id) as q_count
    FROM topics t
    JOIN subjects s ON t.subject_id = s.id
    JOIN levels l ON s.level_id = l.id
    JOIN educational_systems es ON l.system_id = es.id
    LEFT JOIN content_items ci ON (
      ci.topic_id = t.id 
      OR (ci.canonical_topic_name = LOWER(REGEXP_REPLACE(t.name, '[^a-zA-Z0-9]+', '-', 'g'))
          AND ci.topic_id IS NULL)
    ) AND ci.status = 'approved' AND ci.category = 'mcq'
    WHERE 
      es.is_active = true
      AND (board_filter = 'all' OR es.id::TEXT = board_filter)
      AND (class_filter = 'all' OR l.id::TEXT = class_filter)
      AND (subject_filter = 'all' OR s.id::TEXT = subject_filter)
    GROUP BY LOWER(REGEXP_REPLACE(t.name, '[^a-zA-Z0-9]+', '-', 'g')), t.name, s.name, es.name
  )
  SELECT 
    ts.canonical,
    MAX(ts.t_display)::TEXT as display_name,
    MAX(ts.s_name)::TEXT as subject_name,
    COUNT(DISTINCT ts.board)::BIGINT as board_count,
    ARRAY_AGG(DISTINCT ts.board)::TEXT[] as board_names,
    SUM(ts.q_count)::BIGINT as total_questions,
    CASE 
      WHEN SUM(ts.q_count) >= 100 THEN 'good'
      WHEN SUM(ts.q_count) >= 50 THEN 'low'
      ELSE 'empty'
    END::TEXT as status
  FROM topic_stats ts
  GROUP BY ts.canonical
  ORDER BY SUM(ts.q_count) ASC, ts.canonical;
END;
$$;
