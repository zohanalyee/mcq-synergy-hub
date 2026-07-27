
-- 1) Fix honeypot policy endpoint name
DROP POLICY IF EXISTS "Allow anonymous honeypot inserts" ON public.scraper_signals;
CREATE POLICY "Allow anonymous honeypot inserts"
ON public.scraper_signals
FOR INSERT
TO anon, authenticated
WITH CHECK (endpoint = 'honeypot-questions-dump' AND signal_type = 'honeypot');

-- 2) Harden user_inquiries: email regex + tighter caps
DROP POLICY IF EXISTS "Anyone can submit inquiry with validation" ON public.user_inquiries;
CREATE POLICY "Anyone can submit inquiry with validation"
ON public.user_inquiries
FOR INSERT
TO anon, authenticated
WITH CHECK (
  name IS NOT NULL AND length(name) BETWEEN 1 AND 200
  AND email IS NOT NULL AND length(email) BETWEEN 3 AND 255
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND subject IS NOT NULL AND length(subject) BETWEEN 1 AND 500
  AND message IS NOT NULL AND length(message) BETWEEN 1 AND 5000
);

-- 3) Harden guest user_feedback: length caps + force is_public=false on guest rows (admin approves later)
DROP POLICY IF EXISTS "Guest feedback allowed" ON public.user_feedback;
CREATE POLICY "Guest feedback allowed"
ON public.user_feedback
FOR INSERT
TO anon
WITH CHECK (
  is_guest = true
  AND user_id IS NULL
  AND COALESCE(length(message), 0) <= 2000
  AND (user_name IS NULL OR length(user_name) <= 100)
  AND is_public = false
);

-- 4) Revoke anon EXECUTE from trigger-only and privileged SECURITY DEFINER functions.
DO $$
DECLARE
  fn_sig text;
BEGIN
  FOR fn_sig IN
    SELECT p.oid::regprocedure::text
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND p.proname IN (
        'handle_new_user',
        'seed_user_credits',
        'sync_user_question_mastery',
        'rls_auto_enable',
        'backfill_topic_ids',
        'log_credit_transaction',
        'deduct_credits'
      )
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', fn_sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', fn_sig);
  END LOOP;
END $$;
