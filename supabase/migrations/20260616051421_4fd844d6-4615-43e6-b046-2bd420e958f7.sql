-- Allow public (guests + Googlebot) to read reviews/testimonials
CREATE POLICY "Public can view feedback reviews"
ON public.user_feedback
FOR SELECT
TO anon, authenticated
USING (true);

-- Ensure the Data API can read for anon role
GRANT SELECT ON public.user_feedback TO anon;