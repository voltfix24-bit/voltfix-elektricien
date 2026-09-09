-- Voorkom dubbele bijschrijving van dezelfde betaling
CREATE UNIQUE INDEX IF NOT EXISTS contractor_transactions_payment_note_uidx
  ON public.contractor_transactions (note)
  WHERE note LIKE 'payment:%';

CREATE OR REPLACE FUNCTION public.credit_contractor_topup(
  _contractor_id uuid,
  _amount_cents integer,
  _payment_ref text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_contractor public.contractors%ROWTYPE;
  v_new integer;
BEGIN
  IF _amount_cents IS NULL OR _amount_cents <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_amount');
  END IF;

  SELECT * INTO v_contractor FROM public.contractors
    WHERE id = _contractor_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  IF EXISTS (SELECT 1 FROM public.contractor_transactions WHERE note = _payment_ref) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_credited',
      'balance_cents', v_contractor.balance_cents);
  END IF;

  UPDATE public.contractors
    SET balance_cents = balance_cents + _amount_cents
    WHERE id = _contractor_id
    RETURNING balance_cents INTO v_new;

  INSERT INTO public.contractor_transactions
    (contractor_id, amount_cents, balance_after_cents, kind, note)
    VALUES (_contractor_id, _amount_cents, v_new, 'topup', _payment_ref);

  RETURN jsonb_build_object('ok', true, 'balance_cents', v_new,
    'name', v_contractor.name, 'email', v_contractor.email,
    'telegram_user_id', v_contractor.telegram_user_id);
EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('ok', false, 'reason', 'already_credited');
END; $$;

REVOKE ALL ON FUNCTION public.credit_contractor_topup(uuid, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_contractor_topup(uuid, integer, text) TO service_role;