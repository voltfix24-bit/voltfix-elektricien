REVOKE ALL ON FUNCTION public.reserve_lead_escalations(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enqueue_lead_escalation_check() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.wake_lead_escalation() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_lead_escalations(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.enqueue_lead_escalation_check() TO service_role;