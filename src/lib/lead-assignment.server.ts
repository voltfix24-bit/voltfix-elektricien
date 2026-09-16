// Server-only: klantgegevens afleveren bij een monteur die door kantoor is
// toegewezen (of aan wie een klus is overgedragen).
//
// Zelf claimen via Telegram zet een rij in `lead_deliveries` en levert daarna
// het privébericht met volledige klantgegevens. Toewijzen vanuit de backoffice
// deed dat niet, waardoor de monteur niets kreeg. Deze helper doet exact
// hetzelfde als zelf-claimen: dezelfde rij in dezelfde wachtrij, hetzelfde
// privébericht, dezelfde vervolgknoppen — en hij is opnieuw te proberen door de
// bestaande herstelhook.

import { tryDeliverClaimNow } from '@/lib/lead-delivery.server'

export const PRIVATE_CHANNEL = 'telegram_private'

/**
 * De vorige monteur hoort te weten dat een klus niet meer op zijn naam staat —
 * anders rijdt hij naar een klus die inmiddels van iemand anders is. Zijn
 * vervolgknoppen bij die klus verdwijnen in hetzelfde bericht.
 */
export async function notifyPreviousOwner(
  leadId: string,
  previousOwnerId: string | null | undefined,
  opts: { kind: 'transfer' | 'release'; refunded: boolean; amountCents?: number | null },
): Promise<{ notified: boolean; reason?: string }> {
  if (!previousOwnerId) return { notified: false, reason: 'no_previous_owner' }
  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const tg = await import('@/lib/telegram.server')
    const [{ data: lead }, { data: contractor }, { data: delivery }] = await Promise.all([
      supabaseAdmin.from('leads').select('id, ref_number, job_type, city, is_test').eq('id', leadId).maybeSingle(),
      supabaseAdmin.from('contractors').select('id, name, is_test, telegram_user_id').eq('id', previousOwnerId).maybeSingle(),
      supabaseAdmin.from('lead_deliveries').select('telegram_message_id, contractor_id').eq('lead_id', leadId).maybeSingle(),
    ])
    const chatId = contractor?.telegram_user_id ?? null
    if (!chatId) return { notified: false, reason: 'no_telegram' }

    // Eerst de knoppen weghalen: die mogen niet blijven staan, ook niet als het
    // bericht hieronder zou mislukken.
    const messageId = delivery?.contractor_id === previousOwnerId ? delivery?.telegram_message_id ?? null : null
    if (messageId) {
      await tg
        .editMessageReplyMarkup({
          chat_id: chatId,
          message_id: Number(messageId),
          reply_markup: { inline_keyboard: [] },
          routing: { event: 'previous_owner_buttons_removed', lead, contractor },
        })
        .catch(() => {})
    }

    const money = opts.refunded
      ? `De leadprijs${opts.amountCents ? ` (${(opts.amountCents / 100).toFixed(2).replace('.', ',')} euro)` : ''} is teruggestort op je saldo.`
      : 'De leadprijs is niet teruggestort.'
    const area = lead?.city ?? ''
    await tg.sendMessage({
      chat_id: chatId,
      text:
        `<b>${opts.kind === 'transfer' ? 'Klus overgedragen' : 'Klus niet meer van jou'}</b>\n` +
        `${tg.escapeHtml(lead?.job_type ?? 'Klus')}${area ? ` · ${tg.escapeHtml(area)}` : ''}${lead?.ref_number ? ` · #${lead.ref_number}` : ''}\n\n` +
        `Deze klus staat niet meer op jouw naam. Ga er niet naartoe.\n${money}`,
      routing: { event: 'previous_owner_notice', lead, contractor },
    })
    return { notified: true }
  } catch (error) {
    console.error('vorige monteur waarschuwen mislukt', leadId, error)
    return { notified: false, reason: 'error' }
  }
}

export type AssignmentDelivery = {
  delivered: boolean
  /** Stabiele reden, alleen voor logging en de waarschuwing in de backoffice. */
  reason: 'sent' | 'no_telegram' | 'delivery_failed' | 'queue_failed'
}

/**
 * Zet de leveringstaak klaar en probeert hem direct. Mislukt het, dan blijft de
 * taak in de wachtrij staan en krijgt kantoor een bericht in de beheerderschat,
 * zodat het niet alleen in het serverlog belandt.
 */
export async function deliverAssignedLead(
  leadId: string,
  contractorId: string,
): Promise<AssignmentDelivery> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const tg = await import('@/lib/telegram.server')

  const { data: contractor } = await supabaseAdmin
    .from('contractors')
    .select('id, name, telegram_user_id, is_test')
    .eq('id', contractorId)
    .maybeSingle()
  const telegramUserId = contractor?.telegram_user_id ?? null

  const { error: queueError } = await supabaseAdmin
    .from('lead_deliveries')
    .upsert(
      {
        lead_id: leadId,
        contractor_id: contractorId,
        telegram_user_id: telegramUserId,
        status: 'pending',
        attempts: 0,
        sent_at: null,
        last_error: null,
        next_attempt_at: new Date().toISOString(),
        lease_until: null,
      },
      { onConflict: 'lead_id' },
    )
  if (queueError) {
    console.error('deliverAssignedLead: wachtrij schrijven mislukt', leadId, queueError.message)
    await warnAdmin(tg, leadId, contractor ?? null, 'wachtrij niet aangemaakt')
    await recordPrivateProblem(leadId, 'wachtrij niet aangemaakt')
    return { delivered: false, reason: 'queue_failed' }
  }

  if (!telegramUserId) {
    await warnAdmin(tg, leadId, contractor ?? null, 'monteur heeft de bot nog niet privé gestart')
    await recordPrivateProblem(leadId, 'monteur heeft de bot nog niet privé gestart')
    return { delivered: false, reason: 'no_telegram' }
  }

  const { delivered } = await tryDeliverClaimNow(supabaseAdmin as never, leadId)
  if (!delivered) {
    await warnAdmin(tg, leadId, contractor ?? null, 'privébericht niet bezorgd')
    await recordPrivateProblem(leadId, 'privébericht niet bezorgd')
    return { delivered: false, reason: 'delivery_failed' }
  }
  await clearPrivateProblem(leadId)
  return { delivered: true, reason: 'sent' }
}

/** Zichtbaar in het dossier: rode balk met "Opnieuw versturen". */
async function recordPrivateProblem(leadId: string, message: string) {
  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    await supabaseAdmin.from('lead_notification_outbox').insert({
      lead_id: leadId,
      channel: PRIVATE_CHANNEL,
      payload: { kind: 'private_delivery' },
      status: 'failed',
      last_error: message.slice(0, 500),
      retry_count: 1,
    })
  } catch (error) {
    console.error('privéprobleem vastleggen mislukt', leadId, error)
  }
}

async function clearPrivateProblem(leadId: string) {
  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    await supabaseAdmin
      .from('lead_notification_outbox')
      .update({ status: 'sent', last_error: null })
      .eq('lead_id', leadId)
      .eq('channel', PRIVATE_CHANNEL)
      .eq('status', 'failed')
  } catch (error) {
    console.error('privéprobleem opschonen mislukt', leadId, error)
  }
}

async function warnAdmin(
  tg: typeof import('@/lib/telegram.server'),
  leadId: string,
  contractor: { id?: string; name?: string | null; is_test?: boolean | null } | null,
  why: string,
) {
  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data: lead } = await supabaseAdmin.from('leads').select('id, is_test, customer_name').eq('id', leadId).maybeSingle()
    const chatId = tg.adminChatId(lead)
    if (!chatId) return
    await tg.sendMessage({
      chat_id: chatId,
      text:
        `<b>Toewijzing niet afgeleverd</b>\n` +
        `Monteur: ${tg.escapeHtml(contractor?.name ?? 'onbekend')}\n` +
        `Lead: ${leadId.slice(0, 8)}\n` +
        `Reden: ${tg.escapeHtml(why)}\n\n` +
        `De monteur moet de bot privé starten; daarna wordt het bericht vanzelf opnieuw geprobeerd.`,
      routing: { event: 'assignment_delivery_failed', lead, contractor },
    })
  } catch (error) {
    console.error('deliverAssignedLead: beheerder waarschuwen mislukt', leadId, error)
  }
}

/* -------------------------------------------------------------------------- */
/* Groepsbericht bijhouden                                                     */
/* -------------------------------------------------------------------------- */

const GROUP_COLUMNS =
  'id, ref_number, customer_name, customer_phone, customer_email, postal_code, address, city, job_type, description, price_cents, price_status, pricing_type, agreed_price_details, pricing_note, customer_language, is_urgent, is_test, dispatched_at, created_at, telegram_message_id'

export type GroupSync = { ok: boolean; skipped: boolean; error?: string }

/**
 * Zet het groepsbericht op "Aangenomen door …" en haalt de knop weg.
 * Mislukt dat, dan blijft er een actieve knop staan voor een klus die al een
 * eigenaar heeft — dat mag niet alleen in het serverlog belanden, dus wordt het
 * als mislukte melding vastgelegd zodat de backoffice het toont.
 */
export async function syncGroupClaimed(leadId: string, contractorName: string): Promise<GroupSync> {
  return runGroupSync(leadId, 'claimed', async (tg, lead) => {
    await tg.removeLeadKeyboard({ chat_id: tg.groupChatId(lead), message_id: Number(lead.telegram_message_id), routing: { event: 'assignment_group_keyboard', lead } }).catch(() => {})
    await tg.editLeadMessage({
      chat_id: tg.groupChatId(lead),
      message_id: Number(lead.telegram_message_id),
      text: tg.claimedText(lead as never, contractorName),
      reply_markup: { inline_keyboard: [] },
      routing: { event: 'assignment_group_update', lead },
    })
  })
}

/** Zet het groepsbericht terug op vrij, met een werkende "Aannemen"-knop. */
export async function syncGroupOpen(leadId: string): Promise<GroupSync> {
  return runGroupSync(leadId, 'released', async (tg, lead) => {
    await tg.editLeadMessage({
      chat_id: tg.groupChatId(lead),
      message_id: Number(lead.telegram_message_id),
      text: tg.groupTeaser(lead as never),
      reply_markup: { inline_keyboard: tg.leadKeyboard(String(lead.id), Number(lead.price_cents ?? 0)) },
      routing: { event: 'assignment_released_group_update', lead },
    })
  })
}

async function runGroupSync(
  leadId: string,
  kind: 'claimed' | 'released',
  run: (tg: typeof import('@/lib/telegram.server'), lead: Record<string, unknown>) => Promise<void>,
): Promise<GroupSync> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { data: lead } = await supabaseAdmin.from('leads').select(GROUP_COLUMNS).eq('id', leadId).maybeSingle()
  if (!lead || !lead.telegram_message_id) return { ok: true, skipped: true }
  try {
    const tg = await import('@/lib/telegram.server')
    await run(tg, lead as Record<string, unknown>)
    await clearGroupProblem(leadId)
    return { ok: true, skipped: false }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'onbekende fout'
    console.error('groepsbericht bijwerken mislukt', leadId, kind, message)
    await recordGroupProblem(leadId, kind, message)
    return { ok: false, skipped: false, error: message }
  }
}

export const GROUP_CHANNEL = 'telegram_group'

async function recordGroupProblem(leadId: string, kind: string, message: string) {
  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    await supabaseAdmin.from('lead_notification_outbox').insert({
      lead_id: leadId,
      channel: GROUP_CHANNEL,
      payload: { kind },
      status: 'failed',
      last_error: message.slice(0, 500),
      retry_count: 1,
    })
  } catch (error) {
    console.error('groepsprobleem vastleggen mislukt', leadId, error)
  }
}

async function clearGroupProblem(leadId: string) {
  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    await supabaseAdmin
      .from('lead_notification_outbox')
      .update({ status: 'sent', last_error: null })
      .eq('lead_id', leadId)
      .eq('channel', GROUP_CHANNEL)
      .eq('status', 'failed')
  } catch (error) {
    console.error('groepsprobleem opschonen mislukt', leadId, error)
  }
}
