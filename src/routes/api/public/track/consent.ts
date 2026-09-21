import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Toestemmingskeuze doorzetten naar de server
// ---------------------------------------------------------------------------
// Een latere weigering of intrekking in de cookiebanner mag niet in de browser
// blijven steken. De bezoeker stuurt zijn nieuwe keuze hierheen, samen met de
// klik-id's die bij zijn advertentieklik horen. Wij leggen die keuze vast bij
// de gemeten klikken én bij de dossiers die aan die klik hangen, en blokkeren
// meteen de terugmeldingen die nog klaarstonden.
//
// Wat hier NIET gebeurt: een aanvraag of dossier verwijderen of blokkeren. De
// klant houdt gewoon zijn afspraak, offerte en contact.
// ---------------------------------------------------------------------------

const bodySchema = z.object({
  gclid: z.string().trim().max(200).nullish(),
  gbraid: z.string().trim().max(200).nullish(),
  wbraid: z.string().trim().max(200).nullish(),
  clickRef: z.string().trim().max(16).nullish(),
  adUserData: z.enum(['granted', 'denied']),
  adStorage: z.enum(['granted', 'denied']).nullish(),
})

export const Route = createFileRoute('/api/public/track/consent')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: unknown
        try {
          payload = await request.json()
        } catch {
          return new Response(null, { status: 204 })
        }
        const parsed = bodySchema.safeParse(payload)
        if (!parsed.success) return new Response(null, { status: 204 })
        const d = parsed.data
        const ids = [d.gclid, d.gbraid, d.wbraid].filter(Boolean) as string[]
        if (ids.length === 0 && !d.clickRef) return new Response(null, { status: 204 })

        try {
          const { applyConsentDecision } = await import('@/lib/ads-consent.server')
          await applyConsentDecision({
            gclid: d.gclid ?? null,
            gbraid: d.gbraid ?? null,
            wbraid: d.wbraid ?? null,
            clickRef: d.clickRef ?? null,
            adUserData: d.adUserData,
            adStorage: d.adStorage ?? null,
          })
        } catch (err) {
          console.error('Toestemmingskeuze verwerken mislukt', err)
        }

        return new Response(null, { status: 204 })
      },
    },
  },
})
