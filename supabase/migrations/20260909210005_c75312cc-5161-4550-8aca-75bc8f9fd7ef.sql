-- The admin server function calls this RPC as the signed-in user.
-- Its existing has_role(auth.uid(), 'admin') guard remains mandatory.
REVOKE EXECUTE ON FUNCTION public.adjust_contractor_balance(uuid, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.adjust_contractor_balance(uuid, integer, text) TO authenticated, service_role;