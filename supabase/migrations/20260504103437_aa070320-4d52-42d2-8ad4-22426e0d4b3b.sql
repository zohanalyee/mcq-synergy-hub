
-- Allow content submitters to view their own submissions (status, rejection_reason)
CREATE POLICY "Users can view own content submissions"
ON public.content_submissions
FOR SELECT
TO authenticated
USING (auth.uid() = created_by);

-- Restrict user_ratings reads to the rating's owner only.
-- Public/aggregate stats are served via the SECURITY DEFINER RPC public.get_platform_stats().
DROP POLICY IF EXISTS "Authenticated users can read ratings" ON public.user_ratings;

CREATE POLICY "Users can view their own ratings"
ON public.user_ratings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Ensure job_test_progress has owner-scoped INSERT/UPDATE policies so authenticated
-- users can record their own progress without needing service-role writes.
CREATE POLICY "Users insert own job_test_progress"
ON public.job_test_progress
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users update own job_test_progress"
ON public.job_test_progress
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
