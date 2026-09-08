// Server-only helper: zet een publieke aanvraag om in een lead én stuurt hem
// direct door naar de Telegram-groep met claim- en spamknop.

import { z } from 'zod'

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

})

export type LeadIntake = z.infer<typeof leadIntakeSchema>

const FALLBACK_PRICE_CENTS = 1000

export async function resolveLeadPriceCents(isUrgent: boolean): Promise<number> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { data, error } = await supabaseAdmin
    .from('lead_settings')
    .select('default_price_cents, urgent_price_cents')
    .eq('id', 1)
    .maybeSingle()
  if (error || !data) return FALLBACK_PRICE_CENTS
  return isUrgent ? data.urgent_price_cents : data.default_price_cents
}

/**
 * Bewaart een als spam herkende aanvraag met status 'blocked_spam'.
 * Er gaat bewust GEEN Telegram-bericht of notificatie uit.
 */
export async function storeBlockedSpamLead(
  input: Partial<LeadIntake>,
  reason: string,
): Promise<void> {
  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    await supabaseAdmin.from('leads').insert({
      customer_name: input.name || 'Onbekend',
      customer_phone: input.phone || 'onbekend',
      customer_email: input.email || null,
      postal_code: input.postalCode || null,
      address: input.address || null,
      city: input.city || null,
      job_type: input.jobType || 'onbekend',
      description: [input.description, `[spamfilter: ${reason}]`].filter(Boolean).join('\n\n'),
      price_cents: 0,
      status: 'blocked_spam',
      source: input.source || 'website_form',
      source_path: input.sourcePath || null,
      is_urgent: false,
      image_urls: [],
    })
  } catch (err) {
    console.error('Failed to store blocked spam lead', err)
  }
}

/**
 * Slaat de lead op en dispatcht hem naar Telegram. Telegram-fouten worden
 * gelogd maar gooien niet: de lead staat dan al veilig in de database en kan
 * vanuit de backoffice alsnog verstuurd worden.
 */
export async function createAndDispatchLead(input: LeadIntake): Promise<{ id: string } | null> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const priceCents = input.priceCents ?? (await resolveLeadPriceCents(input.isUrgent))

  const { data: row, error } = await supabaseAdmin
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
    })
    .select('*')
    .single()

  if (error || !row) {
    console.error('Failed to insert lead from website form', error)
    return null
  }

  try {
    const { dispatchLeadToGroup } = await import('@/lib/lead-dispatch.server')
    const messageId = await dispatchLeadToGroup(row as any)
    await supabaseAdmin
      .from('leads')
      .update({
        status: 'dispatched',
        telegram_message_id: messageId,
        dispatched_at: new Date().toISOString(),
      })
      .eq('id', row.id)
  } catch (err) {
    console.error('Telegram dispatch for website lead failed', err)
  }


  return { id: row.id }
}
