import { describe, expect, it } from 'vitest'
import { countByPill, leadStage, REVIEW_CLOSE_MS, type StageLead } from './lead-status'

const base: StageLead = { status: 'new', job_type: 'Groepenkast vervangen', is_urgent: false }
const now = Date.parse('2026-09-20T10:00:00Z')

describe('statusmodel', () => {
  it('houdt de vier eerste werkstatussen uit elkaar', () => {
    expect(leadStage({ ...base, status: 'new' }, now)).toBe('new')
    expect(leadStage({ ...base, status: 'dispatched' }, now)).toBe('dispatched')
    expect(leadStage({ ...base, status: 'claimed' }, now)).toBe('claimed')
    expect(leadStage({ ...base, status: 'claimed', scheduled_at: '2026-09-22T07:30:00Z' }, now)).toBe('scheduled')
  })

  it('kent Ingepland nooit toe aan een storing', () => {
    expect(
      leadStage({ status: 'claimed', job_type: 'Storing', is_urgent: true, scheduled_at: '2026-09-22T07:30:00Z' }, now),
    ).toBe('claimed')
  })

  it('gaat van wacht op review naar afgerond zonder review na 7 dagen', () => {
    const done = { ...base, status: 'claimed', outcome: 'done', outcome_at: new Date(now - 86_400_000).toISOString() }
    expect(leadStage(done, now)).toBe('awaiting_review')
    expect(leadStage({ ...done, outcome_at: new Date(now - REVIEW_CLOSE_MS - 1000).toISOString() }, now)).toBe('closed_no_review')
    expect(leadStage({ ...done, review_closed_at: new Date(now).toISOString() }, now)).toBe('closed_no_review')
  })

  it('kent een late review alsnog toe', () => {
    const closed = {
      ...base,
      status: 'claimed',
      outcome: 'done',
      outcome_at: new Date(now - 9 * 86_400_000).toISOString(),
      review_closed_at: new Date(now - 2 * 86_400_000).toISOString(),
      reviewed_at: new Date(now).toISOString(),
    }
    expect(leadStage(closed, now)).toBe('closed_review')
  })

  it('zet de drie neutrale uitkomsten op Niet doorgegaan', () => {
    for (const outcome of ['declined', 'no_deal', 'unreachable']) {
      expect(leadStage({ ...base, status: 'claimed', outcome }, now)).toBe('not_proceeded')
    }
  })

  it('houdt piekaanvragen zichtbaar voor controle en laat zekere spam buiten het model', () => {
    expect(leadStage({ ...base, status: 'cancelled' }, now)).toBe('out_of_flow')
    expect(leadStage({ ...base, status: 'spam_review' }, now)).toBe('spam_review')
    expect(leadStage({ ...base, status: 'blocked_spam' }, now)).toBe('out_of_flow')
  })

  it('telt elke lead in precies één bak, en Alles (werk) is de som van de vier werkpillen', () => {
    const counts = countByPill(['new', 'dispatched', 'claimed', 'scheduled', 'awaiting_review', 'closed_review', 'closed_no_review', 'not_proceeded', 'spam_review'])
    expect(counts.work).toBe(6)
    expect(counts.closed).toBe(2)
    expect(counts.not_proceeded).toBe(1)
    expect(counts.spam_review).toBe(1)
    expect(counts.new + counts.dispatched + counts.claimed + counts.scheduled + counts.awaiting_review).toBe(counts.work)
  })
})
