ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS escalation_claimed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS escalation_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS escalation_minutes integer,
  ADD COLUMN IF NOT EXISTS last_customer_message_estimated boolean NOT NULL DEFAULT false;

-- Eenmalige vulling voor bestaande openstaande leads; daarna vult de app dit veld.
UPDATE public.leads l
SET escalation_minutes = CASE
      WHEN l.is_urgent OR l.job_type ~* '(storing|stroomuitval|geen stroom|kortsluiting|spoed|emergency|power outage)'
        THEN coalesce((SELECT escalation_urgent_minutes FROM public.lead_settings WHERE id = 1), 15)
      ELSE coalesce((SELECT escalation_planned_minutes FROM public.lead_settings WHERE id = 1), 240)
    END
WHERE l.escalation_minutes IS NULL;

CREATE OR REPLACE FUNCTION public.reserve_lead_escalations(_limit integer DEFAULT 20)
RETURNS SETOF public.leads
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH cfg AS (
    SELECT coalesce(max(escalation_planned_minutes), 240) AS fallback_minutes
    FROM public.lead_settings WHERE id = 1
  ), due AS (
    SELECT l.id FROM public.leads l, cfg
    WHERE l.escalated_at IS NULL
      AND l.claimed_by IS NULL
      AND l.status IN ('new', 'dispatched')
      -- Vastgelopen poging (proces gestopt tussen claimen en versturen) mag na een kwartier opnieuw.
      AND (l.escalation_claimed_at IS NULL OR l.escalation_claimed_at < now() - interval '15 minutes')
      AND coalesce(l.dispatched_at, l.created_at)
          + make_interval(mins => coalesce(l.escalation_minutes, cfg.fallback_minutes)) < now()
    ORDER BY l.created_at
    LIMIT greatest(_limit, 1)
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.leads l SET escalation_claimed_at = now()
  FROM due WHERE l.id = due.id AND l.escalated_at IS NULL
  RETURNING l.*;
$$;

REVOKE ALL ON FUNCTION public.reserve_lead_escalations(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_lead_escalations(integer) TO service_role;