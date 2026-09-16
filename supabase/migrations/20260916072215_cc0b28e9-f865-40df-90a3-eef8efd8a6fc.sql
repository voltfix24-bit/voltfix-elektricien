SELECT cron.schedule(
  'voltfix-lead-digest',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://www.voltfix.nl/api/public/hooks/lead-digest',
    headers := jsonb_build_object('Content-Type','application/json','X-Reminder-Token',(SELECT token FROM public.lead_reminder_config WHERE id = 1)),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
  $$
);