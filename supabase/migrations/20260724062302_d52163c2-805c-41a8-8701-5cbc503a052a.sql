
DROP FUNCTION IF EXISTS public.get_scraper_signal_log(int);
DROP FUNCTION IF EXISTS public.get_scraper_signal_stats();

CREATE OR REPLACE FUNCTION public.get_scraper_signal_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT jsonb_build_object(
    'total_24h', (SELECT count(*) FROM public.scraper_signals WHERE created_at > now() - interval '24 hours'),
    'total_7d',  (SELECT count(*) FROM public.scraper_signals WHERE created_at > now() - interval '7 days'),
    'total_30d', (SELECT count(*) FROM public.scraper_signals WHERE created_at > now() - interval '30 days'),
    'top_ips',   COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT ip_hash, count(*)::int AS hits
        FROM public.scraper_signals
        WHERE created_at > now() - interval '7 days'
        GROUP BY ip_hash
        ORDER BY hits DESC
        LIMIT 10
      ) t
    ), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_scraper_signal_log(p_limit int DEFAULT 50)
RETURNS SETOF public.scraper_signals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT * FROM public.scraper_signals
  ORDER BY created_at DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 500);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_scraper_signal_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_scraper_signal_log(int) TO authenticated;
