import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { infoRequestItemCodes, suggestedInfoRequestItems } from '@/lib/booking/info-request'
import { assertPerilexPermission, type PerilexPermission } from '@/lib/perilex-permissions'

/**
 * Beheerkant van de klantaanvulling (fase 5B).
 *
 * De link zelf wordt hier één keer teruggegeven, direct na aanmaken, zodat de
 * medewerker hem kan kopiëren of via WhatsApp kan delen. Daarna bestaat alleen
 * de hash nog: de link staat niet in de auditlog, niet in een interne notitie
 * en nooit in de monteursgroep.
 */

async function assertAdmin(context: any, permission: PerilexPermission) {
  const { data, error } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' })
  if (error) throw new Error(error.message)
  assertPerilexPermission(data ? 'admin' : 'user', permission)
}

async function leadStatusFor(context: any, quoteRequestId: string): Promise<string | null> {
  const lead = await context.supabase
    .from('leads')
    .select('status')
    .eq('external_ref', `quote:${quoteRequestId}`)
    .maybeSingle()
  return (lead.data as any)?.status ?? null
}

/** Overzicht voor het beoordelingspaneel: gevraagd, ontvangen, niet aanleverbaar. */
export const listInfoRequests = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ quoteRequestId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context, 'info_request.read')
    const { data: rows, error } = await context.supabase
      .from('quote_request_info_requests')
      .select(
        'id, status, revision, language, items, customer_note, extra_question, callback_requested, callback_requested_at, expires_at, created_at, opened_at, submitted_at, withdrawn_at, answers, reported_missing',
      )
      .eq('quote_request_id', data.quoteRequestId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)

    const { data: assessment } = await context.supabase
      .from('quote_request_assessments')
      .select('id, missing_info')
      .eq('quote_request_id', data.quoteRequestId)
      .maybeSingle()
    const { data: files } = await context.supabase
      .from('quote_request_attachments')
      .select('attachment_id, category, original_filename, info_request_id')
      .eq('quote_request_id', data.quoteRequestId)

    const received = (files ?? []).map((file: any) => file.category as string)
    return {
      requests: rows ?? [],
      assessmentId: (assessment as any)?.id ?? null,
      files: files ?? [],
      suggestions: suggestedInfoRequestItems({
        missingInfo: ((assessment as any)?.missing_info ?? []) as string[],
        receivedCategories: received,
      }),
      receivedCategories: [...new Set(received)],
    }
  })

/**
 * Maakt een informatieverzoek en geeft de deelbare link eenmalig terug.
 * Een concept verstuurt niets en heeft geen link.
 */
export const createInfoRequestFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        quoteRequestId: z.string().uuid(),
        items: z.array(z.enum(infoRequestItemCodes)).min(1).max(infoRequestItemCodes.length),
        language: z.enum(['nl', 'en']),
        customerNote: z.string().max(600).default(''),
        extraQuestion: z.string().max(300).default(''),
        openNow: z.boolean().default(true),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context, 'info_request.create')
    const { adminClient, createInfoRequest } = await import('@/lib/info-request.server')
    const supabase = adminClient()
    if (!supabase) return { ok: false as const, reason: 'server_not_configured' }

    const { data: assessment } = await context.supabase
      .from('quote_request_assessments')
      .select('id')
      .eq('quote_request_id', data.quoteRequestId)
      .maybeSingle()

    const result = await createInfoRequest(supabase, {
      quoteRequestId: data.quoteRequestId,
      assessmentId: ((assessment as any)?.id ?? null) as string | null,
      items: data.items,
      language: data.language,
      customerNote: data.customerNote,
      extraQuestion: data.extraQuestion,
      actorId: context.userId,
      leadStatus: await leadStatusFor(context, data.quoteRequestId),
      openNow: data.openNow,
    })
    if (!result.ok) return result

    if ((assessment as any)?.id) {
      // Auditregel zonder link en zonder klantgegevens.
      await supabase.from('quote_request_assessment_events').insert({
        assessment_id: (assessment as any).id,
        quote_request_id: data.quoteRequestId,
        actor_id: context.userId,
        event_type: 'info_request_created',
        field: 'items',
        new_value: { items: data.items, revision: result.revision, openNow: data.openNow } as never,
      })
    }

    // De volledige link met token in het fragment: alleen nu, alleen hier.
    const link = result.token
      ? `${data.language === 'en' ? '/en-gb/additional-information' : '/aanvullen'}#t=${result.token}`
      : null
    return { ok: true as const, id: result.id, revision: result.revision, expiresAt: result.expiresAt, link }
  })

/** Trekt een lopend verzoek in; de link en alle sessies vervallen direct. */
export const withdrawInfoRequestFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context, 'info_request.withdraw')
    const { adminClient, withdrawInfoRequest } = await import('@/lib/info-request.server')
    const supabase = adminClient()
    if (!supabase) return { ok: false as const, reason: 'server_not_configured' }
    return withdrawInfoRequest(supabase, data.id)
  })

/**
 * Lost een aanvraag-ID op naar de bijbehorende lead, zodat de Telegramknop en
 * gedeelde links de juiste beoordeling openen. Alleen voor beheerders; de
 * lezing loopt via de sessie van de gebruiker, niet via beheerrechten.
 */
export const resolveLeadForQuoteFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ quoteRequestId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context, 'info_request.read')
    const { data: lead } = await context.supabase
      .from('leads')
      .select('id')
      .eq('external_ref', `quote:${data.quoteRequestId}`)
      .maybeSingle()
    return { ok: true as const, leadId: (lead as any)?.id ?? null }
  })
