import { createFileRoute } from '@tanstack/react-router'

import { isWellFormedReminderToken, reminderTokenMatches } from '@/lib/hook-token'

/**
 * Herstelhook: probeert openstaande meldingen (interne lead, e-mails) opnieuw.
 * Beveiligd met dezelfde private token als de leadherinneringen.
 */
export const Route = createFileRoute('/api/public/hooks/notification-retry')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supplied = request.headers.get('x-reminder-token') ?? ''
        if (!isWellFormedReminderToken(supplied)) return new Response('Unauthorized', { status: 401 })
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const { data: config } = await supabaseAdmin.from('lead_reminder_config').select('token').eq('id', 1).single()
        if (!config || !reminderTokenMatches(supplied, config.token)) {
          return new Response('Unauthorized', { status: 401 })
        }
        try {
          const { processDueNotifications } = await import('@/lib/notifications.server')
          const { processDueLeadDeliveries } = await import('@/lib/lead-delivery.server')
          const result = await processDueNotifications(supabaseAdmin as never)
          // Ook betaalde claims waarvan de klantgegevens nog niet aankwamen.
          const deliveries = await processDueLeadDeliveries(supabaseAdmin as never)
          const failed = result.failed + deliveries.failed
          return Response.json(
            { ...result, deliveries },
            { status: failed ? 503 : 200, headers: { 'Cache-Control': 'no-store' } },
          )
        } catch (err) {
          console.error('Notification retry failed', err)
          return new Response('Retry failed', { status: 500 })
        }
      },
    },
  },
})
