
-- Fix 1: Restrict user_ratings SELECT to exclude user_id from public reads
-- Drop the overly permissive "Anyone can read ratings" policy
DROP POLICY IF EXISTS "Anyone can read ratings" ON public.user_ratings;

-- Allow public to read only rating values (not user_id) via RPC (get_platform_stats already does this)
-- For direct table access, restrict to authenticated users or admins
CREATE POLICY "Authenticated users can read ratings" ON public.user_ratings
  FOR SELECT TO authenticated
  USING (true);

-- Fix 2: Add INSERT policy for contact_submissions (allow anyone to submit)
CREATE POLICY "Anyone can submit contact form" ON public.contact_submissions
  FOR INSERT TO public
  WITH CHECK (true);
