CREATE TABLE IF NOT EXISTS public.ad_consent_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE,
  gclid text,
  gbraid text,
  wbraid text,
  click_ref text,
  last_seq bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ad_consent_tickets TO service_role;
ALTER TABLE public.ad_consent_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consent tickets service only" ON public.ad_consent_tickets FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS ad_consent_tickets_gclid_idx ON public.ad_consent_tickets (gclid);
CREATE INDEX IF NOT EXISTS ad_consent_tickets_gbraid_idx ON public.ad_consent_tickets (gbraid);
CREATE INDEX IF NOT EXISTS ad_consent_tickets_wbraid_idx ON public.ad_consent_tickets (wbraid);

CREATE TABLE IF NOT EXISTS public.ad_consent_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.ad_consent_tickets(id) ON DELETE CASCADE,
  ad_user_data text NOT NULL CHECK (ad_user_data IN ('granted','denied')),
  ad_storage text CHECK (ad_storage IN ('granted','denied')),
  origin text NOT NULL DEFAULT 'cookie_banner',
  consent_version integer NOT NULL DEFAULT 2,
  seq bigint NOT NULL,
  decided_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ticket_id, seq)
);
GRANT ALL ON public.ad_consent_decisions TO service_role;
ALTER TABLE public.ad_consent_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consent decisions service only" ON public.ad_consent_decisions FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.ads_migration_policy (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  backfill_start_at timestamptz,
  approved_by uuid,
  approved_at timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ads_migration_policy TO service_role;
GRANT SELECT ON public.ads_migration_policy TO authenticated;
ALTER TABLE public.ads_migration_policy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "migration policy service only" ON public.ads_migration_policy FOR ALL TO service_role USING (true) WITH CHECK (true);
INSERT INTO public.ads_migration_policy (id, note)
VALUES (1, 'Nog geen goedgekeurde startgrens: er wordt niets historisch klaargezet.')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.ads_worker_checkpoint (
  name text PRIMARY KEY,
  cursor_value text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ads_worker_checkpoint TO service_role;
ALTER TABLE public.ads_worker_checkpoint ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checkpoint service only" ON public.ads_worker_checkpoint FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE public.ads_conversion_outbox
  ADD COLUMN IF NOT EXISTS event_source text,
  ADD COLUMN IF NOT EXISTS currency text,
  ADD COLUMN IF NOT EXISTS payload_frozen_at timestamptz,
  ADD COLUMN IF NOT EXISTS legacy_import boolean NOT NULL DEFAULT false;

INSERT INTO public.ads_conversion_outbox (
  lead_id, phase, account_id, conversion_action_id, status, event_time,
  gclid, gbraid, wbraid, evidence, consent_ad_user_data, is_test,
  phase_source, submitted_at, legacy_import, last_error
)
SELECT l.id, 'job_completed', '9084464909', '7779910497', 'submitted',
       COALESCE(l.outcome_at, l.ads_uploaded_at, l.created_at),
       l.gclid, l.gbraid, l.wbraid, l.ad_click_evidence, l.ad_consent_ad_user_data,
       COALESCE(l.is_test, false), 'legacy_pre_split', l.ads_uploaded_at, true,
       'Eerder gemeld onder de oude identiteit; gemarkeerd zodat het niet opnieuw telt.'
FROM public.leads l
WHERE l.ads_uploaded_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.ads_conversion_outbox o
    WHERE o.lead_id = l.id AND o.phase = 'job_completed' AND o.account_id = '9084464909'
  );

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER ad_consent_tickets_updated BEFORE UPDATE ON public.ad_consent_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ads_migration_policy_updated BEFORE UPDATE ON public.ads_migration_policy FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();