ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS review_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS leads_review_sent_at_idx ON public.leads (review_sent_at) WHERE review_sent_at IS NOT NULL;