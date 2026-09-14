/**
 * Plandatum van gepland werk: welke dag en welk half uur de monteur heeft
 * doorgegeven. Alleen gepland werk kan ingepland zijn — een storing nooit.
 */

import { isEmergencyLead } from './lead-overdue'

export type ScheduleLead = {
  status?: string
  is_urgent?: boolean | null
  job_type?: string | null
  outcome?: string | null
  scheduled_at?: string | null
  schedule_prompt_count?: number | null
  schedule_prompt_at?: string | null
  claimed_at?: string | null
}

/** Gepland werk is alles wat geen storing of spoed is. Eén definitie. */
export function isPlannedLead(lead: { is_urgent?: boolean | null; job_type?: string | null }): boolean {
  return !isEmergencyLead({ is_urgent: Boolean(lead.is_urgent), job_type: lead.job_type ?? '' })
}

/** Hoeveel uur de bot wacht op antwoord voordat hij het nog één keer vraagt. */
export const SCHEDULE_PROMPT_HOURS = 4
export const SCHEDULE_PROMPT_MS = SCHEDULE_PROMPT_HOURS * 3_600_000
/** De bot vraagt het precies twee keer; daarna is het aan kantoor. */
export const MAX_SCHEDULE_PROMPTS = 2

/** Opgepakt gepland werk zonder dag en tijd — de harde rem hangt hieraan. */
export function needsSchedule(lead: ScheduleLead): boolean {
  return lead.status === 'claimed' && !lead.outcome && !lead.scheduled_at && isPlannedLead(lead)
}

/** Twee keer gevraagd, vier uur stil: kantoor pakt het over. */
export function scheduleMissingOverdue(lead: ScheduleLead, now = Date.now()): boolean {
  if (!needsSchedule(lead)) return false
  if ((lead.schedule_prompt_count ?? 0) < MAX_SCHEDULE_PROMPTS) return false
  const asked = lead.schedule_prompt_at ? Date.parse(lead.schedule_prompt_at) : NaN
  if (!Number.isFinite(asked)) return false
  return now - asked > SCHEDULE_PROMPT_MS
}

export function minutesSinceSchedulePrompt(lead: ScheduleLead, now = Date.now()): number {
  const asked = lead.schedule_prompt_at ? Date.parse(lead.schedule_prompt_at) : NaN
  if (!Number.isFinite(asked)) return 0
  return Math.max(0, Math.floor((now - asked) / 60_000))
}

/* ---------------- Dagen en tijdvakken ---------------- */

export function isoDay(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export type DayOption = { value: string; label: string }

const DAY_FORMAT = new Intl.DateTimeFormat('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })

/** Vandaag, morgen en de vier werkdagen daarna (met datum). */
export function dayOptions(now = Date.now()): DayOption[] {
  const options: DayOption[] = []
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  options.push({ value: isoDay(start), label: 'Vandaag' })
  const tomorrow = new Date(start)
  tomorrow.setDate(tomorrow.getDate() + 1)
  options.push({ value: isoDay(tomorrow), label: 'Morgen' })

  const cursor = new Date(tomorrow)
  while (options.length < 6) {
    cursor.setDate(cursor.getDate() + 1)
    const day = cursor.getDay()
    if (day === 0 || day === 6) continue
    options.push({ value: isoDay(cursor), label: DAY_FORMAT.format(cursor) })
  }
  return options
}

/** Blokken van een half uur tussen 07:00 en 18:00. */
export function slotOptions(): string[] {
  const slots: string[] = []
  for (let minutes = 7 * 60; minutes <= 18 * 60; minutes += 30) {
    slots.push(`${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`)
  }
  return slots
}

export function isValidDay(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T12:00:00`))
}

export function isValidSlot(value: string): boolean {
  return slotOptions().includes(value)
}

/**
 * Vrij ingetypte tijd van de monteur: "9", "9:15", "9.15", "0915", "14u30".
 * Levert "HH:MM" tussen 06:00 en 22:00, anders null.
 */
export function parseTimeInput(raw: string): string | null {
  const value = (raw ?? '').trim().toLowerCase().replace(/\s+/g, '')
  if (!value) return null
  let hour: number | null = null
  let minute = 0
  let match = /^(\d{1,2})[:.uh-](\d{2})$/.exec(value)
  if (match) {
    hour = Number(match[1])
    minute = Number(match[2])
  } else if ((match = /^(\d{1,2})[:.uh-]?$/.exec(value))) {
    hour = Number(match[1])
  } else if ((match = /^(\d{3,4})$/.exec(value))) {
    const digits = match[1]!.padStart(4, '0')
    hour = Number(digits.slice(0, 2))
    minute = Number(digits.slice(2))
  }
  if (hour === null || !Number.isFinite(hour) || !Number.isFinite(minute)) return null
  if (minute < 0 || minute > 59) return null
  if (hour < 6 || hour > 22) return null
  if (hour === 22 && minute > 0) return null
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

/** Lokale dag + tijd naar een tijdstip; Amsterdam draait op de servertijdzone. */
export function toScheduleIso(day: string, slot: string): string {
  const [year, month, date] = day.split('-').map(Number)
  const [hour, minute] = slot.split(':').map(Number)
  return new Date(year!, (month ?? 1) - 1, date ?? 1, hour ?? 0, minute ?? 0, 0, 0).toISOString()
}

/** "di 16 sep · 09:30" — dezelfde notatie in lijst, detail en Telegram. */
export function scheduleText(iso: string): string {
  const date = new Date(iso)
  if (!Number.isFinite(date.getTime())) return ''
  const day = date.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
  const time = date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
  return `${day} · ${time}`
}
