CREATE TABLE IF NOT EXISTS public.question_explorer_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid,
  action text NOT NULL,
  library_ids uuid[] NOT NULL DEFAULT '{}',
  mock_ids uuid[] NOT NULL DEFAULT '{}',
  library_affected integer NOT NULL DEFAULT 0,
  mock_affected integer NOT NULL DEFAULT 0,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.question_explorer_audit TO authenticated;
GRANT ALL ON public.question_explorer_audit TO service_role;

ALTER TABLE public.question_explorer_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read question explorer audit" ON public.question_explorer_audit;
CREATE POLICY "Admins can read question explorer audit"
ON public.question_explorer_audit
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.question_explorer_bulk_action(
  p_action text,
  p_library_ids uuid[] DEFAULT '{}',
  p_mock_ids uuid[] DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_lib integer := 0;
  v_mock integer := 0;
  v_kept integer := 0;
BEGIN
  IF NOT public.is_admin(v_admin) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  IF p_action NOT IN ('keep_one_hold_rest', 'unapprove_mock', 'delete') THEN
    RAISE EXCEPTION 'Unknown action: %', p_action;
  END IF;

  IF p_action = 'keep_one_hold_rest' THEN
    WITH sel AS (
      SELECT id, lower(btrim(title)) AS norm, created_at,
             row_number() OVER (
               PARTITION BY lower(btrim(title))
               ORDER BY (status = 'approved') DESC, created_at ASC, id ASC
             ) AS rn
      FROM public.content_items
      WHERE id = ANY(p_library_ids)
    ), held AS (
      UPDATE public.content_items c
      SET status = 'flagged_duplicate', updated_at = now()
      FROM sel
      WHERE c.id = sel.id AND sel.rn > 1 AND c.status <> 'flagged_duplicate'
      RETURNING c.id
    )
    SELECT (SELECT count(*) FROM held), (SELECT count(*) FROM sel WHERE rn = 1)
    INTO v_lib, v_kept;

  ELSIF p_action = 'unapprove_mock' THEN
    WITH upd AS (
      UPDATE public.job_test_questions
      SET admin_approved = false
      WHERE id = ANY(p_mock_ids) AND admin_approved IS DISTINCT FROM false
      RETURNING id
    )
    SELECT count(*) INTO v_mock FROM upd;

  ELSE
    WITH dl AS (
      DELETE FROM public.content_items WHERE id = ANY(p_library_ids) RETURNING id
    )
    SELECT count(*) INTO v_lib FROM dl;

    WITH dm AS (
      DELETE FROM public.job_test_questions WHERE id = ANY(p_mock_ids) RETURNING id
    )
    SELECT count(*) INTO v_mock FROM dm;
  END IF;

  INSERT INTO public.question_explorer_audit (
    admin_id, action, library_ids, mock_ids, library_affected, mock_affected, details
  ) VALUES (
    v_admin, p_action, p_library_ids, p_mock_ids, v_lib, v_mock,
    jsonb_build_object('kept', v_kept)
  );

  RETURN jsonb_build_object(
    'action', p_action,
    'library_affected', v_lib,
    'mock_affected', v_mock,
    'kept', v_kept
  );
END;
$$;

REVOKE ALL ON FUNCTION public.question_explorer_bulk_action(text, uuid[], uuid[]) FROM public;
GRANT EXECUTE ON FUNCTION public.question_explorer_bulk_action(text, uuid[], uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.question_explorer_bulk_action(text, uuid[], uuid[]) TO service_role;