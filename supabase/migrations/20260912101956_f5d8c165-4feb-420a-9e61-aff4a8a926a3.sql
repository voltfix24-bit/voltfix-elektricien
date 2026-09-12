-- lovable-cron-fallback-reviewed: 288 runs/day; only armed while notification_outbox or lead_deliveries hold pending rows; wake on enqueue and unschedule after drain; five-minute recovery window for paid claim delivery
-- 1. Durable delivery of customer details to the claiming contractor
CREATE TABLE public.lead_deliveries (
  lead_id uuid PRIMARY KEY REFERENCES public.leads(id) ON DELETE CASCADE,
  contractor_id uuid NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
  telegram_user_id bigint,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  lease_until timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lead_deliveries TO authenticated;
GRANT ALL ON public.lead_deliveries TO service_role;
ALTER TABLE public.lead_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read lead deliveries" ON public.lead_deliveries
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service manages lead deliveries" ON public.lead_deliveries
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER lead_deliveries_updated_at BEFORE UPDATE ON public.lead_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX lead_deliveries_due_idx ON public.lead_deliveries (status, next_attempt_at) WHERE status = 'pending';

-- 2. Claim: no overwrite of an existing owner, resumable for the same winner
CREATE OR REPLACE FUNCTION public.claim_lead(_lead_id uuid, _telegram_user_id bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  v_contractor public.contractors%ROWTYPE;
  v_lead public.leads%ROWTYPE;
  v_new_balance integer;
BEGIN
  SELECT * INTO v_contractor FROM public.contractors
    WHERE telegram_user_id = _telegram_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_registered');
  END IF;
  IF NOT v_contractor.is_active THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'inactive');
  END IF;

  SELECT * INTO v_lead FROM public.leads WHERE id = _lead_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  -- Already owned: the winner may resume delivery, nobody else may claim.
  IF v_lead.claimed_by IS NOT NULL THEN
    IF v_lead.claimed_by = v_contractor.id THEN
      INSERT INTO public.lead_deliveries (lead_id, contractor_id, telegram_user_id)
        VALUES (v_lead.id, v_contractor.id, _telegram_user_id)
      ON CONFLICT (lead_id) DO UPDATE
        SET telegram_user_id = EXCLUDED.telegram_user_id,
            status = CASE WHEN public.lead_deliveries.status = 'sent' THEN 'sent' ELSE 'pending' END,
            next_attempt_at = now(),
            lease_until = NULL;
      RETURN jsonb_build_object('ok', true, 'resumed', true, 'contractor_id', v_contractor.id,
        'contractor_name', v_contractor.name, 'balance_cents', v_contractor.balance_cents,
        'lead', to_jsonb(v_lead));
    END IF;
    RETURN jsonb_build_object('ok', false, 'reason', 'already_claimed');
  END IF;

  IF v_lead.status = 'cancelled' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'cancelled');
  END IF;
  IF v_lead.status = 'spam_review' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'spam_review');
  END IF;
  -- Only explicitly claimable states; anything else is not open for sale.
  IF v_lead.status NOT IN ('new', 'dispatched') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_claimable', 'status', v_lead.status);
  END IF;

  IF v_contractor.balance_cents < v_lead.price_cents THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_balance',
      'balance_cents', v_contractor.balance_cents, 'price_cents', v_lead.price_cents);
  END IF;

  v_new_balance := v_contractor.balance_cents - v_lead.price_cents;
  UPDATE public.contractors SET balance_cents = v_new_balance WHERE id = v_contractor.id;
  UPDATE public.leads SET status = 'claimed', claimed_by = v_contractor.id, claimed_at = now()
    WHERE id = v_lead.id AND claimed_by IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'lead ownership changed during claim';
  END IF;
  INSERT INTO public.contractor_transactions (contractor_id, amount_cents, balance_after_cents, kind, lead_id, note)
    VALUES (v_contractor.id, -v_lead.price_cents, v_new_balance, 'lead_claim', v_lead.id, 'Lead geclaimd');
  -- Same transaction as the charge: paid claims always have a delivery task.
  INSERT INTO public.lead_deliveries (lead_id, contractor_id, telegram_user_id)
    VALUES (v_lead.id, v_contractor.id, _telegram_user_id)
  ON CONFLICT (lead_id) DO UPDATE SET status = 'pending', next_attempt_at = now(), lease_until = NULL;

  v_lead.status := 'claimed';
  v_lead.claimed_by := v_contractor.id;
  v_lead.claimed_at := now();

  RETURN jsonb_build_object('ok', true, 'contractor_id', v_contractor.id,
    'contractor_name', v_contractor.name, 'balance_cents', v_new_balance,
    'lead', to_jsonb(v_lead));
END; $function$;
REVOKE ALL ON FUNCTION public.claim_lead(uuid, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_lead(uuid, bigint) TO service_role;

-- 3. Authorised spam reporting
CREATE OR REPLACE FUNCTION public.report_lead_spam(_lead_id uuid, _telegram_user_id bigint, _reporter_name text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  v_contractor public.contractors%ROWTYPE;
  v_lead public.leads%ROWTYPE;
BEGIN
  SELECT * INTO v_contractor FROM public.contractors WHERE telegram_user_id = _telegram_user_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_registered'); END IF;
  IF NOT v_contractor.is_active THEN RETURN jsonb_build_object('ok', false, 'reason', 'inactive'); END IF;

  SELECT * INTO v_lead FROM public.leads WHERE id = _lead_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_found'); END IF;
  IF v_lead.claimed_by IS NOT NULL OR v_lead.status NOT IN ('new', 'dispatched') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_reportable', 'status', v_lead.status);
  END IF;

  UPDATE public.leads
    SET status = 'spam_review',
        description = coalesce(description, '') ||
          format(E'\n\n[spam gemeld door %s (%s) op %s]',
                 coalesce(nullif(_reporter_name, ''), v_contractor.name),
                 v_contractor.id,
                 to_char(now() AT TIME ZONE 'Europe/Amsterdam', 'YYYY-MM-DD HH24:MI'))
    WHERE id = v_lead.id AND claimed_by IS NULL AND status IN ('new', 'dispatched')
    RETURNING * INTO v_lead;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_reportable'); END IF;

  RETURN jsonb_build_object('ok', true, 'lead', to_jsonb(v_lead), 'contractor_name', v_contractor.name);
END; $function$;
REVOKE ALL ON FUNCTION public.report_lead_spam(uuid, bigint, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.report_lead_spam(uuid, bigint, text) TO service_role;

-- 4. Leased reservation for the notification outbox
ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS lease_until timestamptz;

CREATE OR REPLACE FUNCTION public.reserve_notifications(_limit integer, _quote_request_id uuid DEFAULT NULL)
RETURNS SETOF public.notification_outbox LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $function$
  WITH due AS (
    SELECT id FROM public.notification_outbox
    WHERE status = 'pending'
      AND next_attempt_at <= now()
      AND (lease_until IS NULL OR lease_until <= now())
      AND (_quote_request_id IS NULL OR quote_request_id = _quote_request_id)
    ORDER BY next_attempt_at
    LIMIT greatest(_limit, 1)
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.notification_outbox o
    SET lease_until = now() + interval '5 minutes'
  FROM due WHERE o.id = due.id
  RETURNING o.*;
$function$;
REVOKE ALL ON FUNCTION public.reserve_notifications(integer, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_notifications(integer, uuid) TO service_role;

-- 5. Leased reservation for claim deliveries
CREATE OR REPLACE FUNCTION public.reserve_lead_deliveries(_limit integer)
RETURNS SETOF public.lead_deliveries LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $function$
  WITH due AS (
    SELECT lead_id FROM public.lead_deliveries
    WHERE status = 'pending'
      AND next_attempt_at <= now()
      AND (lease_until IS NULL OR lease_until <= now())
    ORDER BY next_attempt_at
    LIMIT greatest(_limit, 1)
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.lead_deliveries d
    SET lease_until = now() + interval '5 minutes'
  FROM due WHERE d.lead_id = due.lead_id
  RETURNING d.*;
$function$;
REVOKE ALL ON FUNCTION public.reserve_lead_deliveries(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_lead_deliveries(integer) TO service_role;

-- 6. Automatic recovery also covers pending claim deliveries
CREATE OR REPLACE FUNCTION public.enqueue_notification_retry()
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE request_id bigint;
BEGIN
  PERFORM pg_advisory_xact_lock(482902);
  IF NOT EXISTS (SELECT 1 FROM public.notification_outbox WHERE status = 'pending')
     AND NOT EXISTS (SELECT 1 FROM public.lead_deliveries WHERE status = 'pending') THEN
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
END; $function$;
REVOKE ALL ON FUNCTION public.enqueue_notification_retry() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_notification_retry() TO service_role;

CREATE OR REPLACE FUNCTION public.wake_lead_delivery_retry() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  IF NEW.status = 'pending' THEN
    PERFORM pg_advisory_xact_lock(482902);
    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'voltfix-notification-retry') THEN
      PERFORM cron.schedule('voltfix-notification-retry','*/5 * * * *','SELECT public.enqueue_notification_retry();');
    END IF;
  END IF;
  RETURN NEW;
END; $function$;
REVOKE ALL ON FUNCTION public.wake_lead_delivery_retry() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.wake_lead_delivery_retry() TO service_role;
DROP TRIGGER IF EXISTS wake_lead_delivery_retry ON public.lead_deliveries;
CREATE TRIGGER wake_lead_delivery_retry AFTER INSERT OR UPDATE OF status ON public.lead_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.wake_lead_delivery_retry();