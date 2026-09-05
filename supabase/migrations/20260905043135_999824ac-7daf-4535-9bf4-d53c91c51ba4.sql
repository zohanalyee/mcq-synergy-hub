CREATE TABLE IF NOT EXISTS public.platform_stats_snapshot (
  id boolean PRIMARY KEY DEFAULT true,
  mcq_count bigint NOT NULL DEFAULT 0,
  subject_count bigint NOT NULL DEFAULT 0,
  test_count bigint NOT NULL DEFAULT 0,
  satisfaction_pct numeric NOT NULL DEFAULT 98,
  refreshed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT platform_stats_snapshot_single_row CHECK (id)
);

GRANT SELECT ON public.platform_stats_snapshot TO anon;
GRANT SELECT ON public.platform_stats_snapshot TO authenticated;
GRANT ALL ON public.platform_stats_snapshot TO service_role;

ALTER TABLE public.platform_stats_snapshot ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform stats are public" ON public.platform_stats_snapshot;
CREATE POLICY "Platform stats are public"
ON public.platform_stats_snapshot FOR SELECT
TO anon, authenticated
USING (true);

CREATE OR REPLACE FUNCTION public.refresh_platform_stats_snapshot()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.platform_stats_snapshot (id, mcq_count, subject_count, test_count, satisfaction_pct, refreshed_at)
  SELECT
    true,
    (SELECT COUNT(*) FROM content_items),
    (SELECT COUNT(*) FROM subjects),
    (SELECT COUNT(*) FROM test_attempts),
    COALESCE((SELECT ROUND(AVG(rating) * 20) FROM user_ratings), 98),
    now()
  ON CONFLICT (id) DO UPDATE SET
    mcq_count = EXCLUDED.mcq_count,
    subject_count = EXCLUDED.subject_count,
    test_count = EXCLUDED.test_count,
    satisfaction_pct = EXCLUDED.satisfaction_pct,
    refreshed_at = EXCLUDED.refreshed_at;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_platform_stats_snapshot() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_platform_stats_snapshot() TO service_role;

SELECT public.refresh_platform_stats_snapshot();

CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS TABLE(mcq_count bigint, subject_count bigint, test_count bigint, satisfaction_pct numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT s.mcq_count, s.subject_count, s.test_count, s.satisfaction_pct
  FROM public.platform_stats_snapshot s
  WHERE s.id;
$$;

SELECT cron.schedule(
  'refresh-platform-stats-snapshot',
  '7 * * * *',
  $$SELECT public.refresh_platform_stats_snapshot();$$
);