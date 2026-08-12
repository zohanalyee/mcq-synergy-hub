ALTER TABLE public.ai_usage_logs DROP CONSTRAINT IF EXISTS ai_usage_logs_source_type_check;
ALTER TABLE public.ai_usage_logs ADD CONSTRAINT ai_usage_logs_source_type_check CHECK (source_type = ANY (ARRAY[
  'user_test_session','admin_bulk_generator','auto_fill','auto_fill_run_summary',
  'generate-test','generate-from-rag','generate-job-test','ai_attempt',
  'job_test_queue','content_health_fill','quality_gate','quality_gate_run_summary','content_fill_sprint'
]));

INSERT INTO public.system_settings (key, value, description)
VALUES (
  'content_fill_sprint',
  '{"enabled": false, "scope_keywords": [], "target_per_topic": 15, "daily_budget": 600}'::jsonb,
  'Content Fill Sprint mode: focus auto-fill on a priority scope with its own per-topic target and daily budget'
)
ON CONFLICT (key) DO NOTHING;