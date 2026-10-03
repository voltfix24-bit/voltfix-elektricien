CREATE TABLE public.ad_visit_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_view_id text NOT NULL UNIQUE,
  visit_id text NOT NULL,
  seq int NOT NULL DEFAULT 1,
  page_path text NOT NULL,
  language text,
  device text,
  campaign_id text,
  utm_campaign text,
  has_click_id boolean NOT NULL DEFAULT false,
  consent_ads text,
  entered_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL,
  duration_ms integer NOT NULL DEFAULT 0,
  visible_ms integer NOT NULL DEFAULT 0,
  max_scroll_pct smallint NOT NULL DEFAULT 0,
  scroll_direction_changes integer NOT NULL DEFAULT 0,
  action text,
  is_bot boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ad_visit_pages TO service_role;
ALTER TABLE public.ad_visit_pages ENABLE ROW LEVEL SECURITY;
CREATE INDEX ad_visit_pages_visit_idx ON public.ad_visit_pages (visit_id, seq);
CREATE INDEX ad_visit_pages_entered_idx ON public.ad_visit_pages (entered_at DESC);