-- Authenticated admins already have the required table grants and admin-only RLS.
-- Execute under the caller's rights, retaining the explicit admin check and atomic transaction.
ALTER FUNCTION public.adjust_contractor_balance(uuid, integer, text) SECURITY INVOKER;