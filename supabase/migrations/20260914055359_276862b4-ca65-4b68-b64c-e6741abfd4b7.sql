CREATE TABLE public.lead_completion_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL UNIQUE REFERENCES public.leads(id) ON DELETE CASCADE,
  contractor_id uuid NOT NULL REFERENCES public.contractors(id),
  state text NOT NULL DEFAULT 'awaiting_before' CHECK (state IN ('awaiting_before','awaiting_before_reason','awaiting_result','awaiting_signature','complete')),
  before_photo_path text,
  before_skipped_reason text CHECK (before_skipped_reason IS NULL OR (char_length(trim(before_skipped_reason)) BETWEEN 2 AND 240)),
  result_photo_path text,
  signature_path text,
  signature_token_hash text UNIQUE,
  signature_expires_at timestamptz,
  signed_at timestamptz,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  retention_expires_at timestamptz NOT NULL DEFAULT (now() + interval '365 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (before_photo_path IS NULL OR before_skipped_reason IS NULL),
  CHECK (state <> 'complete' OR (result_photo_path IS NOT NULL AND signature_path IS NOT NULL AND signed_at IS NOT NULL))
);
GRANT SELECT ON public.lead_completion_proofs TO authenticated;
GRANT ALL ON public.lead_completion_proofs TO service_role;
ALTER TABLE public.lead_completion_proofs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view lead completion proofs" ON public.lead_completion_proofs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role manages lead completion proofs" ON public.lead_completion_proofs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX lead_completion_proofs_incomplete_idx ON public.lead_completion_proofs (started_at) WHERE completed_at IS NULL;
CREATE TRIGGER update_lead_completion_proofs_updated_at BEFORE UPDATE ON public.lead_completion_proofs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Service role manages private completion evidence" ON storage.objects FOR ALL TO service_role USING (bucket_id = 'lead-completion-proof') WITH CHECK (bucket_id = 'lead-completion-proof');