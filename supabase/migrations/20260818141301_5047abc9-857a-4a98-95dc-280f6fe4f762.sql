ALTER TABLE public.quote_requests ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.quote_requests ALTER COLUMN postal_code DROP NOT NULL;
ALTER TABLE public.quote_requests ADD COLUMN IF NOT EXISTS appointment_date text;
ALTER TABLE public.quote_requests ADD COLUMN IF NOT EXISTS appointment_slot text;
ALTER TABLE public.quote_requests ADD COLUMN IF NOT EXISTS appointment_note text;