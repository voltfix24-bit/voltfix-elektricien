export type TimedLead = { status: string; dispatched_at: string | null; is_urgent?: boolean; job_type: string; claimed_by?: string | null }

export function isEmergencyLead(lead: Pick<TimedLead, 'is_urgent' | 'job_type'>) {
  return Boolean(lead.is_urgent) || /storing|stroomuitval|geen stroom|spoed|emergency|power outage/i.test(lead.job_type)
}

export function isLeadOverdue(lead: TimedLead, now = Date.now()) {
  if (lead.status !== 'dispatched' || lead.claimed_by || !lead.dispatched_at) return false
  return now > Date.parse(lead.dispatched_at) + (isEmergencyLead(lead) ? 1 : 24) * 3_600_000
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

export function openSinceColor(lead: TimedLead & { created_at: string }, now = Date.now()) {
  const thresholdMs = (isEmergencyLead(lead) ? 1 : 24) * 3_600_000
  const elapsed = now - openSinceAnchor(lead)
  if (elapsed > thresholdMs) return 'text-destructive'
  if (elapsed > thresholdMs / 2) return 'text-warning'
  return 'text-muted-foreground'
}