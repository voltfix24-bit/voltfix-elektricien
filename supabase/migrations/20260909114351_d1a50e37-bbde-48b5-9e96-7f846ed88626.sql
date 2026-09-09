ALTER TABLE public.contractor_applications
  ADD COLUMN IF NOT EXISTS telegram_user_id bigint;

CREATE INDEX IF NOT EXISTS contractor_applications_telegram_user_id_idx
  ON public.contractor_applications (telegram_user_id);