-- Credit transactions table
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  details TEXT,
  balance_after INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_credit_transactions_user_created
  ON public.credit_transactions (user_id, created_at DESC);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view only their own transactions
CREATE POLICY "Users view own credit transactions"
  ON public.credit_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins view all credit transactions"
  ON public.credit_transactions
  FOR SELECT
  USING (public.is_admin());

-- No direct INSERT/UPDATE/DELETE from clients; only via SECURITY DEFINER functions / service role.

-- Helper function to log a credit transaction (callable by edge functions via service role)
CREATE OR REPLACE FUNCTION public.log_credit_transaction(
  p_user_id UUID,
  p_amount INTEGER,
  p_action_type TEXT,
  p_details TEXT DEFAULT NULL,
  p_balance_after INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  INSERT INTO public.credit_transactions (user_id, amount, action_type, details, balance_after)
  VALUES (p_user_id, p_amount, p_action_type, p_details, p_balance_after)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- Update deduct_credits to also log a transaction row
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id uuid,
  p_amount integer,
  p_action_type text DEFAULT 'AI Generation',
  p_details text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

  -- Log the transaction (negative amount for deduction)
  IF p_amount > 0 THEN
    INSERT INTO public.credit_transactions (user_id, amount, action_type, details, balance_after)
    VALUES (p_user_id, -p_amount, COALESCE(p_action_type, 'AI Generation'), p_details, v_remaining);
  END IF;

  RETURN jsonb_build_object(
    'remaining', COALESCE(v_remaining, 0),
    'used_today', COALESCE(v_used_today, 0)
  );
END;
$$;

-- RPC for users to fetch their own transaction history
CREATE OR REPLACE FUNCTION public.get_my_credit_history(p_limit integer DEFAULT 100)
RETURNS TABLE(
  id uuid,
  amount integer,
  action_type text,
  details text,
  balance_after integer,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN;
  END IF;
  RETURN QUERY
  SELECT ct.id, ct.amount, ct.action_type, ct.details, ct.balance_after, ct.created_at
  FROM public.credit_transactions ct
  WHERE ct.user_id = v_uid
  ORDER BY ct.created_at DESC
  LIMIT GREATEST(1, LEAST(p_limit, 500));
END;
$$;