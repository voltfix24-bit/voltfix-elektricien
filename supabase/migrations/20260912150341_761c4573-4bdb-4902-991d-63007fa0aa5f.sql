ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS review_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

ALTER TABLE public.contractors
  ADD COLUMN IF NOT EXISTS review_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS leads_review_requested_at_idx
  ON public.leads (review_requested_at DESC) WHERE review_requested_at IS NOT NULL;

CREATE OR REPLACE FUNCTION public.approve_review_bonus(_lead_id uuid, _amount_cents integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.leads%ROWTYPE;
  v_contractor public.contractors%ROWTYPE;
  v_new integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Geen beheerdersrechten';
  END IF;
  IF _amount_cents IS NULL OR _amount_cents <= 0 OR _amount_cents > 100000 THEN
    RAISE EXCEPTION 'Ongeldig bonusbedrag';
  END IF;

  SELECT * INTO v_lead FROM public.leads WHERE id = _lead_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lead niet gevonden'; END IF;
  IF v_lead.claimed_by IS NULL THEN RAISE EXCEPTION 'Lead heeft geen monteur'; END IF;
  IF v_lead.reviewed_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_rewarded');
  END IF;

  SELECT * INTO v_contractor FROM public.contractors WHERE id = v_lead.claimed_by FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ZZP''er niet gevonden'; END IF;

  UPDATE public.leads SET reviewed_at = now() WHERE id = _lead_id;

  UPDATE public.contractors
    SET balance_cents = balance_cents + _amount_cents,
        review_count = review_count + 1
    WHERE id = v_contractor.id
    RETURNING balance_cents INTO v_new;

  INSERT INTO public.contractor_transactions
    (contractor_id, amount_cents, balance_after_cents, kind, lead_id, note)
    VALUES (v_contractor.id, _amount_cents, v_new, 'review_bonus', _lead_id, 'Bonus 5-sterrenreview');

  RETURN jsonb_build_object('ok', true, 'balance_cents', v_new,
    'contractor_id', v_contractor.id, 'contractor_name', v_contractor.name,
    'telegram_user_id', v_contractor.telegram_user_id);
END; $$;

REVOKE ALL ON FUNCTION public.approve_review_bonus(uuid, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.approve_review_bonus(uuid, integer) TO authenticated;