/**
 * Agenda-afspraak voor een ingeplande klus: .ics-bestand voor de telefoon van
 * de monteur en een link naar Google Agenda. Herinnering 60 minuten vooraf.
 */

export type AppointmentLead = {
  id: string
  ref_number?: number | string | null
  job_type?: string | null
  customer_name?: string | null
  customer_phone?: string | null
  address?: string | null
  postal_code?: string | null
  city?: string | null
  description?: string | null
}

export const REMINDER_MINUTES = 60

function stamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

export function appointmentTitle(lead: AppointmentLead): string {
  const ref = lead.ref_number ? `#${lead.ref_number}` : ''
  const job = (lead.job_type ?? 'Klus').trim()
  return [job, ref].filter(Boolean).join(' ')
}

export function appointmentLocation(lead: AppointmentLead): string {
  return [lead.address, lead.postal_code, lead.city].map((part) => (part ?? '').trim()).filter(Boolean).join(', ')
}

export function appointmentDescription(lead: AppointmentLead): string {
  const lines = [
    lead.ref_number ? `Aanvraag #${lead.ref_number}` : '',
    lead.customer_name ? `Klant: ${lead.customer_name}` : '',
    lead.customer_phone ? `Telefoon: ${lead.customer_phone}` : '',
    appointmentLocation(lead) ? `Adres: ${appointmentLocation(lead)}` : '',
    (lead.description ?? '').trim() ? `Omschrijving: ${(lead.description ?? '').trim().replace(/\s+/g, ' ').slice(0, 400)}` : '',
  ].filter(Boolean)
  return lines.join('\n')
}

function escapeIcs(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

/** Bouwt het .ics-bestand; start en einde als echte tijdstippen (UTC). */
export function buildAppointmentIcs(lead: AppointmentLead, startIso: string, endIso: string): string {
  const start = new Date(startIso)
  const end = new Date(endIso)
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//VoltFix//Planning//NL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:voltfix-${lead.id}@voltfix.nl`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escapeIcs(appointmentTitle(lead))}`,
    `LOCATION:${escapeIcs(appointmentLocation(lead))}`,
    `DESCRIPTION:${escapeIcs(appointmentDescription(lead))}`,
    'BEGIN:VALARM',
    `TRIGGER:-PT${REMINDER_MINUTES}M`,
    'ACTION:DISPLAY',
    'DESCRIPTION:Herinnering: klus VoltFix',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

/** Link "Zet in Google Agenda" met dezelfde gegevens als het .ics-bestand. */
export function googleCalendarUrl(lead: AppointmentLead, startIso: string, endIso: string): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: appointmentTitle(lead),
    dates: `${stamp(new Date(startIso))}/${stamp(new Date(endIso))}`,
    details: appointmentDescription(lead),
    location: appointmentLocation(lead),
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
