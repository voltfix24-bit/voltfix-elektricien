CREATE TABLE public.rank_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start date NOT NULL,
  keyword text NOT NULL,
  position numeric(6,2),
  clicks integer NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  ctr numeric(6,4) NOT NULL DEFAULT 0,
  top_page text,
  captured_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT rank_snapshots_week_keyword_key UNIQUE (week_start, keyword)
);

CREATE INDEX rank_snapshots_keyword_week_idx ON public.rank_snapshots (keyword, week_start DESC);

GRANT ALL ON public.rank_snapshots TO service_role;

ALTER TABLE public.rank_snapshots ENABLE ROW LEVEL SECURITY;