import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { render } from '@react-email/render'
import { z } from 'zod'

import { TEMPLATES } from '@/lib/email-templates/registry'
import type { Database } from '@/integrations/supabase/types'

// ---------------------------------------------------------------------------
// Public endpoint that accepts a multipart form submission from the contact
// form (max 3 image attachments, 20 MB each). It:
//   1. Validates all fields with Zod.
//   2. Validates every attachment on MIME + magic bytes (no spoofed files).
//   3. Uploads attachments to the private `quote-attachments` storage bucket.
//   4. Inserts a row in `quote_requests`.
//   5. Enqueues 2 emails via pgmq: notification to info@voltfix.nl + customer
//      confirmation.
// ---------------------------------------------------------------------------

const MAX_ATTACHMENTS = 3
const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024 // 20 MB
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
])

const SITE_NAME = 'voltfix-amsterdam-web'
const SENDER_DOMAIN = 'notify.voltfix.nl'
const FROM_DOMAIN = 'voltfix.nl'
const OWNER_EMAIL = 'info@voltfix.nl'

const bodySchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .min(8)
    .max(20)
    .regex(/^[0-9+()\s-]+$/),
  email: z.string().trim().toLowerCase().email().max(120),
  postalCode: z
    .string()
    .trim()
    .min(4)
    .max(10)
    .regex(/^[0-9]{4}\s?[A-Za-z]{0,2}$/),
  jobType: z.string().trim().min(1).max(80),
  message: z.string().trim().max(2000).optional().nullable(),
  locale: z.enum(['nl', 'en']).default('nl'),
  sourcePath: z.string().max(200).optional().nullable(),
  hp: z.string().max(0).optional(), // honeypot: must be empty
})

function detectImageMime(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png'
  }
  // WebP: "RIFF" .... "WEBP"
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp'
  }
  // HEIC/HEIF: bytes 4..11 start with "ftyp" and brand contains heic/heix/hevc/mif1/msf1
  if (
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11])
    const heifBrands = ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1', 'heif']
    if (heifBrands.includes(brand)) return 'image/heic'
  }
  return null
}

function extForMime(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'image/heic':
    case 'image/heif':
      return 'heic'
    default:
      return 'bin'
  }
}

function jsonError(status: number, error: string, details?: unknown) {
  return Response.json({ error, details }, { status })
}

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input)
  const buf = await crypto.subtle.digest('SHA-256', enc)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function enqueueEmail(
  supabase: SupabaseClient<Database>,
  opts: {
    templateName: string
    recipient: string
    templateData: Record<string, any>
  },
) {
  const entry = TEMPLATES[opts.templateName]
  if (!entry) throw new Error(`Template not found: ${opts.templateName}`)
  const effectiveRecipient = (entry.to || opts.recipient).toLowerCase()

  // Suppression check
  const { data: suppressed } = await supabase
    .from('suppressed_emails')
    .select('id')
    .eq('email', effectiveRecipient)
    .maybeSingle()
  if (suppressed) return { skipped: true, reason: 'suppressed' as const }

  // Ensure unsubscribe token exists for this recipient
  let unsubscribeToken: string
  const { data: existing } = await supabase
    .from('email_unsubscribe_tokens')
    .select('token, used_at')
    .eq('email', effectiveRecipient)
    .maybeSingle()

  if (existing && !existing.used_at) {
    unsubscribeToken = existing.token as string
  } else if (!existing) {
    unsubscribeToken = generateToken()
    await supabase
      .from('email_unsubscribe_tokens')
      .upsert(
        { token: unsubscribeToken, email: effectiveRecipient },
        { onConflict: 'email', ignoreDuplicates: true },
      )
    const { data: stored } = await supabase
      .from('email_unsubscribe_tokens')
      .select('token')
      .eq('email', effectiveRecipient)
      .maybeSingle()
    unsubscribeToken = (stored?.token as string) ?? unsubscribeToken
  } else {
    // Token used → recipient effectively unsubscribed
    return { skipped: true, reason: 'suppressed' as const }
  }

  const element = React.createElement(entry.component, opts.templateData)
  const html = await render(element)
  const text = await render(element, { plainText: true })
  const subject =
    typeof entry.subject === 'function' ? entry.subject(opts.templateData) : entry.subject
  const messageId = crypto.randomUUID()

  await supabase.from('email_send_log').insert({
    message_id: messageId,
    template_name: opts.templateName,
    recipient_email: effectiveRecipient,
    status: 'pending',
  })

  const { error } = await supabase.rpc('enqueue_email', {
    queue_name: 'transactional_emails',
    payload: {
      message_id: messageId,
      to: effectiveRecipient,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject,
      html,
      text,
      purpose: 'transactional',
      label: opts.templateName,
      idempotency_key: messageId,
      unsubscribe_token: unsubscribeToken,
      queued_at: new Date().toISOString(),
    },
  })

  if (error) {
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: opts.templateName,
      recipient_email: effectiveRecipient,
      status: 'failed',
      error_message: 'Failed to enqueue email',
    })
    return { skipped: false, error }
  }
  return { skipped: false }
}

export const Route = createFileRoute('/api/public/quote-request')({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }),

      POST: async ({ request }) => {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!supabaseUrl || !supabaseServiceKey) {
          return jsonError(500, 'Server configuration error')
        }

        let form: FormData
        try {
          form = await request.formData()
        } catch {
          return jsonError(400, 'Invalid multipart form')
        }

        const raw = {
          name: String(form.get('name') ?? ''),
          phone: String(form.get('phone') ?? ''),
          email: String(form.get('email') ?? ''),
          postalCode: String(form.get('postalCode') ?? ''),
          jobType: String(form.get('jobType') ?? ''),
          message: form.get('message') ? String(form.get('message')) : undefined,
          locale: (form.get('locale') as string) || 'nl',
          sourcePath: form.get('sourcePath') ? String(form.get('sourcePath')) : undefined,
          hp: form.get('hp') ? String(form.get('hp')) : '',
        }

        const parsed = bodySchema.safeParse(raw)
        if (!parsed.success) {
          return jsonError(400, 'Invalid form data', parsed.error.flatten())
        }
        const data = parsed.data

        // Silent success on honeypot hit
        if (raw.hp && raw.hp.length > 0) {
          return Response.json({ success: true })
        }

        // Collect attachments
        const files: File[] = []
        for (const value of form.getAll('attachments')) {
          if (value instanceof File && value.size > 0) files.push(value)
        }
        if (files.length > MAX_ATTACHMENTS) {
          return jsonError(400, `Maximum ${MAX_ATTACHMENTS} attachments allowed`)
        }
        for (const f of files) {
          if (f.size > MAX_ATTACHMENT_BYTES) {
            return jsonError(400, `File "${f.name}" exceeds 20 MB`)
          }
          if (!ALLOWED_MIME.has(f.type)) {
            return jsonError(400, `File type "${f.type}" not allowed for "${f.name}"`)
          }
        }

        const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })

        // Validate & upload attachments (magic-byte check)
        const requestId = crypto.randomUUID()
        const uploadedPaths: string[] = []
        const attachmentLinks: Array<{ url: string; filename: string }> = []

        for (let i = 0; i < files.length; i++) {
          const f = files[i]
          const buf = new Uint8Array(await f.arrayBuffer())
          const detected = detectImageMime(buf)
          if (!detected) {
            return jsonError(400, `File "${f.name}" is not a valid image`)
          }
          const ext = extForMime(detected)
          const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60)
          const objectPath = `${new Date().toISOString().slice(0, 10)}/${requestId}/${i + 1}-${safeName}.${ext}`

          const { error: uploadError } = await supabase.storage
            .from('quote-attachments')
            .upload(objectPath, buf, {
              contentType: detected,
              upsert: false,
            })
          if (uploadError) {
            console.error('Attachment upload failed', uploadError)
            return jsonError(500, 'Attachment upload failed')
          }
          uploadedPaths.push(objectPath)

          const { data: signed } = await supabase.storage
            .from('quote-attachments')
            .createSignedUrl(objectPath, 60 * 60 * 24 * 7) // 7 days
          if (signed?.signedUrl) {
            attachmentLinks.push({ url: signed.signedUrl, filename: safeName })
          }
        }

        // Hash IP for basic abuse tracking (never store raw IP)
        const ipHeader =
          request.headers.get('cf-connecting-ip') ??
          request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
          request.headers.get('x-real-ip') ??
          null
        const ipHash = ipHeader ? await sha256Hex(ipHeader) : null

        // Persist request
        const { data: inserted, error: insertError } = await supabase
          .from('quote_requests')
          .insert({
            name: data.name,
            phone: data.phone,
            email: data.email,
            postal_code: data.postalCode,
            job_type: data.jobType,
            message: data.message ?? null,
            locale: data.locale,
            source_path: data.sourcePath ?? null,
            attachment_paths: uploadedPaths,
            user_agent: request.headers.get('user-agent')?.slice(0, 500) ?? null,
            ip_hash: ipHash,
          })
          .select('id, created_at')
          .single()

        if (insertError) {
          console.error('Failed to insert quote_request', insertError)
          return jsonError(500, 'Failed to save request')
        }

        // Enqueue emails (best-effort — a failure here should not fail the request,
        // because we already stored the lead)
        try {
          await enqueueEmail(supabase, {
            templateName: 'quote-notification',
            recipient: OWNER_EMAIL,
            templateData: {
              name: data.name,
              phone: data.phone,
              email: data.email,
              postalCode: data.postalCode,
              jobType: data.jobType,
              message: data.message ?? undefined,
              locale: data.locale,
              sourcePath: data.sourcePath ?? undefined,
              attachments: attachmentLinks,
              submittedAt: new Date(inserted.created_at as string).toLocaleString('nl-NL', {
                timeZone: 'Europe/Amsterdam',
              }),
            },
          })
        } catch (err) {
          console.error('Owner notification failed', err)
        }

        try {
          await enqueueEmail(supabase, {
            templateName: 'quote-confirmation',
            recipient: data.email,
            templateData: {
              name: data.name,
              jobType: data.jobType,
              message: data.message ?? undefined,
              postalCode: data.postalCode,
              attachmentsCount: uploadedPaths.length,
              locale: data.locale,
            },
          })
        } catch (err) {
          console.error('Customer confirmation failed', err)
        }

        return Response.json({ success: true, id: inserted.id })
      },
    },
  },
})
