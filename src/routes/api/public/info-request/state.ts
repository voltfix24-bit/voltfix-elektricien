import { createFileRoute } from '@tanstack/react-router'

import { adminClient, customerState, isInfoRequestPublicEnabled, sessionContext } from '@/lib/info-request.server'

/**
 * Huidige stand voor de klant: welke punten gevraagd zijn, wat al is
 * opgeslagen en of de link nog geldig is. Eigenaarschap komt uit de sessie —
 * de browser geeft geen aanvraag-ID mee. De meegegeven `c` kiest alleen welke
 * van de eigen sessies dit tabblad toont; toegang geeft hij niet.
 */
export const Route = createFileRoute('/api/public/info-request/state')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isInfoRequestPublicEnabled()) return Response.json({ ok: false, code: 'disabled' }, { status: 403 })
        const supabase = adminClient()
        if (!supabase) return Response.json({ ok: false, code: 'server_not_configured' }, { status: 500 })
        const contextId = new URL(request.url).searchParams.get('c')
        const context = await sessionContext(supabase, request, contextId)
        if (!context) return Response.json({ ok: false, code: 'no_session' }, { status: 401 })
        const state = await customerState(supabase, context.request)
        return Response.json(
          { ok: true, contextId: context.sessionId, state },
          { headers: { 'Cache-Control': 'no-store' } },
        )
      },
    },
  },
})
