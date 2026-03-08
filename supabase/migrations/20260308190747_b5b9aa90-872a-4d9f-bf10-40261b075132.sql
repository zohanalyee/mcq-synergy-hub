
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS TABLE(mcq_count bigint, subject_count bigint, test_count bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM content_items WHERE category = 'mcq' AND status = 'approved')::BIGINT as mcq_count,
    (SELECT COUNT(*) FROM subjects)::BIGINT as subject_count,
    (SELECT COUNT(*) FROM test_attempts)::BIGINT as test_count;
END;
$$;
