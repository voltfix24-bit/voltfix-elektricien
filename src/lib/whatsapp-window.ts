/**
 * WhatsApp staat vrije antwoorden alleen toe binnen 24 uur na het laatste
 * bericht van de klant. Zonder tijdstip tonen we niets — niet gokken.
 */
export type WhatsAppWindow = { state: 'open' | 'last_hour' | 'closed'; text: string; tone: 'text-warning' | 'text-destructive' }

export const WHATSAPP_WINDOW_MS = 24 * 3_600_000

export function whatsappWindow(lastCustomerMessageAt: string | null | undefined, now = Date.now()): WhatsAppWindow | null {
  if (!lastCustomerMessageAt) return null
  const start = Date.parse(lastCustomerMessageAt)
  if (!Number.isFinite(start)) return null
  const minutesLeft = Math.floor((start + WHATSAPP_WINDOW_MS - now) / 60_000)
  if (minutesLeft <= 0) return { state: 'closed', text: 'Venster gesloten — alleen template', tone: 'text-destructive' }
  const hours = Math.floor(minutesLeft / 60)
  const minutes = minutesLeft % 60
  const left = hours ? `${hours} u ${String(minutes).padStart(2, '0')}` : `${minutes} min`
  return {
    state: minutesLeft <= 60 ? 'last_hour' : 'open',
    text: `Venster sluit over ${left}`,
    tone: minutesLeft <= 60 ? 'text-destructive' : 'text-warning',
  }
}
