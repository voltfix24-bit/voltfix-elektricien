import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Bon uitgeven voor het beheren van de eigen toestemming
// ---------------------------------------------------------------------------
// Bij een advertentieklik vraagt de browser hier een geheime bon op. Die bon is
// het enige waarmee de bezoeker later zijn keuze kan wijzigen of intrekken. De
// bon zegt niets over toestemming: hij bewijst alleen dat het om dezelfde
// browsersessie gaat. De server bewaart alleen een vingerafdruk van de bon.
// ---------------------------------------------------------------------------

const bodySchema = z.object({
  gclid: z.string().trim().max(200).nullish(),
  gbraid: z.string().trim().max(200).nullish(),
  wbraid: z.string().trim().max(200).nullish(),
  clickRef: z.string().trim().max(16).nullish(),
  /** Geheim van deze browser; bepaalt wiens gegevens deze bon mag beheren. */
  visitorToken: z.string().trim().min(16).max(200).nullish(),
})

export const Route = createFileRoute('/api/public/track/consent-ticket')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: unknown
        try {
          payload = await request.json()
        } catch {
          return Response.json({ ok: false }, { status: 400 })
        }
        const parsed = bodySchema.safeParse(payload)
        if (!parsed.success) return Response.json({ ok: false }, { status: 400 })

        try {
          const { issueConsentTicket } = await import('@/lib/ads-consent.server')
          const issued = await issueConsentTicket({
            gclid: parsed.data.gclid ?? null,
            gbraid: parsed.data.gbraid ?? null,
            wbraid: parsed.data.wbraid ?? null,
            clickRef: parsed.data.clickRef ?? null,
            visitorToken: parsed.data.visitorToken ?? null,
          })
          if (!issued) return Response.json({ ok: false }, { status: 400 })
          return Response.json({ ok: true, token: issued.token }, { headers: { 'Cache-Control': 'no-store' } })
        } catch (err) {
          console.error('Toestemmingsbon uitgeven mislukt', err)
          return Response.json({ ok: false }, { status: 500 })
        }
      },
    },
  },
})
