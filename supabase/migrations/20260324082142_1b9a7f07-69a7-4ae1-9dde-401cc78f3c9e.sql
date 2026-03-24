-- Fix 1: Set search_path on functions missing it

-- get_platform_stats (SECURITY DEFINER, missing search_path)
CREATE OR REPLACE FUNCTION public.get_platform_stats()
 RETURNS TABLE(mcq_count bigint, subject_count bigint, test_count bigint, satisfaction_pct numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY SELECT
    (SELECT COUNT(*) FROM content_items)::bigint as mcq_count,
    (SELECT COUNT(*) FROM subjects)::bigint as subject_count,
    (SELECT COUNT(*) FROM test_attempts)::bigint as test_count,
    COALESCE((SELECT ROUND(AVG(rating) * 20) FROM user_ratings), 98)::numeric as satisfaction_pct;
END;
$function$;

-- validate_user_feedback (trigger function, missing search_path)
CREATE OR REPLACE FUNCTION public.validate_user_feedback()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.stars < 1 OR NEW.stars > 5 THEN
    RAISE EXCEPTION 'Stars must be between 1 and 5';
  END IF;
  IF NEW.category NOT IN ('Content', 'Design', 'Technical', 'Other') THEN
    RAISE EXCEPTION 'Invalid category';
  END IF;
  IF NEW.status NOT IN ('new', 'reviewed', 'addressed', 'archived') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix 2: Tighten permissive RLS policies with WITH CHECK (true)

-- user_inquiries: keep public but validate required fields are non-empty
DROP POLICY IF EXISTS "Anyone can submit inquiry" ON user_inquiries;
CREATE POLICY "Anyone can submit inquiry with validation" ON user_inquiries
  FOR INSERT TO public
  WITH CHECK (
    name IS NOT NULL AND name != '' AND length(name) <= 200
    AND email IS NOT NULL AND email != '' AND length(email) <= 255
    AND subject IS NOT NULL AND subject != '' AND length(subject) <= 500
    AND message IS NOT NULL AND message != '' AND length(message) <= 5000
  );

-- user_ratings: require authentication and user_id match
DROP POLICY IF EXISTS "Anyone can insert ratings" ON user_ratings;
CREATE POLICY "Authenticated users can insert own ratings" ON user_ratings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);