CREATE TABLE public.user_attempt_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id uuid,
  question_fingerprint text NOT NULL,
  question_id text,
  subject text NOT NULL,
  topic text NOT NULL DEFAULT '',
  difficulty text NOT NULL DEFAULT 'medium',
  is_correct boolean NOT NULL,
  time_taken_seconds integer,
  test_type text NOT NULL DEFAULT 'practice',
  attempted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_attempt_user_date ON public.user_attempt_history(user_id, attempted_at DESC);
CREATE INDEX idx_attempt_user_subject ON public.user_attempt_history(user_id, subject, attempted_at DESC);
CREATE INDEX idx_attempt_session ON public.user_attempt_history(session_id);

ALTER TABLE public.user_attempt_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own attempt history"
ON public.user_attempt_history
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own attempt history"
ON public.user_attempt_history
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own attempt history"
ON public.user_attempt_history
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all attempt history"
ON public.user_attempt_history
FOR SELECT
TO authenticated
USING (is_admin());