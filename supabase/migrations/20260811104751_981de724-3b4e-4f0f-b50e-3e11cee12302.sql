SELECT cron.alter_job(
  job_id := 1,
  schedule := '0 */3 * * *',
  command := $$
  SELECT net.http_post(
    url := 'https://pzhvipkcssxrsxxljbbz.supabase.co/functions/v1/scheduled-autofill',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-token', (SELECT value #>> '{}' FROM public.system_settings WHERE key = 'indexnow_cron_token')
    ),
    body := '{"scheduled": true}'::jsonb,
    timeout_milliseconds := 300000
  ) AS request_id;
  $$
);