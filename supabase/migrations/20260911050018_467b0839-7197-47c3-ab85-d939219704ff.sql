ALTER TABLE public.job_test_generation_queue
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'demand';

UPDATE public.job_test_definitions
SET exam_tier = CASE
  WHEN job_title ~* '(teacher|subject specialist|specialist|coordinator|manager|instructor|nurse|ece|early childhood|hst|est|academic)' THEN 'mid'
  ELSE 'clerical'
END
WHERE exam_tier IS NULL;

INSERT INTO public.system_settings (key, value)
VALUES (
  'mock_test_fill_sprint',
  '{"enabled": true, "label": "IBA Community Colleges & Schools batch", "target_per_test": 200, "daily_budget": 300, "defer_to_exam_sprint": true, "promote_after": "2026-09-20T18:59:59Z"}'::jsonb
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;