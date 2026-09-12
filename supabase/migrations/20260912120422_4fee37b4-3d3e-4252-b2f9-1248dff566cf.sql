ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS intake_session_id uuid,
  ADD COLUMN IF NOT EXISTS service text,
  ADD COLUMN IF NOT EXISTS intent text,
  ADD COLUMN IF NOT EXISTS source_page text;

CREATE UNIQUE INDEX IF NOT EXISTS leads_intake_session_idx
  ON public.leads (intake_session_id)
  WHERE intake_session_id IS NOT NULL;