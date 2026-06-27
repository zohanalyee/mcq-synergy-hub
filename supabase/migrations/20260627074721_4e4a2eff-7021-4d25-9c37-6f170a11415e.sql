ALTER TABLE public.job_tests
  ADD COLUMN IF NOT EXISTS definition_id uuid REFERENCES public.job_test_definitions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_job_tests_definition_id ON public.job_tests(definition_id);