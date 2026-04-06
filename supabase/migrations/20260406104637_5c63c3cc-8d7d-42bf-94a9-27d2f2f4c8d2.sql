CREATE TABLE public.job_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  organization text NOT NULL,
  duration integer DEFAULT 90,
  questions integer DEFAULT 100,
  syllabus jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.job_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read job tests" ON public.job_tests
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can manage job tests" ON public.job_tests
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER update_job_tests_updated_at
  BEFORE UPDATE ON public.job_tests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();