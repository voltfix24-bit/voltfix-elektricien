import { describe, expect, it } from 'vitest'
import {
  dayOptions,
  isPlannedLead,
  isValidSlot,
  minutesSinceSchedulePrompt,
  needsSchedule,
  scheduleMissingOverdue,
  scheduleText,
  slotOptions,
  toScheduleIso,
} from './lead-schedule'

const planned = { status: 'claimed', is_urgent: false, job_type: 'Groepenkast vervangen' }
const emergency = { status: 'claimed', is_urgent: true, job_type: 'Storing: geen stroom' }

describe('plandatum', () => {
  it('scheidt gepland werk van storingen', () => {
    expect(isPlannedLead(planned)).toBe(true)
    expect(isPlannedLead(emergency)).toBe(false)
  })

  it('vraagt alleen om een plandatum bij opgepakt gepland werk zonder afloop', () => {
    expect(needsSchedule(planned)).toBe(true)
    expect(needsSchedule(emergency)).toBe(false)
    expect(needsSchedule({ ...planned, scheduled_at: '2026-09-22T07:30:00Z' })).toBe(false)
    expect(needsSchedule({ ...planned, outcome: 'done' })).toBe(false)
    expect(needsSchedule({ ...planned, status: 'dispatched' })).toBe(false)
  })

  it('legt de klus pas bij kantoor na twee vragen en vier stille uren', () => {
    const now = Date.parse('2026-09-20T12:00:00Z')
    const asked = (hoursAgo: number, count: number) => ({
      ...planned,
      schedule_prompt_count: count,
      schedule_prompt_at: new Date(now - hoursAgo * 3_600_000).toISOString(),
    })
    expect(scheduleMissingOverdue(asked(5, 1), now)).toBe(false)
    expect(scheduleMissingOverdue(asked(3, 2), now)).toBe(false)
    expect(scheduleMissingOverdue(asked(5, 2), now)).toBe(true)
    expect(minutesSinceSchedulePrompt(asked(5, 2), now)).toBe(300)
  })

  it('biedt vandaag, morgen en vier werkdagen', () => {
    const options = dayOptions(Date.parse('2026-09-14T09:00:00'))
    expect(options).toHaveLength(6)
    expect(options[0]!.label).toBe('Vandaag')
    expect(options[1]!.label).toBe('Morgen')
    expect(options.slice(2).every((option) => {
      const day = new Date(`${option.value}T12:00:00`).getDay()
      return day !== 0 && day !== 6
    })).toBe(true)
  })

  it('geeft halfuurblokken tussen 07:00 en 18:00', () => {
    const slots = slotOptions()
    expect(slots[0]).toBe('07:00')
    expect(slots[slots.length - 1]).toBe('18:00')
    expect(slots).toHaveLength(23)
    expect(isValidSlot('09:30')).toBe(true)
    expect(isValidSlot('06:30')).toBe(false)
    expect(isValidSlot('09:15')).toBe(false)
  })

  it('schrijft dag en tijd overal hetzelfde op', () => {
    const iso = toScheduleIso('2026-09-15', '09:30')
    expect(scheduleText(iso)).toMatch(/di 15 sep · 09:30/)
  })
})

describe('parseTimeInput', () => {
  it('accepteert vrije notaties', () => {
    expect(parseTimeInput('9')).toBe('09:00')
    expect(parseTimeInput('9:15')).toBe('09:15')
    expect(parseTimeInput('9.30')).toBe('09:30')
    expect(parseTimeInput('0915')).toBe('09:15')
    expect(parseTimeInput('14u30')).toBe('14:30')
  })
  it('weigert onzin en tijden buiten 06:00-22:00', () => {
    expect(parseTimeInput('')).toBeNull()
    expect(parseTimeInput('abc')).toBeNull()
    expect(parseTimeInput('05:30')).toBeNull()
    expect(parseTimeInput('23:00')).toBeNull()
    expect(parseTimeInput('12:75')).toBeNull()
  })
})
