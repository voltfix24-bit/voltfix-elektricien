REVOKE ALL ON FUNCTION public.admin_assign_lead(uuid, uuid, uuid, boolean, boolean, boolean, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_release_lead(uuid, uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_assign_lead(uuid, uuid, uuid, boolean, boolean, boolean, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_release_lead(uuid, uuid, boolean, text) TO authenticated, service_role;