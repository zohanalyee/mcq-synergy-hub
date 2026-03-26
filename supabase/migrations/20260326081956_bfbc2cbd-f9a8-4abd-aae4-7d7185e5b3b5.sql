
CREATE OR REPLACE FUNCTION public.increment_empty_topic_view(p_path text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE empty_topic_analytics
  SET view_count = view_count + 1, last_viewed_at = now()
  WHERE page_path = p_path;
END;
$$;
