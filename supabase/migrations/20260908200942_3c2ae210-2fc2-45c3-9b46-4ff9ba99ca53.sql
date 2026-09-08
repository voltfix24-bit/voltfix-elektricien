ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS price_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS agreed_price_details text;