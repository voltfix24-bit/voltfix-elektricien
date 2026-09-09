import { describe, expect, it } from 'vitest'
import { leadStage } from './lead-status'

describe('lead status filters', () => {
  it('keeps open, dispatched and claimed separate', () => {
    expect(leadStage('new')).toBe('open')
    expect(leadStage('spam_review')).toBe('open')
    expect(leadStage('dispatched')).toBe('dispatched')
    expect(leadStage('claimed')).toBe('claimed')
  })
  it('groups cancelled and blocked leads without treating claims as completed jobs', () => {
    expect(leadStage('cancelled')).toBe('closed')
    expect(leadStage('blocked_spam')).toBe('closed')
    expect(leadStage('unknown')).toBeUndefined()
  })
})