ALTER FUNCTION public.has_role(uuid, public.app_role) SECURITY INVOKER;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.approve_review_bonus(uuid, integer, smallint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_review_bonus(uuid, integer, smallint) TO service_role;