-- Alleen voor de wegwerpdatabase van de formuliertest-routetest.
-- Vult de minimale voorbouw aan met precies de kolommen, unieke sleutels en
-- functies die de aanvraagroute en de meldingswachtrij in productie gebruiken.

CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (id uuid PRIMARY KEY);

-- Unieke herhaalsleutel zoals in productie (quote_requests_idempotency_key_uidx).
CREATE UNIQUE INDEX IF NOT EXISTS quote_requests_idempotency_key_uidx
  ON public.quote_requests (idempotency_key) WHERE idempotency_key IS NOT NULL;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS customer_email text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS job_type text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS price_cents integer NOT NULL DEFAULT 2000,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS claimed_by uuid,
  ADD COLUMN IF NOT EXISTS telegram_message_id bigint,
  ADD COLUMN IF NOT EXISTS dispatched_at timestamptz,
  ADD COLUMN IF NOT EXISTS source_path text,
  ADD COLUMN IF NOT EXISTS is_urgent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS customer_language text,
  ADD COLUMN IF NOT EXISTS external_ref text,
  ADD COLUMN IF NOT EXISTS escalation_minutes integer,
  ADD COLUMN IF NOT EXISTS quote_kind text,
  ADD COLUMN IF NOT EXISTS quote_package text,
  ADD COLUMN IF NOT EXISTS quote_options jsonb,
  ADD COLUMN IF NOT EXISTS quote_base_price_cents integer,
  ADD COLUMN IF NOT EXISTS install_preference text,
  ADD COLUMN IF NOT EXISTS ad_click_evidence text,
  ADD COLUMN IF NOT EXISTS ad_click_linked_at timestamptz,
  ADD COLUMN IF NOT EXISTS ad_consent_ad_user_data text;
-- Zoals productie: leads_external_ref_key.
CREATE UNIQUE INDEX IF NOT EXISTS leads_external_ref_key ON public.leads (external_ref) WHERE external_ref IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.lead_settings (
  id integer PRIMARY KEY DEFAULT 1,
  default_price_cents integer NOT NULL DEFAULT 2000,
  urgent_price_cents integer NOT NULL DEFAULT 2000,
  escalation_urgent_minutes integer NOT NULL DEFAULT 15,
  escalation_planned_minutes integer NOT NULL DEFAULT 240
);
INSERT INTO public.lead_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS public.lead_job_prices (job_type text PRIMARY KEY, price_cents integer NOT NULL DEFAULT 1000);

CREATE TABLE IF NOT EXISTS public.notification_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid NOT NULL REFERENCES public.quote_requests(id),
  kind text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  lease_until timestamptz,
  delivery_token uuid,
  UNIQUE (quote_request_id, kind)
);

-- Letterlijk overgenomen uit productie.
CREATE OR REPLACE FUNCTION public.reserve_notifications(_limit integer, _quote_request_id uuid DEFAULT NULL::uuid)
 RETURNS SETOF notification_outbox LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $function$
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

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
    CREATE ROLE authenticator LOGIN NOINHERIT;
  END IF;
END $$;
GRANT anon, authenticated, service_role TO authenticator;
