INSERT INTO public.system_settings (key, value, description)
VALUES
 ('dynamic_scaling_config',
  '{"enabled": true, "max_pool_multiplier": 6.0, "max_pool_per_test": 1500, "warm_threshold": 0.15, "hot_threshold": 0.30, "surge_threshold": 0.60, "warm_factor": 1.5, "hot_factor": 2.0, "surge_factor": 3.0}'::jsonb,
  'Velocity-based mock test pool scaling: burn-rate tiers raise the effective pool multiplier, capped by max_pool_multiplier / max_pool_per_test.'),
 ('campaign_surge',
  '{"enabled": false, "label": "Larkana Library Banner", "starts_at": null, "ends_at": null, "daily_budget": 1200, "min_multiplier": 3.0, "sprint_keywords": ["mdcat", "sindh", "class 9", "class 10", "class 11", "class 12", "spsc", "cce", "sts", "nts"]}'::jsonb,
  'Time-boxed campaign surge window: raises autofill daily budget and floors mock test pool multipliers while active. Auto-expires at ends_at.')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.pool_scaling_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_id uuid,
  test_title text,
  demand_tier text NOT NULL,
  burn_rate numeric,
  questions_consumed_24h integer,
  approved_pool integer,
  base_multiplier numeric,
  effective_multiplier numeric,
  effective_target integer,
  surge_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pool_scaling_events TO authenticated;
GRANT ALL ON public.pool_scaling_events TO service_role;

ALTER TABLE public.pool_scaling_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view pool scaling events" ON public.pool_scaling_events;
CREATE POLICY "Admins can view pool scaling events"
ON public.pool_scaling_events FOR SELECT TO authenticated
USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_pool_scaling_events_created ON public.pool_scaling_events (created_at DESC);

CREATE OR REPLACE FUNCTION public.get_mock_test_demand(p_hours integer DEFAULT 24)
RETURNS TABLE (
  definition_id uuid,
  test_id uuid,
  title text,
  slug text,
  attempts bigint,
  distinct_users bigint,
  last_attempt_at timestamptz,
  active_users_window bigint,
  questions_consumed_window bigint,
  burn_rate numeric,
  demand_tier text,
  exam_length integer,
  approved_pool bigint,
  base_multiplier numeric,
  effective_multiplier numeric,
  effective_target integer,
  pool_deficit integer,
  surge_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH gate AS (
    SELECT (auth.role() = 'service_role' OR public.is_admin()) AS ok
  ),
  cfg AS (
    SELECT
      COALESCE((value->>'enabled')::boolean, true) AS enabled,
      COALESCE((value->>'max_pool_multiplier')::numeric, 6.0) AS max_mult,
      COALESCE((value->>'max_pool_per_test')::integer, 1500) AS max_pool,
      COALESCE((value->>'warm_threshold')::numeric, 0.15) AS warm_t,
      COALESCE((value->>'hot_threshold')::numeric, 0.30) AS hot_t,
      COALESCE((value->>'surge_threshold')::numeric, 0.60) AS surge_t,
      COALESCE((value->>'warm_factor')::numeric, 1.5) AS warm_f,
      COALESCE((value->>'hot_factor')::numeric, 2.0) AS hot_f,
      COALESCE((value->>'surge_factor')::numeric, 3.0) AS surge_f
    FROM public.system_settings WHERE key = 'dynamic_scaling_config'
  ),
  cfg1 AS (
    SELECT * FROM cfg
    UNION ALL
    SELECT true, 6.0, 1500, 0.15, 0.30, 0.60, 1.5, 2.0, 3.0
    WHERE NOT EXISTS (SELECT 1 FROM cfg)
  ),
  surge AS (
    SELECT
      COALESCE((value->>'enabled')::boolean, false)
        AND (value->>'starts_at' IS NULL OR (value->>'starts_at')::timestamptz <= now())
        AND (value->>'ends_at' IS NULL OR (value->>'ends_at')::timestamptz >= now()) AS active,
      COALESCE((value->>'min_multiplier')::numeric, 1.0) AS min_mult
    FROM public.system_settings WHERE key = 'campaign_surge'
  ),
  surge1 AS (
    SELECT * FROM surge
    UNION ALL
    SELECT false, 1.0 WHERE NOT EXISTS (SELECT 1 FROM surge)
  ),
  pop AS (
    SELECT public.mock_test_slug(jt.title) AS slug,
           jt.id AS test_id,
           jt.title,
           jt.definition_id,
           COALESCE(jt.questions, 100) AS exam_length
    FROM public.job_tests jt
    WHERE (SELECT ok FROM gate)
  ),
  prog AS (
    SELECT p.job_test_id AS slug,
           SUM(COALESCE(p.total_attempts, 0))::bigint AS attempts,
           COUNT(DISTINCT p.user_id)::bigint AS distinct_users,
           MAX(p.last_attempt_at) AS last_attempt_at
    FROM public.job_test_progress p
    WHERE p.last_attempt_at >= now() - '14 days'::interval
    GROUP BY p.job_test_id
  ),
  win AS (
    SELECT p.job_test_id AS slug,
           COUNT(DISTINCT p.user_id)::bigint AS active_users
    FROM public.job_test_progress p
    WHERE p.last_attempt_at >= now() - (p_hours || ' hours')::interval
    GROUP BY p.job_test_id
  ),
  consumed AS (
    SELECT q.job_test_id AS definition_id, COUNT(*)::bigint AS consumed
    FROM public.user_question_mastery m
    JOIN public.job_test_questions q ON q.id = m.question_id
    WHERE m.last_attempted_at >= now() - (p_hours || ' hours')::interval
    GROUP BY q.job_test_id
  ),
  pool AS (
    SELECT q.job_test_id AS definition_id, COUNT(*)::bigint AS approved_pool
    FROM public.job_test_questions q
    WHERE q.admin_approved = true
    GROUP BY q.job_test_id
  ),
  base AS (
    SELECT pop.definition_id,
           pop.test_id,
           pop.title,
           pop.slug,
           COALESCE(prog.attempts, 0) AS attempts,
           COALESCE(prog.distinct_users, 0) AS distinct_users,
           prog.last_attempt_at,
           COALESCE(win.active_users, 0) AS active_users_window,
           COALESCE(consumed.consumed, 0) AS consumed_window,
           pop.exam_length,
           COALESCE(pool.approved_pool, 0) AS approved_pool,
           GREATEST(COALESCE(d.pool_multiplier, 2.0), 1) AS base_mult
    FROM pop
    LEFT JOIN prog ON prog.slug = pop.slug
    LEFT JOIN win ON win.slug = pop.slug
    LEFT JOIN public.job_test_definitions d ON d.id = pop.definition_id
    LEFT JOIN pool ON pool.definition_id = pop.definition_id
    LEFT JOIN consumed ON consumed.definition_id = pop.definition_id
  ),
  scored AS (
    SELECT b.*,
           c.enabled, c.max_mult, c.max_pool,
           s.active AS surge_active, s.min_mult,
           ROUND(b.consumed_window::numeric / GREATEST(b.approved_pool, 1)::numeric, 3) AS burn,
           CASE
             WHEN b.consumed_window::numeric / GREATEST(b.approved_pool, 1)::numeric >= c.surge_t THEN 'surge'
             WHEN b.consumed_window::numeric / GREATEST(b.approved_pool, 1)::numeric >= c.hot_t THEN 'hot'
             WHEN b.consumed_window::numeric / GREATEST(b.approved_pool, 1)::numeric >= c.warm_t THEN 'warm'
             ELSE 'steady'
           END AS tier,
           CASE
             WHEN b.consumed_window::numeric / GREATEST(b.approved_pool, 1)::numeric >= c.surge_t THEN c.surge_f
             WHEN b.consumed_window::numeric / GREATEST(b.approved_pool, 1)::numeric >= c.hot_t THEN c.hot_f
             WHEN b.consumed_window::numeric / GREATEST(b.approved_pool, 1)::numeric >= c.warm_t THEN c.warm_f
             ELSE 1.0
           END AS tier_factor
    FROM base b CROSS JOIN cfg1 c CROSS JOIN surge1 s
  ),
  eff AS (
    SELECT sc.*,
           LEAST(
             sc.max_mult,
             GREATEST(
               sc.base_mult * (CASE WHEN sc.enabled THEN sc.tier_factor ELSE 1.0 END),
               CASE WHEN sc.surge_active THEN GREATEST(sc.min_mult, sc.base_mult) ELSE sc.base_mult END
             )
           ) AS eff_mult
    FROM scored sc
  )
  SELECT e.definition_id,
         e.test_id,
         e.title,
         e.slug,
         e.attempts,
         e.distinct_users,
         e.last_attempt_at,
         e.active_users_window,
         e.consumed_window,
         e.burn,
         e.tier,
         e.exam_length,
         e.approved_pool,
         e.base_mult,
         ROUND(e.eff_mult, 2),
         LEAST(e.max_pool, CEIL(e.exam_length * e.eff_mult)::integer) AS effective_target,
         GREATEST(0, LEAST(e.max_pool, CEIL(e.exam_length * e.eff_mult)::integer) - e.approved_pool)::integer AS pool_deficit,
         e.surge_active
  FROM eff e
  ORDER BY e.burn DESC, e.attempts DESC;
$$;

REVOKE ALL ON FUNCTION public.get_mock_test_demand(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_mock_test_demand(integer) TO authenticated, service_role;