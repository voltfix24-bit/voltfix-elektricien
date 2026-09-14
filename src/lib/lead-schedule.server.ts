// Server-only: de bot vraagt de monteur na het claimen van gepland werk om dag
// en tijd, en herhaalt die vraag precies één keer na vier uur.

import { dayOptions, scheduleText, slotOptions } from './lead-schedule'

type AnyLead = Record<string, any>

/** Vraagt de monteur om een dag. Gooit niet: een mislukte vraag blokkeert niets. */
export async function askScheduleDay(chatId: number | string, lead: AnyLead, repeat = false): Promise<boolean> {
  const tg = await import('./telegram.server')
  const label = tg.scheduleJobLabel(lead)
  const esc = tg.escapeHtml
  const ref = lead.ref_number ? `#${lead.ref_number}` : ''
  const head = repeat
    ? `Nog even: welke dag doe je ${esc(label)}${ref ? ` (${esc(String(ref))})` : ''}?`
    : `Welke dag doe je ${esc(label)}${ref ? ` (${esc(String(ref))})` : ''}?`

  // Zonder deze regels weet de monteur niet over welke klus het gaat.
  const place = [lead.address, lead.postal_code, lead.city].map((v: any) => (v ?? '').trim()).filter(Boolean).join(', ')
  const description = ((lead.description ?? '') as string).trim().replace(/\s+/g, ' ')
  const lines = [
    lead.job_type ? `<b>Klus:</b> ${esc(String(lead.job_type))}` : '',
    lead.customer_name ? `<b>Klant:</b> ${esc(String(lead.customer_name))}` : '',
    place ? `<b>Adres:</b> ${esc(place)}` : '',
    lead.customer_phone ? `<b>Tel:</b> ${esc(String(lead.customer_phone))}` : '',
    description ? `<b>Omschrijving:</b> ${esc(description.slice(0, 200))}${description.length > 200 ? '…' : ''}` : '',
  ].filter(Boolean)

  const text = [head, '', ...lines].join('\n').trim()
  try {
    await tg.sendMessage({
      chat_id: chatId,
      text,
      reply_markup: tg.scheduleDayKeyboard(lead.id, dayOptions()),
    })
    return true
  } catch (error) {
    console.error('schedule prompt failed', lead.id, error)
    return false
  }
}

export async function askScheduleSlot(chatId: number | string, lead: AnyLead, day: string) {
  const tg = await import('./telegram.server')
  await tg.sendMessage({
    chat_id: chatId,
    text: 'Hoe laat?',
    reply_markup: tg.scheduleSlotKeyboard(lead.id, day, slotOptions()),
  })
}

/**
 * Herhaalvraag voor leads die na vier uur nog geen plandatum hebben. De
 * database reserveert en telt mee, zodat twee runs nooit dubbel vragen en de
 * vraag nooit vaker dan twee keer uitgaat.
 */
export async function sendSchedulePrompts(): Promise<{ asked: number }> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { data: reserved, error } = await supabaseAdmin.rpc('reserve_schedule_prompts', { _limit: 20 })
  if (error) {
    console.error('reserve_schedule_prompts failed', error)
    return { asked: 0 }
  }
  let asked = 0
  for (const lead of (reserved ?? []) as AnyLead[]) {
    const { data: contractor } = await supabaseAdmin
      .from('contractors')
      .select('telegram_user_id')
      .eq('id', lead.claimed_by)
      .maybeSingle()
    const chat = contractor?.telegram_user_id
    if (!chat) continue
    if (await askScheduleDay(chat, lead, true)) asked++
  }
  return { asked }
}

/** Legt een plandatum vast en schrijft de wijziging in de tijdlijn. */
export async function saveSchedule(opts: {
  leadId: string
  iso: string
  by: string
  actorId?: string | null
}): Promise<{ ok: boolean; previous: string | null }> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { data: before } = await supabaseAdmin.from('leads').select('scheduled_at').eq('id', opts.leadId).maybeSingle()
  const previous = before?.scheduled_at ?? null
  const { error } = await supabaseAdmin.from('leads').update({ scheduled_at: opts.iso }).eq('id', opts.leadId)
  if (error) {
    console.error('saveSchedule failed', opts.leadId, error)
    return { ok: false, previous }
  }
  await supabaseAdmin
    .from('lead_audit_logs')
    .insert({
      lead_id: opts.leadId,
      actor_id: opts.actorId ?? null,
      action: previous ? 'schedule_changed' : 'schedule_set',
      changes: { by: opts.by, from: previous ? scheduleText(previous) : null, to: scheduleText(opts.iso) } as any,
    })
    .then(undefined, (e: unknown) => console.error('audit log failed', e))
  return { ok: true, previous }
}
