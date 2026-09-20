import { createFileRoute } from '@tanstack/react-router'

import { isWellFormedReminderToken, reminderTokenMatches } from '@/lib/hook-token'

/**
 * Verzendt de klaargezette conversieterugmeldingen.
 *
 * Wordt periodiek aangeroepen door de geplande taak, en is met dezelfde
 * privétoken beveiligd als de andere achtergrondtaken — zodat niemand anders
 * conversies naar het advertentieaccount kan laten sturen.
 */
export const Route = createFileRoute('/api/public/hooks/ads-outbox')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supplied = request.headers.get('x-reminder-token') ?? ''
        if (!isWellFormedReminderToken(supplied)) return new Response('Unauthorized', { status: 401 })
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const { data: config } = await supabaseAdmin
          .from('lead_reminder_config')
          .select('token')
          .eq('id', 1)
          .single()
        if (!config || !reminderTokenMatches(supplied, config.token)) {
          return new Response('Unauthorized', { status: 401 })
        }
        try {
          const { processAdsOutbox } = await import('@/lib/ads-outbox.server')
          const result = await processAdsOutbox()
          return Response.json(result, { headers: { 'Cache-Control': 'no-store' } })
        } catch (err) {
          console.error('Verwerken van de conversiewachtrij mislukt', err)
          return new Response('Mislukt', { status: 500 })
        }
      },
    },
  },
})
