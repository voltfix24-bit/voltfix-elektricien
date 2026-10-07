ALTER TABLE public.lead_settings
  ADD COLUMN IF NOT EXISTS priority_group_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS priority_chat_id text,
  ADD COLUMN IF NOT EXISTS priority_wait_urgent_seconds integer NOT NULL DEFAULT 180,
  ADD COLUMN IF NOT EXISTS priority_wait_planned_seconds integer NOT NULL DEFAULT 900;
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS priority_message_id bigint,
  ADD COLUMN IF NOT EXISTS priority_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS public_released_at timestamptz;
CREATE INDEX IF NOT EXISTS leads_priority_pending_idx ON public.leads (priority_sent_at)
  WHERE priority_sent_at IS NOT NULL AND public_released_at IS NULL AND claimed_by IS NULL;