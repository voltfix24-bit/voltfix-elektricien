ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS consent_visitor_hash text;
ALTER TABLE public.conversion_events ADD COLUMN IF NOT EXISTS consent_visitor_hash text;
ALTER TABLE public.quote_requests ADD COLUMN IF NOT EXISTS ad_visitor_hash text;
CREATE INDEX IF NOT EXISTS leads_consent_visitor_hash_idx ON public.leads(consent_visitor_hash) WHERE consent_visitor_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS conversion_events_consent_visitor_hash_idx ON public.conversion_events(consent_visitor_hash) WHERE consent_visitor_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS quote_requests_ad_visitor_hash_idx ON public.quote_requests(ad_visitor_hash) WHERE ad_visitor_hash IS NOT NULL;
ALTER TABLE public.ads_conversion_outbox
  ADD COLUMN IF NOT EXISTS consent_visitor_hash text,
  ADD COLUMN IF NOT EXISTS consent_seq bigint;

CREATE TABLE IF NOT EXISTS public.ad_consent_subjects_v2 (
  visitor_hash text PRIMARY KEY CHECK (visitor_hash ~ '^[a-f0-9]{64}$'),
  token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  seq bigint NOT NULL DEFAULT 0,
  ad_user_data text CHECK (ad_user_data IN ('granted', 'denied')),
  ad_storage text CHECK (ad_storage IN ('granted', 'denied')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.ad_consent_choices_v2 (
  visitor_hash text NOT NULL REFERENCES public.ad_consent_subjects_v2(visitor_hash),
  seq bigint NOT NULL CHECK (seq > 0 AND seq <= 9007199254740991),
  ad_user_data text NOT NULL CHECK (ad_user_data IN ('granted', 'denied')),
  ad_storage text CHECK (ad_storage IN ('granted', 'denied')),
  origin text NOT NULL,
  consent_version integer NOT NULL,
  decided_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (visitor_hash, seq)
);
ALTER TABLE public.ad_consent_subjects_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_consent_choices_v2 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ad_consent_subjects_v2, public.ad_consent_choices_v2 FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.ad_consent_subjects_v2, public.ad_consent_choices_v2 TO service_role;

CREATE OR REPLACE FUNCTION public.ads_consent_subject_v2(p_visitor_hash text, p_token_hash text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE n integer;
BEGIN
  INSERT INTO ad_consent_subjects_v2(visitor_hash, token_hash) VALUES (p_visitor_hash, p_token_hash)
    ON CONFLICT (visitor_hash) DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF NOT EXISTS (SELECT 1 FROM ad_consent_subjects_v2 WHERE visitor_hash = p_visitor_hash AND token_hash = p_token_hash) THEN
    RAISE EXCEPTION 'Consent credential mismatch';
  END IF;
  RETURN jsonb_build_object('resumed', n = 0);
END $$;

CREATE OR REPLACE FUNCTION public.ads_consent_apply_v2(
  p_token_hash text, p_seq bigint, p_ad_user_data text, p_ad_storage text,
  p_origin text, p_version integer
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE s ad_consent_subjects_v2; n_events integer; n_leads integer; n_outbox integer; allowed boolean;
BEGIN
  IF p_seq IS NULL OR p_seq < 1 OR p_seq > 9007199254740991 OR
     p_ad_user_data IS NULL OR p_ad_user_data NOT IN ('granted', 'denied') OR
     (p_ad_storage IS NOT NULL AND p_ad_storage NOT IN ('granted', 'denied')) THEN
    RAISE EXCEPTION 'Invalid consent decision';
  END IF;
  SELECT * INTO s FROM ad_consent_subjects_v2 WHERE token_hash = p_token_hash FOR UPDATE;
  IF NOT FOUND THEN RETURN '{"ok":false,"reason":"unknown_ticket"}'::jsonb; END IF;
  IF p_seq < s.seq THEN RETURN '{"ok":false,"reason":"stale"}'::jsonb; END IF;
  IF p_seq = s.seq THEN
    IF s.ad_user_data IS DISTINCT FROM p_ad_user_data OR s.ad_storage IS DISTINCT FROM p_ad_storage THEN
      RETURN '{"ok":false,"reason":"conflict"}'::jsonb;
    END IF;
    RETURN '{"ok":true,"events":0,"leads":0,"blocked":0,"unblocked":0}'::jsonb;
  END IF;
  INSERT INTO ad_consent_choices_v2(visitor_hash, seq, ad_user_data, ad_storage, origin, consent_version)
    VALUES (s.visitor_hash, p_seq, p_ad_user_data, p_ad_storage, p_origin, p_version);
  UPDATE ad_consent_subjects_v2 SET seq = p_seq, ad_user_data = p_ad_user_data,
    ad_storage = p_ad_storage, updated_at = now() WHERE visitor_hash = s.visitor_hash;
  allowed := p_ad_user_data = 'granted' AND p_ad_storage = 'granted';
  UPDATE conversion_events SET consent_ad_user_data = p_ad_user_data, consent_ad_storage = p_ad_storage,
    gclid = CASE WHEN p_ad_storage = 'granted' THEN gclid END,
    gbraid = CASE WHEN p_ad_storage = 'granted' THEN gbraid END,
    wbraid = CASE WHEN p_ad_storage = 'granted' THEN wbraid END,
    click_ref = CASE WHEN p_ad_storage = 'granted' THEN click_ref END
    WHERE consent_visitor_hash = s.visitor_hash;
  GET DIAGNOSTICS n_events = ROW_COUNT;
  UPDATE leads SET ad_consent_ad_user_data = CASE WHEN allowed THEN 'granted' ELSE 'denied' END,
    gclid = CASE WHEN p_ad_storage = 'granted' THEN gclid END,
    gbraid = CASE WHEN p_ad_storage = 'granted' THEN gbraid END,
    wbraid = CASE WHEN p_ad_storage = 'granted' THEN wbraid END
    WHERE consent_visitor_hash = s.visitor_hash;
  GET DIAGNOSTICS n_leads = ROW_COUNT;
  UPDATE quote_requests SET ad_consent_ad_user_data = CASE WHEN allowed THEN 'granted' ELSE 'denied' END,
    gclid = CASE WHEN p_ad_storage = 'granted' THEN gclid END,
    gbraid = CASE WHEN p_ad_storage = 'granted' THEN gbraid END,
    wbraid = CASE WHEN p_ad_storage = 'granted' THEN wbraid END
    WHERE ad_visitor_hash = s.visitor_hash;
  UPDATE ads_conversion_outbox o SET
    status = CASE WHEN allowed THEN o.status ELSE 'blocked_consent' END,
    consent_ad_user_data = CASE WHEN allowed THEN 'granted' ELSE 'denied' END,
    last_error = CASE WHEN allowed THEN o.last_error ELSE 'Toestemming ontbreekt of is ingetrokken.' END
    WHERE (o.consent_visitor_hash = s.visitor_hash OR o.lead_id IN
      (SELECT id FROM leads WHERE consent_visitor_hash = s.visitor_hash))
      AND o.status IN ('pending','failed_temporary','export_disabled','config_missing',
        'no_evidence','blocked_consent','destination_changed','skipped_historical','skipped_no_click');
  GET DIAGNOSTICS n_outbox = ROW_COUNT;
  RETURN jsonb_build_object('ok', true, 'events', n_events, 'leads', n_leads,
    'blocked', CASE WHEN allowed THEN 0 ELSE n_outbox END,
    'unblocked', CASE WHEN allowed THEN n_outbox ELSE 0 END);
END $$;

CREATE OR REPLACE FUNCTION public.ads_consent_on_insert_v2()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE h text; s ad_consent_subjects_v2; j jsonb; permitted boolean;
BEGIN
  j := to_jsonb(NEW);
  h := CASE WHEN TG_TABLE_NAME = 'quote_requests' THEN j->>'ad_visitor_hash' ELSE j->>'consent_visitor_hash' END;
  SELECT * INTO s FROM ad_consent_subjects_v2 WHERE visitor_hash = h FOR SHARE;
  permitted := coalesce(s.ad_user_data = 'granted' AND s.ad_storage = 'granted', false);
  IF TG_TABLE_NAME = 'conversion_events' THEN
    j := j || jsonb_build_object('consent_ad_user_data', s.ad_user_data, 'consent_ad_storage', s.ad_storage);
  ELSE
    j := j || jsonb_build_object('ad_consent_ad_user_data', CASE WHEN permitted THEN 'granted' ELSE s.ad_user_data END);
  END IF;
  IF NOT permitted THEN
    j := j || '{"gclid":null,"gbraid":null,"wbraid":null}'::jsonb;
    IF TG_TABLE_NAME = 'conversion_events' THEN j := j || '{"click_ref":null}'::jsonb; END IF;
  END IF;
  NEW := jsonb_populate_record(NEW, j);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS ads_consent_insert_v2 ON public.leads;
CREATE TRIGGER ads_consent_insert_v2 BEFORE INSERT ON public.leads FOR EACH ROW EXECUTE FUNCTION public.ads_consent_on_insert_v2();
DROP TRIGGER IF EXISTS ads_consent_insert_v2 ON public.quote_requests;
CREATE TRIGGER ads_consent_insert_v2 BEFORE INSERT ON public.quote_requests FOR EACH ROW EXECUTE FUNCTION public.ads_consent_on_insert_v2();
DROP TRIGGER IF EXISTS ads_consent_insert_v2 ON public.conversion_events;
CREATE TRIGGER ads_consent_insert_v2 BEFORE INSERT ON public.conversion_events FOR EACH ROW EXECUTE FUNCTION public.ads_consent_on_insert_v2();

CREATE OR REPLACE FUNCTION public.ads_claim_v2(
  p_id uuid, p_attempts integer, p_status text, p_action text, p_next_attempt timestamptz
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE o ads_conversion_outbox; l leads; s ad_consent_subjects_v2; h text;
  floor_at timestamptz; started text; reason text; source_type text;
BEGIN
  SELECT l0.consent_visitor_hash INTO h FROM leads l0 JOIN ads_conversion_outbox o0 ON o0.lead_id = l0.id WHERE o0.id = p_id;
  SELECT * INTO s FROM ad_consent_subjects_v2 WHERE visitor_hash = h FOR UPDATE;
  SELECT l0.* INTO l FROM leads l0 JOIN ads_conversion_outbox o0 ON o0.lead_id = l0.id WHERE o0.id = p_id FOR UPDATE OF l0;
  SELECT * INTO o FROM ads_conversion_outbox WHERE id = p_id FOR UPDATE;
  IF NOT FOUND OR o.status NOT IN ('pending','failed_temporary') OR o.status <> p_status OR
     o.attempts <> p_attempts OR o.attempts >= 6 OR o.next_attempt_at > now() THEN
    RETURN '{"claimed":false,"reason":"changed"}'::jsonb;
  END IF;
  IF l.consent_visitor_hash IS DISTINCT FROM h OR h IS NULL OR s.visitor_hash IS NULL OR
     s.ad_user_data IS DISTINCT FROM 'granted' OR s.ad_storage IS DISTINCT FROM 'granted' THEN
    reason := 'blocked_consent';
  ELSIF o.payload_frozen_at IS NOT NULL AND o.consent_visitor_hash IS DISTINCT FROM h THEN
    reason := 'blocked_consent';
  ELSIF coalesce(l.is_test,false) OR o.is_test THEN reason := 'skipped_test';
  ELSIF l.ad_click_evidence IS NULL OR l.ad_click_evidence NOT IN ('form','whatsapp_ref','click_id') THEN reason := 'no_evidence';
  ELSIF coalesce(o.gclid,o.gbraid,o.wbraid) IS NULL THEN reason := 'skipped_no_click';
  ELSIF (o.phase = 'request_qualified' AND (l.qualified_at IS NULL OR l.disqualified_at IS NOT NULL)) OR
        (o.phase = 'job_accepted' AND l.claimed_at IS NULL) OR
        (o.phase = 'job_completed' AND (l.outcome IS DISTINCT FROM 'done' OR l.outcome_at IS NULL)) OR
        o.phase NOT IN ('request_received','request_qualified','job_accepted','job_completed') THEN reason := 'phase_reverted';
  ELSIF p_action IS NULL OR p_action IN ('','unconfigured') THEN reason := 'config_missing';
  ELSIF o.payload_frozen_at IS NOT NULL AND o.conversion_action_id IS DISTINCT FROM p_action THEN reason := 'destination_changed';
  END IF;
  SELECT backfill_start_at INTO floor_at FROM ads_migration_policy WHERE id = 1 FOR SHARE;
  IF floor_at IS NULL THEN
    SELECT cursor_value INTO started FROM ads_worker_checkpoint WHERE name = 'ads_measurement_start' FOR SHARE;
    floor_at := greatest(now() - interval '30 days', coalesce(started::timestamptz, now()));
  END IF;
  IF o.event_time < floor_at OR EXISTS (SELECT 1 FROM ads_conversion_outbox WHERE lead_id = o.lead_id AND account_id = o.account_id AND legacy_import) THEN
    reason := 'skipped_historical';
  END IF;
  IF reason IS NOT NULL THEN
    UPDATE ads_conversion_outbox SET status = reason, last_error = 'Niet vrijgegeven door de laatste databasecontrole.' WHERE id = p_id;
    RETURN jsonb_build_object('claimed', false, 'reason', reason);
  END IF;
  source_type := CASE
    WHEN lower(coalesce(l.source,'')) ~ '(phone|telefo|bel)' THEN 'PHONE'
    WHEN lower(coalesce(l.source,'')) ~ '(whatsapp|message|chat)' THEN 'MESSAGE'
    WHEN lower(coalesce(l.source,'')) ~ '(website|form|web|booking)' THEN 'WEB' ELSE 'OTHER' END;
  PERFORM set_config('voltfix.ads_claim_v2', 'on', true);
  UPDATE ads_conversion_outbox SET status = 'in_flight', attempts = attempts + 1,
    inflight_since = now(), last_attempt_at = now(), next_attempt_at = p_next_attempt,
    conversion_action_id = CASE WHEN payload_frozen_at IS NULL THEN p_action ELSE conversion_action_id END,
    event_source = CASE WHEN payload_frozen_at IS NULL THEN source_type ELSE event_source END,
    currency = coalesce(currency,'EUR'), payload_frozen_at = coalesce(payload_frozen_at, now()),
    consent_visitor_hash = h, consent_seq = s.seq, consent_ad_user_data = 'granted'
    WHERE id = p_id RETURNING * INTO o;
  RETURN jsonb_build_object('claimed', true, 'row', to_jsonb(o));
END $$;

CREATE OR REPLACE FUNCTION public.ads_outbox_guard_v2()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.status = 'in_flight' AND (OLD.status IS DISTINCT FROM NEW.status OR OLD.attempts <> NEW.attempts)
     AND current_setting('voltfix.ads_claim_v2', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'Use ads_claim_v2 to authorize exports';
  END IF;
  IF OLD.payload_frozen_at IS NOT NULL AND
    ROW(NEW.account_id, NEW.conversion_action_id, NEW.event_time, NEW.value_cents, NEW.gclid, NEW.gbraid,
      NEW.wbraid, NEW.event_source, NEW.currency, NEW.payload_frozen_at, NEW.lead_id, NEW.phase, NEW.consent_visitor_hash)
    IS DISTINCT FROM
    ROW(OLD.account_id, OLD.conversion_action_id, OLD.event_time, OLD.value_cents, OLD.gclid, OLD.gbraid,
      OLD.wbraid, OLD.event_source, OLD.currency, OLD.payload_frozen_at, OLD.lead_id, OLD.phase, OLD.consent_visitor_hash) THEN
    RAISE EXCEPTION 'Frozen conversion payload cannot change';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS ads_outbox_guard_v2 ON public.ads_conversion_outbox;
CREATE TRIGGER ads_outbox_guard_v2 BEFORE UPDATE ON public.ads_conversion_outbox FOR EACH ROW EXECUTE FUNCTION public.ads_outbox_guard_v2();

REVOKE ALL ON FUNCTION public.ads_consent_subject_v2(text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ads_consent_apply_v2(text,bigint,text,text,text,integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ads_claim_v2(uuid,integer,text,text,timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ads_consent_on_insert_v2() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ads_outbox_guard_v2() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ads_consent_subject_v2(text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.ads_consent_apply_v2(text,bigint,text,text,text,integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.ads_claim_v2(uuid,integer,text,text,timestamptz) TO service_role;
NOTIFY pgrst, 'reload schema';