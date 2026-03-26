
CREATE TABLE public.empty_topic_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_name text NOT NULL,
  subject_name text NOT NULL,
  topic_name text NOT NULL,
  class_number text NOT NULL,
  page_path text NOT NULL UNIQUE,
  view_count integer NOT NULL DEFAULT 1,
  last_viewed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.empty_topic_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view empty topic analytics" ON public.empty_topic_analytics
  FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "Anyone can upsert empty topic analytics" ON public.empty_topic_analytics
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can update empty topic analytics" ON public.empty_topic_analytics
  FOR UPDATE TO anon, authenticated USING (true);
