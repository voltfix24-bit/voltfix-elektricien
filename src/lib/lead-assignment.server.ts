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
    .select('name, telegram_user_id')
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
    await warnAdmin(tg, leadId, contractor?.name ?? null, 'wachtrij niet aangemaakt')
    return { delivered: false, reason: 'queue_failed' }
  }

  if (!telegramUserId) {
    await warnAdmin(tg, leadId, contractor?.name ?? null, 'monteur heeft de bot nog niet privé gestart')
    return { delivered: false, reason: 'no_telegram' }
  }

  const { delivered } = await tryDeliverClaimNow(supabaseAdmin as never, leadId)
  if (!delivered) {
    await warnAdmin(tg, leadId, contractor?.name ?? null, 'privébericht niet bezorgd')
    return { delivered: false, reason: 'delivery_failed' }
  }
  return { delivered: true, reason: 'sent' }
}

async function warnAdmin(
  tg: typeof import('@/lib/telegram.server'),
  leadId: string,
  contractorName: string | null,
  why: string,
) {
  try {
    const chatId = tg.adminChatId()
    if (!chatId) return
    await tg.sendMessage({
      chat_id: chatId,
      text:
        `<b>Toewijzing niet afgeleverd</b>\n` +
        `Monteur: ${tg.escapeHtml(contractorName ?? 'onbekend')}\n` +
        `Lead: ${leadId.slice(0, 8)}\n` +
        `Reden: ${tg.escapeHtml(why)}\n\n` +
        `De monteur moet de bot privé starten; daarna wordt het bericht vanzelf opnieuw geprobeerd.`,
    })
  } catch (error) {
    console.error('deliverAssignedLead: beheerder waarschuwen mislukt', leadId, error)
  }
}

/* -------------------------------------------------------------------------- */
/* Groepsbericht bijhouden                                                     */
/* -------------------------------------------------------------------------- */

const GROUP_COLUMNS =
  'id, ref_number, customer_name, customer_phone, customer_email, postal_code, address, city, job_type, description, price_cents, price_status, pricing_type, agreed_price_details, pricing_note, customer_language, is_urgent, dispatched_at, created_at, telegram_message_id'

export type GroupSync = { ok: boolean; skipped: boolean; error?: string }

/**
 * Zet het groepsbericht op "Aangenomen door …" en haalt de knop weg.
 * Mislukt dat, dan blijft er een actieve knop staan voor een klus die al een
 * eigenaar heeft — dat mag niet alleen in het serverlog belanden, dus wordt het
 * als mislukte melding vastgelegd zodat de backoffice het toont.
 */
export async function syncGroupClaimed(leadId: string, contractorName: string): Promise<GroupSync> {
  return runGroupSync(leadId, 'claimed', async (tg, lead) => {
    await tg.removeLeadKeyboard({ chat_id: tg.groupChatId(), message_id: Number(lead.telegram_message_id) }).catch(() => {})
    await tg.editLeadMessage({
      chat_id: tg.groupChatId(),
      message_id: Number(lead.telegram_message_id),
      text: tg.claimedText(lead as never, contractorName),
      reply_markup: { inline_keyboard: [] },
    })
  })
}

/** Zet het groepsbericht terug op vrij, met een werkende "Aannemen"-knop. */
export async function syncGroupOpen(leadId: string): Promise<GroupSync> {
  return runGroupSync(leadId, 'released', async (tg, lead) => {
    await tg.editLeadMessage({
      chat_id: tg.groupChatId(),
      message_id: Number(lead.telegram_message_id),
      text: tg.groupTeaser(lead as never),
      reply_markup: { inline_keyboard: tg.leadKeyboard(String(lead.id), Number(lead.price_cents ?? 0)) },
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
