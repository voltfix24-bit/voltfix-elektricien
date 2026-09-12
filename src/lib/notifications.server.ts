import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/integrations/supabase/types'
import { business } from '@/lib/business'

/**
 * Duurzame meldingenwachtrij voor aanvragen.
 *
 * Iedere aanvraag krijgt bij opslag één rij per melding (interne leadverwerking,
 * eigenaarsmail, klantbevestiging). Slaagt een melding niet, dan blijft de rij
 * staan met een oplopend aantal pogingen en een volgend probeermoment. Zo is
 * uitval tussen opslag en interne opvolging herstelbaar: opnieuw proberen vult
 * precies de ontbrekende melding aan en maakt nooit een tweede lead.
 */

export type NotificationKind = 'internal_lead' | 'owner_email' | 'customer_email'

type QuoteRow = Database['public']['Tables']['quote_requests']['Row']

const BACKOFF_MINUTES = [1, 5, 15, 60, 240]
const MAX_ATTEMPTS = 6

export async function enqueueNotifications(
  supabase: SupabaseClient<Database>,
  quoteRequestId: string,
  entries: Array<{ kind: NotificationKind; payload?: Record<string, unknown> }>,
) {
  if (!entries.length) return
  const { error } = await supabase.from('notification_outbox').upsert(
    entries.map((entry) => ({
      quote_request_id: quoteRequestId,
      kind: entry.kind,
      status: 'pending',
      payload: (entry.payload ?? {}) as never,
    })),
    { onConflict: 'quote_request_id,kind', ignoreDuplicates: true },
  )
  // Een opslagfout mag nooit stil passeren: zonder taken bestaat er geen
  // opvolging en zou de aanvraag onzichtbaar blijven liggen.
  if (error) throw new Error(`Failed to enqueue notifications: ${error.message}`)
}

/**
 * Zorgt dat de verwachte taken bestaan, ook wanneer een eerdere poging tussen
 * het opslaan van de aanvraag en het vastleggen van de taken is afgebroken.
 */
export async function ensureNotifications(
  supabase: SupabaseClient<Database>,
  quoteRequestId: string,
  entries: Array<{ kind: NotificationKind; payload?: Record<string, unknown> }>,
) {
  const { data, error } = await supabase
    .from('notification_outbox')
    .select('kind')
    .eq('quote_request_id', quoteRequestId)
  if (error) throw new Error(`Failed to read notification outbox: ${error.message}`)
  const known = new Set((data ?? []).map((row) => row.kind))
  const missing = entries.filter((entry) => !known.has(entry.kind))
  if (missing.length) await enqueueNotifications(supabase, quoteRequestId, missing)
  return { existing: known.size, added: missing.length }
}

async function signedAttachments(supabase: SupabaseClient<Database>, paths: string[]) {
  const links: Array<{ url: string; filename: string }> = []
  for (const path of paths) {
    const { data } = await supabase.storage.from('quote-attachments').createSignedUrl(path, 60 * 60 * 24 * 7)
    if (data?.signedUrl) links.push({ url: data.signedUrl, filename: path.split('/').pop() ?? 'foto' })
  }
  return links
}

async function runOne(
  supabase: SupabaseClient<Database>,
  quote: QuoteRow,
  kind: NotificationKind,
  payload: Record<string, unknown>,
) {
  const locale = (quote.locale === 'en' ? 'en' : 'nl') as 'nl' | 'en'
  if (kind === 'internal_lead') {
    const { createAndDispatchLead } = await import('./leads-intake.server')
    const isUrgent = /spoed|storing|urgent|emergency/i.test(`${quote.job_type} ${quote.message ?? ''}`)
    await createAndDispatchLead({
      name: quote.name,
      phone: quote.phone,
      email: quote.email,
      postalCode: quote.postal_code,
      address: quote.street ? `${quote.street} ${quote.house_number ?? ''}, ${(quote.postal_code ?? '').toUpperCase()}`.trim() : null,
      city: quote.city ?? null,
      jobType: quote.job_type,
      description: [
        quote.message,
        quote.appointment_date ? `Voorkeur: ${quote.appointment_date}${quote.appointment_slot ? ` · ${quote.appointment_slot}` : ''}` : null,
        quote.attachment_paths?.length ? `${quote.attachment_paths.length} foto('s) meegestuurd` : null,
      ]
        .filter(Boolean)
        .join('\n'),
      isUrgent,
      source: quote.appointment_date ? 'booking_form' : 'website_form',
      sourcePath: quote.source_path ?? null,
      imagePaths: Array.isArray(payload['imagePaths']) ? (payload['imagePaths'] as string[]) : [],
      // Dezelfde aanvraag levert altijd dezelfde lead op, ook na opnieuw proberen.
      externalRef: `quote:${quote.id}`,
    })
    return
  }

  const { sendTemplateEmail } = await import('./email-templates/send-email')
  if (kind === 'owner_email') {
    const result = await sendTemplateEmail('quote-notification', business.email, {
      idempotencyKey: `quote-notification-${quote.id}`,
      templateData: {
        name: quote.name,
        phone: quote.phone,
        email: quote.email ?? undefined,
        postalCode: quote.postal_code ?? undefined,
        jobType: quote.job_type,
        message: quote.message ?? undefined,
        locale,
        sourcePath: quote.source_path ?? undefined,
        appointmentDate: quote.appointment_date ?? undefined,
        appointmentSlot: quote.appointment_slot ?? undefined,
        appointmentNote: quote.appointment_note ?? undefined,
        attachments: await signedAttachments(supabase, quote.attachment_paths ?? []),
        submittedAt: new Date(quote.created_at).toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' }),
      },
    })
    if (!result.sent) return // onderdrukt adres telt als afgehandeld
    return
  }

  if (!quote.email) return
  await sendTemplateEmail('quote-confirmation', quote.email, {
    idempotencyKey: `quote-confirmation-${quote.id}`,
    templateData: {
      name: quote.name,
      jobType: quote.job_type,
      message: quote.message ?? undefined,
      postalCode: quote.postal_code ?? undefined,
      attachmentsCount: quote.attachment_paths?.length ?? 0,
      locale,
      appointmentDate: quote.appointment_date ?? undefined,
      appointmentSlot: quote.appointment_slot ?? undefined,
      appointmentNote: quote.appointment_note ?? undefined,
    },
  })
}

async function refreshAggregate(supabase: SupabaseClient<Database>, quoteRequestId: string) {
  const { data } = await supabase.from('notification_outbox').select('status').eq('quote_request_id', quoteRequestId)
  const rows = data ?? []
  // Nul taken is GEEN bewijs van aflevering: dan ontbreekt de opvolging juist.
  const status = rows.length === 0
    ? 'pending'
    : rows.every((r) => r.status === 'sent')
      ? 'sent'
      : rows.some((r) => r.status === 'failed')
        ? 'failed'
        : 'pending'
  await supabase.from('quote_requests').update({ notification_status: status }).eq('id', quoteRequestId)
}

type OutboxRow = Database['public']['Tables']['notification_outbox']['Row']

/**
 * Verwerkt gereserveerde taken. Iedere taak is exclusief geleased, dus twee
 * gelijktijdige verwerkers pakken nooit dezelfde taak op.
 */
async function runReserved(supabase: SupabaseClient<Database>, rows: OutboxRow[]) {
  let sent = 0
  let failed = 0
  const touched = new Set<string>()
  const quotes = new Map<string, QuoteRow | null>()

  for (const row of rows) {
    touched.add(row.quote_request_id)
    if (!quotes.has(row.quote_request_id)) {
      const { data } = await supabase.from('quote_requests').select('*').eq('id', row.quote_request_id).maybeSingle()
      quotes.set(row.quote_request_id, (data as QuoteRow | null) ?? null)
    }
    const quote = quotes.get(row.quote_request_id)
    if (!quote) continue

    const attempts = row.attempts + 1
    try {
      await runOne(supabase, quote, row.kind as NotificationKind, (row.payload ?? {}) as Record<string, unknown>)
      await supabase
        .from('notification_outbox')
        .update({ status: 'sent', sent_at: new Date().toISOString(), attempts, last_error: null, lease_until: null })
        .eq('id', row.id)
      sent++
    } catch (err) {
      const minutes = BACKOFF_MINUTES[Math.min(attempts - 1, BACKOFF_MINUTES.length - 1)]
      await supabase
        .from('notification_outbox')
        .update({
          // Na het maximum blijft de taak definitief mislukt staan; hij wordt
          // niet opnieuw gereserveerd en dus niet eindeloos herhaald.
          status: attempts >= MAX_ATTEMPTS ? 'failed' : 'pending',
          attempts,
          last_error: (err instanceof Error ? err.message : String(err)).slice(0, 500),
          next_attempt_at: new Date(Date.now() + minutes * 60_000).toISOString(),
          lease_until: null,
        })
        .eq('id', row.id)
      failed++
      console.error('Notification delivery failed; retry scheduled', row.kind, row.quote_request_id)
    }
  }

  for (const id of touched) await refreshAggregate(supabase, id)
  return { sent, failed }
}

/** Verwerkt de achterstallige meldingen van één aanvraag. */
export async function runNotificationsForRequest(supabase: SupabaseClient<Database>, quoteRequestId: string) {
  const { data, error } = await supabase.rpc('reserve_notifications', {
    _limit: 10,
    _quote_request_id: quoteRequestId,
  })
  if (error) throw new Error(`reserve_notifications failed: ${error.message}`)
  const rows = (data ?? []) as OutboxRow[]
  if (!rows.length) {
    await refreshAggregate(supabase, quoteRequestId)
    return { sent: 0, failed: 0 }
  }
  return runReserved(supabase, rows)
}

/** Achterstallige meldingen opnieuw proberen (retry-hook). */
export async function processDueNotifications(supabase: SupabaseClient<Database>, limit = 25) {
  const { data, error } = await supabase.rpc('reserve_notifications', { _limit: limit })
  if (error) throw new Error(`reserve_notifications failed: ${error.message}`)
  const rows = (data ?? []) as OutboxRow[]
  const result = await runReserved(supabase, rows)
  const requests = new Set(rows.map((row) => row.quote_request_id)).size
  return { requests, ...result }
}
