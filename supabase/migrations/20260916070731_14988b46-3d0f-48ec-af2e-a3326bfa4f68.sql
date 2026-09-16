ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS quote_base_price_cents integer,
  ADD COLUMN IF NOT EXISTS install_preference text;

COMMENT ON COLUMN public.leads.quote_base_price_cents IS 'Basisprijs van het gekozen pakket in centen (klantprijs, excl. opties).';
COMMENT ON COLUMN public.leads.install_preference IS 'Korte installatievoorkeur van de klant, bv. "in overleg".';