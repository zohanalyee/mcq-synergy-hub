
-- Remove the UPDATE policy since increment_empty_topic_view() uses SECURITY DEFINER and bypasses RLS
DROP POLICY IF EXISTS "Service can update empty topic view count" ON public.empty_topic_analytics;
