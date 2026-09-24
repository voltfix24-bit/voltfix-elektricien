-- Disposable local database only. The production migrations below are tested unchanged.
CREATE ROLE anon;
CREATE ROLE authenticated;
CREATE ROLE service_role BYPASSRLS;
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), source text DEFAULT 'website',
  created_at timestamptz DEFAULT now(), outcome text, outcome_at timestamptz, claimed_at timestamptz,
  gclid text, gbraid text, wbraid text, is_test boolean DEFAULT false, customer_price_cents integer,
  ads_uploaded_at timestamptz, ads_upload_status text, ads_upload_error text
);
CREATE TABLE public.conversion_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), created_at timestamptz DEFAULT now(),
  gclid text, gbraid text, wbraid text, click_ref text
);
CREATE TABLE public.quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), created_at timestamptz DEFAULT now(),
  gclid text, gbraid text, wbraid text, ad_consent_ad_user_data text
);
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
