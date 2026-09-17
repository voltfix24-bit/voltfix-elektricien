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


/** Vandaag en de dertien dagen daarna: de monteur plant binnen twee weken. */
export const SCHEDULE_DAYS = 14

export function dayOptions(now = Date.now()): DayOption[] {
  const options: DayOption[] = []
  // "Vandaag" is de dag in Amsterdam, niet de dag op de server (UTC).
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(new Date(now))
  const [y, m, d] = today.split('-').map(Number)
  for (let offset = 0; offset < SCHEDULE_DAYS; offset++) {
    const date = new Date(Date.UTC(y!, (m ?? 1) - 1, (d ?? 1) + offset, 12))
    const label =
      offset === 0
        ? 'Vandaag'
        : offset === 1
          ? 'Morgen'
          : date.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
    options.push({ value: date.toISOString().slice(0, 10), label })
  }
  return options
}


export type SlotBlock = { value: string; label: string; start: string; end: string }

/** Tijdvakken van twee uur tussen 08:00 en 18:00, plus "hele dag". */
export const SLOT_BLOCKS: SlotBlock[] = [
  { value: '08-10', label: '08:00 - 10:00', start: '08:00', end: '10:00' },
  { value: '10-12', label: '10:00 - 12:00', start: '10:00', end: '12:00' },
  { value: '12-14', label: '12:00 - 14:00', start: '12:00', end: '14:00' },
  { value: '14-16', label: '14:00 - 16:00', start: '14:00', end: '16:00' },
  { value: '16-18', label: '16:00 - 18:00', start: '16:00', end: '18:00' },
  { value: 'dag', label: 'Hele dag', start: '08:00', end: '18:00' },
]

export function findBlock(value: string): SlotBlock | null {
  return SLOT_BLOCKS.find((block) => block.value === value) ?? null
}

/** Starttijd van een keuze: een tijdvak of een zelf ingetypte tijd. */
export function slotStartTime(value: string): string | null {
  const block = findBlock(value)
  if (block) return block.start
  return isValidSlot(value) ? value : null
}

/** Leesbare weergave van het gekozen tijdvak; leeg bij een losse tijd. */
export function slotLabel(value: string | null | undefined): string {
  const block = value ? findBlock(value) : null
  return block ? block.label : ''
}

/** Blokken van een half uur tussen 07:00 en 18:00 (zelf ingetypte tijd). */
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

/** Tijdzone van het werkgebied; de server draait op UTC, de monteur niet. */
const TZ = 'Europe/Amsterdam'

const TZ_PARTS = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ,
  hour12: false,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

/** Verschil tussen Amsterdamse tijd en UTC op dat moment, in milliseconden. */
function tzOffsetMs(utcMs: number): number {
  const p: Record<string, string> = {}
  for (const part of TZ_PARTS.formatToParts(new Date(utcMs))) p[part.type] = part.value
  const asUtc = Date.UTC(
    Number(p['year']),
    Number(p['month']) - 1,
    Number(p['day']),
    Number(p['hour']) === 24 ? 0 : Number(p['hour']),
    Number(p['minute']),
    Number(p['second']),
  )
  return asUtc - utcMs
}

/**
 * Dag + tijd zoals de monteur ze kiest, altijd gelezen als Amsterdamse tijd.
 * Zonder dit staat een klus van 14:00 op een UTC-server twee uur verkeerd.
 */
export function toScheduleIso(day: string, slot: string): string {
  const [year, month, date] = day.split('-').map(Number)
  const [hour, minute] = slot.split(':').map(Number)
  const naive = Date.UTC(year!, (month ?? 1) - 1, date ?? 1, hour ?? 0, minute ?? 0, 0, 0)
  let ts = naive - tzOffsetMs(naive)
  ts = naive - tzOffsetMs(ts)
  return new Date(ts).toISOString()
}

/** "di 16 sep · 09:30" — altijd Amsterdamse tijd, ook in een servermelding. */
export function scheduleText(iso: string): string {
  const date = new Date(iso)
  if (!Number.isFinite(date.getTime())) return ''
  const day = date.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ })
  const time = date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: TZ })
  return `${day} · ${time}`
}

