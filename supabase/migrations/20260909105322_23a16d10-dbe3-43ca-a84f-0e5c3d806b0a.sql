ALTER TABLE public.contractor_applications
  ADD COLUMN IF NOT EXISTS iban text,
  ADD COLUMN IF NOT EXISTS invoice_email text;

ALTER TABLE public.contractors
  ADD COLUMN IF NOT EXISTS iban text,
  ADD COLUMN IF NOT EXISTS invoice_email text;