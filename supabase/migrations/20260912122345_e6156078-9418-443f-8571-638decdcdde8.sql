ALTER TABLE public.contractor_transactions
  ADD COLUMN IF NOT EXISTS invoice_url text,
  ADD COLUMN IF NOT EXISTS invoice_pdf_url text;