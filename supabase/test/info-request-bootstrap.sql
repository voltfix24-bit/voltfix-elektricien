-- Minimale voorbouw voor een wegwerpdatabase (fase 5B-integratietests).
--
-- Dit is GEEN productieschema: het bevat alleen de objecten waarvan de
-- fase 5B-migratie afhankelijk is, zodat die migratie daarna onveranderd
-- kan draaien op een lege Postgres zonder Supabase-extensies.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE ROLE anon NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE ROLE authenticated NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE ROLE service_role NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger
LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION auth_uid_stub() RETURNS uuid LANGUAGE sql AS $$ SELECT NULL::uuid $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
LANGUAGE sql STABLE SET search_path TO 'public' AS $$ SELECT false $$;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$;

CREATE TABLE IF NOT EXISTS public.quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quote_request_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid NOT NULL UNIQUE REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quote_request_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id uuid NOT NULL,
  attachment_id uuid NOT NULL,
  quote_request_id uuid REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('consumer_unit','existing_outlet','installation_location','appliance_label','kitchen_plan','other')),
  original_filename text NOT NULL,
  storage_path text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL CHECK (size_bytes > 0),
  content_hash text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','stored','failed','orphaned')),
  sanitization_status text,
  error_code text,
  retention_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS quote_request_attachments_draft_attachment_key
  ON public.quote_request_attachments (draft_id, attachment_id);

CREATE TABLE IF NOT EXISTS public.notification_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  kind text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  lease_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (quote_request_id, kind)
);
