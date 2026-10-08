CREATE OR REPLACE FUNCTION public.auto_merge_duplicate_clusters(_dry_run boolean DEFAULT true)
 RETURNS TABLE(groups_merged integer, copies_hidden integer)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_groups int; v_hidden int;
BEGIN
  IF NOT (public.is_admin() OR auth.role() = 'service_role' OR current_user IN ('postgres','supabase_admin')) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  CREATE TEMP TABLE _dup ON COMMIT DROP AS
  WITH n AS (
    SELECT id, status, created_at, show_in_subjects, show_in_mock_tests, show_in_syllabus,
      lower(btrim(regexp_replace(title, '\[FORCE-SAVE-[^]]*\]', '', 'g'))) AS norm,
      md5(lower(regexp_replace(COALESCE(options::text,''), '\s+', '', 'g'))) AS opt_key
    FROM content_items
    WHERE category = 'mcq' AND status IN ('approved','pending','flagged_duplicate')
  ), r AS (
    SELECT id, norm, opt_key,
      row_number() OVER w AS rn,
      count(*) OVER (PARTITION BY norm, opt_key) AS c,
      bool_or(status='approved') OVER (PARTITION BY norm, opt_key) AS any_approved,
      bool_or(COALESCE(show_in_subjects,false)) OVER (PARTITION BY norm, opt_key) AS v_sub,
      bool_or(COALESCE(show_in_mock_tests,false)) OVER (PARTITION BY norm, opt_key) AS v_mock,
      bool_or(COALESCE(show_in_syllabus,false)) OVER (PARTITION BY norm, opt_key) AS v_syl
    FROM n
    WINDOW w AS (PARTITION BY norm, opt_key ORDER BY (status = 'approved') DESC, created_at ASC)
  )
  SELECT * FROM r WHERE c > 1;

  SELECT count(DISTINCT (norm, opt_key))::int, count(*) FILTER (WHERE rn > 1)::int
  INTO v_groups, v_hidden FROM _dup;

  IF NOT _dry_run THEN
    -- Master keeps every context the copies were used in (one question, many tests).
    -- Status is only 'approved' if a human already approved one copy — never auto-approve.
    UPDATE content_items ci SET
      status = CASE WHEN d.any_approved THEN 'approved' ELSE 'pending' END,
      show_in_subjects = d.v_sub, show_in_mock_tests = d.v_mock, show_in_syllabus = d.v_syl,
      updated_at = now()
    FROM _dup d WHERE d.rn = 1 AND ci.id = d.id;
    UPDATE content_items ci SET status = 'rejected', show_in_subjects = false,
      show_in_mock_tests = false, show_in_syllabus = false, updated_at = now()
    FROM _dup d WHERE d.rn > 1 AND ci.id = d.id;
  END IF;

  RETURN QUERY SELECT v_groups, v_hidden;
END;
$function$;

-- Insert-time reuse guard: an exact copy of an existing MCQ is never added as a new visible row.
CREATE OR REPLACE FUNCTION public.reuse_existing_mcq_on_insert()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_master uuid;
BEGIN
  IF NEW.category IS DISTINCT FROM 'mcq' OR NEW.title IS NULL THEN RETURN NEW; END IF;
  SELECT id INTO v_master FROM content_items
  WHERE category = 'mcq' AND status IN ('approved','pending')
    AND lower(btrim(regexp_replace(title, '\[FORCE-SAVE-[^]]*\]', '', 'g')))
        = lower(btrim(regexp_replace(NEW.title, '\[FORCE-SAVE-[^]]*\]', '', 'g')))
    AND md5(lower(regexp_replace(COALESCE(options::text,''), '\s+', '', 'g')))
        = md5(lower(regexp_replace(COALESCE(NEW.options::text,''), '\s+', '', 'g')))
  ORDER BY (status='approved') DESC, created_at ASC LIMIT 1;
  IF v_master IS NULL THEN RETURN NEW; END IF;

  UPDATE content_items SET
    show_in_subjects = COALESCE(show_in_subjects,false) OR COALESCE(NEW.show_in_subjects,false),
    show_in_mock_tests = COALESCE(show_in_mock_tests,false) OR COALESCE(NEW.show_in_mock_tests,false),
    show_in_syllabus = COALESCE(show_in_syllabus,false) OR COALESCE(NEW.show_in_syllabus,false),
    updated_at = now()
  WHERE id = v_master;

  NEW.status := 'rejected';
  NEW.show_in_subjects := false; NEW.show_in_mock_tests := false; NEW.show_in_syllabus := false;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_reuse_existing_mcq ON public.content_items;
CREATE TRIGGER trg_reuse_existing_mcq BEFORE INSERT ON public.content_items
FOR EACH ROW EXECUTE FUNCTION public.reuse_existing_mcq_on_insert();

CREATE INDEX IF NOT EXISTS idx_content_items_mcq_norm_title
  ON public.content_items (lower(btrim(regexp_replace(title, '\[FORCE-SAVE-[^]]*\]', '', 'g'))))
  WHERE category = 'mcq';

-- Nightly hands-off exact-duplicate clean-up (03:30 UTC)
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.unschedule('auto-merge-exact-duplicates') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='auto-merge-exact-duplicates');
SELECT cron.schedule('auto-merge-exact-duplicates', '30 3 * * *', $$SELECT public.auto_merge_duplicate_clusters(false)$$);

-- Autofill targets every page still below the 8-MCQ index gate
UPDATE public.system_settings
SET value = jsonb_set(value::jsonb, '{min_threshold}', '8'::jsonb)
WHERE key = 'auto_fill_config' AND (value::jsonb ? 'min_threshold');