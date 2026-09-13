import { describe, expect, it } from 'vitest'
import { escalationMinutes, isEmergencyLead, isLeadOverdue } from './lead-overdue'

const base = { status: 'dispatched', dispatched_at: '2026-09-09T12:00:00.000Z', created_at: '2026-09-09T11:00:00.000Z', job_type: 'Groepenkast vervangen', is_urgent: false, claimed_by: null }
const after = (minutes: number) => Date.parse(base.dispatched_at) + minutes * 60_000

describe('escalatietermijn', () => {
  it('geeft 15 minuten voor storingen en 240 voor gepland werk', () => {
    expect(escalationMinutes({ job_type: 'Storing / geen stroom' })).toBe(15)
    expect(escalationMinutes({ job_type: 'Kortsluiting', is_urgent: false })).toBe(15)
    expect(escalationMinutes(base)).toBe(240)
  })
  it('volgt de ingestelde termijnen wanneer die worden meegegeven', () => {
    const settings = { escalation_urgent_minutes: 10, escalation_planned_minutes: 120 }
    expect(escalationMinutes({ ...base, is_urgent: true }, settings)).toBe(10)
    expect(escalationMinutes(base, settings)).toBe(120)
  })
})

describe('niet opgepakt', () => {
  it('wacht strikt langer dan vier uur bij gepland werk', () => {
    expect(isLeadOverdue(base, after(239))).toBe(false)
    expect(isLeadOverdue(base, after(240))).toBe(false)
    expect(isLeadOverdue(base, after(240) + 1)).toBe(true)
  })
  it('wacht strikt langer dan vijftien minuten bij een storing', () => {
    const lead = { ...base, is_urgent: true }
    expect(isLeadOverdue(lead, after(15))).toBe(false)
    expect(isLeadOverdue(lead, after(15) + 1)).toBe(true)
  })
  it('herkent oudere storingsleads zonder spoedvlag', () => {
    for (const job_type of ['Storing / geen stroom', 'Spoed: Stroomuitval/Storing', 'Kortsluiting meterkast', 'Emergency repair', 'Power outage']) {
      expect(isEmergencyLead({ job_type })).toBe(true)
      expect(isLeadOverdue({ ...base, job_type }, after(20))).toBe(true)
    }
  })
  it('telt een nog niet doorgezette lead vanaf aanmaken', () => {
    const lead = { ...base, status: 'new', dispatched_at: null }
    expect(isLeadOverdue(lead, Date.parse(lead.created_at) + 239 * 60_000)).toBe(false)
    expect(isLeadOverdue(lead, Date.parse(lead.created_at) + 241 * 60_000)).toBe(true)
  })
  it('negeert geclaimde, geannuleerde en spamleads', () => {
    for (const status of ['claimed', 'cancelled', 'blocked_spam', 'spam_review']) expect(isLeadOverdue({ ...base, status }, after(2880))).toBe(false)
    expect(isLeadOverdue({ ...base, claimed_by: 'contractor' }, after(2880))).toBe(false)
  })
  it('herstart de teller na opnieuw doorzetten', () => {
    expect(isLeadOverdue({ ...base, dispatched_at: new Date(after(2820)).toISOString() }, after(2880))).toBe(false)
  })
})
