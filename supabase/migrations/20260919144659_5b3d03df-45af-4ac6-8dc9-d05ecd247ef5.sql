CREATE TABLE public.google_ads_keyword_market_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL,
  geo_target TEXT NOT NULL,
  language_code TEXT NOT NULL,
  avg_monthly_searches BIGINT,
  competition TEXT,
  competition_index INTEGER,
  low_top_of_page_bid_micros BIGINT,
  high_top_of_page_bid_micros BIGINT,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (keyword, geo_target, language_code)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_ads_keyword_market_cache TO authenticated;
GRANT ALL ON public.google_ads_keyword_market_cache TO service_role;

ALTER TABLE public.google_ads_keyword_market_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins beheren de zoekwoordmarktcache"
  ON public.google_ads_keyword_market_cache
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX google_ads_keyword_market_cache_fetched_at_idx
  ON public.google_ads_keyword_market_cache (fetched_at);