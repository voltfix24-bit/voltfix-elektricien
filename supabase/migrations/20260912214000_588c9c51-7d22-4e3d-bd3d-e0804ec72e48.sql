CREATE TABLE public.quote_request_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id uuid NOT NULL,
  attachment_id uuid NOT NULL,
  quote_request_id uuid REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('consumer_unit','existing_outlet','installation_location','appliance_label','kitchen_plan','other')),
  original_filename text NOT NULL,
  storage_bucket text NOT NULL DEFAULT 'quote-attachments',
  storage_path text NOT NULL,
  mime_type text NOT NULL CHECK (mime_type IN ('image/jpeg','image/png','image/webp','image/heic','application/pdf')),
  size_bytes integer NOT NULL CHECK (size_bytes > 0),
  content_hash text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','stored','failed','orphaned')),
  error_code text,
  retention_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX quote_request_attachments_draft_attachment_key
  ON public.quote_request_attachments (draft_id, attachment_id);
CREATE UNIQUE INDEX quote_request_attachments_draft_hash_key
  ON public.quote_request_attachments (draft_id, content_hash)
  WHERE content_hash IS NOT NULL;
CREATE INDEX quote_request_attachments_request_idx
  ON public.quote_request_attachments (quote_request_id);
CREATE INDEX quote_request_attachments_orphan_idx
  ON public.quote_request_attachments (created_at)
  WHERE quote_request_id IS NULL;

GRANT SELECT ON public.quote_request_attachments TO authenticated;
GRANT ALL ON public.quote_request_attachments TO service_role;

ALTER TABLE public.quote_request_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read attachment metadata"
  ON public.quote_request_attachments
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER quote_request_attachments_updated_at
  BEFORE UPDATE ON public.quote_request_attachments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();