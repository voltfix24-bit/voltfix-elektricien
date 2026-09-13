CREATE TABLE public.quote_request_assessments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_request_id uuid NOT NULL UNIQUE REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  service_id text NOT NULL DEFAULT 'perilex',
  assessment_status text NOT NULL DEFAULT 'new' CHECK (assessment_status IN ('new','in_review','waiting_customer','ready_fixed_price','survey_proposed','survey_scheduled','quote_required','safety_contact_required','scheduled','completed','cancelled')),
  decision text CHECK (decision IS NULL OR decision IN ('fixed_existing_standard','fixed_existing_priority_24h','site_survey','additional_information_required','custom_quote_required','safety_contact_required','outside_service_area','declined')),
  checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  safety_flags text[] NOT NULL DEFAULT '{}'::text[],
  work_items text[] NOT NULL DEFAULT '{}'::text[],
  missing_info text[] NOT NULL DEFAULT '{}'::text[],
  internal_notes text,
  priority_requested boolean NOT NULL DEFAULT false,
  availability_confirmed_by uuid,
  availability_confirmed_at timestamp with time zone,
  price_rule_id text,
  amount_ex_vat_cents integer,
  price_snapshot jsonb,
  catalog_version text,
  assigned_to uuid,
  decided_by uuid,
  decided_at timestamp with time zone,
  created_by uuid,
  version integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.quote_request_assessments TO authenticated;
GRANT ALL ON public.quote_request_assessments TO service_role;

ALTER TABLE public.quote_request_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read assessments" ON public.quote_request_assessments
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can create assessments" ON public.quote_request_assessments
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update assessments" ON public.quote_request_assessments
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX quote_request_assessments_status_idx ON public.quote_request_assessments (assessment_status, updated_at DESC);
CREATE INDEX quote_request_assessments_lead_idx ON public.quote_request_assessments (lead_id);

CREATE TRIGGER quote_request_assessments_updated_at
  BEFORE UPDATE ON public.quote_request_assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.quote_request_assessment_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id uuid NOT NULL REFERENCES public.quote_request_assessments(id) ON DELETE CASCADE,
  quote_request_id uuid NOT NULL,
  actor_id uuid,
  event_type text NOT NULL,
  field text,
  old_value jsonb,
  new_value jsonb,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.quote_request_assessment_events TO authenticated;
GRANT ALL ON public.quote_request_assessment_events TO service_role;

ALTER TABLE public.quote_request_assessment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read assessment events" ON public.quote_request_assessment_events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX quote_request_assessment_events_assessment_idx
  ON public.quote_request_assessment_events (assessment_id, created_at DESC);

CREATE TABLE public.attachment_access_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attachment_id uuid NOT NULL,
  quote_request_id uuid,
  actor_id uuid,
  action text NOT NULL CHECK (action IN ('view','download')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.attachment_access_log TO authenticated;
GRANT ALL ON public.attachment_access_log TO service_role;

ALTER TABLE public.attachment_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read attachment access log" ON public.attachment_access_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX attachment_access_log_attachment_idx
  ON public.attachment_access_log (attachment_id, created_at DESC);

ALTER TABLE public.quote_request_attachments
  ADD COLUMN IF NOT EXISTS sanitization_status text NOT NULL DEFAULT 'not_applicable'
  CHECK (sanitization_status IN ('not_applicable','metadata_stripped','metadata_retained','failed'));