CREATE TABLE public.duplicate_scan_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scanned_at timestamptz NOT NULL DEFAULT now(),
  total_approved integer NOT NULL DEFAULT 0,
  total_mcqs integer NOT NULL DEFAULT 0,
  groups integer NOT NULL DEFAULT 0,
  total_rows integer NOT NULL DEFAULT 0,
  extra_copies integer NOT NULL DEFAULT 0,
  approved_dup_groups integer NOT NULL DEFAULT 0,
  new_groups integer NOT NULL DEFAULT 0,
  new_copies integer NOT NULL DEFAULT 0,
  group_keys jsonb NOT NULL DEFAULT '[]'::jsonb,
  trigger_source text NOT NULL DEFAULT 'cron',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.duplicate_scan_runs TO authenticated;
GRANT ALL ON public.duplicate_scan_runs TO service_role;

ALTER TABLE public.duplicate_scan_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view duplicate scan runs"
ON public.duplicate_scan_runs FOR SELECT TO authenticated
USING (public.is_admin());

CREATE INDEX idx_duplicate_scan_runs_scanned_at ON public.duplicate_scan_runs (scanned_at DESC);

CREATE OR REPLACE FUNCTION public.run_duplicate_scan(_trigger_source text DEFAULT 'cron')
RETURNS TABLE (
  groups integer,
  total_rows integer,
  extra_copies integer,
  approved_dup_groups integer,
  new_groups integer,
  new_copies integer,
  total_approved integer,
  total_mcqs integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_keys jsonb;
  v_prev jsonb;
  v_groups integer;
  v_rows integer;
  v_extra integer;
  v_appdup integer;
  v_new_groups integer;
  v_new_copies integer;
  v_total_approved integer;
  v_total_mcqs integer;
BEGIN
  IF NOT (public.is_admin() OR auth.role() = 'service_role' OR current_user IN ('postgres','supabase_admin')) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT
    count(*) FILTER (WHERE status = 'approved' AND show_in_subjects),
    count(*)
  INTO v_total_approved, v_total_mcqs
  FROM content_items WHERE category = 'mcq';

  WITH n AS (
    SELECT id, status,
      lower(btrim(regexp_replace(title, '\[FORCE-SAVE-[^]]*\]', '', 'g'))) AS norm
    FROM content_items
    WHERE category = 'mcq'
  ),
  g AS (
    SELECT norm, count(*) AS c,
      count(*) FILTER (WHERE status = 'approved') AS ac
    FROM n GROUP BY norm HAVING count(*) > 1
  )
  SELECT
    count(*)::int,
    coalesce(sum(c), 0)::int,
    coalesce(sum(c - 1), 0)::int,
    count(*) FILTER (WHERE ac > 1)::int,
    coalesce(jsonb_agg(jsonb_build_object('k', md5(norm), 'c', c)), '[]'::jsonb)
  INTO v_groups, v_rows, v_extra, v_appdup, v_keys
  FROM g;

  SELECT group_keys INTO v_prev
  FROM duplicate_scan_runs ORDER BY scanned_at DESC LIMIT 1;

  IF v_prev IS NULL THEN
    v_new_groups := v_groups;
    v_new_copies := v_extra;
  ELSE
    SELECT
      count(*)::int,
      coalesce(sum(
        (cur.c)::int - coalesce((SELECT (p->>'c')::int FROM jsonb_array_elements(v_prev) p WHERE p->>'k' = cur.k), 1)
      ), 0)::int
    INTO v_new_groups, v_new_copies
    FROM (
      SELECT e->>'k' AS k, (e->>'c')::int AS c FROM jsonb_array_elements(v_keys) e
    ) cur
    WHERE NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(v_prev) p
      WHERE p->>'k' = cur.k AND (p->>'c')::int >= cur.c
    );
  END IF;

  INSERT INTO duplicate_scan_runs (
    total_approved, total_mcqs, groups, total_rows, extra_copies,
    approved_dup_groups, new_groups, new_copies, group_keys, trigger_source
  ) VALUES (
    v_total_approved, v_total_mcqs, v_groups, v_rows, v_extra,
    v_appdup, v_new_groups, v_new_copies, v_keys, coalesce(_trigger_source, 'cron')
  );

  RETURN QUERY SELECT v_groups, v_rows, v_extra, v_appdup, v_new_groups, v_new_copies, v_total_approved, v_total_mcqs;
END;
$$;

REVOKE ALL ON FUNCTION public.run_duplicate_scan(text) FROM public;
GRANT EXECUTE ON FUNCTION public.run_duplicate_scan(text) TO authenticated, service_role;