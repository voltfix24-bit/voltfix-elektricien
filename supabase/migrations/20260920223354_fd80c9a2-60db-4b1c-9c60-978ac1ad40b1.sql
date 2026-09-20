ALTER TABLE public.conversion_events
  ADD COLUMN IF NOT EXISTS consent_ad_user_data TEXT,
  ADD COLUMN IF NOT EXISTS consent_ad_storage TEXT,
  ADD COLUMN IF NOT EXISTS is_internal BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS ad_click_evidence TEXT,
  ADD COLUMN IF NOT EXISTS ad_click_linked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ad_click_linked_by UUID,
  ADD COLUMN IF NOT EXISTS ad_consent_ad_user_data TEXT;

CREATE TABLE IF NOT EXISTS public.ads_conversion_outbox (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  account_id TEXT NOT NULL,
  conversion_action_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  event_time TIMESTAMPTZ NOT NULL,
  value_cents INTEGER,
  gclid TEXT,
  gbraid TEXT,
  wbraid TEXT,
  evidence TEXT,
  consent_ad_user_data TEXT,
  is_test BOOLEAN NOT NULL DEFAULT false,
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_attempt_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  request_id TEXT,
  warnings JSONB,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ads_conversion_outbox_unique_phase UNIQUE (lead_id, account_id, conversion_action_id, phase)
);

CREATE INDEX IF NOT EXISTS ads_conversion_outbox_due_idx
  ON public.ads_conversion_outbox (status, next_attempt_at);

GRANT ALL ON public.ads_conversion_outbox TO service_role;

ALTER TABLE public.ads_conversion_outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alleen de server beheert de conversiewachtrij"
  ON public.ads_conversion_outbox FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.ads_conversion_outbox_touch()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS ads_conversion_outbox_touch_trigger ON public.ads_conversion_outbox;
CREATE TRIGGER ads_conversion_outbox_touch_trigger
  BEFORE UPDATE ON public.ads_conversion_outbox
  FOR EACH ROW EXECUTE FUNCTION public.ads_conversion_outbox_touch();