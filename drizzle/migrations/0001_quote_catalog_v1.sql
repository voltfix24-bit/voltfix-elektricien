CREATE TABLE public.catalog_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id text NOT NULL,
  version_no integer NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  version_key text,
  note text,
  created_by uuid,
  published_by uuid,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (service_id, version_no)
);
CREATE UNIQUE INDEX catalog_one_draft ON public.catalog_versions(service_id) WHERE status = 'draft';
CREATE UNIQUE INDEX catalog_one_published ON public.catalog_versions(service_id) WHERE status = 'published';

CREATE TABLE public.catalog_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.catalog_versions(id),
  item_key text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('package','option','extra_unit','survey','brand','component','labour')),
  label_nl text NOT NULL,
  label_en text NOT NULL,
  description_nl text,
  description_en text,
  price_inc_vat_cents integer NOT NULL CHECK (price_inc_vat_cents >= 0),
  vat_rate_bps integer NOT NULL DEFAULT 2100,
  unit text NOT NULL DEFAULT 'stuk',
  max_qty integer,
  sort integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  show_on_website boolean NOT NULL DEFAULT true,
  show_in_quotes boolean NOT NULL DEFAULT true,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (version_id, item_key)
);

CREATE TABLE public.catalog_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid REFERENCES public.catalog_versions(id),
  actor_id uuid,
  action text NOT NULL,
  diff jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.quote_number_counters (year integer PRIMARY KEY, last_no integer NOT NULL DEFAULT 0);

CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number text UNIQUE,
  lead_id uuid NOT NULL REFERENCES public.leads(id),
  service_id text NOT NULL,
  catalog_version_id uuid REFERENCES public.catalog_versions(id),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','final','sent','accepted','declined','expired','superseded')),
  revision integer NOT NULL DEFAULT 1,
  parent_quote_id uuid REFERENCES public.quotes(id),
  language text NOT NULL DEFAULT 'nl',
  customer_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  business_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  subtotal_ex_vat_cents integer NOT NULL DEFAULT 0,
  vat_cents integer NOT NULL DEFAULT 0,
  total_inc_vat_cents integer NOT NULL DEFAULT 0,
  valid_until date,
  internal_note text,
  customer_note text,
  is_test boolean NOT NULL DEFAULT false,
  created_by uuid,
  finalized_at timestamptz,
  finalized_by uuid,
  sent_at timestamptz,
  accepted_at timestamptz,
  declined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX quotes_lead_idx ON public.quotes(lead_id);

CREATE TABLE public.quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  sort integer NOT NULL DEFAULT 0,
  catalog_item_key text,
  kind text NOT NULL,
  label text NOT NULL,
  description text,
  qty integer NOT NULL DEFAULT 1 CHECK (qty > 0),
  unit text NOT NULL DEFAULT 'stuk',
  catalog_unit_price_cents integer,
  unit_price_inc_vat_cents integer NOT NULL CHECK (unit_price_inc_vat_cents >= 0),
  vat_rate_bps integer NOT NULL DEFAULT 2100,
  line_total_inc_vat_cents integer NOT NULL,
  override_reason text,
  is_internal boolean NOT NULL DEFAULT false
);

CREATE TABLE public.quote_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  actor_id uuid,
  event text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.catalog_versions, public.catalog_items, public.catalog_audit, public.quotes, public.quote_items, public.quote_events TO authenticated;
GRANT DELETE ON public.quote_items TO authenticated;
GRANT ALL ON public.catalog_versions, public.catalog_items, public.catalog_audit, public.quotes, public.quote_items, public.quote_events, public.quote_number_counters TO service_role;

ALTER TABLE public.catalog_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_number_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin all" ON public.catalog_versions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin all" ON public.catalog_items FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin read insert" ON public.catalog_audit FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin insert" ON public.catalog_audit FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin all" ON public.quotes FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin all" ON public.quote_items FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin read" ON public.quote_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin insert" ON public.quote_events FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Gepubliceerde catalogusversies en hun items zijn onveranderbaar.
CREATE OR REPLACE FUNCTION public.guard_catalog_items() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE s text;
BEGIN
  SELECT status INTO s FROM public.catalog_versions WHERE id = coalesce(NEW.version_id, OLD.version_id);
  IF s <> 'draft' THEN RAISE EXCEPTION 'Alleen een conceptcatalogus kan worden bewerkt'; END IF;
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Catalogusitems worden nooit verwijderd'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_catalog_items BEFORE INSERT OR UPDATE OR DELETE ON public.catalog_items FOR EACH ROW EXECUTE FUNCTION public.guard_catalog_items();

-- Afwijking van catalogusprijs vereist interne reden; definitieve offerte onveranderbaar.
CREATE OR REPLACE FUNCTION public.guard_quote_items() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE s text;
BEGIN
  SELECT status INTO s FROM public.quotes WHERE id = coalesce(NEW.quote_id, OLD.quote_id);
  IF s IS DISTINCT FROM 'draft' THEN RAISE EXCEPTION 'Definitieve offerte kan niet worden gewijzigd'; END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  IF NEW.catalog_unit_price_cents IS NOT NULL AND NEW.unit_price_inc_vat_cents <> NEW.catalog_unit_price_cents
     AND nullif(trim(coalesce(NEW.override_reason,'')),'') IS NULL THEN
    RAISE EXCEPTION 'Prijsafwijking vereist een interne reden';
  END IF;
  NEW.line_total_inc_vat_cents := NEW.qty * NEW.unit_price_inc_vat_cents;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_quote_items BEFORE INSERT OR UPDATE OR DELETE ON public.quote_items FOR EACH ROW EXECUTE FUNCTION public.guard_quote_items();

CREATE OR REPLACE FUNCTION public.guard_quotes() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  NEW.updated_at := now();
  IF OLD.status <> 'draft' AND ROW(NEW.lead_id, NEW.quote_number, NEW.customer_snapshot, NEW.business_snapshot,
       NEW.subtotal_ex_vat_cents, NEW.vat_cents, NEW.total_inc_vat_cents, NEW.valid_until, NEW.customer_note, NEW.language)
     IS DISTINCT FROM ROW(OLD.lead_id, OLD.quote_number, OLD.customer_snapshot, OLD.business_snapshot,
       OLD.subtotal_ex_vat_cents, OLD.vat_cents, OLD.total_inc_vat_cents, OLD.valid_until, OLD.customer_note, OLD.language) THEN
    RAISE EXCEPTION 'Definitieve offerte kan niet worden gewijzigd';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_quotes BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.guard_quotes();

-- Atomair definitief maken: totalen herberekenen, nummer VF-JJJJ-0001 toekennen.
CREATE OR REPLACE FUNCTION public.finalize_quote(_quote_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE q public.quotes%ROWTYPE; y int; n int; inc int; ex int; num text;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO q FROM public.quotes WHERE id = _quote_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Offerte niet gevonden'; END IF;
  IF q.status <> 'draft' THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_draft'); END IF;
  SELECT coalesce(sum(line_total_inc_vat_cents),0),
         coalesce(sum(round(line_total_inc_vat_cents * 10000.0 / (10000 + vat_rate_bps))),0)
    INTO inc, ex FROM public.quote_items WHERE quote_id = _quote_id AND NOT is_internal;
  IF inc <= 0 THEN RETURN jsonb_build_object('ok', false, 'reason', 'empty'); END IF;
  y := extract(year FROM (now() AT TIME ZONE 'Europe/Amsterdam'))::int;
  INSERT INTO public.quote_number_counters(year, last_no) VALUES (y, 1)
    ON CONFLICT (year) DO UPDATE SET last_no = quote_number_counters.last_no + 1
    RETURNING last_no INTO n;
  num := CASE WHEN q.is_test THEN 'TEST-' ELSE '' END || 'VF-' || y || '-' || lpad(n::text, 4, '0');
  UPDATE public.quotes SET status = 'final', quote_number = num, total_inc_vat_cents = inc,
    subtotal_ex_vat_cents = ex, vat_cents = inc - ex,
    valid_until = (now() AT TIME ZONE 'Europe/Amsterdam')::date + 14,
    finalized_at = now(), finalized_by = auth.uid()
   WHERE id = _quote_id;
  INSERT INTO public.quote_events(quote_id, actor_id, event, data) VALUES (_quote_id, auth.uid(), 'finalized', jsonb_build_object('number', num, 'total', inc));
  RETURN jsonb_build_object('ok', true, 'quote_number', num);
END $$;

-- Concept publiceren: oude publicatie archiveren.
CREATE OR REPLACE FUNCTION public.publish_catalog_version(_version_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v public.catalog_versions%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO v FROM public.catalog_versions WHERE id = _version_id FOR UPDATE;
  IF NOT FOUND OR v.status <> 'draft' THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_draft'); END IF;
  UPDATE public.catalog_versions SET status = 'archived' WHERE service_id = v.service_id AND status = 'published';
  UPDATE public.catalog_versions SET status = 'published', published_at = now(), published_by = auth.uid(),
    version_key = coalesce(version_key, v.service_id || '-v' || v.version_no) WHERE id = _version_id;
  INSERT INTO public.catalog_audit(version_id, actor_id, action) VALUES (_version_id, auth.uid(), 'published');
  RETURN jsonb_build_object('ok', true);
END $$;
GRANT EXECUTE ON FUNCTION public.finalize_quote(uuid), public.publish_catalog_version(uuid) TO authenticated;