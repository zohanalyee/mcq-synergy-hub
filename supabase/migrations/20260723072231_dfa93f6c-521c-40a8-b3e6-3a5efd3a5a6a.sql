CREATE OR REPLACE FUNCTION public.record_question_usage(question_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF question_ids IS NULL OR array_length(question_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  -- Bump content_items MCQ rows that match
  UPDATE public.content_items
  SET usage_count = COALESCE(usage_count, 0) + 1,
      last_used_at = now()
  WHERE id = ANY(question_ids)
    AND category = 'mcq';

  -- Bump job_test_questions rows that match (dual-source)
  UPDATE public.job_test_questions
  SET usage_count = COALESCE(usage_count, 0) + 1,
      last_used_at = now()
  WHERE id = ANY(question_ids);
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_question_usage(uuid[]) TO anon, authenticated, service_role;