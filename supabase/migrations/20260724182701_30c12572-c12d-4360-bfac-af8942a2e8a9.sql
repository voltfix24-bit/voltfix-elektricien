
-- Tabel voor offerte-aanvragen
CREATE TABLE public.quote_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  job_type TEXT NOT NULL,
  message TEXT,
  locale TEXT NOT NULL DEFAULT 'nl',
  source_path TEXT,
  attachment_paths TEXT[] NOT NULL DEFAULT '{}',
  user_agent TEXT,
  ip_hash TEXT,
  status TEXT NOT NULL DEFAULT 'new'
);

GRANT ALL ON public.quote_requests TO service_role;

ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

-- Alleen service_role heeft toegang; anon/authenticated hebben geen policies -> geen toegang.
CREATE POLICY "Service role manages quote_requests"
  ON public.quote_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX quote_requests_created_at_idx ON public.quote_requests (created_at DESC);

-- Storage policies voor quote-attachments (private bucket).
-- Anon/authenticated hebben geen policies dus geen upload/download; service_role bypasst RLS.
CREATE POLICY "Service role manages quote-attachments"
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'quote-attachments')
  WITH CHECK (bucket_id = 'quote-attachments');
