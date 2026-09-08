-- Beperk EXECUTE-rechten voor beveiligingsgevoelige SECURITY DEFINER functies
-- Deze functies worden alleen intern aangeroepen (service_role / admin serverfuncties),
-- niet rechtstreeks door anonieme of gewone ingelogde gebruikers.

-- claim_lead: alleen service_role (Telegram webhook via supabaseAdmin)
REVOKE EXECUTE ON FUNCTION public.claim_lead(uuid, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_lead(uuid, bigint) TO service_role;

-- adjust_contractor_balance: alleen service_role (admin serverfuncties)
REVOKE EXECUTE ON FUNCTION public.adjust_contractor_balance(uuid, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_contractor_balance(uuid, integer, text) TO service_role;

-- has_role: moet beschikbaar blijven voor authenticated omdat RLS-beleid deze aanroept
-- Controleer en corrigeer eventuele te ruime rechten, maar laat authenticated staan.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- update_updated_at_column is een triggerfunctie en hoeft niet direct aangeroepen te worden
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;