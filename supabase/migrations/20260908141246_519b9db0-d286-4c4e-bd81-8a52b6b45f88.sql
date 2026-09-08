-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Contractors
CREATE TABLE public.contractors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company text,
  phone text,
  email text,
  telegram_user_id bigint UNIQUE,
  balance_cents integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contractors TO authenticated;
GRANT ALL ON public.contractors TO service_role;
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage contractors" ON public.contractors
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER contractors_updated_at BEFORE UPDATE ON public.contractors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Leads
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  postal_code text,
  address text,
  city text,
  job_type text NOT NULL,
  description text,
  price_cents integer NOT NULL DEFAULT 2000,
  status text NOT NULL DEFAULT 'new',
  claimed_by uuid REFERENCES public.contractors(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  telegram_message_id bigint,
  dispatched_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leads_status_check CHECK (status IN ('new','dispatched','claimed','cancelled'))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage leads" ON public.leads
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Balance ledger
CREATE TABLE public.contractor_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL,
  balance_after_cents integer NOT NULL,
  kind text NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.contractor_transactions TO authenticated;
GRANT ALL ON public.contractor_transactions TO service_role;
ALTER TABLE public.contractor_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage transactions" ON public.contractor_transactions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_tx_contractor ON public.contractor_transactions(contractor_id, created_at DESC);

-- Atomic claim
CREATE OR REPLACE FUNCTION public.claim_lead(_lead_id uuid, _telegram_user_id bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
END; $$;

REVOKE ALL ON FUNCTION public.claim_lead(uuid, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_lead(uuid, bigint) TO service_role;

-- Admin top-up helper
CREATE OR REPLACE FUNCTION public.adjust_contractor_balance(_contractor_id uuid, _amount_cents integer, _note text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_new integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.contractors SET balance_cents = balance_cents + _amount_cents
    WHERE id = _contractor_id RETURNING balance_cents INTO v_new;
  IF v_new IS NULL THEN RAISE EXCEPTION 'contractor not found'; END IF;
  INSERT INTO public.contractor_transactions (contractor_id, amount_cents, balance_after_cents, kind, note)
    VALUES (_contractor_id, _amount_cents, v_new, CASE WHEN _amount_cents >= 0 THEN 'topup' ELSE 'correction' END, _note);
  RETURN v_new;
END; $$;
GRANT EXECUTE ON FUNCTION public.adjust_contractor_balance(uuid, integer, text) TO authenticated, service_role;