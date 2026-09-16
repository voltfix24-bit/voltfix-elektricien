import { timingSafeEqual } from 'node:crypto'

import { business } from './business'
import { escalationMinutes, isEmergencyLead, openSinceAnchor } from './lead-overdue'

type DigestLead = {
  id: string
  ref_number: number | null
  job_type: string
  city: string | null
  postal_code: string | null
  is_urgent?: boolean | undefined
  is_test: boolean | null
  dispatched_at: string | null
  created_at: string
}

/** "3 u 20 m" leest sneller dan "200 min". */
function openFor(lead: DigestLead, now: number): string {
  const minutes = Math.max(0, Math.floor((now - openSinceAnchor(lead)) / 60_000))
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} u ${minutes % 60} m`
  return `${Math.floor(hours / 24)} d ${hours % 24} u`
}

/**
 * Eén regel per klus, spoed dat over tijd is bovenaan. Geen klantgegevens:
 * klussoort, plaats en hoe lang de klus openstaat is genoeg om te handelen.
 */
export function buildDigest(leads: DigestLead[], now = Date.now()): string | null {
  if (leads.length === 0) return null
  const scored = leads.map((lead) => {

    const overdue = now > openSinceAnchor(lead) + escalationMinutes(lead) * 60_000
    const urgent = isEmergencyLead(lead)
    return { lead, overdue, urgent, rank: urgent && overdue ? 0 : overdue ? 1 : urgent ? 2 : 3 }
  })
  scored.sort((a, b) => a.rank - b.rank || openSinceAnchor(a.lead) - openSinceAnchor(b.lead))

  const lines = scored.map(({ lead, overdue, urgent }) => {
    const area = lead.city || lead.postal_code || 'onbekende plaats'
    const marker = urgent && overdue ? '🚨 SPOED · over tijd' : overdue ? '⏰ over tijd' : urgent ? '🚨 spoed' : '·'
    const ref = lead.ref_number ? ` #${lead.ref_number}` : ''
    return `${marker} ${lead.job_type} · ${area} · ${openFor(lead, now)} open${ref}`
  })

  return [
    `<b>${leads.length} ${leads.length === 1 ? 'klus staat' : 'klussen staan'} open zonder monteur</b>`,
    '',
    ...lines,
    '',
    `${business.url}/admin/leads?filter=open`,
  ].join('\n')
}

/**
 * Dagelijkse samenvatting voor de beheerder. Staat er niets open, dan gaat er
 * geen bericht uit. Testdossiers worden apart naar het testkanaal gestuurd.
 */
export async function handleLeadDigest(request: Request): Promise<Response> {
  const supplied = request.headers.get('x-reminder-token') ?? ''
  if (!/^[a-f0-9]{64}$/.test(supplied)) return new Response('Unauthorized', { status: 401 })
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { data: config, error: configError } = await supabaseAdmin
    .from('lead_reminder_config')
    .select('token')
    .eq('id', 1)
    .single()
  if (
    configError ||
    !config ||
    supplied.length !== config.token.length ||
    !timingSafeEqual(Buffer.from(supplied), Buffer.from(config.token))
  ) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('leads')
    .select('id, ref_number, job_type, city, postal_code, is_urgent, is_test, dispatched_at, created_at')
    .is('claimed_by', null)
    .in('status', ['new', 'dispatched'])
    .order('created_at', { ascending: true })
    .limit(200)
  if (error) throw error

  const open = (data ?? []) as DigestLead[]
  const { adminChatId, sendMessage } = await import('./telegram.server')
  const chat = adminChatId()
  if (!chat) return Response.json({ sent: 0, reason: 'no_admin_chat' }, { status: 200 })

  let sent = 0
  // Echte klussen en testdossiers krijgen elk hun eigen samenvatting, zodat de
  // router een testbericht altijd naar het testkanaal kan sturen.
  for (const group of [open.filter((lead) => !lead.is_test), open.filter((lead) => lead.is_test)]) {
    const text = buildDigest(group)
    if (!text) continue
    await sendMessage({
      chat_id: chat,
      text,
      routing: group[0]?.is_test ? { event: 'lead_digest', lead: group[0] } : { event: 'lead_digest', productionSafe: true },
    })
    sent++
  }

  return Response.json({ open: open.length, sent }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
}
