
DROP FUNCTION IF EXISTS public.get_platform_stats();

CREATE OR REPLACE FUNCTION public.get_platform_stats()
  RETURNS TABLE(mcq_count bigint, subject_count bigint, test_count bigint, satisfaction_pct integer)
  LANGUAGE plpgsql
  STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_avg NUMERIC;
BEGIN
  SELECT AVG(rating)::NUMERIC INTO v_avg FROM public.user_ratings;
  
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM content_items WHERE category = 'mcq' AND status = 'approved')::BIGINT as mcq_count,
    (SELECT COUNT(*) FROM subjects)::BIGINT as subject_count,
    (SELECT COUNT(*) FROM test_attempts)::BIGINT as test_count,
    COALESCE(ROUND((v_avg / 5.0) * 100)::INTEGER, 98) as satisfaction_pct;
END;
$function$;
