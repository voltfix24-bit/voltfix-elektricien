// Server-only: duurzame aflevering van klantgegevens aan de monteur die een
// lead heeft geclaimd (en betaald).
//
// De leveringstaak wordt in dezelfde databasetransactie als de afschrijving
// aangemaakt (`claim_lead`). Mislukt de Telegram-aflevering, dan blijft de taak
// staan met een oplopend aantal pogingen en wordt hij door de herstelhook
// opnieuw geprobeerd. Een betaalde claim kan daardoor nooit stil verdwijnen.

import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/integrations/supabase/types'

const BACKOFF_MINUTES = [1, 5, 15, 60, 240]
const MAX_ATTEMPTS = 6

type DeliveryRow = Database['public']['Tables']['lead_deliveries']['Row']

/**
 * Levert klantgegevens en foto's aan de winnaar. Gooit bij een fout, zodat de
 * aanroeper de taak opnieuw kan inplannen.
 */
export async function deliverClaimedLead(
  supabase: SupabaseClient<Database>,
  row: Pick<DeliveryRow, 'lead_id' | 'contractor_id' | 'telegram_user_id'>,
): Promise<void> {
  const tg = await import('@/lib/telegram.server')
  const { data: lead, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', row.lead_id)
    .maybeSingle()
  if (error) throw new Error(`Lead lookup failed: ${error.message}`)
  if (!lead) throw new Error('Lead not found for delivery')
  if (lead.claimed_by !== row.contractor_id) {
    // De lead hoort inmiddels bij iemand anders: deze taak is niet meer geldig.
    throw new Error('Lead is owned by another contractor')
  }

  let chatId = row.telegram_user_id
  if (!chatId) {
    const { data: contractor } = await supabase
      .from('contractors')
      .select('telegram_user_id')
      .eq('id', row.contractor_id)
      .maybeSingle()
    chatId = contractor?.telegram_user_id ?? null
  }
  if (!chatId) throw new Error('Contractor has no Telegram chat')

  await tg.sendMessage({
    chat_id: chatId,
    text: tg.privateDetails(lead as never),
    reply_markup: tg.leadDoneKeyboard(lead.id),
  })
  const { sendClaimedLeadPhotos } = await import('@/lib/lead-dispatch.server')
  await sendClaimedLeadPhotos(chatId, row.lead_id)
}

async function markSent(supabase: SupabaseClient<Database>, leadId: string, attempts: number) {
  await supabase
    .from('lead_deliveries')
    .update({ status: 'sent', sent_at: new Date().toISOString(), attempts, last_error: null, lease_until: null })
    .eq('lead_id', leadId)
}

async function markFailed(
  supabase: SupabaseClient<Database>,
  leadId: string,
  attempts: number,
  err: unknown,
) {
  const minutes = BACKOFF_MINUTES[Math.min(attempts - 1, BACKOFF_MINUTES.length - 1)]
  await supabase
    .from('lead_deliveries')
    .update({
      status: attempts >= MAX_ATTEMPTS ? 'failed' : 'pending',
      attempts,
      last_error: (err instanceof Error ? err.message : String(err)).slice(0, 500),
      next_attempt_at: new Date(Date.now() + minutes * 60_000).toISOString(),
      lease_until: null,
    })
    .eq('lead_id', leadId)
}

/**
 * Probeert één leveringstaak direct (gebruikt vanuit de claimknop). Faalt de
 * aflevering, dan blijft de taak in de wachtrij staan voor de herstelhook.
 */
export async function tryDeliverClaimNow(
  supabase: SupabaseClient<Database>,
  leadId: string,
): Promise<{ delivered: boolean }> {
  const { data: row } = await supabase
    .from('lead_deliveries')
    .select('*')
    .eq('lead_id', leadId)
    .maybeSingle()
  if (!row || row.status === 'sent') return { delivered: row?.status === 'sent' }
  const attempts = row.attempts + 1
  try {
    await deliverClaimedLead(supabase, row)
    await markSent(supabase, leadId, attempts)
    return { delivered: true }
  } catch (err) {
    console.error('Claim delivery failed; queued for retry', leadId, err)
    await markFailed(supabase, leadId, attempts, err)
    return { delivered: false }
  }
}

/** Achterstallige leveringen opnieuw proberen (retry-hook). */
export async function processDueLeadDeliveries(supabase: SupabaseClient<Database>, limit = 10) {
  const { data, error } = await supabase.rpc('reserve_lead_deliveries', { _limit: limit })
  if (error) throw new Error(`reserve_lead_deliveries failed: ${error.message}`)
  const rows = (data ?? []) as DeliveryRow[]
  let sent = 0
  let failed = 0
  for (const row of rows) {
    const attempts = row.attempts + 1
    try {
      await deliverClaimedLead(supabase, row)
      await markSent(supabase, row.lead_id, attempts)
      sent++
    } catch (err) {
      await markFailed(supabase, row.lead_id, attempts, err)
      failed++
    }
  }
  return { deliveries: rows.length, sent, failed }
}
