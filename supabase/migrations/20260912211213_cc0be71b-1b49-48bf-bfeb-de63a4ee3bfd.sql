ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS service_answers jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.quote_requests.service_answers IS
  'Dienstspecifieke intake-antwoorden als stabiele codes (geen vertaalde UI-teksten). Leeg object voor historische rijen.';