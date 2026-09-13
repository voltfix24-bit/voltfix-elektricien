-- Extra kolommen voor de wegwerpdatabase (fase 7).
--
-- De minimale voorbouw maakt `public.quote_requests` met alleen id en
-- created_at. Voor de echte route-tests (prijscontrole via de draaiende
-- testapplicatie) moet de tabel dezelfde kolommen hebben als productie.
-- Dit bestand voegt die kolommen toe en raakt niets anders aan.

ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS job_type text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS message text,
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'nl',
  ADD COLUMN IF NOT EXISTS source_path text,
  ADD COLUMN IF NOT EXISTS attachment_paths text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS ip_hash text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS appointment_date text,
  ADD COLUMN IF NOT EXISTS appointment_slot text,
  ADD COLUMN IF NOT EXISTS appointment_note text,
  ADD COLUMN IF NOT EXISTS street text,
  ADD COLUMN IF NOT EXISTS house_number text,
  ADD COLUMN IF NOT EXISTS city text,
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
  ADD COLUMN IF NOT EXISTS notification_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS service_answers jsonb NOT NULL DEFAULT '{}'::jsonb;

GRANT SELECT, INSERT, UPDATE ON public.quote_requests TO service_role;
