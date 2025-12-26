-- Function 1: Get daily activity stats for heatmap (last 365 days)
CREATE OR REPLACE FUNCTION get_daily_activity_stats(days_back INT DEFAULT 365)
RETURNS TABLE(activity_date DATE, user_count BIGINT, test_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
$$;

-- Function 2: Get hourly activity distribution
CREATE OR REPLACE FUNCTION get_hourly_activity_distribution()
RETURNS TABLE(hour_of_day INT, test_count BIGINT, user_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(HOUR FROM ta.created_at)::INT as hour_of_day,
    COUNT(*) as test_count,
    COUNT(DISTINCT ta.user_id) as user_count
  FROM test_attempts ta
  WHERE ta.created_at >= (CURRENT_DATE - 30) -- Last 30 days for peak hours
  GROUP BY EXTRACT(HOUR FROM ta.created_at)
  ORDER BY hour_of_day;
END;
$$;

-- Function 3: Get user retention stats (bounce rate, power users)
CREATE OR REPLACE FUNCTION get_user_retention_stats()
RETURNS TABLE(
  total_users BIGINT,
  active_users BIGINT,
  bounce_rate NUMERIC,
  avg_session_time NUMERIC,
  total_tests BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_users BIGINT;
  v_active_users BIGINT;
  v_bounce_rate NUMERIC;
  v_avg_session_time NUMERIC;
  v_total_tests BIGINT;
BEGIN
  -- Total users from profiles
  SELECT COUNT(*) INTO v_total_users FROM profiles;
  
  -- Active users (users who have taken at least one test)
  SELECT COUNT(DISTINCT user_id) INTO v_active_users FROM test_attempts;
  
  -- Bounce rate (users who never took a test)
  IF v_total_users > 0 THEN
    v_bounce_rate := ROUND(((v_total_users - v_active_users)::NUMERIC / v_total_users) * 100, 2);
  ELSE
    v_bounce_rate := 0;
  END IF;
  
  -- Average session time in seconds
  SELECT COALESCE(AVG(time_taken), 0) INTO v_avg_session_time FROM test_attempts WHERE time_taken IS NOT NULL;
  
  -- Total tests
  SELECT COUNT(*) INTO v_total_tests FROM test_attempts;
  
  RETURN QUERY SELECT v_total_users, v_active_users, v_bounce_rate, v_avg_session_time, v_total_tests;
END;
$$;

-- Function 4: Get power users (top users by activity)
CREATE OR REPLACE FUNCTION get_power_users(limit_count INT DEFAULT 10)
RETURNS TABLE(
  user_id UUID,
  username TEXT,
  total_tests BIGINT,
  total_time_spent BIGINT,
  avg_score NUMERIC,
  last_active TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
$$;

-- Function 5: Get recently active users (for "online now" estimate)
CREATE OR REPLACE FUNCTION get_recently_active_users(minutes_ago INT DEFAULT 15)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_count BIGINT;
BEGIN
  SELECT COUNT(DISTINCT user_id) INTO active_count
  FROM test_attempts
  WHERE created_at >= (NOW() - (minutes_ago || ' minutes')::INTERVAL);
  
  RETURN active_count;
END;
$$;