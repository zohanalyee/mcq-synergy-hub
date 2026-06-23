CREATE OR REPLACE FUNCTION public.get_indexable_board_topic_paths(p_min_approved_mcqs integer DEFAULT 5)
RETURNS TABLE(
  path text,
  lastmod date,
  approved_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH board_topics AS (
    SELECT
      t.id AS topic_id,
      t.name AS topic_name,
      s.name AS subject_name,
      l.name AS level_name,
      es.name AS system_name,
      substring(l.name FROM '(\d+)') AS class_number
    FROM public.topics t
    JOIN public.subjects s ON s.id = t.subject_id
    JOIN public.levels l ON l.id = s.level_id
    JOIN public.educational_systems es ON es.id = l.system_id
    WHERE es.is_active = true
  ), topic_counts AS (
    SELECT
      bt.topic_id,
      COUNT(ci.id)::bigint AS approved_count,
      COALESCE(MAX(ci.updated_at)::date, CURRENT_DATE) AS lastmod
    FROM board_topics bt
    JOIN public.content_items ci
      ON ci.category = 'mcq'
     AND ci.status = 'approved'
     AND (
       ci.topic_id = bt.topic_id
       OR (
         ci.topic_id IS NULL
         AND ci.canonical_topic_name = lower(regexp_replace(bt.topic_name, '[^a-zA-Z0-9]+', '-', 'g'))
       )
     )
    GROUP BY bt.topic_id
  )
  SELECT
    '/boards/' ||
      lower(regexp_replace(bt.system_name, '[^a-zA-Z0-9]+', '-', 'g')) ||
      '/class-' || bt.class_number ||
      '/' || lower(regexp_replace(bt.subject_name, '[^a-zA-Z0-9]+', '-', 'g')) ||
      '/' || lower(regexp_replace(bt.topic_name, '[^a-zA-Z0-9]+', '-', 'g')) AS path,
    tc.lastmod,
    tc.approved_count
  FROM board_topics bt
  JOIN topic_counts tc ON tc.topic_id = bt.topic_id
  WHERE bt.class_number IS NOT NULL
    AND tc.approved_count >= GREATEST(1, COALESCE(p_min_approved_mcqs, 5))
  ORDER BY path;
$$;

GRANT EXECUTE ON FUNCTION public.get_indexable_board_topic_paths(integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_indexable_board_topic_paths(integer) TO service_role;