CREATE TABLE public.contact_route_reviews (
  route_key text PRIMARY KEY,
  contact_status text NOT NULL DEFAULT 'unknown' CHECK (contact_status IN ('real_contact','no_contact','unknown')),
  outcome text CHECK (outcome IN ('remote_help','scheduled','completed','dropped')),
  note text CHECK (char_length(note) <= 2000),
  lead_id uuid REFERENCES public.leads(id),
  revenue_cents integer CHECK (revenue_cents >= 0),
  reviewed_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON COLUMN public.contact_route_reviews.revenue_cents IS 'Werkelijke VoltFix-opbrengst; NULL = onbekend, 0 = expliciet nul';

CREATE TABLE public.contact_route_review_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_key text NOT NULL,
  actor_id uuid,
  old_value jsonb,
  new_value jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX contact_route_review_history_key ON public.contact_route_review_history(route_key, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.contact_route_reviews TO authenticated;
GRANT ALL ON public.contact_route_reviews TO service_role;
GRANT SELECT ON public.contact_route_review_history TO authenticated;
GRANT ALL ON public.contact_route_review_history TO service_role;

ALTER TABLE public.contact_route_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_route_review_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read reviews" ON public.contact_route_reviews FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert reviews" ON public.contact_route_reviews FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update reviews" ON public.contact_route_reviews FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins read review history" ON public.contact_route_review_history FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.contact_route_review_log() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  NEW.reviewed_by := COALESCE(auth.uid(), NEW.reviewed_by);
  INSERT INTO public.contact_route_review_history(route_key, actor_id, old_value, new_value)
  VALUES (NEW.route_key, NEW.reviewed_by,
    CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) - 'created_at' ELSE NULL END,
    to_jsonb(NEW) - 'created_at');
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.contact_route_review_log() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER contact_route_review_log BEFORE INSERT OR UPDATE ON public.contact_route_reviews
FOR EACH ROW EXECUTE FUNCTION public.contact_route_review_log();