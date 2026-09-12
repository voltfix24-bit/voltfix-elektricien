ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS review_rating smallint;
ALTER TABLE public.leads ADD CONSTRAINT leads_review_rating_range CHECK (review_rating IS NULL OR (review_rating BETWEEN 1 AND 5));
ALTER TABLE public.contractors ADD COLUMN IF NOT EXISTS five_star_reviews integer NOT NULL DEFAULT 0;
ALTER TABLE public.contractors ADD COLUMN IF NOT EXISTS avg_rating numeric(3,2);

CREATE OR REPLACE FUNCTION public.approve_review_bonus(_lead_id uuid, _amount_cents integer, _rating smallint DEFAULT 5)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_lead public.leads%ROWTYPE;
  v_contractor public.contractors%ROWTYPE;
  v_new integer;
  v_avg numeric(3,2);
  v_total integer;
  v_five integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Geen beheerdersrechten';
  END IF;
  IF _rating IS NULL OR _rating < 1 OR _rating > 5 THEN
    RAISE EXCEPTION 'Ongeldige beoordeling';
  END IF;
  IF _amount_cents IS NULL OR _amount_cents < 0 OR _amount_cents > 100000 THEN
    RAISE EXCEPTION 'Ongeldig bonusbedrag';
  END IF;
  IF _rating < 5 AND _amount_cents > 0 THEN
    RAISE EXCEPTION 'Bonus alleen bij 5 sterren';
  END IF;

  SELECT * INTO v_lead FROM public.leads WHERE id = _lead_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lead niet gevonden'; END IF;
  IF v_lead.claimed_by IS NULL THEN RAISE EXCEPTION 'Lead heeft geen monteur'; END IF;
  IF v_lead.reviewed_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_rewarded');
  END IF;

  SELECT * INTO v_contractor FROM public.contractors WHERE id = v_lead.claimed_by FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ZZP''er niet gevonden'; END IF;

  UPDATE public.leads SET reviewed_at = now(), review_rating = _rating WHERE id = _lead_id;

  SELECT count(*)::int, count(*) FILTER (WHERE review_rating = 5)::int, round(avg(review_rating)::numeric, 2)
    INTO v_total, v_five, v_avg
    FROM public.leads
    WHERE claimed_by = v_contractor.id AND review_rating IS NOT NULL;

  IF _amount_cents > 0 THEN
    UPDATE public.contractors
      SET balance_cents = balance_cents + _amount_cents,
          review_count = v_total,
          five_star_reviews = v_five,
          avg_rating = v_avg
      WHERE id = v_contractor.id
      RETURNING balance_cents INTO v_new;

    INSERT INTO public.contractor_transactions
      (contractor_id, amount_cents, balance_after_cents, kind, lead_id, note)
      VALUES (v_contractor.id, _amount_cents, v_new, 'review_bonus', _lead_id, 'Bonus 5-sterrenreview');
  ELSE
    UPDATE public.contractors
      SET review_count = v_total,
          five_star_reviews = v_five,
          avg_rating = v_avg
      WHERE id = v_contractor.id
      RETURNING balance_cents INTO v_new;
  END IF;

  RETURN jsonb_build_object('ok', true, 'balance_cents', v_new, 'rating', _rating,
    'avg_rating', v_avg, 'total_reviews', v_total, 'five_star_reviews', v_five,
    'contractor_id', v_contractor.id, 'contractor_name', v_contractor.name,
    'telegram_user_id', v_contractor.telegram_user_id);
END; $function$;