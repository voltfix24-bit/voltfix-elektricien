ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS external_ref text;
CREATE UNIQUE INDEX IF NOT EXISTS leads_external_ref_key ON public.leads (external_ref) WHERE external_ref IS NOT NULL;