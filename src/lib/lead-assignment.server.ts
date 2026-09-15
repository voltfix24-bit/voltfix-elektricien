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
