
-- Table 1: Track which questions each user has attempted
CREATE TABLE public.user_question_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  question_id UUID NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

CREATE INDEX idx_user_question_attempts_user ON public.user_question_attempts(user_id);
CREATE INDEX idx_user_question_attempts_question ON public.user_question_attempts(question_id);

ALTER TABLE public.user_question_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attempts"
  ON public.user_question_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attempts"
  ON public.user_question_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own attempts"
  ON public.user_question_attempts FOR DELETE
  USING (auth.uid() = user_id);

-- Table 2: Recommended practice tests for weak areas
CREATE TABLE public.recommended_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  topic_name TEXT NOT NULL,
  subject_name TEXT,
  reason TEXT NOT NULL DEFAULT 'weakness',
  weakness_percentage NUMERIC,
  question_count INTEGER NOT NULL DEFAULT 0,
  question_ids JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  session_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_recommended_tests_user_status ON public.recommended_tests(user_id, status);

ALTER TABLE public.recommended_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recommendations"
  ON public.recommended_tests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recommendations"
  ON public.recommended_tests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendations"
  ON public.recommended_tests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recommendations"
  ON public.recommended_tests FOR DELETE
  USING (auth.uid() = user_id);
