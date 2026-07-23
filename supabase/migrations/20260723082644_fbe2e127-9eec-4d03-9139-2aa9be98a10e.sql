CREATE TABLE public.scraper_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_hash TEXT NOT NULL,
  user_agent TEXT,
  endpoint TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

GRANT SELECT, INSERT ON public.scraper_signals TO authenticated;
GRANT INSERT ON public.scraper_signals TO anon;
GRANT ALL ON public.scraper_signals TO service_role;

ALTER TABLE public.scraper_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read scraper signals"
ON public.scraper_signals FOR SELECT TO authenticated
USING (public.is_admin());

CREATE POLICY "Allow anonymous honeypot inserts"
ON public.scraper_signals FOR INSERT TO anon
WITH CHECK (endpoint = 'get_all_questions_dump' AND signal_type = 'honeypot');

CREATE POLICY "Allow authenticated honeypot inserts"
ON public.scraper_signals FOR INSERT TO authenticated
WITH CHECK (endpoint = 'get_all_questions_dump' AND signal_type = 'honeypot');

CREATE INDEX idx_scraper_signals_created_at ON public.scraper_signals(created_at DESC);
CREATE INDEX idx_scraper_signals_ip_hash ON public.scraper_signals(ip_hash);

CREATE TRIGGER update_scraper_signals_updated_at
BEFORE UPDATE ON public.scraper_signals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_all_questions_dump()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_headers jsonb;
  v_ip text;
  v_ua text;
  v_hash text;
BEGIN
  v_headers := COALESCE(current_setting('request.headers', true), '{}')::jsonb;
  v_ip := trim(split_part(COALESCE(v_headers->>'x-forwarded-for', 'unknown'), ',', 1));
  v_ua := COALESCE(v_headers->>'user-agent', 'unknown');
  v_hash := encode(digest(v_ip, 'sha256'), 'hex');

  INSERT INTO public.scraper_signals (ip_hash, user_agent, endpoint, signal_type, metadata)
  VALUES (v_hash, v_ua, 'get_all_questions_dump', 'honeypot',
          jsonb_build_object('path', '/rest/v1/rpc/get_all_questions_dump'));

  RETURN jsonb_build_object(
    'warning', 'scraping detected',
    'items', '[]'::jsonb,
    'message', 'This endpoint is a monitoring honeypot. No real questions are returned.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_questions_dump() TO anon;
GRANT EXECUTE ON FUNCTION public.get_all_questions_dump() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_scraper_signal_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_top_ips jsonb;
  v_result jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  SELECT jsonb_agg(row_to_json(t))
  INTO v_top_ips
  FROM (
    SELECT ip_hash, COUNT(*)::bigint AS hits
    FROM public.scraper_signals
    WHERE created_at >= now() - INTERVAL '7 days'
    GROUP BY ip_hash
    ORDER BY COUNT(*) DESC
    LIMIT 20
  ) t;

  SELECT jsonb_build_object(
    'total_24h', COALESCE(COUNT(*) FILTER (WHERE created_at >= now() - INTERVAL '1 day'), 0)::bigint,
    'total_7d', COALESCE(COUNT(*) FILTER (WHERE created_at >= now() - INTERVAL '7 days'), 0)::bigint,
    'total_30d', COALESCE(COUNT(*) FILTER (WHERE created_at >= now() - INTERVAL '30 days'), 0)::bigint,
    'top_ips', COALESCE(v_top_ips, '[]'::jsonb)
  ) INTO v_result
  FROM public.scraper_signals;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_scraper_signal_stats() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_scraper_signal_log(p_limit integer DEFAULT 50)
RETURNS TABLE(id uuid, created_at timestamp with time zone, ip_hash text, user_agent text, endpoint text, signal_type text, metadata jsonb)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT s.id, s.created_at, s.ip_hash, s.user_agent, s.endpoint, s.signal_type, s.metadata
  FROM public.scraper_signals s
  ORDER BY s.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 500));
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_scraper_signal_log(integer) TO authenticated;