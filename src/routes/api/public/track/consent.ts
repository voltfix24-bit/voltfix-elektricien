import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Toestemmingskeuze doorzetten naar de server
// ---------------------------------------------------------------------------
// Een latere weigering of intrekking in de cookiebanner mag niet in de browser
// blijven steken. De bezoeker stuurt zijn nieuwe keuze hierheen, met de bon die
// de server bij zijn advertentieklik heeft uitgegeven. Alleen met die bon is de
// keuze van díe bezoeker te wijzigen: een los meegestuurd klik-id is geen bewijs
// van eigenaarschap en wordt hier niet geaccepteerd.
//
// Het antwoord is onderscheidend, zodat de browser weet of hij het later
// opnieuw moet proberen. Wat hier NIET gebeurt: een aanvraag of dossier
// verwijderen of blokkeren. De klant houdt gewoon zijn afspraak en contact.
// ---------------------------------------------------------------------------

const bodySchema = z.object({
  token: z.string().trim().regex(/^[a-f0-9]{64}$/).nullish(),
  visitorToken: z.string().trim().regex(/^[A-Za-z0-9._-]{16,200}$/).nullish(),
  adUserData: z.enum(['granted', 'denied']),
  adStorage: z.enum(['granted', 'denied']).nullish(),
  seq: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
  version: z.number().int().min(1).max(100).nullish(),
}).refine((body) => Boolean(body.token || body.visitorToken))

export const Route = createFileRoute('/api/public/track/consent')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: unknown
        try {
          payload = await request.json()
        } catch {
          return Response.json({ ok: false, reason: 'invalid_body' }, { status: 400 })
        }
        const parsed = bodySchema.safeParse(payload)
        if (!parsed.success) return Response.json({ ok: false, reason: 'invalid_body' }, { status: 400 })
        const d = parsed.data

        try {
          const { applyConsentDecision } = await import('@/lib/ads-consent.server')
          const result = await applyConsentDecision({
            token: d.token,
            visitorToken: d.visitorToken,
            adUserData: d.adUserData,
            adStorage: d.adStorage ?? null,
            seq: d.seq,
            version: d.version ?? 2,
          })
          if (!result.ok) {
            // Onbekende bon: niet gevonden of niet van deze bezoeker.
            // Bezet: er loopt een andere keuze van dezelfde bezoeker — de
            // browser houdt hem klaar en probeert het later opnieuw.
            // Achterhaald of tegenstrijdig: er is al een nieuwere of andere
            // keuze met ditzelfde volgnummer verwerkt.
            const status =
              result.reason === 'unknown_ticket' ? 401 : result.reason === 'busy' ? 503 : 409
            return Response.json({ ok: false, reason: result.reason }, { status })
          }
          return Response.json(result, { headers: { 'Cache-Control': 'no-store' } })
        } catch (err) {
          console.error('Toestemmingskeuze verwerken mislukt', err)
          // Eerlijk falen: de browser probeert het later opnieuw.
          return Response.json({ ok: false, reason: 'server_error' }, { status: 500 })
        }
      },
    },
  },
})
