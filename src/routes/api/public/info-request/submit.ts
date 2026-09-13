import { createFileRoute } from '@tanstack/react-router'

import {
  evaluateAccess,
  evaluateAnswers,
  normaliseAnswers,
  type InfoRequestItemCode,
} from '@/lib/booking/info-request'
import {
  adminClient,
  clearedSessionCookie,
  isInfoRequestPublicEnabled,
  rateLimit,
  receiptContext,
  sameOrigin,
  sessionContext,
} from '@/lib/info-request.server'

/**
 * Definitief indienen — één handeling, één transactie.
 *
 * De databasefunctie controleert de stand opnieuw, koppelt de bijlagen, sluit
 * het verzoek en trekt de toegang in. Twee tabbladen, een dubbelklik of een
 * verloren antwoord leveren met dezelfde sleutel dezelfde bevestiging op;
 * andere inhoud onder dezelfde sleutel geeft een conflict.
 */

function jsonError(status: number, code: string, extra: Record<string, unknown> = {}) {
  return Response.json({ ok: false, code, ...extra }, { status })
}

export const Route = createFileRoute('/api/public/info-request/submit')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isInfoRequestPublicEnabled()) return jsonError(403, 'disabled')
        if (!sameOrigin(request)) return jsonError(403, 'bad_origin')

        const supabase = adminClient()
        if (!supabase) return jsonError(500, 'server_not_configured')

        let body: { answers?: unknown; idempotencyKey?: unknown; revision?: unknown; contextId?: unknown }
        try {
          body = (await request.json()) as typeof body
        } catch {
          return jsonError(400, 'invalid_request')
        }
        const contextId = typeof body.contextId === 'string' ? body.contextId : null
        const key = typeof body.idempotencyKey === 'string' ? body.idempotencyKey.slice(0, 64) : ''
        if (key.length < 8) return jsonError(400, 'invalid_request')

        const context = await sessionContext(supabase, request, contextId)
        if (!context) {
          // Beperkt ontvangstbewijs: de sessie is bij de commit ingetrokken,
          // maar het antwoord ging verloren. Dezelfde inzending mag dan nog
          // bevestigd worden — bewerken niet.
          const receipt = await receiptContext(supabase, request, contextId)
          if (!receipt) return jsonError(401, 'no_session')
          const submitted = receipt.request
          if (submitted.status !== 'submitted' || submitted.idempotency_key !== key) {
            return jsonError(401, 'no_session')
          }
          const items = submitted.items.filter(Boolean) as InfoRequestItemCode[]
          const answers = normaliseAnswers(items, body.answers)
          // Andere inhoud onder dezelfde sleutel is nadrukkelijk geen replay.
          if (JSON.stringify(answers) !== JSON.stringify(submitted.answers ?? {})) {
            return jsonError(409, 'content_changed')
          }
          return Response.json(
            { ok: true, replayed: true, reported: (submitted.reported_missing ?? []) as unknown },
            { headers: { 'Cache-Control': 'no-store' } },
          )
        }
        if (!rateLimit(`submit:${context.sessionId}`, 10, 300)) return jsonError(429, 'too_many_requests')

        const row = context.request
        const access = evaluateAccess({ status: row.status as never, expiresAt: row.expires_at })
        if (!access.ok) return Response.json({ ok: false, code: access.reason }, { status: 410 })

        // De vraagversie waarop de klant antwoordde moet nog gelden.
        if (typeof body.revision === 'number' && body.revision !== row.revision) {
          return jsonError(409, 'revision_changed', { revision: row.revision })
        }

        const items = row.items.filter(Boolean) as InfoRequestItemCode[]
        const answers = normaliseAnswers(items, body.answers)

        // Uitsluitend bevestigd opgeslagen bijlagen tellen mee.
        const { data: stored } = await supabase
          .from('quote_request_attachments')
          .select('attachment_id, category')
          .eq('draft_id', row.id)
          .eq('status', 'stored')
        const files = stored ?? []
        const result = evaluateAnswers({
          items,
          answers,
          storedCategories: files.map(file => file.category),
        })
        if (!result.complete) return jsonError(400, 'incomplete', { open: result.open })

        const { data: rpc, error } = await supabase.rpc('submit_info_request', {
          _info_request_id: row.id,
          _answers: answers as never,
          _reported_missing: result.reported as never,
          _idempotency_key: key,
          _attachment_ids: files.map(file => file.attachment_id),
        })
        if (error) return jsonError(500, 'submit_failed')
        const outcome = (rpc ?? {}) as { ok?: boolean; reason?: string; replayed?: boolean }
        if (!outcome.ok) return jsonError(409, outcome.reason ?? 'conflict')

        // Pas ná de bevestigde commit volgt de interne melding. Faalt die, dan
        // blijft de ontvangst staan: de wachtrij probeert het opnieuw.
        try {
          const { enqueueNotifications, runNotificationsForRequest } = await import('@/lib/notifications.server')
          await enqueueNotifications(supabase, row.quote_request_id, [
            {
              kind: 'info_request_received',
              payload: {
                infoRequestRevision: row.revision,
                receivedCategories: [...new Set(files.map(file => file.category))],
                missingItems: result.reported,
                callbackRequested: row.callback_requested,
              },
            },
          ])
          await runNotificationsForRequest(supabase, row.quote_request_id)
        } catch {
          // Bewust stil richting de klant: de ontvangst is al definitief.
        }

        return Response.json(
          { ok: true, replayed: Boolean(outcome.replayed), reported: result.reported },
          { headers: { 'Set-Cookie': clearedSessionCookie(), 'Cache-Control': 'no-store' } },
        )
      },
    },
  },
})
