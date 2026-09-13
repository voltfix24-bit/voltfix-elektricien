import { isStepOverdue, minutesSinceStep } from './follow-up'
import { minutesSinceSchedulePrompt, scheduleMissingOverdue } from './lead-schedule'

export type TimedLead = { status: string; dispatched_at: string | null; is_urgent?: boolean; job_type: string; claimed_by?: string | null }

export type EscalationSettings = { escalation_urgent_minutes?: number | null; escalation_planned_minutes?: number | null }

/** Startwaarden; in Instellingen aanpasbaar en daar via `settings` meegegeven. */
export const DEFAULT_ESCALATION_MINUTES = { urgent: 15, planned: 240 } as const

export function isEmergencyLead(lead: Pick<TimedLead, 'is_urgent' | 'job_type'>) {
  return Boolean(lead.is_urgent) || /storing|stroomuitval|geen stroom|kortsluiting|spoed|emergency|power outage/i.test(lead.job_type)
}

/**
 * De enige definitie van "te lang open": 15 minuten voor een storing, 4 uur
 * voor gepland werk. Lijst, detail, Vandaag en de geplande taak gebruiken deze
 * functie — er is geen tweede termijn elders.
 */
export function escalationMinutes(lead: Pick<TimedLead, 'is_urgent' | 'job_type'>, settings?: EscalationSettings) {
  return isEmergencyLead(lead)
    ? (settings?.escalation_urgent_minutes ?? DEFAULT_ESCALATION_MINUTES.urgent)
    : (settings?.escalation_planned_minutes ?? DEFAULT_ESCALATION_MINUTES.planned)
}

export function isLeadOverdue(lead: TimedLead & { created_at?: string }, now = Date.now(), settings?: EscalationSettings) {
  if (lead.status !== 'new' && lead.status !== 'dispatched') return false
  if (lead.claimed_by) return false
  const anchor = openSinceAnchor({ dispatched_at: lead.dispatched_at, created_at: lead.created_at ?? '' })
  if (!Number.isFinite(anchor)) return false
  return now > anchor + escalationMinutes(lead, settings) * 60_000
}

/** "Open sinds" telt vanaf doorzetten naar Telegram, anders vanaf aanmaken. */
export function openSinceAnchor(lead: { dispatched_at: string | null; created_at: string }) {
  return lead.dispatched_at ? Date.parse(lead.dispatched_at) : Date.parse(lead.created_at)
}

export function openSinceText(lead: { dispatched_at: string | null; created_at: string }, now = Date.now()) {
  const minutes = Math.floor((now - openSinceAnchor(lead)) / 60_000)
  if (minutes < 60) return `open sinds ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `open sinds ${hours} u`
  const days = Math.floor(hours / 24)
  return `open sinds ${days} d`
}

export function openSinceColor(lead: TimedLead & { created_at: string }, now = Date.now(), settings?: EscalationSettings) {
  const thresholdMs = escalationMinutes(lead, settings) * 60_000
  const elapsed = now - openSinceAnchor(lead)
  if (elapsed > thresholdMs) return 'text-destructive'
  if (elapsed > thresholdMs / 2) return 'text-warning'
  return 'text-muted-foreground'
}

/** Verstreken minuten sinds binnenkomst (of doorzetten). */
export function openMinutes(lead: { dispatched_at: string | null; created_at: string }, now = Date.now()) {
  return Math.floor((now - openSinceAnchor(lead)) / 60_000)
}

/** "22 min" / "3 u 40 m" — dezelfde notatie in lijst, detail en instellingen. */
export function durationText(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} u` : `${hours} u ${rest} m`
}

export type Urgency = 'escalated' | 'emergency' | 'no_schedule' | 'step_overdue' | 'failed' | 'none'

/** De enige plek die bepaalt hoe dringend een lead eruitziet. */
export function leadUrgency(
  lead: TimedLead & { created_at: string; dispatch?: { state?: string | null } | null; next_step_at?: string | null; outcome?: string | null },
  now = Date.now(),
  settings?: EscalationSettings,
): Urgency {
  if (isLeadOverdue(lead, now, settings)) return 'escalated'
  if (isEmergencyLead(lead) && !lead.claimed_by) return 'emergency'
  if (scheduleMissingOverdue(lead as never, now)) return 'no_schedule'
  if (isStepOverdue(lead, now)) return 'step_overdue'
  if (lead.dispatch?.state === 'failed') return 'failed'
  return 'none'
}

/** Klasse voor de 3px linkerrand. Nergens anders een randkleur bepalen. */
export const URGENCY_BORDER: Record<Urgency, string> = {
  escalated: 'border-l-destructive',
  emergency: 'border-l-destructive',
  no_schedule: 'border-l-warning',
  step_overdue: 'border-l-warning',
  failed: 'border-l-warning',
  none: 'border-l-border',
}

/** Derde regel in de lijst; leeg wanneer er niets aan de hand is. */
export function urgencyLine(
  lead: TimedLead & { created_at: string; dispatch?: { state?: string | null } | null; next_step_at?: string | null; outcome?: string | null },
  now = Date.now(),
  settings?: EscalationSettings,
): string | null {
  const urgency = leadUrgency(lead, now, settings)
  const minutes = openMinutes(lead, now)
  if (urgency === 'escalated') return `Niet opgepakt · ${durationText(minutes)} · beheerder gewaarschuwd`
  if (urgency === 'emergency') return `Spoed · open sinds ${durationText(minutes)}`
  if (urgency === 'no_schedule') return `Geen plandatum · ${durationText(minutesSinceSchedulePrompt(lead as never, now))}`
  if (urgency === 'step_overdue') return `Vervolgstap verlopen · ${durationText(minutesSinceStep(lead, now))}`
  if (urgency === 'failed') return `Verzending mislukt · ${durationText(minutes)}`
  return null
}
