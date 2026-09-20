import { createFileRoute } from '@tanstack/react-router'

/**
 * Verzendt de klaargezette conversieterugmeldingen.
 *
 * Wordt periodiek aangeroepen door de geplande taak. Beveiligd met dezelfde
 * gedeelde sleutel als de andere achtergrondtaken, zodat niemand anders
 * conversies naar het advertentieaccount kan laten sturen.
 */
export const Route = createFileRoute('/api/public/hooks/ads-outbox')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env['HOOKS_SHARED_SECRET']
        if (!secret) return new Response('Niet geconfigureerd', { status: 503 })
        const provided = request.headers.get('x-hooks-secret') ?? ''
        if (provided.length !== secret.length || provided !== secret) {
          return new Response('Geen toegang', { status: 401 })
        }
        try {
          const { processAdsOutbox } = await import('@/lib/ads-outbox.server')
          const result = await processAdsOutbox()
          return Response.json(result)
        } catch (err) {
          console.error('Verwerken van de conversiewachtrij mislukt', err)
          return new Response('Mislukt', { status: 500 })
        }
      },
    },
  },
})
