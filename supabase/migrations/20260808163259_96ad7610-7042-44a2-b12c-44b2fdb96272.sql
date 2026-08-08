ALTER TABLE public.conversion_events
  ADD COLUMN IF NOT EXISTS is_bot boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bot_reason text;

CREATE INDEX IF NOT EXISTS conversion_events_is_bot_created_at_idx
  ON public.conversion_events (is_bot, created_at DESC);