/**
 * Hoe een opgepakte klus is afgelopen. Vier uitkomsten, hier gedefinieerd en
 * nergens anders — geen vijfde, geen facturatie, geen uren.
 */

export const OUTCOMES = ['done', 'declined', 'no_deal', 'unreachable'] as const
export type Outcome = (typeof OUTCOMES)[number]

export const OUTCOME_LABEL: Record<Outcome, string> = {
  done: 'Klus gedaan',
  declined: 'Klant zag ervan af',
  no_deal: 'Prijs niet akkoord',
  unreachable: 'Klant onbereikbaar',
}

/** Alleen 'done' is groen. De rest is neutraal — geen fout, dus geen rood. */
export const OUTCOME_DOT: Record<Outcome, string> = {
  done: 'bg-success',
  declined: 'bg-muted-foreground',
  no_deal: 'bg-muted-foreground',
  unreachable: 'bg-muted-foreground',
}

export function isOutcome(value: unknown): value is Outcome {
  return typeof value === 'string' && (OUTCOMES as readonly string[]).includes(value)
}

type OutcomeLead = { status: string; outcome?: string | null; claimed_at?: string | null }

/** Alleen te zetten zolang de lead opgepakt is en er nog geen afloop staat. */
export function canSetOutcome(lead: OutcomeLead): boolean {
  return lead.status === 'claimed' && !lead.outcome
}

/** Opgepakt, ouder dan 3 dagen, nog geen uitkomst. */
export function isOutcomeOverdue(lead: OutcomeLead, now = Date.now()): boolean {
  if (lead.status !== 'claimed' || lead.outcome) return false
  if (!lead.claimed_at) return false
  const claimed = Date.parse(lead.claimed_at)
  if (!Number.isFinite(claimed)) return false
  return (now - claimed) / 86_400_000 > 3
}
