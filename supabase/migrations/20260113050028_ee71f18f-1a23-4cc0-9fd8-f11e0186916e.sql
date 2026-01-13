-- Create RPC function for content inventory stats (bypasses 1000-row limit)
CREATE OR REPLACE FUNCTION public.get_content_inventory_stats()
RETURNS TABLE (
  subject TEXT,
  topic TEXT,
  approved_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(ci.subject, 'Uncategorized')::TEXT as subject,
    COALESCE(ci.topic, 'General')::TEXT as topic,
    COUNT(*)::BIGINT as approved_count
  FROM content_items ci
  WHERE ci.category = 'mcq' AND ci.status = 'approved'
  GROUP BY ci.subject, ci.topic
  ORDER BY ci.subject, ci.topic;
END;
$$;