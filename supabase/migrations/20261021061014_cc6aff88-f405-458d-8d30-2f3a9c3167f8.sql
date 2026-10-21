ALTER TABLE public.quality_job_runs
  ADD COLUMN IF NOT EXISTS last_success_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS last_error_at timestamptz,
  ADD COLUMN IF NOT EXISTS cursor jsonb;
INSERT INTO public.quality_job_runs (id, status) VALUES ('det-sweep', 'idle') ON CONFLICT (id) DO NOTHING;
UPDATE public.quality_job_runs SET lease_until = NULL WHERE id = 'quality-gate';
INSERT INTO public.system_settings (key, value)
VALUES ('quality_hide_needs_review', '{"enabled": false, "owner_approved": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;
CREATE INDEX IF NOT EXISTS idx_qqr_definition_version ON public.question_quality_reviews (definition_id, checker_version);