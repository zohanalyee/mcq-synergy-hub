-- Create the global context search RPC function
CREATE OR REPLACE FUNCTION public.global_context_search(
  search_query TEXT,
  result_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  result_type TEXT,
  id UUID,
  name TEXT,
  subject_id UUID,
  subject_name TEXT,
  level_id UUID,
  level_name TEXT,
  system_id UUID,
  system_name TEXT,
  system_type TEXT,
  topic_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  -- Search subjects with full hierarchy
  SELECT 
    'subject'::TEXT as result_type,
    s.id,
    s.name::TEXT,
    s.id as subject_id,
    s.name::TEXT as subject_name,
    l.id as level_id,
    l.name::TEXT as level_name,
    es.id as system_id,
    es.name::TEXT as system_name,
    es.type::TEXT as system_type,
    (SELECT COUNT(*) FROM topics t WHERE t.subject_id = s.id)::BIGINT as topic_count
  FROM subjects s
  INNER JOIN levels l ON s.level_id = l.id
  INNER JOIN educational_systems es ON l.system_id = es.id
  WHERE 
    es.is_active = true
    AND s.name ILIKE '%' || search_query || '%'
  
  UNION ALL
  
  -- Search topics with full hierarchy
  SELECT 
    'topic'::TEXT as result_type,
    t.id,
    t.name::TEXT,
    s.id as subject_id,
    s.name::TEXT as subject_name,
    l.id as level_id,
    l.name::TEXT as level_name,
    es.id as system_id,
    es.name::TEXT as system_name,
    es.type::TEXT as system_type,
    0::BIGINT as topic_count
  FROM topics t
  INNER JOIN subjects s ON t.subject_id = s.id
  INNER JOIN levels l ON s.level_id = l.id
  INNER JOIN educational_systems es ON l.system_id = es.id
  WHERE 
    es.is_active = true
    AND t.name ILIKE '%' || search_query || '%'
  
  ORDER BY result_type ASC, name ASC
  LIMIT result_limit;
END;
$$;