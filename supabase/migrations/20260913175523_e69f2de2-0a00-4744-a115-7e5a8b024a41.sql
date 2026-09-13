DO $$ BEGIN
  CREATE TYPE public.lead_outcome AS ENUM ('done', 'declined', 'no_deal', 'unreachable');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.lead_step_kind AS ENUM ('call', 'whatsapp', 'close');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS outcome public.lead_outcome,
  ADD COLUMN IF NOT EXISTS outcome_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS outcome_note text,
  ADD COLUMN IF NOT EXISTS next_step_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS next_step_kind public.lead_step_kind,
  ADD COLUMN IF NOT EXISTS contact_attempts integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS leads_outcome_idx ON public.leads (outcome);
CREATE INDEX IF NOT EXISTS leads_next_step_at_idx ON public.leads (next_step_at) WHERE next_step_at IS NOT NULL;