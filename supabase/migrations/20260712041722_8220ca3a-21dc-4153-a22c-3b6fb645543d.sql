CREATE TABLE public.job_test_generation_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_test_id UUID NOT NULL,
  subject TEXT NOT NULL,
  target_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  accepted_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_test_generation_queue TO authenticated;
GRANT ALL ON public.job_test_generation_queue TO service_role;

ALTER TABLE public.job_test_generation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage job test generation queue"
  ON public.job_test_generation_queue
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE INDEX idx_jtgq_status ON public.job_test_generation_queue (status, created_at);
CREATE INDEX idx_jtgq_job_test ON public.job_test_generation_queue (job_test_id);

CREATE TRIGGER update_jtgq_updated_at
  BEFORE UPDATE ON public.job_test_generation_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.job_test_generation_queue;