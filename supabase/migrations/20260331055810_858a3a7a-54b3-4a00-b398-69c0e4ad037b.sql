
-- Fix the overly permissive contact_submissions INSERT policy
-- Replace WITH CHECK (true) with basic validation constraints
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;

CREATE POLICY "Anyone can submit contact form" ON public.contact_submissions
  FOR INSERT TO public
  WITH CHECK (
    name IS NOT NULL AND length(name) > 0 AND length(name) <= 200
    AND email IS NOT NULL AND length(email) > 0 AND length(email) <= 255
    AND message IS NOT NULL AND length(message) > 0 AND length(message) <= 5000
  );
