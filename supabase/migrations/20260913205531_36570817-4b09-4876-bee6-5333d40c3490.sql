ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS schedule_prompt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS schedule_prompt_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_closed_at timestamptz;

CREATE OR REPLACE FUNCTION public.is_planned_lead(_is_urgent boolean, _job_type text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT NOT coalesce(_is_urgent, false)
     AND coalesce(_job_type, '') !~* '(storing|stroomuitval|geen stroom|kortsluiting|spoed|emergency|power outage)'
$$;

CREATE INDEX IF NOT EXISTS leads_schedule_pending_idx
  ON public.leads (schedule_prompt_at)
  WHERE status = 'claimed' AND scheduled_at IS NULL AND outcome IS NULL;

CREATE OR REPLACE FUNCTION public.reserve_schedule_prompts(_limit integer DEFAULT 20)
RETURNS SETOF public.leads
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.leads l
     SET schedule_prompt_count = l.schedule_prompt_count + 1,
         schedule_prompt_at = now()
   WHERE l.id IN (
     SELECT c.id FROM public.leads c
      WHERE c.status = 'claimed'
        AND c.claimed_by IS NOT NULL
        AND c.outcome IS NULL
        AND c.scheduled_at IS NULL
        AND public.is_planned_lead(c.is_urgent, c.job_type)
        AND c.schedule_prompt_count < 2
        AND (c.schedule_prompt_at IS NULL OR c.schedule_prompt_at < now() - interval '4 hours')
        AND coalesce(c.claimed_at, c.created_at) < now() - interval '4 hours'
      ORDER BY c.claimed_at
      LIMIT coalesce(_limit, 20)
      FOR UPDATE SKIP LOCKED
   )
  RETURNING l.*;
$$;

REVOKE ALL ON FUNCTION public.reserve_schedule_prompts(integer) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_schedule_prompts(integer) TO service_role;

CREATE OR REPLACE FUNCTION public.claim_lead(_lead_id uuid, _telegram_user_id bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_contractor public.contractors%ROWTYPE;
  v_lead public.leads%ROWTYPE;
  v_new_balance integer;
  v_settings public.lead_settings%ROWTYPE;
  v_busy boolean;
  v_someone_free boolean;
  v_seconds_left integer;
  v_blocking public.leads%ROWTYPE;
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
  IF v_lead.status NOT IN ('new', 'dispatched') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_claimable', 'status', v_lead.status);
  END IF;

  -- Harde rem: gepland werk zonder dag en tijd blokkeert een tweede geplande
  -- klus. Storingen laten we altijd door.
  IF public.is_planned_lead(v_lead.is_urgent, v_lead.job_type) THEN
    SELECT * INTO v_blocking FROM public.leads b
      WHERE b.claimed_by = v_contractor.id
        AND b.status = 'claimed'
        AND b.outcome IS NULL
        AND b.scheduled_at IS NULL
        AND public.is_planned_lead(b.is_urgent, b.job_type)
      ORDER BY b.claimed_at
      LIMIT 1;
    IF FOUND THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'schedule_missing',
        'blocking_lead_id', v_blocking.id,
        'blocking_address', coalesce(nullif(trim(coalesce(v_blocking.address, '')), ''), coalesce(v_blocking.city, 'je open klus')));
    END IF;
  END IF;

  -- Voorrangsregel: alleen bij storingen, alleen als deze monteur nog op een
  -- storing zit én er iemand vrij is om voor te gaan. Gepland werk: nooit.
  SELECT * INTO v_settings FROM public.lead_settings WHERE id = 1;
  IF v_lead.is_urgent
     AND coalesce(v_settings.claim_priority_enabled, true)
     AND coalesce(v_settings.claim_delay_seconds, 120) > 0
     AND v_lead.dispatched_at IS NOT NULL THEN
    v_busy := v_contractor.last_storing_claim_at IS NOT NULL
      AND v_contractor.last_storing_claim_at
          > now() - make_interval(mins => coalesce(v_settings.busy_window_minutes, 120));
    IF v_busy THEN
      SELECT EXISTS (
        SELECT 1 FROM public.contractors c
        WHERE c.is_active
          AND c.id <> v_contractor.id
          AND (c.last_storing_claim_at IS NULL
               OR c.last_storing_claim_at
                  <= now() - make_interval(mins => coalesce(v_settings.busy_window_minutes, 120)))
      ) INTO v_someone_free;
      IF v_someone_free THEN
        v_seconds_left := ceil(extract(epoch FROM (
          v_lead.dispatched_at
          + make_interval(secs => coalesce(v_settings.claim_delay_seconds, 120))
          - now()
        )));
        IF v_seconds_left > 0 THEN
          RETURN jsonb_build_object('ok', false, 'reason', 'too_early',
            'seconds_left', v_seconds_left,
            'since', v_contractor.last_storing_claim_at);
        END IF;
      END IF;
    END IF;
  END IF;

  IF v_contractor.balance_cents < v_lead.price_cents THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_balance',
      'balance_cents', v_contractor.balance_cents, 'price_cents', v_lead.price_cents);
  END IF;

  v_new_balance := v_contractor.balance_cents - v_lead.price_cents;
  UPDATE public.contractors SET balance_cents = v_new_balance WHERE id = v_contractor.id;
  -- Een claim telt als eerste contact wanneer er nog geen eerder contact was.
  UPDATE public.leads SET status = 'claimed', claimed_by = v_contractor.id, claimed_at = now(),
      first_contact_at = coalesce(first_contact_at, now())
    WHERE id = v_lead.id AND claimed_by IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'lead ownership changed during claim';
  END IF;

  -- Alleen een storing maakt iemand "bezig"; het vorige moment bewaren zodat
  -- een annulering de toestand kan terugdraaien.
  IF v_lead.is_urgent THEN
    UPDATE public.contractors
      SET prev_storing_claim_at = last_storing_claim_at,
          last_storing_claim_at = now()
      WHERE id = v_contractor.id;
  END IF;

  INSERT INTO public.contractor_transactions (contractor_id, amount_cents, balance_after_cents, kind, lead_id, note)
    VALUES (v_contractor.id, -v_lead.price_cents, v_new_balance, 'lead_claim', v_lead.id, 'Lead geclaimd');
  INSERT INTO public.lead_deliveries (lead_id, contractor_id, telegram_user_id)
    VALUES (v_lead.id, v_contractor.id, _telegram_user_id)
  ON CONFLICT (lead_id) DO UPDATE SET status = 'pending', next_attempt_at = now(), lease_until = NULL;

  v_lead.status := 'claimed';
  v_lead.claimed_by := v_contractor.id;
  v_lead.claimed_at := now();

  RETURN jsonb_build_object('ok', true, 'contractor_id', v_contractor.id,
    'contractor_name', v_contractor.name, 'balance_cents', v_new_balance,
    'lead', to_jsonb(v_lead),
    'planned', public.is_planned_lead(v_lead.is_urgent, v_lead.job_type));
END;
$function$;