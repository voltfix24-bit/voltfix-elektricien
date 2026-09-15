ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS customer_price_cents integer,
  ADD COLUMN IF NOT EXISTS quote_kind text,
  ADD COLUMN IF NOT EXISTS quote_package text,
  ADD COLUMN IF NOT EXISTS quote_options jsonb,
  ADD COLUMN IF NOT EXISTS scheduled_slot text;

CREATE TABLE IF NOT EXISTS public.lead_job_prices (
  job_type text PRIMARY KEY,
  label text,
  price_cents integer NOT NULL DEFAULT 1000,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_job_prices TO authenticated;
GRANT ALL ON public.lead_job_prices TO service_role;

ALTER TABLE public.lead_job_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins beheren leadprijzen per klussoort" ON public.lead_job_prices;
CREATE POLICY "Admins beheren leadprijzen per klussoort"
  ON public.lead_job_prices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_lead_job_prices_updated_at ON public.lead_job_prices;
CREATE TRIGGER update_lead_job_prices_updated_at
  BEFORE UPDATE ON public.lead_job_prices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.lead_job_prices (job_type, label, price_cents) VALUES
  ('groepenkast', 'Groepenkast vervangen', 2000),
  ('groepenkast-schouw', 'Groepenkast schouw (€90)', 1000),
  ('storing', 'Spoed / storing', 1000)
ON CONFLICT (job_type) DO NOTHING;