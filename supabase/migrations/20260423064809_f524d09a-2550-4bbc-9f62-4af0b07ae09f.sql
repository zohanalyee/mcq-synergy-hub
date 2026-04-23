
-- ============================================================
-- Table 1: job_test_definitions
-- ============================================================
CREATE TABLE public.job_test_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_title TEXT NOT NULL,
  department TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  syllabus JSONB NOT NULL DEFAULT '{"sections": []}'::jsonb,
  sample_questions JSONB DEFAULT '{}'::jsonb,
  difficulty_distribution JSONB NOT NULL DEFAULT '{"easy": 30, "medium": 50, "hard": 20}'::jsonb,
  min_questions_per_topic INTEGER NOT NULL DEFAULT 2,
  max_retries INTEGER NOT NULL DEFAULT 3,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.job_test_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all job test definitions"
  ON public.job_test_definitions
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Authenticated users view published definitions"
  ON public.job_test_definitions
  FOR SELECT
  TO authenticated
  USING (status = 'published');

CREATE INDEX idx_job_test_definitions_status ON public.job_test_definitions(status);

-- ============================================================
-- Table 2: job_test_questions
-- ============================================================
CREATE TABLE public.job_test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_test_id UUID NOT NULL REFERENCES public.job_test_definitions(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  topic TEXT,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  generation_batch INTEGER,
  validation_score NUMERIC(3,2),
  admin_approved BOOLEAN NOT NULL DEFAULT false,
  times_used INTEGER NOT NULL DEFAULT 0,
  times_correct INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.job_test_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all job test questions"
  ON public.job_test_questions
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Authenticated users view approved questions of published tests"
  ON public.job_test_questions
  FOR SELECT
  TO authenticated
  USING (
    admin_approved = true
    AND EXISTS (
      SELECT 1 FROM public.job_test_definitions d
      WHERE d.id = job_test_questions.job_test_id
        AND d.status = 'published'
    )
  );

CREATE INDEX idx_job_test_questions_test_id ON public.job_test_questions(job_test_id);
CREATE INDEX idx_job_test_questions_subject ON public.job_test_questions(subject);
CREATE INDEX idx_job_test_questions_approved ON public.job_test_questions(admin_approved);

-- Difficulty validation via trigger (no CHECK per project rules)
CREATE OR REPLACE FUNCTION public.validate_job_test_question_difficulty()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.difficulty NOT IN ('easy', 'medium', 'hard') THEN
    RAISE EXCEPTION 'Invalid difficulty: %. Must be easy, medium, or hard.', NEW.difficulty;
  END IF;
  IF NEW.correct_answer NOT IN ('A', 'B', 'C', 'D') THEN
    RAISE EXCEPTION 'Invalid correct_answer: %. Must be A, B, C, or D.', NEW.correct_answer;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_job_test_question
  BEFORE INSERT OR UPDATE ON public.job_test_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_job_test_question_difficulty();

-- ============================================================
-- Table 3: job_test_generation_logs
-- ============================================================
CREATE TABLE public.job_test_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_test_id UUID REFERENCES public.job_test_definitions(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  requested_count INTEGER,
  difficulty TEXT,
  generated_count INTEGER NOT NULL DEFAULT 0,
  accepted_count INTEGER NOT NULL DEFAULT 0,
  rejected_count INTEGER NOT NULL DEFAULT 0,
  rejection_reasons JSONB DEFAULT '{}'::jsonb,
  api_calls_made INTEGER NOT NULL DEFAULT 0,
  total_cost_credits NUMERIC(10,2),
  generation_time_seconds INTEGER,
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.job_test_generation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all generation logs"
  ON public.job_test_generation_logs
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE INDEX idx_job_test_logs_test_id ON public.job_test_generation_logs(job_test_id);
CREATE INDEX idx_job_test_logs_created_at ON public.job_test_generation_logs(created_at DESC);

-- ============================================================
-- updated_at trigger for definitions
-- ============================================================
CREATE TRIGGER trg_job_test_definitions_updated_at
  BEFORE UPDATE ON public.job_test_definitions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Migrate existing job_tests rows -> job_test_definitions
-- ============================================================
INSERT INTO public.job_test_definitions (
  job_title, department, status, syllabus, created_at, updated_at
)
SELECT
  jt.title,
  jt.organization,
  'published',
  jsonb_build_object(
    'sections',
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'subject', COALESCE(s->>'topic', ''),
            'percentage', COALESCE((s->>'percentage')::int, 0),
            'question_count',
              GREATEST(
                1,
                ROUND(COALESCE(jt.questions, 100) * COALESCE((s->>'percentage')::int, 0) / 100.0)::int
              ),
            'topics', '[]'::jsonb,
            'style_guide', '',
            'forbidden', '[]'::jsonb
          )
        )
        FROM jsonb_array_elements(
          CASE
            WHEN jsonb_typeof(jt.syllabus) = 'array' THEN jt.syllabus
            ELSE '[]'::jsonb
          END
        ) s
      ),
      '[]'::jsonb
    )
  ),
  COALESCE(jt.created_at, now()),
  COALESCE(jt.updated_at, now())
FROM public.job_tests jt;
