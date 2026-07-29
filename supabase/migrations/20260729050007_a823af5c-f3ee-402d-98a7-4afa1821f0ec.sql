
-- ===== G2E: Guest per-IP rate limiter =====

CREATE TABLE IF NOT EXISTS public.guest_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  hour_bucket TIMESTAMPTZ NOT NULL,
  day_bucket DATE NOT NULL,
  count_hour INTEGER NOT NULL DEFAULT 0,
  count_day INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ip_address, endpoint, hour_bucket)
);

GRANT ALL ON public.guest_rate_limits TO service_role;
-- No grants to anon/authenticated: only edge functions (service role) touch it.

ALTER TABLE public.guest_rate_limits ENABLE ROW LEVEL SECURITY;

-- Admins may inspect for debugging
CREATE POLICY "Admins can view guest_rate_limits"
ON public.guest_rate_limits FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_guest_rate_limits_lookup
  ON public.guest_rate_limits (ip_address, endpoint, hour_bucket);
CREATE INDEX IF NOT EXISTS idx_guest_rate_limits_day
  ON public.guest_rate_limits (ip_address, endpoint, day_bucket);


CREATE OR REPLACE FUNCTION public.check_guest_rate_limit(
  p_ip TEXT,
  p_endpoint TEXT,
  p_max_per_hour INTEGER,
  p_max_per_day INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hour TIMESTAMPTZ := date_trunc('hour', now());
  v_day  DATE := (now() AT TIME ZONE 'UTC')::date;
  v_hour_count INTEGER := 0;
  v_day_count  INTEGER := 0;
  v_allowed BOOLEAN;
BEGIN
  IF p_ip IS NULL OR length(p_ip) = 0 THEN
    -- No IP => don't block (edge function will still gate by other means)
    RETURN jsonb_build_object('allowed', true, 'reason', 'no_ip');
  END IF;

  -- Sum today's usage for this IP+endpoint before recording the new hit
  SELECT COALESCE(SUM(count_hour), 0)
    INTO v_day_count
  FROM public.guest_rate_limits
  WHERE ip_address = p_ip
    AND endpoint = p_endpoint
    AND day_bucket = v_day;

  SELECT COALESCE(count_hour, 0)
    INTO v_hour_count
  FROM public.guest_rate_limits
  WHERE ip_address = p_ip
    AND endpoint = p_endpoint
    AND hour_bucket = v_hour;

  IF (v_hour_count + 1) > p_max_per_hour THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'hour_limit',
      'used_hour', v_hour_count,
      'used_day', v_day_count,
      'limit_hour', p_max_per_hour,
      'limit_day', p_max_per_day
    );
  END IF;

  IF (v_day_count + 1) > p_max_per_day THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'day_limit',
      'used_hour', v_hour_count,
      'used_day', v_day_count,
      'limit_hour', p_max_per_hour,
      'limit_day', p_max_per_day
    );
  END IF;

  -- Record this call
  INSERT INTO public.guest_rate_limits (ip_address, endpoint, hour_bucket, day_bucket, count_hour, count_day)
  VALUES (p_ip, p_endpoint, v_hour, v_day, 1, 1)
  ON CONFLICT (ip_address, endpoint, hour_bucket)
  DO UPDATE SET count_hour = guest_rate_limits.count_hour + 1,
                updated_at = now();

  -- Housekeeping: drop rows older than 2 days (cheap, bounded)
  DELETE FROM public.guest_rate_limits
   WHERE day_bucket < (v_day - INTERVAL '2 days');

  RETURN jsonb_build_object(
    'allowed', true,
    'used_hour', v_hour_count + 1,
    'used_day', v_day_count + 1,
    'limit_hour', p_max_per_hour,
    'limit_day', p_max_per_day
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_guest_rate_limit(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_guest_rate_limit(TEXT, TEXT, INTEGER, INTEGER) TO service_role;
