
-- Fix user_feedback RLS: restrict INSERT to prevent identity spoofing

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can submit feedback" ON user_feedback;

-- Allow authenticated users to submit feedback under their own identity only
CREATE POLICY "Authenticated users submit own feedback" ON user_feedback
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow guest feedback (no user_id, must be marked as guest)
CREATE POLICY "Guest feedback allowed" ON user_feedback
  FOR INSERT TO public
  WITH CHECK (is_guest = true AND user_id IS NULL);

-- Restrict public SELECT to exclude sensitive columns by using a more targeted policy
-- Keep public read for the Reviews page but exclude admin_notes exposure
-- The public SELECT policy with USING(true) is needed for the public Reviews page
-- but we should ensure admin_notes are only visible to admins
-- (Column-level security isn't available via RLS, so we rely on the app not selecting admin_notes publicly)
