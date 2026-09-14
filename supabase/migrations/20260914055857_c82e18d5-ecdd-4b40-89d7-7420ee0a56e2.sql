CREATE OR REPLACE FUNCTION public.finalize_lead_from_completion_proof()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.state = 'complete' AND OLD.state IS DISTINCT FROM 'complete' THEN
    IF NEW.result_photo_path IS NULL OR NEW.signature_path IS NULL OR NEW.signed_at IS NULL THEN
      RAISE EXCEPTION 'Completion proof is incomplete';
    END IF;

    UPDATE public.leads
    SET outcome = 'done',
        outcome_at = COALESCE(outcome_at, NEW.completed_at, now()),
        review_requested_at = COALESCE(review_requested_at, NEW.completed_at, now()),
        next_step_at = NULL,
        next_step_kind = NULL,
        updated_at = now()
    WHERE id = NEW.lead_id
      AND claimed_by = NEW.contractor_id
      AND outcome IS NULL;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Lead is not eligible for completion';
    END IF;

    INSERT INTO public.lead_audit_logs (lead_id, action, changes)
    VALUES (NEW.lead_id, 'outcome_set', jsonb_build_object('outcome', 'done', 'proof', true));
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_lead_from_completion_proof() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_lead_from_completion_proof() TO service_role;

CREATE TRIGGER finalize_lead_after_completion_proof
BEFORE UPDATE OF state ON public.lead_completion_proofs
FOR EACH ROW
WHEN (NEW.state = 'complete' AND OLD.state IS DISTINCT FROM 'complete')
EXECUTE FUNCTION public.finalize_lead_from_completion_proof();