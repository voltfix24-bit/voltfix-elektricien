-- lovable-cron-fallback-reviewed: 288 runs/day; only armed while notification_outbox has pending rows; wake on enqueue and unschedule after drain; five-minute recovery window for internal lead/Telegram follow-up
CREATE OR REPLACE FUNCTION public.enqueue_notification_retry() RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE request_id bigint;
BEGIN
  PERFORM pg_advisory_xact_lock(482902);
  IF NOT EXISTS (SELECT 1 FROM public.notification_outbox WHERE status = 'pending') THEN
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'voltfix-notification-retry';
    RETURN NULL;
  END IF;
  SELECT net.http_post(
    url := 'https://www.voltfix.nl/api/public/hooks/notification-retry',
    headers := jsonb_build_object('Content-Type','application/json','X-Reminder-Token',(SELECT token FROM public.lead_reminder_config WHERE id = 1)),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  ) INTO request_id;
  RETURN request_id;
END; $$;
REVOKE ALL ON FUNCTION public.enqueue_notification_retry() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_notification_retry() TO service_role;

CREATE OR REPLACE FUNCTION public.wake_notification_retry() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    PERFORM pg_advisory_xact_lock(482902);
    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'voltfix-notification-retry') THEN
      PERFORM cron.schedule('voltfix-notification-retry','*/5 * * * *','SELECT public.enqueue_notification_retry();');
    END IF;
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.wake_notification_retry() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.wake_notification_retry() TO service_role;

DROP TRIGGER IF EXISTS wake_notification_retry ON public.notification_outbox;
CREATE TRIGGER wake_notification_retry
  AFTER INSERT OR UPDATE OF status ON public.notification_outbox
  FOR EACH ROW EXECUTE FUNCTION public.wake_notification_retry();

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.notification_outbox WHERE status = 'pending') THEN
    PERFORM cron.schedule('voltfix-notification-retry','*/5 * * * *','SELECT public.enqueue_notification_retry();');
  END IF;
END; $$;