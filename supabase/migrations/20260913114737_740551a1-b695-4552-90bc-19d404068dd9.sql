ALTER TABLE public.notification_outbox ADD COLUMN IF NOT EXISTS delivery_token uuid;

CREATE OR REPLACE FUNCTION public.reserve_notifications(_limit integer, _quote_request_id uuid DEFAULT NULL)
RETURNS SETOF public.notification_outbox LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $function$
  WITH due AS (
    SELECT id FROM public.notification_outbox
    WHERE status = 'pending'
      AND next_attempt_at <= now()
      AND (lease_until IS NULL OR lease_until <= now())
      AND (_quote_request_id IS NULL OR quote_request_id = _quote_request_id)
    ORDER BY next_attempt_at
    LIMIT greatest(_limit, 1)
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.notification_outbox o
    SET lease_until = now() + interval '5 minutes',
        delivery_token = gen_random_uuid()
  FROM due WHERE o.id = due.id
  RETURNING o.*;
$function$;
REVOKE ALL ON FUNCTION public.reserve_notifications(integer, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_notifications(integer, uuid) TO service_role;

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
  v_categories jsonb;
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

  SELECT COALESCE(jsonb_agg(DISTINCT a.category), '[]'::jsonb) INTO v_categories
    FROM public.quote_request_attachments a
    WHERE a.info_request_id = v_row.id AND a.status = 'stored';

  -- De opvolgtaak hoort bij de ontvangst: beide staan in dezelfde transactie.
  -- Bij een nieuwe aanvulling vervalt het afleverkenmerk van een lopende
  -- aflevering, zodat die de nieuwe melding niet als verstuurd kan afsluiten.
  INSERT INTO public.notification_outbox (quote_request_id, kind, status, payload)
  VALUES (
    v_row.quote_request_id,
    'info_request_received',
    'pending',
    jsonb_build_object(
      'infoRequestRevision', v_row.revision,
      'receivedCategories', v_categories,
      'missingItems', COALESCE(_reported_missing, '[]'::jsonb),
      'callbackRequested', v_row.callback_requested
    )
  )
  ON CONFLICT (quote_request_id, kind) DO UPDATE
    SET status = 'pending',
        attempts = 0,
        last_error = NULL,
        next_attempt_at = now(),
        sent_at = NULL,
        lease_until = NULL,
        delivery_token = NULL,
        payload = EXCLUDED.payload;

  RETURN jsonb_build_object('ok', true, 'replayed', false, 'quote_request_id', v_row.quote_request_id);
END;
$$;

REVOKE ALL ON FUNCTION public.submit_info_request(uuid, jsonb, jsonb, text, uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_info_request(uuid, jsonb, jsonb, text, uuid[]) TO service_role;