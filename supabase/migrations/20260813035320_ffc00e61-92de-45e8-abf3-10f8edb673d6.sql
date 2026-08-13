REVOKE EXECUTE ON FUNCTION public.get_subject_aliases(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_subject_aliases(text) TO authenticated, service_role;