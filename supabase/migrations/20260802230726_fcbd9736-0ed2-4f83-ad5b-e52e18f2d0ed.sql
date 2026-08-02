CREATE TABLE public.conversion_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  conversion_type text NOT NULL,
  event_name text NOT NULL,
  language text NOT NULL DEFAULT 'nl',
  page_path text NOT NULL,
  cta_location text NOT NULL DEFAULT 'unknown',
  device text NOT NULL DEFAULT 'unknown',
  source text NOT NULL DEFAULT 'direct',
  referrer_host text,
  utm_source text,
  utm_medium text,
  utm_campaign text
);

CREATE INDEX conversion_events_created_at_idx ON public.conversion_events (created_at DESC);
CREATE INDEX conversion_events_type_idx ON public.conversion_events (conversion_type);

GRANT ALL ON public.conversion_events TO service_role;
REVOKE ALL ON public.conversion_events FROM anon, authenticated;

ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages conversion_events"
  ON public.conversion_events FOR ALL TO service_role
  USING (true) WITH CHECK (true);