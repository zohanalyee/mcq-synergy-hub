-- Add admin authorization checks to all analytics functions

-- 1. get_daily_activity_stats - Add admin check
CREATE OR REPLACE FUNCTION public.get_daily_activity_stats(days_back integer DEFAULT 365)
 RETURNS TABLE(activity_date date, user_count bigint, test_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Verify caller is an admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    DATE(ta.created_at) as activity_date,
    COUNT(DISTINCT ta.user_id) as user_count,
    COUNT(*) as test_count
  FROM test_attempts ta
  WHERE ta.created_at >= (CURRENT_DATE - days_back)
  GROUP BY DATE(ta.created_at)
  ORDER BY activity_date DESC;
END;
$function$;

-- 2. get_hourly_activity_distribution - Add admin check
CREATE OR REPLACE FUNCTION public.get_hourly_activity_distribution()
 RETURNS TABLE(hour_of_day integer, test_count bigint, user_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Verify caller is an admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    EXTRACT(HOUR FROM ta.created_at)::INT as hour_of_day,
    COUNT(*) as test_count,
    COUNT(DISTINCT ta.user_id) as user_count
  FROM test_attempts ta
  WHERE ta.created_at >= (CURRENT_DATE - 30)
  GROUP BY EXTRACT(HOUR FROM ta.created_at)
  ORDER BY hour_of_day;
END;
$function$;

-- 3. get_user_retention_stats - Add admin check
CREATE OR REPLACE FUNCTION public.get_user_retention_stats()
 RETURNS TABLE(total_users bigint, active_users bigint, bounce_rate numeric, avg_session_time numeric, total_tests bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total_users BIGINT;
  v_active_users BIGINT;
  v_bounce_rate NUMERIC;
  v_avg_session_time NUMERIC;
  v_total_tests BIGINT;
BEGIN
  -- Verify caller is an admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  SELECT COUNT(*) INTO v_total_users FROM profiles;
  SELECT COUNT(DISTINCT user_id) INTO v_active_users FROM test_attempts;
  
  IF v_total_users > 0 THEN
    v_bounce_rate := ROUND(((v_total_users - v_active_users)::NUMERIC / v_total_users) * 100, 2);
  ELSE
    v_bounce_rate := 0;
  END IF;
  
  SELECT COALESCE(AVG(time_taken), 0) INTO v_avg_session_time FROM test_attempts WHERE time_taken IS NOT NULL;
  SELECT COUNT(*) INTO v_total_tests FROM test_attempts;
  
  RETURN QUERY SELECT v_total_users, v_active_users, v_bounce_rate, v_avg_session_time, v_total_tests;
END;
$function$;

-- 4. get_power_users - Add admin check
CREATE OR REPLACE FUNCTION public.get_power_users(limit_count integer DEFAULT 10)
 RETURNS TABLE(user_id uuid, username text, total_tests bigint, total_time_spent bigint, avg_score numeric, last_active timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Verify caller is an admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    ta.user_id,
    COALESCE(p.username, 'Anonymous') as username,
    COUNT(*) as total_tests,
    COALESCE(SUM(ta.time_taken), 0) as total_time_spent,
    ROUND(AVG((ta.score::NUMERIC / NULLIF(ta.total_questions, 0)) * 100), 1) as avg_score,
    MAX(ta.created_at) as last_active
  FROM test_attempts ta
  LEFT JOIN profiles p ON ta.user_id = p.id
  WHERE ta.user_id IS NOT NULL
  GROUP BY ta.user_id, p.username
  ORDER BY total_tests DESC, total_time_spent DESC
  LIMIT limit_count;
END;
$function$;

-- 5. get_recently_active_users - Add admin check
CREATE OR REPLACE FUNCTION public.get_recently_active_users(minutes_ago integer DEFAULT 15)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  active_count BIGINT;
BEGIN
  -- Verify caller is an admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  SELECT COUNT(DISTINCT user_id) INTO active_count
  FROM test_attempts
  WHERE created_at >= (NOW() - (minutes_ago || ' minutes')::INTERVAL);
  
  RETURN active_count;
END;
$function$;