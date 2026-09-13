import { createFileRoute } from '@tanstack/react-router'

import { evaluateAccess, normaliseAnswers, type InfoRequestItemCode } from '@/lib/booking/info-request'
import {
  adminClient,
  isInfoRequestPublicEnabled,
  rateLimit,
  sameOrigin,
  sessionContext,
} from '@/lib/info-request.server'

/**
 * Tussentijds bewaren van de antwoorden binnen hetzelfde informatieverzoek.
 *
 * Geen concept in de browser: tokens, foto's en persoonsgegevens komen nooit
 * in localStorage. Het concept heeft een eigen revisie, zodat twee open
 * tabbladen elkaar niet stil overschrijven.
 */
export const Route = createFileRoute('/api/public/info-request/draft')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isInfoRequestPublicEnabled()) return Response.json({ ok: false, code: 'disabled' }, { status: 403 })
        if (!sameOrigin(request)) return Response.json({ ok: false, code: 'bad_origin' }, { status: 403 })

        const supabase = adminClient()
        if (!supabase) return Response.json({ ok: false, code: 'server_not_configured' }, { status: 500 })
        const context = await sessionContext(supabase, request)
        if (!context) return Response.json({ ok: false, code: 'no_session' }, { status: 401 })
        if (!rateLimit(`draft:${context.sessionId}`, 60, 60)) {
          return Response.json({ ok: false, code: 'too_many_requests' }, { status: 429 })
        }

        const row = context.request
        const access = evaluateAccess({ status: row.status as never, expiresAt: row.expires_at })
        if (!access.ok) return Response.json({ ok: false, code: access.reason }, { status: 410 })

        let body: { answers?: unknown; draftRevision?: unknown }
        try {
          body = (await request.json()) as typeof body
        } catch {
          return Response.json({ ok: false, code: 'invalid_request' }, { status: 400 })
        }
        const expected = typeof body.draftRevision === 'number' ? body.draftRevision : -1
        if (expected !== row.draft_revision) {
          return Response.json(
            { ok: false, code: 'draft_conflict', draftRevision: row.draft_revision, answers: row.draft_answers },
            { status: 409 },
          )
        }

        const answers = normaliseAnswers(row.items.filter(Boolean) as InfoRequestItemCode[], body.answers)
        const { error } = await supabase
          .from('quote_request_info_requests')
          .update({ draft_answers: answers as never, draft_revision: row.draft_revision + 1 })
          .eq('id', row.id)
          .eq('draft_revision', row.draft_revision)
        if (error) return Response.json({ ok: false, code: 'save_failed' }, { status: 500 })

        return Response.json(
          { ok: true, draftRevision: row.draft_revision + 1 },
          { headers: { 'Cache-Control': 'no-store' } },
        )
      },
    },
  },
})
