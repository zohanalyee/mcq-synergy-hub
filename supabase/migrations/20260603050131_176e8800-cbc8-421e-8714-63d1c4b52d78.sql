CREATE TABLE public.job_test_custom_syllabus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_test_id UUID NOT NULL,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, job_test_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_test_custom_syllabus TO authenticated;
GRANT ALL ON public.job_test_custom_syllabus TO service_role;

ALTER TABLE public.job_test_custom_syllabus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own custom syllabus"
ON public.job_test_custom_syllabus
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own custom syllabus"
ON public.job_test_custom_syllabus
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom syllabus"
ON public.job_test_custom_syllabus
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom syllabus"
ON public.job_test_custom_syllabus
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_job_test_custom_syllabus_updated_at
BEFORE UPDATE ON public.job_test_custom_syllabus
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();