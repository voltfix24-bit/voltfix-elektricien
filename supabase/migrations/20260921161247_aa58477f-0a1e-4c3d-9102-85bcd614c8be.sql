ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS qualified_at timestamptz,
  ADD COLUMN IF NOT EXISTS qualified_by uuid,
  ADD COLUMN IF NOT EXISTS qualification_note text,
  ADD COLUMN IF NOT EXISTS disqualified_at timestamptz,
  ADD COLUMN IF NOT EXISTS disqualification_reason text;

ALTER TABLE public.ads_conversion_outbox
  ADD COLUMN IF NOT EXISTS phase_source text,
  ADD COLUMN IF NOT EXISTS inflight_since timestamptz,
  ADD COLUMN IF NOT EXISTS recovered_count integer NOT NULL DEFAULT 0;

UPDATE public.ads_conversion_outbox
   SET phase_source = COALESCE(phase_source, 'legacy_pre_split')
 WHERE phase_source IS NULL;

ALTER TABLE public.ads_conversion_outbox
  DROP CONSTRAINT IF EXISTS ads_conversion_outbox_unique_phase;

CREATE INDEX IF NOT EXISTS ads_conversion_outbox_inflight_idx
  ON public.ads_conversion_outbox (status, inflight_since);