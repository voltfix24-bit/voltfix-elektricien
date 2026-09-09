import { describe, expect, it } from 'vitest'
import { isEmergencyLead, isLeadOverdue } from './lead-overdue'

const base = { status: 'dispatched', dispatched_at: '2026-09-09T12:00:00.000Z', job_type: 'Groepenkast vervangen', is_urgent: false, claimed_by: null }
const after = (hours: number) => Date.parse(base.dispatched_at) + hours * 3_600_000

describe('overdue leads', () => {
  it('waits strictly beyond 24 hours for ordinary leads', () => {
    expect(isLeadOverdue(base, after(23))).toBe(false)
    expect(isLeadOverdue(base, after(24))).toBe(false)
    expect(isLeadOverdue(base, after(24) + 1)).toBe(true)
  })
  it('waits strictly beyond one hour for emergency leads', () => {
    const lead = { ...base, is_urgent: true }
    expect(isLeadOverdue(lead, after(1))).toBe(false)
    expect(isLeadOverdue(lead, after(1) + 1)).toBe(true)
  })
  it('recognizes legacy outage leads without an urgency flag', () => {
    for (const job_type of ['Storing / geen stroom', 'Spoed: Stroomuitval/Storing', 'Emergency repair', 'Power outage']) {
      expect(isEmergencyLead({ job_type })).toBe(true)
      expect(isLeadOverdue({ ...base, job_type }, after(2))).toBe(true)
    }
  })
  it('ignores drafts, claims, cancellations, spam and missing dates', () => {
    for (const status of ['new', 'claimed', 'cancelled', 'blocked_spam', 'spam_review']) expect(isLeadOverdue({ ...base, status }, after(48))).toBe(false)
    expect(isLeadOverdue({ ...base, claimed_by: 'contractor' }, after(48))).toBe(false)
    expect(isLeadOverdue({ ...base, dispatched_at: null }, after(48))).toBe(false)
  })
  it('restarts the timer upon re-dispatch', () => {
    expect(isLeadOverdue({ ...base, dispatched_at: new Date(after(47)).toISOString() }, after(48))).toBe(false)
  })
})