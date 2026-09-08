import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { checkSpam, spamMessage } from '@/lib/spam-filter'
import { createAndDispatchLead, leadIntakeSchema } from '@/lib/leads-intake.server'

// Publiek endpoint voor eenvoudige JSON-inzendingen vanaf de website of
// externe formulieren. Beveiliging: Turnstile (indien geconfigureerd),
// honeypot, Zod-validatie en de spamfilter.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const bodySchema = leadIntakeSchema
  .omit({ priceCents: true })
  .extend({
    locale: z.enum(['nl', 'en']).default('nl'),
    hp: z.string().max(0).optional(),
    turnstileToken: z.string().max(4000).optional(),
  })

function jsonError(status: number, error: string, details?: unknown) {
  return Response.json({ error, details }, { status, headers: CORS })
}

async function verifyTurnstile(token: string, ip: string | null): Promise<boolean> {
  const secret = process.env['TURNSTILE_SECRET_KEY']
  if (!secret) return true
  if (!token) return false
  try {
    const body = new URLSearchParams({ secret, response: token })
    if (ip) body.set('remoteip', ip)
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    })
    if (!res.ok) return false
    const json = (await res.json()) as { success?: boolean }
    return json.success === true
  } catch (err) {
    console.error('Turnstile verification failed', err)
    return false
  }
}

export const Route = createFileRoute('/api/public/leads/create')({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),

      POST: async ({ request }) => {
        let raw: unknown
        try {
          raw = await request.json()
        } catch {
          return jsonError(400, 'Invalid JSON body')
        }

        const parsed = bodySchema.safeParse(raw)
        if (!parsed.success) {
          return jsonError(400, 'Invalid form data', parsed.error.flatten())
        }
        const data = parsed.data

        // Honeypot: stilzwijgend succes.
        if (data.hp) return Response.json({ success: true }, { headers: CORS })

        const ip =
          request.headers.get('cf-connecting-ip') ??
          request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
          null

        const turnstileOk = await verifyTurnstile(data.turnstileToken ?? '', ip)
        if (!turnstileOk) {
          return jsonError(
            400,
            data.locale === 'en'
              ? 'The anti-spam check failed. Refresh the page and try again.'
              : 'De anti-spamcontrole is mislukt. Ververs de pagina en probeer opnieuw.',
          )
        }

        const spam = checkSpam({
          name: data.name,
          phone: data.phone,
          email: data.email,
          message: data.description,
          jobType: data.jobType,
        })
        if (spam.spam) {
          console.warn('Lead blocked by spam filter', spam.reason)
          return jsonError(400, spamMessage(data.locale))
        }

        const created = await createAndDispatchLead({
          name: data.name,
          phone: data.phone,
          email: data.email ?? null,
          postalCode: data.postalCode ?? null,
          address: data.address ?? null,
          city: data.city ?? null,
          jobType: data.jobType,
          description: data.description ?? null,
          isUrgent: data.isUrgent,
          source: data.source,
          sourcePath: data.sourcePath ?? null,
          imagePaths: [],

        })

        if (!created) return jsonError(500, 'Failed to save lead')

        return Response.json({ success: true, id: created.id }, { headers: CORS })
      },
    },
  },
})
