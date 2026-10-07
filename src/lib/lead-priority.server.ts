// Server-only: voorranggroep. Een nieuwe lead gaat eerst naar een aparte,
// besloten Telegram-groep. Pakt daar niemand hem binnen de wachttijd, dan gaat
// hij naar de gewone monteursgroep — die niets van de eerste ronde merkt.

import { dispatchLeadToGroup, type DispatchableLead } from '@/lib/lead-dispatch.server'

type PrioritySettings = {
  enabled: boolean
  chatId: string | null
  waitUrgentSeconds: number
  waitPlannedSeconds: number
}

export async function getPrioritySettings(): Promise<PrioritySettings> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { data } = await supabaseAdmin
    .from('lead_settings')
    .select('priority_group_enabled, priority_chat_id, priority_wait_urgent_seconds, priority_wait_planned_seconds')
    .eq('id', 1)
    .maybeSingle()
  return {
    enabled: Boolean(data?.priority_group_enabled),
    chatId: data?.priority_chat_id?.trim() || null,
    waitUrgentSeconds: data?.priority_wait_urgent_seconds ?? 180,
    waitPlannedSeconds: data?.priority_wait_planned_seconds ?? 900,
  }
}

/**
 * Verstuurt een lead: naar de voorranggroep als die aan staat, anders zoals
 * altijd naar de gewone groep. Werkt de lead bij zonder een claim die
 * tijdens het versturen binnenkwam te overschrijven.
 */
export async function dispatchLead(lead: DispatchableLead & { id: string }): Promise<{ priority: boolean }> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const settings = await getPrioritySettings()
  const now = new Date().toISOString()

  if (settings.enabled && settings.chatId) {
    try {
      const messageId = await dispatchLeadToGroup(lead, settings.chatId)
      await supabaseAdmin
        .from('leads')
        .update({ status: 'dispatched', priority_message_id: messageId, priority_sent_at: now, dispatched_at: now })
        .eq('id', lead.id)
        .is('claimed_by', null)
        .neq('status', 'claimed')
      return { priority: true }
    } catch (err) {
      // Voorranggroep onbereikbaar: de klus mag nooit blijven liggen.
      console.error('Voorranggroep versturen mislukt; direct naar gewone groep', lead.id, err)
    }
  }

  const messageId = await dispatchLeadToGroup(lead)
  await supabaseAdmin
    .from('leads')
    .update({ status: 'dispatched', telegram_message_id: messageId, dispatched_at: now, public_released_at: now })
    .eq('id', lead.id)
    .is('claimed_by', null)
    .neq('status', 'claimed')
  return { priority: false }
}

/** Leads waarvan de voorrangstijd voorbij is, alsnog naar de gewone groep. */
export async function releasePriorityLeads(): Promise<{ released: number; failed: number }> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const settings = await getPrioritySettings()
  const shortest = Math.min(settings.waitUrgentSeconds, settings.waitPlannedSeconds)
  const cutoff = new Date(Date.now() - shortest * 1000).toISOString()

  const { data: rows, error } = await supabaseAdmin
    .from('leads')
    .select('*')
    .eq('status', 'dispatched')
    .is('claimed_by', null)
    .is('public_released_at', null)
    .not('priority_sent_at', 'is', null)
    .lte('priority_sent_at', cutoff)
    .limit(20)
  if (error) throw error

  let released = 0
  let failed = 0
  for (const lead of rows ?? []) {
    const wait = lead.is_urgent ? settings.waitUrgentSeconds : settings.waitPlannedSeconds
    // Staat de voorranggroep uit, dan direct doorzetten.
    if (settings.enabled && Date.now() - new Date(lead.priority_sent_at!).getTime() < wait * 1000) continue

    // Reserveren: slechts één run mag deze lead doorzetten.
    const stamp = new Date().toISOString()
    const { data: reserved } = await supabaseAdmin
      .from('leads')
      .update({ public_released_at: stamp })
      .eq('id', lead.id)
      .is('public_released_at', null)
      .is('claimed_by', null)
      .select('id')
    if (!reserved?.length) continue

    try {
      const messageId = await dispatchLeadToGroup(lead as any)
      await supabaseAdmin
        .from('leads')
        .update({ telegram_message_id: messageId, dispatched_at: stamp })
        .eq('id', lead.id)
        .is('claimed_by', null)
      released++
    } catch (err) {
      console.error('Doorzetten naar gewone groep mislukt', lead.id, err)
      await supabaseAdmin.from('leads').update({ public_released_at: null }).eq('id', lead.id).is('claimed_by', null)
      failed++
    }
  }
  return { released, failed }
}
