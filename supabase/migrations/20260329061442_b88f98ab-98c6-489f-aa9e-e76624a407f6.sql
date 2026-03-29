SELECT cron.schedule(
  'nightly-auto-fill',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://pzhvipkcssxrsxxljbbz.supabase.co/functions/v1/scheduled-autofill',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6aHZpcGtjc3N4cnN4eGxqYmJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMjAzODYsImV4cCI6MjA1OTU5NjM4Nn0.XILYqQfW-4sqxdLXIfklKHLJVHH_tY5Ci0xNk4Kxbyw", "Content-Type": "application/json"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  ) AS request_id;
  $$
);