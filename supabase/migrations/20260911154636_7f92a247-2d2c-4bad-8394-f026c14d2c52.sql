ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS booking_service text,
  ADD COLUMN IF NOT EXISTS booking_intent text,
  ADD COLUMN IF NOT EXISTS booking_route text,
  ADD COLUMN IF NOT EXISTS price_status text,
  ADD COLUMN IF NOT EXISTS price_total_cents integer,
  ADD COLUMN IF NOT EXISTS price_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS catalog_version text,
  ADD COLUMN IF NOT EXISTS postal_area text,
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS request_hash text,
  ADD COLUMN IF NOT EXISTS notification_status text NOT NULL DEFAULT 'pending';

CREATE UNIQUE INDEX IF NOT EXISTS quote_requests_idempotency_key_uidx
  ON public.quote_requests (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS quote_requests_booking_service_idx
  ON public.quote_requests (booking_service, created_at DESC);