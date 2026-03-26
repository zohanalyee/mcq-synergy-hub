
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can upsert empty topic analytics" ON public.empty_topic_analytics;
DROP POLICY IF EXISTS "Anyone can update empty topic analytics" ON public.empty_topic_analytics;

-- The tracking is done via the SECURITY DEFINER function increment_empty_topic_view(),
-- so direct INSERT/UPDATE by anon/authenticated is not needed.
-- Only allow inserts via authenticated or anon for initial record creation with restricted fields.
CREATE POLICY "Service can insert empty topic analytics"
ON public.empty_topic_analytics
FOR INSERT
TO anon, authenticated
WITH CHECK (
  view_count = 1
  AND page_path IS NOT NULL
  AND board_name IS NOT NULL
  AND subject_name IS NOT NULL
  AND topic_name IS NOT NULL
  AND class_number IS NOT NULL
);

-- Updates are handled by the SECURITY DEFINER function, but allow limited updates
CREATE POLICY "Service can update empty topic view count"
ON public.empty_topic_analytics
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (
  view_count = (SELECT eta.view_count FROM empty_topic_analytics eta WHERE eta.page_path = empty_topic_analytics.page_path) + 1
);
