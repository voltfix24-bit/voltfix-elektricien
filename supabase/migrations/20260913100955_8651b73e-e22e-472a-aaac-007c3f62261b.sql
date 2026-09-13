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
      AND coalesce(l.dispatched_at, l.created_at) + make_interval(mins =>
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

REVOKE ALL ON FUNCTION public.reserve_lead_escalations(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_lead_escalations(integer) TO service_role;

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
    'lead', to_jsonb(v_lead));
END; $function$;

REVOKE ALL ON FUNCTION public.claim_lead(uuid, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_lead(uuid, bigint) TO service_role;