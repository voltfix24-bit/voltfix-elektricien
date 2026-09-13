import { describe, expect, it } from 'vitest'
import { isStepOverdue, minutesSinceStep, suggestNextStep } from './follow-up'

const now = Date.parse('2026-03-10T12:00:00Z')

describe('follow-up', () => {
  it('stelt bij de eerste poging WhatsApp over een uur voor', () => {
    const step = suggestNextStep(1, true, now)
    expect(step).toEqual({ kind: 'whatsapp', at: new Date(now + 3_600_000).toISOString() })
  })

  it('stelt bellen voor als het WhatsApp-venster dicht is', () => {
    expect(suggestNextStep(1, false, now).kind).toBe('call')
  })

  it('stelt bij de tweede poging bellen morgenochtend voor', () => {
    const step = suggestNextStep(2, true, now) as { kind: string; at: string }
    expect(step.kind).toBe('call')
    const at = new Date(step.at)
    expect(at.getHours()).toBe(9)
    expect(at.getMinutes()).toBe(0)
    expect(at.getTime()).toBeGreaterThan(now)
  })

  it('sluit af na drie pogingen', () => {
    expect(suggestNextStep(3, true, now)).toEqual({ kind: 'close' })
    expect(suggestNextStep(5, false, now)).toEqual({ kind: 'close' })
  })

  it('ziet een verlopen stap, maar niet als er al een afloop staat', () => {
    const past = new Date(now - 20 * 60_000).toISOString()
    expect(isStepOverdue({ next_step_at: past }, now)).toBe(true)
    expect(minutesSinceStep({ next_step_at: past }, now)).toBe(20)
    expect(isStepOverdue({ next_step_at: past, outcome: 'done' }, now)).toBe(false)
    expect(isStepOverdue({ next_step_at: new Date(now + 60_000).toISOString() }, now)).toBe(false)
    expect(isStepOverdue({ next_step_at: null }, now)).toBe(false)
  })
})
