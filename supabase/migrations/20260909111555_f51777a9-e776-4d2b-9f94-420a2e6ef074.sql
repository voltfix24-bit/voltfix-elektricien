ALTER TABLE public.contractors ALTER COLUMN balance_cents SET DEFAULT 5000;
ALTER TABLE public.lead_settings ALTER COLUMN default_price_cents SET DEFAULT 2000;
ALTER TABLE public.lead_settings ALTER COLUMN urgent_price_cents SET DEFAULT 2000;
UPDATE public.lead_settings SET default_price_cents = 2000, urgent_price_cents = 2000 WHERE id = 1;