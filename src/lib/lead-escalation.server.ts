import { timingSafeEqual } from 'node:crypto'
import { escalationMinutes, isEmergencyLead, openSinceAnchor } from './lead-overdue'
import { business } from './business'

/**
 * Signaal naar de beheerder wanneer niemand een lead oppakt.
 *
 * Idempotent: `reserve_lead_escalations` zet `escalated_at` in dezelfde
 * UPDATE als de selectie, dus een tweede (of gelijktijdige) uitvoering vindt
 * de rij niet meer. Er is geen teller in het geheugen — het veld op de lead is
 * de enige garantie.
 */
export async function handleLeadEscalations(request: Request): Promise<Response> {
  const supplied = request.headers.get('x-reminder-token') ?? ''
  if (!/^[a-f0-9]{64}$/.test(supplied)) return new Response('Unauthorized', { status: 401 })
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { data: config, error: configError } = await supabaseAdmin.from('lead_reminder_config').select('token').eq('id', 1).single()
  if (configError || !config || supplied.length !== config.token.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(config.token))) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { data: reserved, error } = await supabaseAdmin.rpc('reserve_lead_escalations', { _limit: 20 })
  if (error) throw error

  const { adminChatId, sendMessage } = await import('./telegram.server')
  const chat = adminChatId()
  let sent = 0
  let failed = 0
  let givenUp = 0
  for (const lead of (reserved ?? []) as any[]) {
    if (!chat) {
      // Geen chat ingesteld: de reservering meteen vrijgeven.
      await supabaseAdmin.from('leads').update({ escalation_claimed_at: null }).eq('id', lead.id)
      continue
    }
    try {
      const minutes = Math.max(0, Math.floor((Date.now() - openSinceAnchor(lead)) / 60_000))
      const area = lead.city || lead.postal_code || 'onbekende wijk'
      const text = [
        'Niet opgepakt',
        `${lead.job_type} · ${area}`,
        `Open sinds ${minutes} min (termijn ${escalationMinutes(lead)} min${isEmergencyLead(lead) ? ', spoed' : ''})`,
        `${business.url}/admin/leads?lead=${lead.id}`,
      ].join('\n')
      await sendMessage({ chat_id: chat, text })
      // Pas nu is de beheerder echt gewaarschuwd.
      await supabaseAdmin.from('leads').update({ escalated_at: new Date().toISOString() }).eq('id', lead.id)
      sent++
    } catch {
      failed++
      const attempts = Number(lead.escalation_attempts ?? 0) + 1
      if (attempts >= MAX_ESCALATION_ATTEMPTS) {
        // Blijvend kapot (bijvoorbeeld een fout chat-id): stoppen met proberen.
        await supabaseAdmin
          .from('leads')
          .update({ escalation_attempts: attempts, escalated_at: new Date().toISOString() })
          .eq('id', lead.id)
        givenUp++
        console.error('Lead escalation alert abandoned after retries', lead.id)
      } else {
        // Reservering vrijgeven zodat de volgende run het opnieuw probeert.
        await supabaseAdmin
          .from('leads')
          .update({ escalation_attempts: attempts, escalation_claimed_at: null })
          .eq('id', lead.id)
        // Geen klantgegevens in de log.
        console.error('Lead escalation alert failed', lead.id)
      }
    }
  }
  return Response.json(
    { reserved: (reserved ?? []).length, sent, failed, givenUp },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  )
}
