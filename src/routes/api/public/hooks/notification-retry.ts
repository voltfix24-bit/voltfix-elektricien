import { createFileRoute } from '@tanstack/react-router'

/**
 * Herstelhook: probeert openstaande meldingen (interne lead, e-mails) opnieuw.
 * Beveiligd met dezelfde private token als de leadherinneringen.
 */
export const Route = createFileRoute('/api/public/hooks/notification-retry')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supplied = request.headers.get('x-reminder-token') ?? ''
        if (!/^[a-f0-9]{64}$/.test(supplied)) return new Response('Unauthorized', { status: 401 })
        const { timingSafeEqual } = await import('node:crypto')
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const { data: config } = await supabaseAdmin.from('lead_reminder_config').select('token').eq('id', 1).single()
        if (!config || supplied.length !== config.token.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(config.token))) {
          return new Response('Unauthorized', { status: 401 })
        }
        try {
          const { processDueNotifications } = await import('@/lib/notifications.server')
          const result = await processDueNotifications(supabaseAdmin as never)
          return Response.json(result, { status: result.failed ? 503 : 200, headers: { 'Cache-Control': 'no-store' } })
        } catch (err) {
          console.error('Notification retry failed', err)
          return new Response('Retry failed', { status: 500 })
        }
      },
    },
  },
})
