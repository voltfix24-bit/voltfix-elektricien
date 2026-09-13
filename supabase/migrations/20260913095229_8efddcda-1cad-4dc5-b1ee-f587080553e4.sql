CREATE TABLE public.quote_request_info_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  assessment_id uuid REFERENCES public.quote_request_assessments(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft',
  revision integer NOT NULL DEFAULT 1,
  language text NOT NULL DEFAULT 'nl',
  items text[] NOT NULL DEFAULT '{}',
  customer_note text,
  token_hash text,
  token_version integer NOT NULL DEFAULT 1,
  expires_at timestamptz NOT NULL,
  created_by uuid,
  opened_at timestamptz,
  submitted_at timestamptz,
  withdrawn_at timestamptz,
  superseded_by uuid REFERENCES public.quote_request_info_requests(id) ON DELETE SET NULL,
  draft_answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  draft_revision integer NOT NULL DEFAULT 0,
  answers jsonb,
  reported_missing jsonb NOT NULL DEFAULT '[]'::jsonb,
  idempotency_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT info_request_status_check CHECK (status IN ('draft','open','submitted','withdrawn','superseded')),
  CONSTRAINT info_request_language_check CHECK (language IN ('nl','en'))
);

CREATE UNIQUE INDEX one_live_info_request_per_quote
  ON public.quote_request_info_requests (quote_request_id)
  WHERE status IN ('draft','open');
CREATE UNIQUE INDEX info_request_token_hash_key
  ON public.quote_request_info_requests (token_hash)
  WHERE token_hash IS NOT NULL;
CREATE INDEX info_request_quote_idx ON public.quote_request_info_requests (quote_request_id, created_at DESC);

GRANT SELECT ON public.quote_request_info_requests TO authenticated;
GRANT ALL ON public.quote_request_info_requests TO service_role;
ALTER TABLE public.quote_request_info_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read info requests" ON public.quote_request_info_requests
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER quote_request_info_requests_updated_at
  BEFORE UPDATE ON public.quote_request_info_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.quote_request_info_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  info_request_id uuid NOT NULL REFERENCES public.quote_request_info_requests(id) ON DELETE CASCADE,
  session_hash text NOT NULL UNIQUE,
  token_version integer NOT NULL DEFAULT 1,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX info_session_request_idx ON public.quote_request_info_sessions (info_request_id);

GRANT ALL ON public.quote_request_info_sessions TO service_role;
ALTER TABLE public.quote_request_info_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No client access to info sessions" ON public.quote_request_info_sessions
  FOR SELECT TO authenticated USING (false);

CREATE TRIGGER quote_request_info_sessions_updated_at
  BEFORE UPDATE ON public.quote_request_info_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.quote_request_attachments
  ADD COLUMN IF NOT EXISTS info_request_id uuid REFERENCES public.quote_request_info_requests(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS quote_request_attachments_info_request_idx
  ON public.quote_request_attachments (info_request_id);

CREATE OR REPLACE FUNCTION public.submit_info_request(
  _info_request_id uuid,
  _answers jsonb,
  _reported_missing jsonb,
  _idempotency_key text,
  _attachment_ids uuid[]
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_row public.quote_request_info_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM public.quote_request_info_requests
    WHERE id = _info_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  IF v_row.status = 'submitted' THEN
    IF v_row.idempotency_key IS NOT NULL AND v_row.idempotency_key = _idempotency_key THEN
      RETURN jsonb_build_object('ok', true, 'replayed', true, 'submitted_at', v_row.submitted_at);
    END IF;
    RETURN jsonb_build_object('ok', false, 'reason', 'already_submitted');
  END IF;

  IF v_row.status <> 'open' THEN
    RETURN jsonb_build_object('ok', false, 'reason', v_row.status);
  END IF;
  IF v_row.expires_at <= now() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'expired');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.quote_request_info_requests
    WHERE idempotency_key = _idempotency_key
      AND idempotency_key IS NOT NULL
      AND id <> _info_request_id
  ) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'idempotency_conflict');
  END IF;

  UPDATE public.quote_request_attachments
    SET quote_request_id = v_row.quote_request_id,
        info_request_id = v_row.id
    WHERE attachment_id = ANY(_attachment_ids)
      AND draft_id = v_row.id;

  UPDATE public.quote_request_info_requests
    SET status = 'submitted',
        answers = _answers,
        reported_missing = _reported_missing,
        idempotency_key = _idempotency_key,
        submitted_at = now(),
        token_hash = NULL
    WHERE id = _info_request_id;

  UPDATE public.quote_request_info_sessions
    SET revoked_at = now()
    WHERE info_request_id = _info_request_id AND revoked_at IS NULL;

  RETURN jsonb_build_object('ok', true, 'replayed', false, 'quote_request_id', v_row.quote_request_id);
END;
$$;

REVOKE ALL ON FUNCTION public.submit_info_request(uuid, jsonb, jsonb, text, uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_info_request(uuid, jsonb, jsonb, text, uuid[]) TO service_role;