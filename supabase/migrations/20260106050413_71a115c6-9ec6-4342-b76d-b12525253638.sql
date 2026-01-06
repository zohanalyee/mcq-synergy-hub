-- Fix 1: Add INSERT policy for profiles table
-- This provides a fallback mechanism if the handle_new_user trigger fails
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Fix 2: Fix get_student_weaknesses function to include search_path
CREATE OR REPLACE FUNCTION public.get_student_weaknesses(target_user_id uuid)
RETURNS TABLE(subject text, average_score numeric, tests_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s AS subject,
    ROUND(AVG((score::numeric / total_questions::numeric) * 100), 2) as average_score,
    COUNT(*) as tests_count
  FROM test_attempts, unnest(subjects) s
  WHERE user_id = target_user_id
  GROUP BY s
  HAVING AVG((score::numeric / total_questions::numeric) * 100) < 50;
END;
$$;