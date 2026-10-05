ALTER TABLE public.ad_visit_pages ADD COLUMN IF NOT EXISTS country_code text;
ALTER TABLE public.ad_visit_pages ADD COLUMN IF NOT EXISTS visitor_hash text;
CREATE INDEX IF NOT EXISTS ad_visit_pages_visitor_hash_idx ON public.ad_visit_pages(visitor_hash) WHERE visitor_hash IS NOT NULL;