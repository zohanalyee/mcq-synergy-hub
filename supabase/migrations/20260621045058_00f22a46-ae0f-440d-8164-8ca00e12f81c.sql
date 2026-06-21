
DROP FUNCTION IF EXISTS public.get_practice_questions(text[],text[],text[],text[],uuid[],text,boolean,integer);

CREATE OR REPLACE FUNCTION public.get_practice_questions(
  p_subjects     text[]  DEFAULT NULL,
  p_topics       text[]  DEFAULT NULL,
  p_topic_ids    uuid[]  DEFAULT NULL,
  p_subtopics    text[]  DEFAULT NULL,
  p_difficulties text[]  DEFAULT NULL,
  p_exclude_ids  uuid[]  DEFAULT NULL,
  p_exam_category text   DEFAULT NULL,
  p_is_featured  boolean DEFAULT NULL,
  p_subject_like text    DEFAULT NULL,
  p_limit        integer DEFAULT 60
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  options jsonb,
  subject text,
  topic text,
  subtopic text,
  topic_id uuid,
  difficulty text,
  question_type text,
  reference_material text,
  tags jsonb,
  usage_count integer,
  last_used_at timestamptz,
  is_featured boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    ci.id,
    ci.title::text,
    ci.description::text,
    ci.options,
    ci.subject::text,
    ci.topic::text,
    ci.subtopic::text,
    ci.topic_id,
    ci.difficulty::text,
    ci.question_type::text,
    ci.reference_material::text,
    to_jsonb(ci.tags) AS tags,
    ci.usage_count,
    ci.last_used_at,
    ci.is_featured,
    ci.created_at
  FROM public.content_items ci
  WHERE ci.category = 'mcq'
    AND ci.status = 'approved'
    AND ci.question_type = 'mcq'
    AND (ci.quality_grade IN ('A','B','C') OR ci.quality_grade IS NULL)
    AND (p_subjects     IS NULL OR array_length(p_subjects,1)     IS NULL OR ci.subject    = ANY(p_subjects))
    AND (p_topics       IS NULL OR array_length(p_topics,1)       IS NULL OR ci.topic      = ANY(p_topics))
    AND (p_topic_ids    IS NULL OR array_length(p_topic_ids,1)    IS NULL OR ci.topic_id   = ANY(p_topic_ids))
    AND (p_subtopics    IS NULL OR array_length(p_subtopics,1)    IS NULL OR ci.subtopic   = ANY(p_subtopics))
    AND (p_difficulties IS NULL OR array_length(p_difficulties,1) IS NULL OR ci.difficulty = ANY(p_difficulties))
    AND (p_is_featured  IS NULL OR ci.is_featured = p_is_featured)
    AND (p_subject_like IS NULL OR ci.subject ILIKE '%' || p_subject_like || '%')
    AND (p_exam_category IS NULL OR ci.exam_category = p_exam_category OR ci.exam_category IS NULL)
    AND (p_exclude_ids  IS NULL OR array_length(p_exclude_ids,1)  IS NULL OR NOT (ci.id = ANY(p_exclude_ids)))
  ORDER BY
    ci.is_featured DESC,
    ci.quality_grade ASC NULLS LAST,
    ci.usage_count ASC NULLS FIRST,
    ci.last_used_at ASC NULLS FIRST,
    ci.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 60), 500));
$$;

GRANT EXECUTE ON FUNCTION public.get_practice_questions(text[],text[],uuid[],text[],text[],uuid[],text,boolean,text,integer) TO anon, authenticated;
