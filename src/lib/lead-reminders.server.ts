import { timingSafeEqual } from 'node:crypto'
import { isEmergencyLead, isLeadOverdue } from './lead-overdue'

export async function handleLeadReminders(request: Request): Promise<Response> {
  const supplied = request.headers.get('x-reminder-token') ?? ''
  if (!/^[a-f0-9]{64}$/.test(supplied)) return new Response('Unauthorized', { status: 401 })
  // A private, generated database credential authenticates the scheduled caller.
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { data: config, error: configError } = await supabaseAdmin.from('lead_reminder_config').select('token').eq('id', 1).single()
  if (configError || !config || supplied.length !== config.token.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(config.token))) {
    return new Response('Unauthorized', { status: 401 })
  }
  const { data: reserved, error } = await supabaseAdmin.rpc('reserve_overdue_lead_reminders')
  if (error) throw error
  const { sendTemplateEmail } = await import('./email-templates/send-email')
  let sent = 0
  let failed = 0
  for (const reminder of reserved ?? []) {
    try {
      const { data: lead, error: readError } = await supabaseAdmin.from('leads').select('*').eq('id', reminder.lead_id).single()
      if (readError) throw readError
      // Recheck after reserving; never alert for a subsequently claimed/cancelled/re-dispatched lead.
      if (!lead || lead.dispatched_at !== reminder.dispatched_at || !isLeadOverdue(lead)) continue
      const result = await sendTemplateEmail('overdue-lead', '', {
        idempotencyKey: `overdue-${lead.id}-${reminder.dispatched_at}`,
        templateData: { jobType: lead.job_type, city: lead.city, leadId: lead.id, hours: isEmergencyLead(lead) ? 1 : 24 },
      })
      if (!result.sent) throw new Error('Reminder recipient suppressed')
      const { error: updateError } = await supabaseAdmin.from('lead_reminders').update({ sent_at: new Date().toISOString() })
        .eq('lead_id', lead.id).eq('dispatched_at', reminder.dispatched_at)
      if (updateError) throw updateError
      sent++
    } catch {
      failed++
      console.error('Lead reminder delivery failed; retry scheduled', reminder.lead_id)
    }
  }
  return Response.json({ sent, failed }, { status: failed ? 503 : 200, headers: { 'Cache-Control': 'no-store' } })
}