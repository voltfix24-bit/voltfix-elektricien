CREATE OR REPLACE FUNCTION public.admin_assign_lead(
  _lead_id uuid,
  _contractor_id uuid,
  _expected_owner uuid,
  _allow_owner_change boolean,
  _refund_previous boolean,
  _charge_new boolean,
  _reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_lead public.leads%ROWTYPE;
  v_new public.contractors%ROWTYPE;
  v_prev public.contractors%ROWTYPE;
  v_price integer;
  v_note text;
  v_new_balance integer;
  v_prev_balance integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO v_lead FROM public.leads WHERE id = _lead_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;
  IF v_lead.status IN ('cancelled', 'blocked_spam') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_assignable', 'status', v_lead.status);
  END IF;

  -- Twee beheerders tegelijk: wie tweede is, wijzigt niets.
  IF v_lead.claimed_by IS DISTINCT FROM _expected_owner THEN
    SELECT * INTO v_prev FROM public.contractors WHERE id = v_lead.claimed_by;
    RETURN jsonb_build_object('ok', false, 'reason', 'owner_changed',
      'current_owner_id', v_lead.claimed_by, 'current_owner_name', v_prev.name);
  END IF;

  IF v_lead.claimed_by IS NOT NULL AND NOT coalesce(_allow_owner_change, false) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_owned');
  END IF;
  IF v_lead.claimed_by = _contractor_id THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_assigned');
  END IF;

  SELECT * INTO v_new FROM public.contractors WHERE id = _contractor_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'contractor_not_found');
  END IF;
  IF NOT v_new.is_active THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'inactive', 'contractor_name', v_new.name);
  END IF;

  v_price := coalesce(v_lead.price_cents, 0);
  IF v_new.balance_cents < v_price THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_balance',
      'contractor_name', v_new.name,
      'balance_cents', v_new.balance_cents,
      'price_cents', v_price);
  END IF;

  v_note := coalesce(nullif(trim(coalesce(_reason, '')), ''), 'Toewijzing door kantoor');

  IF coalesce(_refund_previous, false) AND v_lead.claimed_by IS NOT NULL AND v_price > 0 THEN
    SELECT * INTO v_prev FROM public.contractors WHERE id = v_lead.claimed_by FOR UPDATE;
    IF FOUND THEN
      UPDATE public.contractors SET balance_cents = balance_cents + v_price
        WHERE id = v_prev.id RETURNING balance_cents INTO v_prev_balance;
      INSERT INTO public.contractor_transactions
        (contractor_id, amount_cents, balance_after_cents, kind, lead_id, note)
        VALUES (v_prev.id, v_price, v_prev_balance, 'correction', v_lead.id, 'Terugbetaling: ' || v_note);
    END IF;
  END IF;

  v_new_balance := v_new.balance_cents;
  IF coalesce(_charge_new, false) AND v_price > 0 THEN
    UPDATE public.contractors SET balance_cents = balance_cents - v_price
      WHERE id = v_new.id RETURNING balance_cents INTO v_new_balance;
    INSERT INTO public.contractor_transactions
      (contractor_id, amount_cents, balance_after_cents, kind, lead_id, note)
      VALUES (v_new.id, -v_price, v_new_balance, 'lead_claim', v_lead.id, v_note);
  END IF;

  UPDATE public.leads
     SET claimed_by = _contractor_id,
         claimed_at = now(),
         status = 'claimed',
         first_contact_at = first_contact_at
   WHERE id = v_lead.id
     AND claimed_by IS NOT DISTINCT FROM _expected_owner
  RETURNING * INTO v_lead;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'lead ownership changed during assignment';
  END IF;

  RETURN jsonb_build_object('ok', true,
    'lead', to_jsonb(v_lead),
    'contractor_id', v_new.id,
    'contractor_name', v_new.name,
    'telegram_user_id', v_new.telegram_user_id,
    'balance_cents', v_new_balance,
    'previous_owner_id', _expected_owner,
    'previous_owner_name', v_prev.name,
    'refunded_cents', CASE WHEN coalesce(_refund_previous, false) AND _expected_owner IS NOT NULL THEN v_price ELSE 0 END,
    'charged_cents', CASE WHEN coalesce(_charge_new, false) THEN v_price ELSE 0 END);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_assign_lead(uuid, uuid, uuid, boolean, boolean, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_assign_lead(uuid, uuid, uuid, boolean, boolean, boolean, text) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_release_lead(
  _lead_id uuid,
  _expected_owner uuid,
  _refund_previous boolean,
  _reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_lead public.leads%ROWTYPE;
  v_prev public.contractors%ROWTYPE;
  v_price integer;
  v_note text;
  v_balance integer;
  v_status text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO v_lead FROM public.leads WHERE id = _lead_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;
  IF v_lead.claimed_by IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_owned');
  END IF;
  IF v_lead.claimed_by IS DISTINCT FROM _expected_owner THEN
    SELECT * INTO v_prev FROM public.contractors WHERE id = v_lead.claimed_by;
    RETURN jsonb_build_object('ok', false, 'reason', 'owner_changed',
      'current_owner_id', v_lead.claimed_by, 'current_owner_name', v_prev.name);
  END IF;

  v_price := coalesce(v_lead.price_cents, 0);
  v_note := coalesce(nullif(trim(coalesce(_reason, '')), ''), 'Toewijzing opgeheven door kantoor');

  SELECT * INTO v_prev FROM public.contractors WHERE id = v_lead.claimed_by FOR UPDATE;
  IF coalesce(_refund_previous, false) AND v_price > 0 AND FOUND THEN
    UPDATE public.contractors SET balance_cents = balance_cents + v_price
      WHERE id = v_prev.id RETURNING balance_cents INTO v_balance;
    INSERT INTO public.contractor_transactions
      (contractor_id, amount_cents, balance_after_cents, kind, lead_id, note)
      VALUES (v_prev.id, v_price, v_balance, 'correction', v_lead.id, 'Terugbetaling: ' || v_note);
  END IF;

  -- Terug naar de stand van vóór de toewijzing.
  v_status := CASE WHEN v_lead.dispatched_at IS NOT NULL OR v_lead.telegram_message_id IS NOT NULL
                   THEN 'dispatched' ELSE 'new' END;

  UPDATE public.leads
     SET claimed_by = NULL,
         claimed_at = NULL,
         status = v_status,
         scheduled_at = NULL
   WHERE id = v_lead.id
     AND claimed_by IS NOT DISTINCT FROM _expected_owner
  RETURNING * INTO v_lead;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'lead ownership changed during release';
  END IF;

  DELETE FROM public.lead_deliveries WHERE lead_id = v_lead.id;

  RETURN jsonb_build_object('ok', true,
    'lead', to_jsonb(v_lead),
    'previous_owner_id', _expected_owner,
    'previous_owner_name', v_prev.name,
    'refunded_cents', CASE WHEN coalesce(_refund_previous, false) THEN v_price ELSE 0 END,
    'status', v_status);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_release_lead(uuid, uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_release_lead(uuid, uuid, boolean, text) TO service_role;