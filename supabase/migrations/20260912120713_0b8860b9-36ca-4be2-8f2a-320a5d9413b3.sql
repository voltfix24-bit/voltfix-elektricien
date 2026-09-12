DROP INDEX IF EXISTS public.leads_search_trgm_idx;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;
CREATE INDEX IF NOT EXISTS leads_search_trgm_idx ON public.leads USING gin (
  (coalesce(customer_name,'') || ' ' || coalesce(customer_phone,'') || ' ' || coalesce(postal_code,'') || ' ' || coalesce(city,'')) extensions.gin_trgm_ops
);