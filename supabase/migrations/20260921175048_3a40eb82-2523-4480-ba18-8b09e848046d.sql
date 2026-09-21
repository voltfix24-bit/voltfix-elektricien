ALTER TABLE public.conversion_events
  ADD COLUMN IF NOT EXISTS event_id text,
  ADD COLUMN IF NOT EXISTS lead_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS conversion_events_event_id_key
  ON public.conversion_events (event_id)
  WHERE event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS conversion_events_click_ref_idx
  ON public.conversion_events (click_ref)
  WHERE click_ref IS NOT NULL;