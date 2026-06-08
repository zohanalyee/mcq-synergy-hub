CREATE OR REPLACE FUNCTION public.record_question_usage(question_ids uuid[])
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.content_items
  SET usage_count = COALESCE(usage_count, 0) + 1,
      last_used_at = now()
  WHERE id = ANY(question_ids)
    AND category = 'mcq';
$$;

GRANT EXECUTE ON FUNCTION public.record_question_usage(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_question_usage(uuid[]) TO anon;