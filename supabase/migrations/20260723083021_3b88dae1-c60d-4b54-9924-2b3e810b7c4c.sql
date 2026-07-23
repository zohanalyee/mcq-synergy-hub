CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
  v_hash := encode(digest(v_ip::bytea, 'sha256'), 'hex');

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