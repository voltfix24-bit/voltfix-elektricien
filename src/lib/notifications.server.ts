import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/integrations/supabase/types'
import { business } from '@/lib/business'
import type { GroupBookingFields } from '@/lib/groepenkast'

/**
 * Duurzame meldingenwachtrij voor aanvragen.
 *
 * Iedere aanvraag krijgt bij opslag één rij per melding (interne leadverwerking,
 * eigenaarsmail, klantbevestiging). Slaagt een melding niet, dan blijft de rij
 * staan met een oplopend aantal pogingen en een volgend probeermoment. Zo is
 * uitval tussen opslag en interne opvolging herstelbaar: opnieuw proberen vult
 * precies de ontbrekende melding aan en maakt nooit een tweede lead.
 */

export type NotificationKind =
  | 'internal_lead'
  | 'owner_email'
  | 'customer_email'
  /** Fase 5B: de klant heeft een gevraagde aanvulling ingediend. */
  | 'info_request_received'

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

/**
 * Leest de losse keuzevelden van een groepenkast-aanvraag terug. Oudere
 * aanvragen hebben ze niet; die houden de platte omschrijving.
 */
function readGroupFields(answers: unknown): GroupBookingFields | null {
  const raw = (answers as { groepenkast?: unknown } | null)?.groepenkast
  if (!raw || typeof raw !== 'object') return null
  const value = raw as Partial<GroupBookingFields>
  const kind = value.quoteKind
  if (kind !== 'package' && kind !== 'photo' && kind !== 'survey') return null
  return {
    quoteKind: kind,
    packageName: value.packageName ?? null,
    basePriceCents: typeof value.basePriceCents === 'number' ? value.basePriceCents : null,
    options: Array.isArray(value.options)
      ? value.options
          .map((option: any) => ({ label: String(option?.label ?? '').trim(), priceCents: Number(option?.priceCents) || 0 }))
          .filter((option: { label: string }) => option.label.length > 0)
      : [],
    totalPriceCents: typeof value.totalPriceCents === 'number' ? value.totalPriceCents : null,
    installPreference: typeof value.installPreference === 'string' ? value.installPreference : '',
    customerNote: value.customerNote ?? null,
  }
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
    // Keuzes uit het aanvraagformulier komen als losse velden mee; alleen de
    // toelichting van de klant blijft vrije tekst in de omschrijving.
    const fields = readGroupFields(quote.service_answers)
    await createAndDispatchLead({
      name: quote.name,
      phone: quote.phone,
      email: quote.email,
      postalCode: quote.postal_code,
      address: quote.street ? `${quote.street} ${quote.house_number ?? ''}, ${(quote.postal_code ?? '').toUpperCase()}`.trim() : null,
      city: quote.city ?? null,
      jobType: quote.job_type,
      description: fields
        ? fields.customerNote
        : [
            quote.message,
            quote.appointment_date ? `Voorkeur: ${quote.appointment_date}${quote.appointment_slot ? ` · ${quote.appointment_slot}` : ''}` : null,
            quote.attachment_paths?.length ? `${quote.attachment_paths.length} foto('s) meegestuurd` : null,
          ]
            .filter(Boolean)
            .join('\n'),
      customerPriceCents: fields?.totalPriceCents ?? null,
      quoteKind: fields?.quoteKind ?? null,
      quotePackage: fields?.packageName ?? null,
      quoteOptions: fields?.options ?? null,
      quoteBasePriceCents: fields?.basePriceCents ?? null,
      installPreference: fields?.installPreference ?? null,
      isUrgent,
      source: quote.appointment_date ? 'booking_form' : 'website_form',
      sourcePath: quote.source_path ?? null,
      imagePaths: Array.isArray(payload['imagePaths']) ? (payload['imagePaths'] as string[]) : [],
      // Dezelfde aanvraag levert altijd dezelfde lead op, ook na opnieuw proberen.
      externalRef: `quote:${quote.id}`,
      // Advertentieklik meeverhuizen naar het dossier, samen met de
      // werkelijke cookiekeuze van de bezoeker (of niets, als die ontbreekt).
      gclid: quote.gclid ?? null,
      gbraid: quote.gbraid ?? null,
      wbraid: quote.wbraid ?? null,
      adConsentAdUserData:
        (quote as { ad_consent_ad_user_data?: string | null }).ad_consent_ad_user_data === 'granted'
          ? 'granted'
          : (quote as { ad_consent_ad_user_data?: string | null }).ad_consent_ad_user_data === 'denied'
            ? 'denied'
            : null,
      locale,
    })
    return
  }

  if (kind === 'info_request_received') {
    // Minimale interne melding: aanvraagreferentie, dienst, ontvangen
    // categorieën en eventueel ontbrekende punten. Nooit de klantlink, nooit
    // klantgegevens, nooit een bestand. De knop leidt naar de beveiligde
    // beoordeling; alleen een ingelogde beheerder ziet daar de inhoud.
    const { adminChatId, sendMessage } = await import('./telegram.server')
    const { missingLabels, receivedLabels } = await import('./booking/info-request-notification')
    const received = receivedLabels(payload['receivedCategories'])
    const missing = missingLabels(payload['missingItems'])
    const callback = payload['callbackRequested'] === true
    const lines = [
      '<b>Aanvulling ontvangen</b>',
      `Aanvraag: <code>${quote.id.slice(0, 8)}</code>`,
      `Dienst: ${quote.booking_service ?? quote.job_type}`,
      `Ontvangen: ${received.length} onderdeel(en)${received.length ? ` (${received.join(', ')})` : ''}`,
      missing.length ? `Nog ontbrekend: ${missing.join(', ')}` : null,
      callback ? 'Terugbelverzoek: ja' : null,
    ].filter(Boolean)

    // De knop moet de juiste beoordeling openen. De leadpagina kent alleen
    // `lead=`; het aanvraag-ID lossen we hier server-side op.
    const { data: lead } = await supabase
      .from('leads')
      .select('id, is_test, customer_name')
      .eq('external_ref', `quote:${quote.id}`)
      .maybeSingle()
    const chat = adminChatId(lead)
    if (!chat) throw new Error('Geen interne bestemming ingesteld voor aanvullingsmeldingen')
    const url = lead?.id
      ? `${business.url}/admin/leads?lead=${lead.id}`
      : `${business.url}/admin/leads?q=${quote.id.slice(0, 8)}`

    await sendMessage({
      chat_id: chat,
      text: lines.join('\n'),
      reply_markup: { inline_keyboard: [[{ text: 'Open beoordeling', url }]] },
      routing: { event: 'info_request_received', lead },
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
    // Het afleverkenmerk hoort bij precies déze reservering. Zet een nieuwe
    // aanvulling de taak ondertussen terug in de wachtrij, dan vervalt het
    // kenmerk en sluit deze aflevering de nieuwe melding niet af.
    const token = row.delivery_token
    try {
      await runOne(supabase, quote, row.kind as NotificationKind, (row.payload ?? {}) as Record<string, unknown>)
      const { data: closed } = await supabase
        .from('notification_outbox')
        .update({ status: 'sent', sent_at: new Date().toISOString(), attempts, last_error: null, lease_until: null })
        .eq('id', row.id)
        .eq('delivery_token', token ?? '')
        .select('id')
      if (closed?.length) sent++
      else console.warn('Notification re-queued during delivery; keeping it pending', row.kind)
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
        .eq('delivery_token', token ?? '')
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
