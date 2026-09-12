import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'

import type { Database } from '@/integrations/supabase/types'
import { isBookingServiceActive } from '@/lib/booking/activation'
import {
  attachmentRulesFor,
  attachmentStoragePath,
  displayFilename,
  retentionExpiresAt,
  uuidPattern,
  validateAttachment,
  validateAttachmentSet,
} from '@/lib/booking/attachments'

// ---------------------------------------------------------------------------
// Gecontroleerde upload van één Perilex-bijlage (fase 4).
//
// - De dienst staat op `enabled: false`: dit endpoint weigert elke upload met
//   403 zolang Perilex niet is geactiveerd. Er ontstaat dus nog geen opslag.
// - Uploaden gaat uitsluitend via deze serverlogica; de browser krijgt nooit
//   een storage-sleutel, nooit een publieke URL en nooit een pad dat hij zelf
//   heeft gekozen.
// - Het pad bestaat uitsluitend uit UUID's; de originele bestandsnaam staat
//   alleen in de metadata, niet in het pad.
// ---------------------------------------------------------------------------

function jsonError(status: number, code: string) {
  return Response.json({ ok: false, code }, { status })
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', bytes as unknown as ArrayBuffer)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export const Route = createFileRoute('/api/public/perilex-attachment')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Activatiecontrole vóór alles: geen opslag voor een uitgeschakelde dienst.
        if (!isBookingServiceActive('perilex')) return jsonError(403, 'service_disabled')

        const supabaseUrl = process.env['SUPABASE_URL']
        const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']
        if (!supabaseUrl || !supabaseServiceKey) return jsonError(500, 'server_not_configured')

        let form: FormData
        try {
          form = await request.formData()
        } catch {
          return jsonError(400, 'invalid_request')
        }

        const draftId = String(form.get('draftId') ?? '')
        const attachmentId = String(form.get('attachmentId') ?? '')
        const category = String(form.get('category') ?? '')
        const file = form.get('file')
        if (!uuidPattern.test(draftId) || !uuidPattern.test(attachmentId)) return jsonError(400, 'invalid_request')
        if (!(file instanceof File)) return jsonError(400, 'invalid_request')

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

        const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })

        // Bestaande bijlagen van hetzelfde concept: aantal + totaal bewaken.
        const { data: siblings } = await supabase
          .from('quote_request_attachments')
          .select('attachment_id, size_bytes, content_hash, storage_path, category, original_filename, mime_type')
          .eq('draft_id', draftId)
          .eq('status', 'stored')
        const existing = siblings ?? []
        const already = existing.find(row => row.attachment_id === attachmentId)
        if (already) {
          // Retry na een verloren antwoord: geen tweede bestand, zelfde resultaat.
          return Response.json({ ok: true, attachmentId, duplicate: true })
        }
        const setCheck = validateAttachmentSet([...existing.map(row => row.size_bytes), file.size], rules)
        if (!setCheck.ok) return jsonError(400, setCheck.issue)

        const hash = await sha256Hex(bytes)
        const sameContent = existing.find(row => row.content_hash === hash)
        if (sameContent) {
          return Response.json({ ok: true, attachmentId: sameContent.attachment_id, duplicate: true })
        }

        const storagePath = attachmentStoragePath(draftId, attachmentId, check.mime)
        const { error: uploadError } = await supabase.storage
          .from('quote-attachments')
          .upload(storagePath, bytes, { contentType: check.mime, upsert: false })
        if (uploadError) {
          await supabase.from('quote_request_attachments').insert({
            draft_id: draftId,
            attachment_id: attachmentId,
            category,
            original_filename: displayFilename(file.name),
            storage_path: storagePath,
            mime_type: check.mime,
            size_bytes: file.size,
            content_hash: hash,
            status: 'failed',
            error_code: 'upload_failed',
          })
          return jsonError(502, 'upload_failed')
        }

        const { error: metaError } = await supabase.from('quote_request_attachments').insert({
          draft_id: draftId,
          attachment_id: attachmentId,
          category,
          original_filename: displayFilename(file.name),
          storage_path: storagePath,
          mime_type: check.mime,
          size_bytes: file.size,
          content_hash: hash,
          status: 'stored',
          retention_expires_at: retentionExpiresAt(),
        })
        if (metaError) {
          // Metadata is leidend: zonder rij is het bestand een wees en wordt het
          // opgeruimd. Nooit "foto ontvangen" melden zonder bevestigde opslag.
          await supabase.storage.from('quote-attachments').remove([storagePath])
          return jsonError(500, 'store_failed')
        }

        return Response.json({ ok: true, attachmentId, category, mime: check.mime, size: file.size })
      },
    },
  },
})
