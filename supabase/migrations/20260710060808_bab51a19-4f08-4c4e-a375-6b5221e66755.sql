CREATE OR REPLACE FUNCTION public.get_board_topic_mcqs(p_topic_id uuid DEFAULT NULL::uuid, p_canonical_slug text DEFAULT NULL::text, p_limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, title text, options jsonb, correct_option text, explanation text, difficulty text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    ci.id,
    ci.title::text,
    ci.options,
    ci.correct_option::text,
    ci.explanation::text,
    ci.difficulty::text
  FROM public.content_items ci
  WHERE ci.category = 'mcq'
    AND ci.status = 'approved'
    AND (
      (p_topic_id IS NOT NULL AND ci.topic_id = p_topic_id)
      OR (p_canonical_slug IS NOT NULL AND ci.canonical_topic_name = p_canonical_slug)
    )
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 200));
$function$;

GRANT EXECUTE ON FUNCTION public.get_board_topic_mcqs(uuid, text, integer) TO anon, authenticated, service_role;