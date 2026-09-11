ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS street text,
  ADD COLUMN IF NOT EXISTS house_number text,
  ADD COLUMN IF NOT EXISTS city text;