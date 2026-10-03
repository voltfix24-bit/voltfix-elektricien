ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS acquisition_channel text,
  ADD COLUMN IF NOT EXISTS customer_first_contact_at timestamptz,
  ADD COLUMN IF NOT EXISTS invoiced_amount_cents integer;
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_invoiced_amount_nonneg;
ALTER TABLE public.leads ADD CONSTRAINT leads_invoiced_amount_nonneg CHECK (invoiced_amount_cents IS NULL OR (invoiced_amount_cents >= 0 AND invoiced_amount_cents <= 10000000));
CREATE INDEX IF NOT EXISTS leads_customer_first_contact_at_idx ON public.leads (customer_first_contact_at);

ALTER TABLE public.ad_visit_pages
  ADD COLUMN IF NOT EXISTS traffic_source text NOT NULL DEFAULT 'ads',
  ADD COLUMN IF NOT EXISTS referrer_host text;
CREATE INDEX IF NOT EXISTS ad_visit_pages_source_entered_idx ON public.ad_visit_pages (traffic_source, entered_at);