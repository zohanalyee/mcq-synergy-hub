CREATE TABLE public.user_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  topic text NOT NULL DEFAULT '',
  total_attempts int NOT NULL DEFAULT 0,
  correct_attempts int NOT NULL DEFAULT 0,
  wrong_attempts int NOT NULL DEFAULT 0,
  weakness_score int NOT NULL DEFAULT 50,
  question_fingerprints text[] NOT NULL DEFAULT '{}',
  question_ids text[] NOT NULL DEFAULT '{}',
  last_attempted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, subject, topic)
);

CREATE INDEX idx_user_perf_user ON public.user_performance(user_id);
CREATE INDEX idx_user_perf_weak ON public.user_performance(user_id, weakness_score DESC);
CREATE INDEX idx_user_perf_subject ON public.user_performance(user_id, subject);

ALTER TABLE public.user_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own performance"
  ON public.user_performance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own performance"
  ON public.user_performance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own performance"
  ON public.user_performance FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all performance"
  ON public.user_performance FOR SELECT
  USING (is_admin());

CREATE TRIGGER update_user_performance_updated_at
  BEFORE UPDATE ON public.user_performance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();