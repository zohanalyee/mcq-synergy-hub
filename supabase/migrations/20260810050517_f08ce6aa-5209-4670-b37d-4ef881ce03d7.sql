CREATE TABLE public.email_prefs (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  streak_reminders BOOLEAN NOT NULL DEFAULT true,
  last_reminder_at TIMESTAMPTZ,
  unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX email_prefs_unsubscribe_token_idx ON public.email_prefs(unsubscribe_token);

GRANT SELECT, INSERT, UPDATE ON public.email_prefs TO authenticated;
GRANT ALL ON public.email_prefs TO service_role;

ALTER TABLE public.email_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email prefs" ON public.email_prefs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own email prefs" ON public.email_prefs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own email prefs" ON public.email_prefs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_email_prefs_updated_at BEFORE UPDATE ON public.email_prefs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.email_send_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  email_type TEXT NOT NULL,
  status TEXT NOT NULL,
  error TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX email_send_log_created_at_idx ON public.email_send_log(created_at DESC);

GRANT SELECT ON public.email_send_log TO authenticated;
GRANT ALL ON public.email_send_log TO service_role;

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email send log" ON public.email_send_log
  FOR SELECT TO authenticated USING (public.is_admin());

INSERT INTO public.email_prefs (user_id)
SELECT id FROM auth.users ON CONFLICT (user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.seed_email_prefs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  INSERT INTO public.email_prefs (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER seed_email_prefs_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.seed_email_prefs();