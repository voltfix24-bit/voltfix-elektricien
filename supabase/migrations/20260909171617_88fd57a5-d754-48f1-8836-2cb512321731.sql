-- lovable-cron-fallback-reviewed: 288 runs/day; maximum while unclaimed leads await reminders; no enabled delay-until provider; wake on dispatch and unschedule after drain; five-minute delivery window
CREATE TABLE public.lead_reminder_config (id integer PRIMARY KEY CHECK (id = 1), token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.lead_reminder_config TO service_role;
ALTER TABLE public.lead_reminder_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service manages reminder configuration" ON public.lead_reminder_config FOR ALL TO service_role USING (true) WITH CHECK (true);
INSERT INTO public.lead_reminder_config(id) VALUES (1);
CREATE TABLE public.lead_reminders (lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE, dispatched_at timestamptz NOT NULL, sent_at timestamptz, lease_until timestamptz NOT NULL, attempts integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(lead_id, dispatched_at));
GRANT SELECT ON public.lead_reminders TO authenticated;
GRANT ALL ON public.lead_reminders TO service_role;
ALTER TABLE public.lead_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read reminder delivery" ON public.lead_reminders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service manages reminder delivery" ON public.lead_reminders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER lead_reminders_updated BEFORE UPDATE ON public.lead_reminders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER lead_reminder_config_updated BEFORE UPDATE ON public.lead_reminder_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE FUNCTION public.reserve_overdue_lead_reminders() RETURNS TABLE(lead_id uuid, dispatched_at timestamptz) LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
 INSERT INTO public.lead_reminders AS r (lead_id, dispatched_at, lease_until)
 SELECT l.id, l.dispatched_at, now() + interval '10 minutes' FROM public.leads l
 WHERE l.status = 'dispatched' AND l.claimed_by IS NULL AND l.dispatched_at IS NOT NULL
 AND l.dispatched_at + CASE WHEN l.is_urgent OR l.job_type ~* '(storing|stroomuitval|geen stroom|spoed|emergency|power outage)' THEN interval '1 hour' ELSE interval '24 hours' END < now()
 AND NOT EXISTS (SELECT 1 FROM public.lead_reminders old WHERE old.lead_id=l.id AND old.dispatched_at=l.dispatched_at AND (old.sent_at IS NOT NULL OR old.lease_until > now()))
 ORDER BY l.dispatched_at LIMIT 20
 ON CONFLICT (lead_id, dispatched_at) DO UPDATE SET lease_until=now() + interval '10 minutes', attempts=r.attempts+1
 WHERE r.sent_at IS NULL AND r.lease_until <= now()
 RETURNING r.lead_id, r.dispatched_at;
$$;
REVOKE ALL ON FUNCTION public.reserve_overdue_lead_reminders() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_overdue_lead_reminders() TO service_role;
CREATE OR REPLACE FUNCTION public.enqueue_lead_reminder_check() RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE request_id bigint;
BEGIN
 PERFORM pg_advisory_xact_lock(482901);
 IF NOT EXISTS (SELECT 1 FROM public.leads l WHERE l.status='dispatched' AND l.claimed_by IS NULL AND l.dispatched_at IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.lead_reminders r WHERE r.lead_id=l.id AND r.dispatched_at=l.dispatched_at AND r.sent_at IS NOT NULL)) THEN
   PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname='voltfix-overdue-leads';
   RETURN NULL;
 END IF;
 SELECT net.http_post(url := 'https://www.voltfix.nl/api/public/hooks/lead-reminders', headers := jsonb_build_object('Content-Type','application/json','X-Reminder-Token',(SELECT token FROM public.lead_reminder_config WHERE id=1)), body := '{}'::jsonb, timeout_milliseconds := 10000) INTO request_id;
 RETURN request_id;
END; $$;
REVOKE ALL ON FUNCTION public.enqueue_lead_reminder_check() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_lead_reminder_check() TO service_role;
CREATE OR REPLACE FUNCTION public.wake_lead_reminders() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.status='dispatched' AND NEW.claimed_by IS NULL AND NEW.dispatched_at IS NOT NULL THEN
  PERFORM pg_advisory_xact_lock(482901);
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname='voltfix-overdue-leads') THEN
   PERFORM cron.schedule('voltfix-overdue-leads','*/5 * * * *','SELECT public.enqueue_lead_reminder_check();');
  END IF;
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.wake_lead_reminders() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.wake_lead_reminders() TO service_role;
CREATE TRIGGER wake_lead_reminders AFTER INSERT OR UPDATE OF status, dispatched_at ON public.leads FOR EACH ROW EXECUTE FUNCTION public.wake_lead_reminders();
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM public.leads WHERE status='dispatched' AND claimed_by IS NULL AND dispatched_at IS NOT NULL) THEN
  PERFORM cron.schedule('voltfix-overdue-leads','*/5 * * * *','SELECT public.enqueue_lead_reminder_check();');
 END IF;
END; $$;
CREATE OR REPLACE FUNCTION public.append_lead_photos(_lead_id uuid, _paths text[]) RETURNS public.leads LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result public.leads;
BEGIN
 IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Geen beheerdersrechten'; END IF;
 IF cardinality(_paths) NOT BETWEEN 1 AND 3 OR EXISTS (SELECT 1 FROM unnest(_paths) p WHERE p !~ '^whatsapp/[a-f0-9-]+\.(jpg|png|webp)$') THEN RAISE EXCEPTION 'Ongeldige foto’s'; END IF;
 UPDATE public.leads SET image_urls = ARRAY(SELECT DISTINCT p FROM unnest(coalesce(image_urls, '{}'::text[]) || _paths) p) WHERE id = _lead_id RETURNING * INTO result;
 IF result.id IS NULL THEN RAISE EXCEPTION 'Lead niet gevonden'; END IF;
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.append_lead_photos(uuid,text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.append_lead_photos(uuid,text[]) TO authenticated, service_role;