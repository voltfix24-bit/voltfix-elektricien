export type TimedLead = { status: string; dispatched_at: string | null; is_urgent?: boolean; job_type: string; claimed_by?: string | null }

export function isEmergencyLead(lead: Pick<TimedLead, 'is_urgent' | 'job_type'>) {
  return Boolean(lead.is_urgent) || /storing|stroomuitval|geen stroom|spoed|emergency|power outage/i.test(lead.job_type)
}

export function isLeadOverdue(lead: TimedLead, now = Date.now()) {
  if (lead.status !== 'dispatched' || lead.claimed_by || !lead.dispatched_at) return false
  return now > Date.parse(lead.dispatched_at) + (isEmergencyLead(lead) ? 1 : 24) * 3_600_000
}