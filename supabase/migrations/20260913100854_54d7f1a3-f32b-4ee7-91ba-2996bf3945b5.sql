-- lovable-cron-fallback-reviewed: 1440 runs/day; only while an unclaimed lead exists (wake-on-insert, unschedule-after-drain); a 15-minute emergency escalation cannot be met hourly and cannot be derived lazily because the alert must fire while nobody is looking at a page.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS escalated_at timestamptz,
  ADD COLUMN IF NOT EXISTS first_contact_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_customer_message_at timestamptz;

ALTER TABLE public.lead_settings
  ADD COLUMN IF NOT EXISTS escalation_urgent_minutes integer NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS escalation_planned_minutes integer NOT NULL DEFAULT 240;

CREATE INDEX IF NOT EXISTS leads_escalation_pending_idx
  ON public.leads (created_at)
  WHERE escalated_at IS NULL AND claimed_by IS NULL AND status IN ('new', 'dispatched');

CREATE OR REPLACE FUNCTION public.reserve_lead_escalations(_limit integer DEFAULT 20)
RETURNS SETOF public.leads
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH cfg AS (
    SELECT coalesce(max(escalation_urgent_minutes), 15) AS urgent_minutes,
           coalesce(max(escalation_planned_minutes), 240) AS planned_minutes
    FROM public.lead_settings WHERE id = 1
  ), due AS (
    SELECT l.id FROM public.leads l, cfg
    WHERE l.escalated_at IS NULL
      AND l.claimed_by IS NULL
      AND l.status IN ('new', 'dispatched')
      AND l.created_at + make_interval(mins =>
            CASE WHEN l.is_urgent OR l.job_type ~* '(storing|stroomuitval|geen stroom|kortsluiting|spoed|emergency|power outage)'
                 THEN cfg.urgent_minutes ELSE cfg.planned_minutes END) < now()
    ORDER BY l.created_at
    LIMIT greatest(_limit, 1)
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.leads l SET escalated_at = now()
  FROM due WHERE l.id = due.id AND l.escalated_at IS NULL
  RETURNING l.*;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_lead_escalation_check()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE request_id bigint;
BEGIN
  PERFORM pg_advisory_xact_lock(482903);
  IF NOT EXISTS (
    SELECT 1 FROM public.leads
    WHERE escalated_at IS NULL AND claimed_by IS NULL AND status IN ('new', 'dispatched')
  ) THEN
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'voltfix-lead-escalation';
    RETURN NULL;
  END IF;
  SELECT net.http_post(
    url := 'https://www.voltfix.nl/api/public/hooks/lead-escalation',
    headers := jsonb_build_object('Content-Type','application/json','X-Reminder-Token',(SELECT token FROM public.lead_reminder_config WHERE id = 1)),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  ) INTO request_id;
  RETURN request_id;
END; $$;

CREATE OR REPLACE FUNCTION public.wake_lead_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.escalated_at IS NULL AND NEW.claimed_by IS NULL AND NEW.status IN ('new', 'dispatched') THEN
    PERFORM pg_advisory_xact_lock(482903);
    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'voltfix-lead-escalation') THEN
      PERFORM cron.schedule('voltfix-lead-escalation','* * * * *','SELECT public.enqueue_lead_escalation_check();');
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS wake_lead_escalation ON public.leads;
CREATE TRIGGER wake_lead_escalation
AFTER INSERT OR UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.wake_lead_escalation();