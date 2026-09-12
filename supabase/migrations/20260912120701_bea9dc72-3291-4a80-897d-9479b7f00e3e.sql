CREATE EXTENSION IF NOT EXISTS pg_trgm;

DO $$ BEGIN
  CREATE TYPE public.enum_pricing_type AS ENUM ('standard', 'hourly', 'fixed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.enum_lead_source AS ENUM ('website', 'phone_manual', 'whatsapp_manual', 'referral');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.enum_lead_status AS ENUM ('new', 'dispatched', 'claimed', 'cancelled', 'spam_review', 'blocked_spam');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS pricing_type public.enum_pricing_type NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS pricing_note text,
  ADD COLUMN IF NOT EXISTS idempotency_key uuid,
  ADD COLUMN IF NOT EXISTS duplicate_of_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;

UPDATE public.leads
  SET pricing_type = CASE price_status WHEN 'hourly' THEN 'hourly'::public.enum_pricing_type
                                       WHEN 'fixed' THEN 'fixed'::public.enum_pricing_type
                                       ELSE 'standard'::public.enum_pricing_type END,
      pricing_note = COALESCE(pricing_note, agreed_price_details)
  WHERE pricing_type = 'standard';

CREATE UNIQUE INDEX IF NOT EXISTS leads_idempotency_key_idx
  ON public.leads (idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS leads_created_at_id_idx ON public.leads (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS leads_status_created_at_idx ON public.leads (status, created_at DESC);
CREATE INDEX IF NOT EXISTS leads_search_trgm_idx ON public.leads USING gin (
  (coalesce(customer_name,'') || ' ' || coalesce(customer_phone,'') || ' ' || coalesce(postal_code,'') || ' ' || coalesce(city,'')) gin_trgm_ops
);

CREATE TABLE IF NOT EXISTS public.lead_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  actor_id uuid,
  action text NOT NULL,
  changes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lead_audit_logs TO authenticated;
GRANT ALL ON public.lead_audit_logs TO service_role;
ALTER TABLE public.lead_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read lead audit logs" ON public.lead_audit_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service manages lead audit logs" ON public.lead_audit_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS lead_audit_logs_lead_idx ON public.lead_audit_logs (lead_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.lead_notification_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'telegram',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  retry_count integer NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lead_notification_outbox TO authenticated;
GRANT ALL ON public.lead_notification_outbox TO service_role;
ALTER TABLE public.lead_notification_outbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read lead outbox" ON public.lead_notification_outbox
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service manages lead outbox" ON public.lead_notification_outbox
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS lead_notification_outbox_status_idx ON public.lead_notification_outbox (status, created_at);
CREATE TRIGGER lead_notification_outbox_updated_at BEFORE UPDATE ON public.lead_notification_outbox
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();