DO $$
DECLARE tok text;
BEGIN
  SELECT value::text INTO tok FROM public.system_settings WHERE key = 'indexnow_cron_token';
  tok := trim(both '"' from tok);

  PERFORM cron.unschedule('process-jobtest-queue-every-5min');

  PERFORM cron.schedule(
    'process-jobtest-queue-every-5min',
    '*/5 * * * *',
    format($cmd$
      select net.http_post(
        url:='https://pzhvipkcssxrsxxljbbz.supabase.co/functions/v1/process-jobtest-queue',
        headers:=jsonb_build_object('Content-Type','application/json','x-cron-token',%L),
        body:=concat('{"time": "', now(), '"}')::jsonb
      ) as request_id;
    $cmd$, tok)
  );
END $$;