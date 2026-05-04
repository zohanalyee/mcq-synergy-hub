
CREATE TABLE IF NOT EXISTS public.job_test_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  ip_address INET,
  job_test_id TEXT NOT NULL,
  questions_unlocked INTEGER NOT NULL DEFAULT 100,
  total_attempts INTEGER NOT NULL DEFAULT 0,
  best_score NUMERIC NOT NULL DEFAULT 0,
  weak_topics JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (user_id IS NOT NULL OR ip_address IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_jtp_user
  ON public.job_test_progress (user_id, job_test_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_jtp_ip
  ON public.job_test_progress (ip_address, job_test_id) WHERE user_id IS NULL;

ALTER TABLE public.job_test_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own job_test_progress"
  ON public.job_test_progress FOR SELECT
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Admins view all job_test_progress"
  ON public.job_test_progress FOR SELECT
  USING (public.is_admin());

CREATE TRIGGER update_jtp_updated_at
  BEFORE UPDATE ON public.job_test_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.update_job_test_progress(
  p_user_id UUID,
  p_ip_address INET,
  p_job_test_id TEXT,
  p_score NUMERIC,
  p_weak_topics JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.job_test_progress;
  v_qualified BOOLEAN := p_score >= 80;
  v_unlock_delta INT := 0;
  v_new_unlocked INT;
BEGIN
  IF p_user_id IS NULL AND p_ip_address IS NULL THEN
    RAISE EXCEPTION 'Either user_id or ip_address must be provided';
  END IF;

  IF p_user_id IS NOT NULL THEN
    SELECT * INTO v_row FROM public.job_test_progress
      WHERE user_id = p_user_id AND job_test_id = p_job_test_id;
  ELSE
    SELECT * INTO v_row FROM public.job_test_progress
      WHERE user_id IS NULL AND ip_address = p_ip_address AND job_test_id = p_job_test_id;
  END IF;

  IF NOT FOUND THEN
    INSERT INTO public.job_test_progress (user_id, ip_address, job_test_id, questions_unlocked)
    VALUES (p_user_id, p_ip_address, p_job_test_id, 100)
    RETURNING * INTO v_row;
  END IF;

  IF v_qualified THEN
    v_unlock_delta := 25;
  END IF;

  v_new_unlocked := LEAST(500, v_row.questions_unlocked + v_unlock_delta);

  UPDATE public.job_test_progress
  SET questions_unlocked = v_new_unlocked,
      total_attempts = total_attempts + 1,
      best_score = GREATEST(best_score, p_score),
      weak_topics = p_weak_topics,
      last_attempt_at = now(),
      updated_at = now()
  WHERE id = v_row.id
  RETURNING * INTO v_row;

  RETURN jsonb_build_object(
    'unlocked', v_row.questions_unlocked,
    'unlocked_delta', v_unlock_delta,
    'qualified', v_qualified,
    'best_score', v_row.best_score,
    'total_attempts', v_row.total_attempts,
    'weak_topics', v_row.weak_topics
  );
END;
$$;
