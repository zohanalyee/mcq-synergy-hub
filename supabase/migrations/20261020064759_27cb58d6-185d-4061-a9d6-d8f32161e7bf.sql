ALTER TABLE public.ai_usage_logs DROP CONSTRAINT ai_usage_logs_source_type_check;
ALTER TABLE public.ai_usage_logs ADD CONSTRAINT ai_usage_logs_source_type_check CHECK (source_type = ANY (ARRAY[
 'user_test_session','admin_bulk_generator','auto_fill','auto_fill_run_summary','generate-test','generate-from-rag',
 'generate-job-test','ai_attempt','job_test_queue','content_health_fill','quality_gate','quality_gate_run_summary',
 'content_fill_sprint','mock_quality_gate','fetch-external-jobs','generate-blog','process-book-embedding','process-book-ocr']));