ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS consent_ticket_id uuid;
ALTER TABLE public.conversion_events ADD COLUMN IF NOT EXISTS consent_ticket_id uuid;
CREATE INDEX IF NOT EXISTS leads_consent_ticket_idx ON public.leads (consent_ticket_id);
CREATE INDEX IF NOT EXISTS conversion_events_consent_ticket_idx ON public.conversion_events (consent_ticket_id);