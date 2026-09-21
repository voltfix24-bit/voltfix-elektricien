ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS ad_consent_ad_user_data text;