
-- ============================================================
-- Secure practice-question delivery + server-side scoring.
-- Guests (and authenticated users) read approved questions WITHOUT
-- correct answers/explanations via these SECURITY DEFINER RPCs, and
-- answers are checked server-side at submission time. This restores
-- guest practice without exposing the answer key via the direct API.
-- ============================================================

-- 1) Answer-free practice questions from the MCQ bank (content_items)
CREATE OR REPLACE FUNCTION public.get_practice_questions(
  p_subjects     text[]  DEFAULT NULL,
  p_topics       text[]  DEFAULT NULL,
  p_subtopics    text[]  DEFAULT NULL,
  p_difficulties text[]  DEFAULT NULL,
  p_exclude_ids  uuid[]  DEFAULT NULL,
  p_exam_category text   DEFAULT NULL,
  p_is_featured  boolean DEFAULT NULL,
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
    AND (p_subtopics    IS NULL OR array_length(p_subtopics,1)    IS NULL OR ci.subtopic   = ANY(p_subtopics))
    AND (p_difficulties IS NULL OR array_length(p_difficulties,1) IS NULL OR ci.difficulty = ANY(p_difficulties))
    AND (p_is_featured  IS NULL OR ci.is_featured = p_is_featured)
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

-- 2) Answer-free preview questions matched by fuzzy keyword (ilike) for mock-test previews
CREATE OR REPLACE FUNCTION public.get_preview_questions(
  p_keywords text[],
  p_limit    integer DEFAULT 30
)
RETURNS TABLE(
  id uuid,
  title text,
  options jsonb,
  subject text,
  topic text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pattern text;
BEGIN
  IF p_keywords IS NULL OR array_length(p_keywords,1) IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT ci.id, ci.title::text, ci.options, ci.subject::text, ci.topic::text
  FROM public.content_items ci
  WHERE ci.category = 'mcq'
    AND ci.status = 'approved'
    AND EXISTS (
      SELECT 1 FROM unnest(p_keywords) kw
      WHERE ci.subject ILIKE '%' || kw || '%'
         OR ci.topic   ILIKE '%' || kw || '%'
    )
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 30), 200));
END;
$$;

-- 3) Answer-free approved questions for a job test definition
CREATE OR REPLACE FUNCTION public.get_job_practice_questions(
  p_job_test_id uuid,
  p_subject     text    DEFAULT NULL,
  p_limit       integer DEFAULT 500
)
RETURNS TABLE(
  id uuid,
  job_test_id uuid,
  subject text,
  topic text,
  question text,
  options jsonb,
  difficulty text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    q.id,
    q.job_test_id,
    q.subject::text,
    q.topic::text,
    q.question::text,
    q.options,
    q.difficulty::text
  FROM public.job_test_questions q
  WHERE q.job_test_id = p_job_test_id
    AND q.admin_approved = true
    AND (p_subject IS NULL OR q.subject = p_subject)
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 500), 2000));
$$;

-- 4) Server-side scoring for MCQ-bank questions.
-- Input: jsonb array of {"id": uuid, "answer": "<option text or letter>"}.
-- Returns correctness + the correct answer/explanation ONLY after submission.
CREATE OR REPLACE FUNCTION public.score_practice_answers(p_answers jsonb)
RETURNS TABLE(
  id uuid,
  correct_option text,
  correct_answer text,
  explanation text,
  is_correct boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH submitted AS (
    SELECT (a->>'id')::uuid AS qid, COALESCE(a->>'answer','') AS ans
    FROM jsonb_array_elements(COALESCE(p_answers, '[]'::jsonb)) a
    WHERE (a->>'id') IS NOT NULL
  )
  SELECT
    ci.id,
    ci.correct_option::text AS correct_option,
    COALESCE(
      CASE
        WHEN upper(trim(ci.correct_option)) IN ('A','B','C','D')
          THEN ci.options->>upper(trim(ci.correct_option))
        ELSE ci.correct_option
      END,
      ci.correct_option
    )::text AS correct_answer,
    ci.explanation::text AS explanation,
    (
      lower(trim(s.ans)) = lower(trim(COALESCE(ci.correct_option,'')))
      OR lower(trim(s.ans)) = lower(trim(COALESCE(
           CASE
             WHEN upper(trim(ci.correct_option)) IN ('A','B','C','D')
               THEN ci.options->>upper(trim(ci.correct_option))
             ELSE ci.correct_option
           END, '')))
    ) AS is_correct
  FROM submitted s
  JOIN public.content_items ci ON ci.id = s.qid
  WHERE ci.category = 'mcq' AND ci.status = 'approved';
$$;

-- 5) Server-side scoring for job-test questions.
CREATE OR REPLACE FUNCTION public.score_job_practice_answers(p_answers jsonb)
RETURNS TABLE(
  id uuid,
  correct_option text,
  correct_answer text,
  explanation text,
  is_correct boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH submitted AS (
    SELECT (a->>'id')::uuid AS qid, COALESCE(a->>'answer','') AS ans
    FROM jsonb_array_elements(COALESCE(p_answers, '[]'::jsonb)) a
    WHERE (a->>'id') IS NOT NULL
  )
  SELECT
    q.id,
    q.correct_answer::text AS correct_option,
    COALESCE(
      CASE
        WHEN upper(trim(q.correct_answer)) IN ('A','B','C','D')
          THEN q.options->>upper(trim(q.correct_answer))
        ELSE q.correct_answer
      END,
      q.correct_answer
    )::text AS correct_answer,
    q.explanation::text AS explanation,
    (
      lower(trim(s.ans)) = lower(trim(COALESCE(q.correct_answer,'')))
      OR lower(trim(s.ans)) = lower(trim(COALESCE(
           CASE
             WHEN upper(trim(q.correct_answer)) IN ('A','B','C','D')
               THEN q.options->>upper(trim(q.correct_answer))
             ELSE q.correct_answer
           END, '')))
    ) AS is_correct
  FROM submitted s
  JOIN public.job_test_questions q ON q.id = s.qid
  WHERE q.admin_approved = true;
$$;

-- Grants: practice question delivery + scoring are available to guests and users.
GRANT EXECUTE ON FUNCTION public.get_practice_questions(text[],text[],text[],text[],uuid[],text,boolean,integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_preview_questions(text[],integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_job_practice_questions(uuid,text,integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.score_practice_answers(jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.score_job_practice_answers(jsonb) TO anon, authenticated;
