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
    })
    .select('*')
    .single()

  if (error || !row) {
    console.error('Failed to insert lead from website form', error)
    return null
  }

  try {
    const tg = await import('@/lib/telegram.server')
    const message = await tg.sendMessage({
      chat_id: tg.groupChatId(),
      text: tg.groupTeaser(row as any),
      reply_markup: { inline_keyboard: tg.leadKeyboard(row.id, row.price_cents) },
    })
    await supabaseAdmin
      .from('leads')
      .update({
        status: 'dispatched',
        telegram_message_id: message.message_id,
        dispatched_at: new Date().toISOString(),
      })
      .eq('id', row.id)
  } catch (err) {
    console.error('Telegram dispatch for website lead failed', err)
  }

  return { id: row.id }
}
