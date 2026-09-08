CREATE TABLE public.contractor_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  email text,
  note text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  used_at timestamptz,
  application_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contractor_invites TO authenticated;
GRANT ALL ON public.contractor_invites TO service_role;
ALTER TABLE public.contractor_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage invites" ON public.contractor_invites
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.contractor_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id uuid REFERENCES public.contractor_invites(id) ON DELETE SET NULL,
  company_name text NOT NULL,
  contact_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  kvk_number text NOT NULL,
  vat_number text,
  street text,
  postal_code text,
  city text,
  service_areas text[] NOT NULL DEFAULT '{}'::text[],
  travel_radius_km integer NOT NULL DEFAULT 25,
  specialties text[] NOT NULL DEFAULT '{}'::text[],
  availability text[] NOT NULL DEFAULT '{}'::text[],
  emergency_available boolean NOT NULL DEFAULT false,
  certifications text[] NOT NULL DEFAULT '{}'::text[],
  certification_notes text,
  insurer text,
  policy_number text,
  document_paths text[] NOT NULL DEFAULT '{}'::text[],
  telegram_username text,
  notes text,
  terms_accepted boolean NOT NULL DEFAULT false,
  terms_accepted_at timestamptz,
  status text NOT NULL DEFAULT 'new',
  contractor_id uuid REFERENCES public.contractors(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contractor_applications_status_check CHECK (status IN ('new','approved','rejected'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contractor_applications TO authenticated;
GRANT ALL ON public.contractor_applications TO service_role;
ALTER TABLE public.contractor_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage applications" ON public.contractor_applications
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.contractor_invites
  ADD CONSTRAINT contractor_invites_application_fkey
  FOREIGN KEY (application_id) REFERENCES public.contractor_applications(id) ON DELETE SET NULL;

CREATE INDEX contractor_applications_status_idx ON public.contractor_applications (status, created_at DESC);

CREATE TRIGGER contractor_invites_updated_at BEFORE UPDATE ON public.contractor_invites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER contractor_applications_updated_at BEFORE UPDATE ON public.contractor_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();