INSERT INTO public.system_settings (key, value) VALUES
('ai_free_budget', '{"enabled":true,"reset":"google_pacific","groups":{"user":{"reserve":150},"quality_gate":{"max":100},"auto_fill":{"max":120},"admin_bulk":{"max":60}},"total_max":450}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

UPDATE public.system_settings
SET value = jsonb_set(value, '{enabled}', 'false'::jsonb)
WHERE key = 'auto_fill_paid_budget';

CREATE OR REPLACE FUNCTION public.get_ai_quota_today()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  day_start timestamptz;
  result jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  day_start := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' + interval '8 hours';
  IF day_start > now() THEN day_start := day_start - interval '1 day'; END IF;

  SELECT jsonb_build_object(
    'day_start', day_start,
    'next_reset', day_start + interval '1 day',
    'budget', (SELECT value FROM system_settings WHERE key = 'ai_free_budget'),
    'key_health', (SELECT value FROM system_settings WHERE key = 'free_key_health'),
    'groups', COALESCE((
      SELECT jsonb_object_agg(g, n) FROM (
        SELECT COALESCE(metadata->>'group','user') g, count(*) n
        FROM ai_usage_logs
        WHERE created_at >= day_start AND metadata->>'ai_attempt'='true' AND metadata->>'provider'='gemini'
        GROUP BY 1) s), '{}'::jsonb),
    'keys', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('key_index', k, 'requests', n, 'rate_limited', r) ORDER BY k) FROM (
        SELECT (metadata->>'key_index')::int k, count(*) n,
               count(*) FILTER (WHERE metadata->>'outcome'='rate_limited') r
        FROM ai_usage_logs
        WHERE created_at >= day_start AND metadata->>'ai_attempt'='true' AND metadata->>'provider'='gemini'
        GROUP BY 1) s), '[]'::jsonb),
    'paid_today', (SELECT count(*) FROM ai_usage_logs
        WHERE created_at >= day_start AND metadata->>'provider'='lovable' AND metadata->>'outcome'='success'),
    'paid_background_today', (SELECT count(*) FROM ai_usage_logs
        WHERE created_at >= day_start AND metadata->>'provider'='lovable' AND metadata->>'outcome'='success'
          AND COALESCE(metadata->>'group','user') <> 'user')
  ) INTO result;
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_ai_quota_today() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ai_quota_today() TO authenticated;

SELECT cron.alter_job(jobid, schedule := '50 * * * *') FROM cron.job WHERE jobname = 'hourly-quality-gate';
SELECT cron.alter_job(jobid, schedule := '10 1-23/2 * * *') FROM cron.job WHERE jobname = 'mock-quality-gate-2h';