
-- ============= user_credits table =============
CREATE TABLE public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_remaining INT NOT NULL DEFAULT 100,
  credits_used_today INT NOT NULL DEFAULT 0,
  last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_credits_used INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own credits"
  ON public.user_credits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all credits"
  ON public.user_credits FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER trg_user_credits_updated_at
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= Seed on signup =============
CREATE OR REPLACE FUNCTION public.seed_user_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_credits (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.seed_user_credits();

-- Backfill existing users
INSERT INTO public.user_credits (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- ============= deduct_credits RPC =============
CREATE OR REPLACE FUNCTION public.deduct_credits(p_user_id UUID, p_amount INT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_remaining INT;
  v_used_today INT;
BEGIN
  -- Ensure row exists
  INSERT INTO public.user_credits (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Auto-reset if new day
  UPDATE public.user_credits
  SET credits_remaining = 100,
      credits_used_today = 0,
      last_reset_date = CURRENT_DATE
  WHERE user_id = p_user_id
    AND last_reset_date < CURRENT_DATE;

  -- Deduct
  UPDATE public.user_credits
  SET credits_remaining = GREATEST(0, credits_remaining - GREATEST(0, p_amount)),
      credits_used_today = credits_used_today + GREATEST(0, p_amount),
      total_credits_used = total_credits_used + GREATEST(0, p_amount),
      updated_at = now()
  WHERE user_id = p_user_id
  RETURNING credits_remaining, credits_used_today
  INTO v_remaining, v_used_today;

  RETURN jsonb_build_object(
    'remaining', COALESCE(v_remaining, 0),
    'used_today', COALESCE(v_used_today, 0)
  );
END;
$$;

-- ============= get_my_credits RPC =============
CREATE OR REPLACE FUNCTION public.get_my_credits()
RETURNS TABLE(credits_remaining INT, credits_used_today INT, last_reset_date DATE, total_credits_used INT)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN;
  END IF;

  -- Note: cannot mutate in STABLE function; rely on deduct_credits or a separate refresh call for reset.
  -- Provide today's effective view:
  RETURN QUERY
  SELECT
    CASE WHEN uc.last_reset_date < CURRENT_DATE THEN 100 ELSE uc.credits_remaining END,
    CASE WHEN uc.last_reset_date < CURRENT_DATE THEN 0 ELSE uc.credits_used_today END,
    uc.last_reset_date,
    uc.total_credits_used
  FROM public.user_credits uc
  WHERE uc.user_id = v_uid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.deduct_credits(UUID, INT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_credits() TO authenticated;
