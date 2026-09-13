import { createFileRoute } from '@tanstack/react-router'

import {
  adminClient,
  createSession,
  customerState,
  infoRequestByToken,
  isInfoRequestPublicEnabled,
  rateLimit,
  sameOrigin,
} from '@/lib/info-request.server'
import { evaluateAccess } from '@/lib/booking/info-request'

/**
 * Token inwisselen voor een korte serversessie.
 *
 * Het token staat in het URL-fragment en wordt uitsluitend via POST verstuurd,
 * zodat het niet in serverlogs, verwijzers of linkpreviews belandt. Een GET of
 * preview verbruikt de link dus nooit; de klant kan hem tot het definitief
 * indienen opnieuw openen.
 */

function jsonError(status: number, code: string) {
  return Response.json({ ok: false, code }, { status })
}

export const Route = createFileRoute('/api/public/info-request/session')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isInfoRequestPublicEnabled()) return jsonError(403, 'disabled')
        if (!sameOrigin(request)) return jsonError(403, 'bad_origin')

        let body: { token?: unknown }
        try {
          body = (await request.json()) as { token?: unknown }
        } catch {
          return jsonError(400, 'invalid_request')
        }
        const token = typeof body.token === 'string' ? body.token : ''
        if (token.length < 20 || token.length > 128) return jsonError(400, 'invalid_request')

        const supabase = adminClient()
        if (!supabase) return jsonError(500, 'server_not_configured')
        // Gedeelde rem op het raden van tokens.
        if (!rateLimit(`session:${token.slice(0, 8)}`, 10, 60)) return jsonError(429, 'too_many_requests')

        const infoRequest = await infoRequestByToken(supabase, token)
        // Geen onderscheid tussen "bestaat niet" en "past niet": beide neutraal.
        if (!infoRequest) return jsonError(404, 'not_available')

        const access = evaluateAccess({ status: infoRequest.status as never, expiresAt: infoRequest.expires_at })
        if (!access.ok) return Response.json({ ok: false, code: access.reason }, { status: 410 })

        const session = await createSession(supabase, infoRequest)
        if (!session) return jsonError(500, 'session_failed')

        const state = await customerState(supabase, infoRequest)
        return Response.json(
          { ok: true, state },
          { headers: { 'Set-Cookie': session.cookie, 'Cache-Control': 'no-store' } },
        )
      },
    },
  },
})
