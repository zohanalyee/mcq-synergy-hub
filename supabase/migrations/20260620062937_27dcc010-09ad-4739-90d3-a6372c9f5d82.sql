-- content_items: restrict public approved-read to authenticated users only
DROP POLICY IF EXISTS "Anyone can view approved content" ON public.content_items;
CREATE POLICY "Authenticated users can view approved content"
ON public.content_items
FOR SELECT
TO authenticated
USING (status = 'approved');

-- job_test_questions: remove anon access; keep authenticated-only policy
DROP POLICY IF EXISTS "Anyone can view approved questions of published tests" ON public.job_test_questions;
