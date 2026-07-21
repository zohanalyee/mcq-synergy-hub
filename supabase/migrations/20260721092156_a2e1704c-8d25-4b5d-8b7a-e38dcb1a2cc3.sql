
-- 1. Per-user AI top-up log
CREATE TABLE public.user_ai_topup_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_test_id UUID NOT NULL,
  subject TEXT,
  reason TEXT NOT NULL DEFAULT 'user_exhausted',
  questions_requested INTEGER NOT NULL DEFAULT 0,
  questions_saved INTEGER NOT NULL DEFAULT 0,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_ai_topup_log_user_created ON public.user_ai_topup_log(user_id, created_at DESC);
CREATE INDEX idx_user_ai_topup_log_test_subject ON public.user_ai_topup_log(user_id, job_test_id, subject, created_at DESC);

GRANT SELECT ON public.user_ai_topup_log TO authenticated;
GRANT ALL ON public.user_ai_topup_log TO service_role;

ALTER TABLE public.user_ai_topup_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own top-up log"
  ON public.user_ai_topup_log FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins read all top-up logs"
  ON public.user_ai_topup_log FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 2. Default guardrail settings
INSERT INTO public.system_settings (key, value, description)
VALUES (
  'user_topup_config',
  jsonb_build_object(
    'daily', 2,
    'monthly', 10,
    'cooldown_hours', 6,
    'min_pool_ratio', 0.5,
    'enabled', true
  ),
  'Per-user AI top-up guardrails for Mock Tests (Phase 4b)'
)
ON CONFLICT (key) DO NOTHING;

-- 3. Guardrail check function used by the edge function
CREATE OR REPLACE FUNCTION public.can_user_topup(
  p_user_id UUID,
  p_job_test_id UUID,
  p_subject TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_cfg           JSONB;
  v_enabled       BOOLEAN;
  v_daily_cap     INT;
  v_monthly_cap   INT;
  v_cooldown_hrs  INT;
  v_daily_used    INT;
  v_monthly_used  INT;
  v_last_at       TIMESTAMPTZ;
BEGIN
  IF p_user_id IS NULL OR p_job_test_id IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'missing_ids');
  END IF;

  SELECT value INTO v_cfg
  FROM public.system_settings
  WHERE key = 'user_topup_config';

  v_cfg          := COALESCE(v_cfg, '{}'::jsonb);
  v_enabled      := COALESCE((v_cfg->>'enabled')::BOOLEAN, true);
  v_daily_cap    := COALESCE((v_cfg->>'daily')::INT, 2);
  v_monthly_cap  := COALESCE((v_cfg->>'monthly')::INT, 10);
  v_cooldown_hrs := COALESCE((v_cfg->>'cooldown_hours')::INT, 6);

  IF NOT v_enabled THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'disabled');
  END IF;

  SELECT COUNT(*) INTO v_daily_used
  FROM public.user_ai_topup_log
  WHERE user_id = p_user_id
    AND success = true
    AND created_at >= (now() - INTERVAL '1 day');

  IF v_daily_used >= v_daily_cap THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'daily_cap',
                              'daily_used', v_daily_used, 'daily_cap', v_daily_cap);
  END IF;

  SELECT COUNT(*) INTO v_monthly_used
  FROM public.user_ai_topup_log
  WHERE user_id = p_user_id
    AND success = true
    AND created_at >= (now() - INTERVAL '30 days');

  IF v_monthly_used >= v_monthly_cap THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'monthly_cap',
                              'monthly_used', v_monthly_used, 'monthly_cap', v_monthly_cap);
  END IF;

  SELECT MAX(created_at) INTO v_last_at
  FROM public.user_ai_topup_log
  WHERE user_id = p_user_id
    AND job_test_id = p_job_test_id
    AND (subject IS NOT DISTINCT FROM p_subject)
    AND success = true;

  IF v_last_at IS NOT NULL AND v_last_at > (now() - (v_cooldown_hrs || ' hours')::INTERVAL) THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'cooldown',
                              'last_at', v_last_at, 'cooldown_hours', v_cooldown_hrs);
  END IF;

  RETURN jsonb_build_object('allowed', true,
                            'daily_used', v_daily_used,
                            'monthly_used', v_monthly_used,
                            'daily_cap', v_daily_cap,
                            'monthly_cap', v_monthly_cap);
END;
$$;

GRANT EXECUTE ON FUNCTION public.can_user_topup(UUID, UUID, TEXT) TO authenticated, service_role;
