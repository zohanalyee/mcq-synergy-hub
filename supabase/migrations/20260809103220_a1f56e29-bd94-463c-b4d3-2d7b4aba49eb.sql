CREATE TABLE IF NOT EXISTS public.campaign_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  landing_path TEXT,
  referrer TEXT,
  device_type TEXT,
  visitor_hash TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.campaign_visits TO anon;
GRANT INSERT, SELECT ON public.campaign_visits TO authenticated;
GRANT ALL ON public.campaign_visits TO service_role;

ALTER TABLE public.campaign_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "campaign_visits_insert_anyone" ON public.campaign_visits;
CREATE POLICY "campaign_visits_insert_anyone"
  ON public.campaign_visits FOR INSERT TO anon, authenticated
  WITH CHECK (char_length(campaign) BETWEEN 2 AND 64);

DROP POLICY IF EXISTS "campaign_visits_admin_select" ON public.campaign_visits;
CREATE POLICY "campaign_visits_admin_select"
  ON public.campaign_visits FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_campaign_visits_campaign_created
  ON public.campaign_visits (campaign, created_at DESC);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signup_campaign TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_signup_campaign
  ON public.profiles (signup_campaign) WHERE signup_campaign IS NOT NULL;

CREATE OR REPLACE FUNCTION public.get_campaign_stats()
RETURNS TABLE (
  campaign TEXT,
  visits_today BIGINT,
  visits_7d BIGINT,
  visits_total BIGINT,
  signups BIGINT,
  signups_7d BIGINT,
  students_practiced BIGINT,
  tests_completed BIGINT,
  first_visit TIMESTAMPTZ,
  last_visit TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  WITH v AS (
    SELECT cv.campaign,
           COUNT(*) FILTER (WHERE cv.created_at >= date_trunc('day', now())) AS visits_today,
           COUNT(*) FILTER (WHERE cv.created_at >= now() - interval '7 days') AS visits_7d,
           COUNT(*) AS visits_total,
           MIN(cv.created_at) AS first_visit,
           MAX(cv.created_at) AS last_visit
    FROM public.campaign_visits cv
    GROUP BY cv.campaign
  ),
  s AS (
    SELECT p.signup_campaign AS campaign,
           COUNT(*) AS signups,
           COUNT(*) FILTER (WHERE p.created_at >= now() - interval '7 days') AS signups_7d
    FROM public.profiles p
    WHERE p.signup_campaign IS NOT NULL
    GROUP BY p.signup_campaign
  ),
  a AS (
    SELECT p.signup_campaign AS campaign,
           COUNT(DISTINCT uah.user_id) AS students_practiced
    FROM public.profiles p
    JOIN public.user_attempt_history uah ON uah.user_id = p.id
    WHERE p.signup_campaign IS NOT NULL
    GROUP BY p.signup_campaign
  ),
  t AS (
    SELECT p.signup_campaign AS campaign,
           COUNT(ta.id) AS tests_completed
    FROM public.profiles p
    JOIN public.test_attempts ta ON ta.user_id = p.id
    WHERE p.signup_campaign IS NOT NULL
    GROUP BY p.signup_campaign
  ),
  keys AS (
    SELECT campaign FROM v
    UNION SELECT campaign FROM s
  )
  SELECT k.campaign,
         COALESCE(v.visits_today, 0),
         COALESCE(v.visits_7d, 0),
         COALESCE(v.visits_total, 0),
         COALESCE(s.signups, 0),
         COALESCE(s.signups_7d, 0),
         COALESCE(a.students_practiced, 0),
         COALESCE(t.tests_completed, 0),
         v.first_visit,
         v.last_visit
  FROM keys k
  LEFT JOIN v ON v.campaign = k.campaign
  LEFT JOIN s ON s.campaign = k.campaign
  LEFT JOIN a ON a.campaign = k.campaign
  LEFT JOIN t ON t.campaign = k.campaign
  WHERE public.is_admin()
  ORDER BY COALESCE(v.visits_total, 0) DESC;
$$;

REVOKE ALL ON FUNCTION public.get_campaign_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_campaign_stats() TO authenticated;