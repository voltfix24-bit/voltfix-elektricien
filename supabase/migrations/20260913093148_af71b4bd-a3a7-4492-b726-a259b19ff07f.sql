ALTER TABLE public.quote_request_assessments DROP CONSTRAINT IF EXISTS quote_request_assessments_assessment_status_check;

UPDATE public.quote_request_assessments SET assessment_status = CASE assessment_status
  WHEN 'new' THEN 'not_started'
  WHEN 'in_review' THEN 'in_review'
  WHEN 'waiting_customer' THEN 'waiting_customer'
  WHEN 'safety_contact_required' THEN 'waiting_customer'
  WHEN 'ready_fixed_price' THEN 'ready'
  WHEN 'survey_proposed' THEN 'ready'
  WHEN 'survey_scheduled' THEN 'ready'
  WHEN 'quote_required' THEN 'ready'
  WHEN 'scheduled' THEN 'ready'
  WHEN 'completed' THEN 'closed'
  WHEN 'cancelled' THEN 'closed'
  ELSE 'not_started'
END;

ALTER TABLE public.quote_request_assessments
  ALTER COLUMN assessment_status SET DEFAULT 'not_started';

ALTER TABLE public.quote_request_assessments
  ADD CONSTRAINT quote_request_assessments_assessment_status_check
  CHECK (assessment_status IN ('not_started','in_review','waiting_customer','ready','closed'));