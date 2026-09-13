import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'

import type { Database } from '@/integrations/supabase/types'
import { displayFilename, uuidPattern } from '@/lib/booking/attachments'

// ---------------------------------------------------------------------------
// Gecontroleerde download van één bijlage — uitsluitend voor beheerders.
//
// - Authenticatie via het bearer-token van de ingelogde sessie; daarna een
//   expliciete rolcontrole (`has_role`). Alleen lezen geeft geen toegang.
// - PDF's worden NOOIT inline uitgevoerd: altijd
//   `Content-Disposition: attachment` en `X-Content-Type-Options: nosniff`.
// - Het permanente opslagpad verlaat de server nooit; de browser krijgt bytes.
// - Elke download wordt gelogd zonder de tijdelijke link op te slaan.
// ---------------------------------------------------------------------------

function jsonError(status: number, code: string) {
  return Response.json({ ok: false, code }, { status })
}

export const Route = createFileRoute('/api/admin/attachment')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supabaseUrl = process.env['SUPABASE_URL']
        const publishableKey = process.env['SUPABASE_PUBLISHABLE_KEY']
        const serviceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']
        if (!supabaseUrl || !publishableKey || !serviceKey) return jsonError(500, 'server_not_configured')

        const authHeader = request.headers.get('authorization') ?? ''
        const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : ''
        if (!token) return jsonError(401, 'unauthorized')

        const asUser = createClient<Database>(supabaseUrl, publishableKey, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: `Bearer ${token}` } },
        })
        const { data: userData, error: userError } = await asUser.auth.getUser(token)
        if (userError || !userData?.user) return jsonError(401, 'unauthorized')

        const { data: isAdmin, error: roleError } = await asUser.rpc('has_role', {
          _user_id: userData.user.id,
          _role: 'admin',
        })
        if (roleError) return jsonError(500, 'role_check_failed')
        if (!isAdmin) return jsonError(403, 'forbidden')

        let body: { attachmentRowId?: unknown }
        try {
          body = (await request.json()) as { attachmentRowId?: unknown }
        } catch {
          return jsonError(400, 'invalid_request')
        }
        const rowId = String(body.attachmentRowId ?? '')
        if (!uuidPattern.test(rowId)) return jsonError(400, 'invalid_request')

        const admin = createClient<Database>(supabaseUrl, serviceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
        const { data: row, error } = await admin
          .from('quote_request_attachments')
          .select('id, attachment_id, quote_request_id, storage_bucket, storage_path, mime_type, original_filename, status')
          .eq('id', rowId)
          .maybeSingle()
        if (error) return jsonError(500, 'lookup_failed')
        if (!row || row.status !== 'stored') return jsonError(404, 'not_found')

        const file = await admin.storage.from(row.storage_bucket).download(row.storage_path)
        if (file.error || !file.data) return jsonError(404, 'not_found')
        const bytes = new Uint8Array(await file.data.arrayBuffer())

        await admin.from('attachment_access_log').insert({
          attachment_id: row.attachment_id,
          quote_request_id: row.quote_request_id,
          actor_id: userData.user.id,
          action: 'download',
        })

        const safeName = displayFilename(row.original_filename ?? 'bijlage')
        return new Response(bytes as unknown as BodyInit, {
          status: 200,
          headers: {
            // Nooit inline uitvoeren, ook geen PDF-viewer.
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${safeName.replace(/"/g, '')}"`,
            'X-Content-Type-Options': 'nosniff',
            'Cache-Control': 'no-store',
            'Content-Security-Policy': "default-src 'none'; sandbox",
          },
        })
      },
    },
  },
})
