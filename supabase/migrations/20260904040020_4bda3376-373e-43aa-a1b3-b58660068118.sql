REVOKE EXECUTE ON FUNCTION public.announcement_comment_guard() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.announcement_view_guard() FROM anon, authenticated, public;
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND p.proname LIKE 'announcement%'
      AND p.prorettype = 'trigger'::regtype
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, authenticated, public', r.sig);
  END LOOP;
END $$;