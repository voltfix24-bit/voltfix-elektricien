import { durationText } from './lead-overdue'

/**
 * WhatsApp staat vrije antwoorden alleen toe binnen 24 uur na het laatste
 * bericht van de klant. Zonder tijdstip tonen we niets — niet gokken.
 */
export type WhatsAppWindow =
  | { state: 'unknown' }
  | { state: 'open' | 'closing' | 'closed'; minutesLeft: number }

export const WHATSAPP_WINDOW_MINUTES = 24 * 60

export function whatsappWindow(lastCustomerMessageAt: string | null | undefined, now = Date.now()): WhatsAppWindow {
  if (!lastCustomerMessageAt) return { state: 'unknown' }
  const start = Date.parse(lastCustomerMessageAt)
  if (!Number.isFinite(start)) return { state: 'unknown' }
  const elapsed = (now - start) / 60_000
  const minutesLeft = Math.max(0, Math.floor(WHATSAPP_WINDOW_MINUTES - elapsed))
  if (minutesLeft === 0) return { state: 'closed', minutesLeft }
  return { state: minutesLeft <= 60 ? 'closing' : 'open', minutesLeft }
}

/** Tekst en kleur onder de WhatsApp-knop; `null` wanneer we het niet weten. */
export function whatsappWindowNotice(win: WhatsAppWindow): { text: string; tone: string } | null {
  if (win.state === 'unknown') return null
  if (win.state === 'closed') return { text: 'Venster gesloten — alleen template', tone: 'text-destructive' }
  return {
    text: `Venster sluit over ${durationText(win.minutesLeft)}`,
    tone: win.state === 'closing' ? 'text-destructive' : 'text-warning',
  }
}
