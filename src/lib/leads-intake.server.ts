// Server-only helper: zet een publieke aanvraag om in een lead én stuurt hem
// direct door naar de Telegram-groep met claim- en spamknop.

import { z } from 'zod'
import { detectCustomerLanguage } from './customer-language'
import { escalationMinutes } from './lead-overdue'

export const leadIntakeSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .min(8)
    .max(20)
    .regex(/^[0-9+()\s-]+$/),
  email: z.string().trim().email().max(120).optional().nullable(),
  postalCode: z.string().trim().max(12).optional().nullable(),
  address: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().max(80).optional().nullable(),
  jobType: z.string().trim().min(2).max(80),
  description: z.string().trim().max(2000).optional().nullable(),
  isUrgent: z.boolean().default(false),
  source: z.string().trim().max(60).default('website_form'),
  sourcePath: z.string().trim().max(200).optional().nullable(),
  priceCents: z.number().int().min(0).max(100000).optional(),
  // Paden in de bucket `lead-attachments` (max 3 foto's).
  imagePaths: z.array(z.string().max(300)).max(3).default([]),
  /** Unieke verwijzing naar de bronaanvraag; voorkomt dubbele leads bij opnieuw proberen. */
  externalRef: z.string().trim().max(120).optional().nullable(),
  /** Taal van de aanvraagpagina (nl of en); wordt gebruikt om de klanttaal te bepalen. */
  locale: z.enum(['nl', 'en']).optional().nullable(),
  /** Verzonnen testaanvraag: blijft buiten de werklijst en gaat naar het testkanaal. */
  isTest: z.boolean().optional(),
  /** Wat de KLANT betaalt (offertetotaal). Niet te verwarren met priceCents (leadprijs). */
  customerPriceCents: z.number().int().min(0).max(10_000_00).optional().nullable(),
  quoteKind: z.enum(['package', 'photo', 'survey']).optional().nullable(),
  quotePackage: z.string().trim().max(120).optional().nullable(),
  quoteOptions: z
    .array(z.object({ label: z.string().trim().min(1).max(120), priceCents: z.number().int().min(0).max(10_000_00) }))
    .max(30)
    .optional()
    .nullable(),
})

export type LeadIntake = z.infer<typeof leadIntakeSchema>

const FALLBACK_PRICE_CENTS = 1000

/**
 * Leadprijs: eerst de prijs die voor deze klussoort is ingesteld, anders de
 * algemene prijs. Een groepenkastlead is voor de monteur veel meer waard dan
 * een spoedlead, dus die staat apart in lead_job_prices.
 */
export async function resolveLeadPriceCents(isUrgent: boolean, jobType?: string | null): Promise<number> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const key = (jobType ?? '').trim().toLowerCase()
  if (key) {
    const { data: perJob } = await supabaseAdmin
      .from('lead_job_prices')
      .select('price_cents')
      .eq('job_type', key)
      .maybeSingle()
    if (perJob && Number.isFinite(Number(perJob.price_cents))) return Number(perJob.price_cents)
  }
  const { data, error } = await supabaseAdmin
    .from('lead_settings')
    .select('default_price_cents, urgent_price_cents')
    .eq('id', 1)
    .maybeSingle()
  if (error || !data) return FALLBACK_PRICE_CENTS
  return isUrgent ? data.urgent_price_cents : data.default_price_cents
}

/**
 * De wachttijd tot escalatie wordt bij het aanmaken op de lead gezet. De
 * database vergelijkt alleen nog met dit getal en kent zelf geen klussoorten.
 */
export async function resolveEscalationMinutes(lead: { isUrgent: boolean; jobType: string }): Promise<number> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { data } = await supabaseAdmin
    .from('lead_settings')
    .select('escalation_urgent_minutes, escalation_planned_minutes')
    .eq('id', 1)
    .maybeSingle()
  return escalationMinutes({ is_urgent: lead.isUrgent, job_type: lead.jobType }, data ?? undefined)
}

/**
 * Bewaart een als spam herkende aanvraag met status 'blocked_spam'.
 * Er gaat bewust GEEN Telegram-bericht of notificatie uit.
 */
async function storeHeldLead(
  input: Partial<LeadIntake>,
  reason: string,
  status: 'blocked_spam' | 'spam_review',
): Promise<boolean> {
  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { error } = await supabaseAdmin.from('leads').insert({
      customer_name: input.name || 'Onbekend',
      customer_phone: input.phone || 'onbekend',
      customer_email: input.email || null,
      postal_code: input.postalCode || null,
      address: input.address || null,
      city: input.city || null,
      job_type: input.jobType || 'onbekend',
      description: [input.description, `[spamfilter: ${reason}]`].filter(Boolean).join('\n\n'),
      price_cents: 0,
      status,
      source: input.source || 'website_form',
      source_path: input.sourcePath || null,
      is_urgent: false,
      image_urls: [],
      customer_language: detectCustomerLanguage({
        locale: input.locale ?? null,
        sourcePath: input.sourcePath ?? null,
        jobType: input.jobType ?? null,
        description: input.description ?? null,
      }),
    })
    if (error) throw error
    return true
  } catch (err) {
    console.error('Failed to store blocked spam lead', err)
    return false
  }
}

/** Zekere spam blijft buiten de werklijst en veroorzaakt geen meldingen. */
export async function storeBlockedSpamLead(input: Partial<LeadIntake>, reason: string): Promise<boolean> {
  return storeHeldLead(input, reason, 'blocked_spam')
}

/** Een verkeerspiek is geen bewijs van spam: bewaar hem zichtbaar voor kantoorcontrole. */
export async function storeBurstReviewLead(input: Partial<LeadIntake>, reason: string): Promise<boolean> {
  return storeHeldLead(input, reason, 'spam_review')
}

/**
 * Slaat de lead op en dispatcht hem naar Telegram. Telegram-fouten worden
 * gelogd maar gooien niet: de lead staat dan al veilig in de database en kan
 * vanuit de backoffice alsnog verstuurd worden.
 */
export async function createAndDispatchLead(input: LeadIntake): Promise<{ id: string } | null> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  // Dezelfde bronaanvraag mag nooit twee leads opleveren. Bestaat de lead al,
  // dan gaan we door naar de dispatchstap: die vult ontbrekende opvolging aan.
  let row: any = null
  if (input.externalRef) {
    const { data: existing } = await supabaseAdmin.from('leads').select('*').eq('external_ref', input.externalRef).maybeSingle()
    if (existing) row = existing
  }

  if (!row) {
    const priceCents = input.priceCents ?? (await resolveLeadPriceCents(input.isUrgent, input.jobType))
    const escalateAfter = await resolveEscalationMinutes({ isUrgent: input.isUrgent, jobType: input.jobType })
    const { data: inserted, error } = await supabaseAdmin
      .from('leads')
      .insert({
        customer_name: input.name,
        customer_phone: input.phone,
        customer_email: input.email || null,
        postal_code: input.postalCode || null,
        address: input.address || null,
        city: input.city || null,
        job_type: input.jobType,
        description: input.description || null,
        price_cents: priceCents,
        status: 'new',
        source: input.source,
        source_path: input.sourcePath || null,
        is_urgent: input.isUrgent,
        image_urls: input.imagePaths ?? [],
        customer_language: detectCustomerLanguage({
          locale: input.locale ?? null,
          sourcePath: input.sourcePath ?? null,
          jobType: input.jobType,
          description: input.description ?? null,
        }),
        external_ref: input.externalRef || null,
        escalation_minutes: escalateAfter,
        is_test: input.isTest ?? false,
        customer_price_cents: input.customerPriceCents ?? null,
        quote_kind: input.quoteKind ?? null,
        quote_package: input.quotePackage ?? null,
        quote_options: input.quoteOptions ?? null,
      })
      .select('*')
      .single()

    if (error || !inserted) {
      if (error?.code === '23505' && input.externalRef) {
        const { data: existing } = await supabaseAdmin.from('leads').select('*').eq('external_ref', input.externalRef).maybeSingle()
        if (existing) return { id: existing.id }
      }
      console.error('Failed to insert lead from website form', error)
      // Met bronverwijzing hoort de wachtrij opnieuw te proberen; zonder
      // verwijzing blijft het oude gedrag (stil falen) ongewijzigd.
      if (input.externalRef) throw new Error(`Lead insert failed: ${error?.message ?? 'unknown'}`)
      return null
    }
    row = inserted
  }

  if (row.status === 'dispatched' || row.claimed_by) return { id: row.id }

  try {
    const { dispatchLeadToGroup } = await import('@/lib/lead-dispatch.server')
    const messageId = await dispatchLeadToGroup(row as any)
    // Alleen bijwerken zolang niemand geclaimd heeft: een claim die tijdens het
    // versturen binnenkomt mag nooit worden overschreven.
    await supabaseAdmin
      .from('leads')
      .update({
        status: 'dispatched',
        telegram_message_id: messageId,
        dispatched_at: new Date().toISOString(),
      })
      .eq('id', row.id)
      .is('claimed_by', null)
      .eq('status', 'new')
  } catch (err) {
    console.error('Telegram dispatch for website lead failed', err)
    if (input.externalRef) throw err instanceof Error ? err : new Error('Telegram dispatch failed')
  }



  return { id: row.id }
}
