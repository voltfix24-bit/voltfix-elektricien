// Server-only: de bot vraagt de monteur na het claimen van gepland werk om dag
// en tijd, en herhaalt die vraag precies één keer na vier uur.

import { SLOT_BLOCKS, dayOptions, findBlock, scheduleText, slotLabel } from './lead-schedule'

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
      routing: { event: repeat ? 'schedule_reminder' : 'schedule_prompt', lead },
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
    text: 'Welk tijdvak? Kies een blok, hele dag, of tik op Tijd zelf invullen.',
    reply_markup: tg.scheduleSlotKeyboard(lead.id, day, SLOT_BLOCKS),
    routing: { event: 'schedule_slot_prompt', lead },
  })
}

/**
 * Stuurt de monteur de afspraak als agendabestand met een knop naar Google
 * Agenda. Mislukt dit, dan blijft de planning gewoon staan — het is een extra.
 */
export async function sendAppointment(chatId: number | string, lead: AnyLead, startIso: string, slot: string | null) {
  const { buildAppointmentIcs, googleCalendarUrl } = await import('./lead-ics')
  const block = slot ? findBlock(slot) : null
  const start = new Date(startIso)
  // Einde = start + blokduur. Niet met setHours: dat werkt in servertijd (UTC)
  // terwijl de bloktijden Amsterdamse tijd zijn — dan liep het einde 2 uur uit.
  let durationMs = 2 * 3_600_000
  if (block) {
    const [sh, sm] = block.start.split(':').map(Number)
    const [eh, em] = block.end.split(':').map(Number)
    durationMs = ((eh! * 60 + em!) - (sh! * 60 + sm!)) * 60_000
  }
  const end = new Date(start.getTime() + durationMs)
  const endIso = end.toISOString()
  const tg = await import('./telegram.server')
  try {
    const ics = buildAppointmentIcs(lead as any, startIso, endIso)
    const bytes = new TextEncoder().encode(ics)
    await tg.sendDocumentUpload({
      chat_id: chatId,
      name: `voltfix-${lead.ref_number ?? lead.id}.ics`,
      data: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
      caption: `<b>Afspraak:</b> ${tg.escapeHtml(scheduleText(startIso))}${block ? ` (${tg.escapeHtml(block.label)})` : ''} — zet hem in je agenda.`,
      routing: { event: 'appointment_ics', lead },
    })
    await tg.sendMessage({
      chat_id: chatId,
      text: 'Of zet hem rechtstreeks in Google Agenda:',
      reply_markup: {
        inline_keyboard: [[{ text: 'Zet in Google Agenda', url: googleCalendarUrl(lead as any, startIso, endIso) }]],
      },
      routing: { event: 'appointment_google_calendar', lead },
    })
  } catch (error) {
    console.error('appointment file failed', lead.id, error)
  }
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

/**
 * Legt dag, tijdvak en plandatum vast. Dubbel inplannen kan niet: staat er al
 * een afspraak van iemand anders, dan wint die en krijgt de tweede monteur te
 * horen door wie de klus al is ingepland.
 */
export async function saveSchedule(opts: {
  leadId: string
  iso: string
  by: string
  actorId?: string | null
  slot?: string | null
}): Promise<{ ok: boolean; previous: string | null; conflictBy?: string }> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { data: before } = await supabaseAdmin
    .from('leads')
    .select('scheduled_at, claimed_by, contractors:claimed_by(name)')
    .eq('id', opts.leadId)
    .maybeSingle()
  const previous = (before as any)?.scheduled_at ?? null

  // Al ingepland door een andere monteur: niet overschrijven.
  if (previous && opts.actorId && (before as any)?.claimed_by && (before as any).claimed_by !== opts.actorId) {
    const other = (before as any)?.contractors?.name ?? 'een andere monteur'
    return { ok: false, previous, conflictBy: other }
  }

  const update = { scheduled_at: opts.iso, ...(opts.slot !== undefined ? { scheduled_slot: opts.slot } : {}) }
  const { error } = await supabaseAdmin.from('leads').update(update as any).eq('id', opts.leadId)
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
      changes: {
        by: opts.by,
        from: previous ? scheduleText(previous) : null,
        to: scheduleText(opts.iso),
        slot: opts.slot ? slotLabel(opts.slot) || opts.slot : null,
      } as any,
    })
    .then(undefined, (e: unknown) => console.error('audit log failed', e))
  return { ok: true, previous }
}
