ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'admin';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS is_urgent boolean NOT NULL DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source_path text;

CREATE TABLE IF NOT EXISTS public.lead_settings (
  id integer PRIMARY KEY DEFAULT 1,
  default_price_cents integer NOT NULL DEFAULT 1000,
  urgent_price_cents integer NOT NULL DEFAULT 1000,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lead_settings_single_row CHECK (id = 1)
);

GRANT SELECT, INSERT, UPDATE ON public.lead_settings TO authenticated;
GRANT ALL ON public.lead_settings TO service_role;

ALTER TABLE public.lead_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage lead settings" ON public.lead_settings;
CREATE POLICY "Admins manage lead settings" ON public.lead_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS lead_settings_updated_at ON public.lead_settings;
CREATE TRIGGER lead_settings_updated_at BEFORE UPDATE ON public.lead_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.lead_settings (id, default_price_cents, urgent_price_cents)
VALUES (1, 1000, 1000)
ON CONFLICT (id) DO NOTHING;

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
  IF v_lead.status = 'claimed' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_claimed');
  END IF;
  IF v_lead.status = 'cancelled' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'cancelled');
  END IF;
  IF v_lead.status = 'spam_review' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'spam_review');
  END IF;
  IF v_contractor.balance_cents < v_lead.price_cents THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_balance',
      'balance_cents', v_contractor.balance_cents, 'price_cents', v_lead.price_cents);
  END IF;

  v_new_balance := v_contractor.balance_cents - v_lead.price_cents;
  UPDATE public.contractors SET balance_cents = v_new_balance WHERE id = v_contractor.id;
  UPDATE public.leads SET status = 'claimed', claimed_by = v_contractor.id, claimed_at = now()
    WHERE id = v_lead.id;
  INSERT INTO public.contractor_transactions (contractor_id, amount_cents, balance_after_cents, kind, lead_id, note)
    VALUES (v_contractor.id, -v_lead.price_cents, v_new_balance, 'lead_claim', v_lead.id, 'Lead geclaimd');

  RETURN jsonb_build_object('ok', true, 'contractor_id', v_contractor.id,
    'contractor_name', v_contractor.name, 'balance_cents', v_new_balance,
    'lead', to_jsonb(v_lead));
END; $function$;

REVOKE EXECUTE ON FUNCTION public.claim_lead(uuid, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_lead(uuid, bigint) TO service_role;