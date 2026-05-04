CREATE POLICY "Anyone can view published job test definitions"
ON public.job_test_definitions
FOR SELECT
TO anon, authenticated
USING (status = 'published');

CREATE POLICY "Anyone can view approved questions of published tests"
ON public.job_test_questions
FOR SELECT
TO anon, authenticated
USING (
  admin_approved = true
  AND EXISTS (
    SELECT 1
    FROM public.job_test_definitions d
    WHERE d.id = job_test_questions.job_test_id
      AND d.status = 'published'
  )
);