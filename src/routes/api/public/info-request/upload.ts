import { createFileRoute } from '@tanstack/react-router'

import { allowedCategories, evaluateAccess, type InfoRequestItemCode } from '@/lib/booking/info-request'
import {
  attachmentRulesFor,
  attachmentStoragePath,
  displayFilename,
  retentionExpiresAt,
  uuidPattern,
  validateAttachment,
  validateAttachmentSet,
} from '@/lib/booking/attachments'
import { sanitizeImageBytes } from '@/lib/booking/image-sanitize'
import { adminClient, isInfoRequestPublicEnabled, rateLimit, sameOrigin, sessionContext } from '@/lib/info-request.server'

/**
 * Bijlagen bij een informatieverzoek. Zelfde beveiliging als fase 4:
 * private opslag, extensie/MIME/magic bytes, metadata verwijderen en een pad
 * dat uitsluitend uit UUID's bestaat. De categorie moet passen bij een punt
 * dat in déze vraagversie is gevraagd; iets anders wordt geweigerd.
 */

function jsonError(status: number, code: string) {
  return Response.json({ ok: false, code }, { status })
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', bytes as unknown as ArrayBuffer)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export const Route = createFileRoute('/api/public/info-request/upload')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isInfoRequestPublicEnabled()) return jsonError(403, 'disabled')
        if (!sameOrigin(request)) return jsonError(403, 'bad_origin')

        const supabase = adminClient()
        if (!supabase) return jsonError(500, 'server_not_configured')
        const context = await sessionContext(supabase, request)
        if (!context) return jsonError(401, 'no_session')
        if (!rateLimit(`upload:${context.sessionId}`, 30, 300)) return jsonError(429, 'too_many_requests')

        const row = context.request
        const access = evaluateAccess({ status: row.status as never, expiresAt: row.expires_at })
        if (!access.ok) return Response.json({ ok: false, code: access.reason }, { status: 410 })

        let form: FormData
        try {
          form = await request.formData()
        } catch {
          return jsonError(400, 'invalid_request')
        }
        const attachmentId = String(form.get('attachmentId') ?? '')
        const category = String(form.get('category') ?? '')
        const file = form.get('file')
        if (!uuidPattern.test(attachmentId) || !(file instanceof File)) return jsonError(400, 'invalid_request')
        const allowed = allowedCategories(row.items.filter(Boolean) as InfoRequestItemCode[])
        if (!(allowed as string[]).includes(category)) return jsonError(400, 'category_not_requested')

        const rules = attachmentRulesFor('perilex')
        const bytes = new Uint8Array(await file.arrayBuffer())
        const check = validateAttachment({
          filename: file.name,
          declaredType: file.type,
          size: file.size,
          bytes,
          category,
          rules,
        })
        if (!check.ok) return jsonError(400, check.issue)

        // Bestaande bestanden van dit verzoek tellen mee: de limiet begint niet
        // opnieuw bij een nieuwe poging of een nieuw tabblad.
        const { data: siblings } = await supabase
          .from('quote_request_attachments')
          .select('attachment_id, size_bytes, content_hash')
          .eq('draft_id', row.id)
          .eq('status', 'stored')
        const existing = siblings ?? []
        if (existing.some(item => item.attachment_id === attachmentId)) {
          return Response.json({ ok: true, attachmentId, duplicate: true })
        }
        const setCheck = validateAttachmentSet([...existing.map(item => item.size_bytes), file.size], rules)
        if (!setCheck.ok) return jsonError(400, setCheck.issue)

        const hash = await sha256Hex(bytes)
        const same = existing.find(item => item.content_hash === hash)
        if (same) return Response.json({ ok: true, attachmentId: same.attachment_id, duplicate: true })

        const sanitized = sanitizeImageBytes(bytes, check.mime)
        const storeBytes = sanitized.status === 'metadata_stripped' ? sanitized.bytes : bytes
        const storagePath = attachmentStoragePath(row.id, attachmentId, check.mime)

        const { error: uploadError } = await supabase.storage
          .from('quote-attachments')
          .upload(storagePath, storeBytes, { contentType: check.mime, upsert: false })
        if (uploadError) return jsonError(502, 'upload_failed')

        const { error: metaError } = await supabase.from('quote_request_attachments').insert({
          draft_id: row.id,
          info_request_id: row.id,
          attachment_id: attachmentId,
          category,
          original_filename: displayFilename(file.name),
          storage_path: storagePath,
          mime_type: check.mime,
          size_bytes: storeBytes.length,
          content_hash: hash,
          status: 'stored',
          sanitization_status: sanitized.status,
          retention_expires_at: retentionExpiresAt(),
        })
        if (metaError) {
          // Zonder bevestigde rij melden we nooit "ontvangen".
          await supabase.storage.from('quote-attachments').remove([storagePath])
          return jsonError(500, 'store_failed')
        }

        return Response.json({ ok: true, attachmentId, category, size: storeBytes.length })
      },

      DELETE: async ({ request }) => {
        if (!isInfoRequestPublicEnabled()) return jsonError(403, 'disabled')
        if (!sameOrigin(request)) return jsonError(403, 'bad_origin')
        const supabase = adminClient()
        if (!supabase) return jsonError(500, 'server_not_configured')
        const context = await sessionContext(supabase, request)
        if (!context) return jsonError(401, 'no_session')

        const row = context.request
        const access = evaluateAccess({ status: row.status as never, expiresAt: row.expires_at })
        if (!access.ok) return Response.json({ ok: false, code: access.reason }, { status: 410 })

        const attachmentId = new URL(request.url).searchParams.get('attachmentId') ?? ''
        if (!uuidPattern.test(attachmentId)) return jsonError(400, 'invalid_request')

        // Alleen eigen conceptbijlagen: de sessie bepaalt het concept.
        const { data: own } = await supabase
          .from('quote_request_attachments')
          .select('id, storage_path')
          .eq('draft_id', row.id)
          .eq('attachment_id', attachmentId)
          .maybeSingle()
        if (!own) return jsonError(404, 'not_found')

        await supabase.storage.from('quote-attachments').remove([own.storage_path])
        await supabase.from('quote_request_attachments').delete().eq('id', own.id)
        return Response.json({ ok: true })
      },
    },
  },
})
