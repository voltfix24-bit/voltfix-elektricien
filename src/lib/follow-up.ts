/**
 * Opvolgladder: wat kantoor als volgende doet wanneer de klant niet opneemt.
 * Plant alleen werk voor kantoor — er gaat nooit automatisch een bericht naar
 * de klant.
 */

export type StepKind = 'call' | 'whatsapp' | 'close'

export const STEP_LABEL: Record<StepKind, string> = {
  call: 'Bellen',
  whatsapp: 'WhatsApp',
  close: 'Afsluiten als onbereikbaar',
}

/** Hoe vaak kantoor het maximaal probeert voordat de ladder eindigt. */
export const MAX_ATTEMPTS = 3

export type NextStep = { kind: 'call' | 'whatsapp'; at: string } | { kind: 'close' }

function addMinutes(now: number, minutes: number): string {
  return new Date(now + minutes * 60_000).toISOString()
}

function tomorrowAt(now: number, hour: number, minute: number): string {
  const date = new Date(now)
  date.setDate(date.getDate() + 1)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

/**
 * Voorstel na een mislukte poging. `attempts` is het aantal pogingen ná deze
 * mislukte poging. Staat het WhatsApp-venster dicht, dan wordt het voorstel
 * altijd bellen — een bericht buiten het venster heeft geen zin.
 */
export function suggestNextStep(attempts: number, windowOpen: boolean, now = Date.now()): NextStep {
  if (attempts >= MAX_ATTEMPTS) return { kind: 'close' }
  if (attempts <= 1) return { kind: windowOpen ? 'whatsapp' : 'call', at: addMinutes(now, 60) }
  return { kind: 'call', at: tomorrowAt(now, 9, 0) }
}

type StepLead = { next_step_at?: string | null; outcome?: string | null }

export function isStepOverdue(lead: StepLead, now = Date.now()): boolean {
  if (!lead.next_step_at || lead.outcome) return false
  const at = Date.parse(lead.next_step_at)
  return Number.isFinite(at) && at < now
}

export function minutesSinceStep(lead: StepLead, now = Date.now()): number {
  if (!lead.next_step_at) return 0
  return Math.max(0, Math.floor((now - Date.parse(lead.next_step_at)) / 60_000))
}

/** "vandaag 15:20" / "morgen 09:00" / "wo 16 sep 09:00". */
export function formatWhen(iso: string, now = Date.now()): string {
  const date = new Date(iso)
  const time = date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
  const day = new Date(date).setHours(0, 0, 0, 0)
  const today = new Date(now).setHours(0, 0, 0, 0)
  const diff = Math.round((day - today) / 86_400_000)
  if (diff === 0) return `vandaag ${time}`
  if (diff === 1) return `morgen ${time}`
  if (diff === -1) return `gisteren ${time}`
  return `${date.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })} ${time}`
}
