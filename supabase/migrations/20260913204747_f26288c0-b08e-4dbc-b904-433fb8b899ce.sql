ALTER TABLE public.leads ADD COLUMN ref_number bigint;

CREATE SEQUENCE IF NOT EXISTS public.leads_ref_number_seq OWNED BY public.leads.ref_number;

WITH ordered AS (
  SELECT id, row_number() OVER (ORDER BY created_at, id) AS rn FROM public.leads
)
UPDATE public.leads l SET ref_number = 1000 + ordered.rn FROM ordered WHERE ordered.id = l.id;

SELECT setval('public.leads_ref_number_seq', COALESCE((SELECT max(ref_number) FROM public.leads), 1000));

ALTER TABLE public.leads ALTER COLUMN ref_number SET DEFAULT nextval('public.leads_ref_number_seq');
ALTER TABLE public.leads ALTER COLUMN ref_number SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS leads_ref_number_key ON public.leads (ref_number);