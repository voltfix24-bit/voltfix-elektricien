ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ad_click_evidence_detail text;

-- Eén regel per dossier én fase; conversieactie kan per fase verschillen.
DROP INDEX IF EXISTS ads_conversion_outbox_lead_phase_action_key;
CREATE UNIQUE INDEX IF NOT EXISTS ads_conversion_outbox_lead_phase_key
  ON public.ads_conversion_outbox (lead_id, phase, account_id);