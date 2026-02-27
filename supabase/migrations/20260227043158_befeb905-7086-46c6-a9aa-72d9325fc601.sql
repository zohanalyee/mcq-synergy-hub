UPDATE system_settings
SET value = '{"max_requests": 1400, "max_questions": 50000}'::jsonb,
    updated_at = now()
WHERE key = 'ai_daily_limit';