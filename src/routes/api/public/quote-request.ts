import { createFileRoute } from '@tanstack/react-router'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

import { business } from '@/lib/business'
import { sendTemplateEmail } from '@/lib/email-templates/send-email'
import { checkSpam } from '@/lib/spam-filter'
import { createAndDispatchLead, storeBlockedSpamLead } from '@/lib/leads-intake.server'

import type { Database } from '@/integrations/supabase/types'
import { groupBookingMessage, groupBookingSchema, groupMomentIds, groupMoments, type GroupBooking } from '@/lib/groepenkast'
import {
  isBookingIntent,
  isBookingServiceActive,
  postalAreaOf,
  priceCatalogVersion,
  recalculateGroepenkastPrice,
  type PriceSnapshot,
} from '@/lib/booking/activation'

// ---------------------------------------------------------------------------
// Public endpoint that accepts a multipart form submission from the contact
// form (max 3 image attachments, 20 MB each). It:
//   1. Validates all fields with Zod.
//   2. Validates every attachment on MIME + magic bytes (no spoofed files).
//   3. Uploads attachments to the private `quote-attachments` storage bucket.
//   4. Inserts a row in `quote_requests`.
//   5. Sends 2 emails: notification to the owner inbox + customer confirmation.
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

const OWNER_EMAIL = business.email


const bodySchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .min(8)
    .max(20)
    .regex(/^[0-9+()\s-]+$/),
  email: z
    .union([z.string().trim().toLowerCase().email().max(120), z.literal('')])
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  postalCode: z
    .union([
      z
        .string()
        .trim()
        .min(4)
        .max(10)
        .regex(/^[0-9]{4}\s?[A-Za-z]{0,2}$/),
      z.literal(''),
    ])
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),

  jobType: z.string().trim().min(1).max(80),
  message: z.string().trim().max(2000).optional().nullable(),
  locale: z.enum(['nl', 'en']).default('nl'),
  sourcePath: z.string().max(200).optional().nullable(),
  appointmentDate: z.string().trim().max(120).optional().nullable(),
  appointmentSlot: z.string().trim().max(60).optional().nullable(),
  appointmentNote: z.string().trim().max(120).optional().nullable(),
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

// Cloudflare Turnstile server-side verificatie. Geeft true terug als de secret
// key niet geconfigureerd is (fail-open tot de sleutels zijn ingesteld).
async function verifyTurnstile(token: string, ip: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
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

async function logSend(
  supabase: SupabaseClient<Database>,
  row: {
    template_name: string
    recipient_email: string
    status: 'sent' | 'suppressed' | 'failed'
    error_message?: string
  },
) {
  const { error } = await supabase.from('email_send_log').insert({
    message_id: null,
    template_name: row.template_name,
    recipient_email: row.recipient_email,
    status: row.status,
    error_message: row.error_message ?? null,
  })
  if (error) {
    console.error('Failed to write email send log', {
      code: error.code,
      message: error.message,
    })
  }
}

async function sendEmail(
  supabase: SupabaseClient<Database>,
  opts: {
    templateName: string
    recipient: string
    idempotencyKey: string
    templateData: Record<string, any>
  },
) {
  const recipient = opts.recipient.toLowerCase()
  try {
    const result = await sendTemplateEmail(opts.templateName, recipient, {
      templateData: opts.templateData,
      idempotencyKey: opts.idempotencyKey,
    })

    if (result.sent) {
      await logSend(supabase, {
        template_name: opts.templateName,
        recipient_email: recipient,
        status: 'sent',
      })
      return { skipped: false }
    }

    await logSend(supabase, {
      template_name: opts.templateName,
      recipient_email: recipient,
      status: 'suppressed',
    })
    return { skipped: true, reason: 'suppressed' as const }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await logSend(supabase, {
      template_name: opts.templateName,
      recipient_email: recipient,
      status: 'failed',
      error_message: message.slice(0, 1000),
    })
    throw err
  }
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
          appointmentDate: form.get('appointmentDate') ? String(form.get('appointmentDate')) : undefined,
          appointmentSlot: form.get('appointmentSlot') ? String(form.get('appointmentSlot')) : undefined,
          appointmentNote: form.get('appointmentNote') ? String(form.get('appointmentNote')) : undefined,
          hp: form.get('hp') ? String(form.get('hp')) : '',
          turnstileToken: form.get('turnstileToken') ? String(form.get('turnstileToken')) : '',
        }

        const parsed = bodySchema.safeParse(raw)
        if (!parsed.success) {
          return jsonError(400, 'Invalid form data', parsed.error.flatten())
        }
        const data = parsed.data

        // Package IDs, not client-supplied totals, determine the guide price.
        // Keep the existing intake, email, private uploads and spam checks intact.
        let groupBooking: GroupBooking | null = null
        let bookingServiceId: string | null = null
        let bookingIntentId: string | null = null
        let priceSnapshot: PriceSnapshot | null = null
        const groupRaw = form.get('groupBooking')
        if (groupRaw !== null) {
          try {
            groupBooking = groupBookingSchema.parse(JSON.parse(String(groupRaw)))
          } catch {
            return jsonError(400, data.locale === 'en' ? 'Please check your package, address and preferred time.' : 'Controleer je pakket, adres en voorkeursmoment.')
          }
          if (!data.email) return jsonError(400, data.locale === 'en' ? 'Email is required for your price check.' : 'E-mail is verplicht voor je prijscontrole.')

          // Activatiecontrole: alleen diensten die in de centrale registry op
          // `enabled` staan mogen publiek aangevraagd worden.
          const rawService = String(form.get('bookingService') ?? 'groepenkast').slice(0, 40)
          if (!isBookingServiceActive(rawService)) {
            return jsonError(
              403,
              data.locale === 'en'
                ? 'This service cannot be booked online yet. Please call or send a message.'
                : 'Deze dienst is nog niet online aan te vragen. Bel of stuur een bericht.',
            )
          }
          bookingServiceId = rawService
          const rawIntent = String(form.get('bookingIntent') ?? '').slice(0, 40)
          bookingIntentId = isBookingIntent(rawIntent) ? rawIntent : null

          // Bedragen worden altijd server-side herberekend uit pakket- en
          // optie-ID's. Clientbedragen zijn nooit doorslaggevend.
          priceSnapshot = recalculateGroepenkastPrice({
            packageId: groupBooking.packageId,
            optionIds: groupBooking.optionIds,
            photoReview: groupBooking.photoReview,
          })

          data.postalCode = groupBooking.postalCode.toUpperCase()
          data.jobType = data.locale === 'en' ? 'Fuse box replacement — price check' : 'Groepenkast vervangen — prijscontrole'
          data.message = [
            groupBookingMessage(groupBooking, data.locale),
            `${data.locale === 'en' ? 'Service' : 'Dienst'}: ${bookingServiceId}${bookingIntentId ? ` · ${data.locale === 'en' ? 'intent' : 'intentie'}: ${bookingIntentId}` : ''}`,
          ].join('\n')
          data.appointmentDate = groupBooking.preferredDate
          data.appointmentSlot = groupMoments[data.locale][groupMomentIds.indexOf(groupBooking.preferredMoment)]
          data.appointmentNote = data.locale === 'en' ? 'Preference only; confirm after price review.' : 'Voorkeur; bevestigen na prijscontrole.'
        }

        // Silent success on honeypot hit
        if (raw.hp && raw.hp.length > 0) {
          return Response.json({ success: true })
        }

        // Spamfilter: Zuidoost-Aziatische nummers, SEO/backlink/review-spam en
        // links in het bericht worden geweigerd. Toegestaan: NL, UK, EU, VS, CA.
        const spam = checkSpam({
          name: data.name,
          phone: data.phone,
          email: data.email,
          message: data.message,
          jobType: data.jobType,
        })
        if (spam.spam) {
          console.warn('Quote request blocked by spam filter', spam.reason)
          // Stil opslaan met status 'blocked_spam': geen Telegram-dispatch en
          // geen e-mails, maar wel een succesantwoord richting de afzender.
          await storeBlockedSpamLead(
            {
              name: data.name,
              phone: data.phone,
              email: data.email ?? null,
              postalCode: data.postalCode ?? null,
              jobType: data.jobType,
              description: data.message ?? null,
              source: 'website_form',
              sourcePath: data.sourcePath ?? null,
            },
            spam.reason,
          )
          return Response.json({ success: true })
        }


        // Turnstile anti-spam verificatie (actief zodra TURNSTILE_SECRET_KEY is ingesteld)
        const turnstileIp =
          request.headers.get('cf-connecting-ip') ??
          request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
          null
        const turnstileOk = await verifyTurnstile(raw.turnstileToken, turnstileIp)
        if (!turnstileOk) {
          return jsonError(
            400,
            data.locale === 'en'
              ? 'The anti-spam check failed. Refresh the page and try again.'
              : 'De anti-spamcontrole is mislukt. Ververs de pagina en probeer opnieuw.',
          )
        }

        // Collect attachments
        const files: File[] = []
        for (const value of form.getAll('attachments')) {
          if (value instanceof File && value.size > 0) files.push(value)
        }
        if (files.length > MAX_ATTACHMENTS) {
          return jsonError(400, `Maximum ${MAX_ATTACHMENTS} attachments allowed`)
        }
        if (groupBooking?.photoReview === 'photo' && files.length === 0) {
          return jsonError(400, data.locale === 'en' ? 'Add a photo or request a site inspection.' : 'Voeg een foto toe of vraag een schouw aan.')
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
        const leadImagePaths: string[] = []
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

          // Kopie in de leadbucket, zodat de monteur de foto's in Telegram ziet.
          if (detected === 'image/jpeg' || detected === 'image/png' || detected === 'image/webp') {
            const { error: leadUploadError } = await supabase.storage
              .from('lead-attachments')
              .upload(objectPath, buf, { contentType: detected, upsert: false })
            if (leadUploadError) {
              console.error('Lead attachment upload failed', leadUploadError)
            } else {
              leadImagePaths.push(objectPath)
            }
          }


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
            street: groupBooking?.street ?? null,
            house_number: groupBooking?.houseNumber ?? null,
            city: groupBooking?.city ?? null,
            job_type: data.jobType,
            message: data.message ?? null,
            locale: data.locale,
            source_path: data.sourcePath ?? null,
            appointment_date: data.appointmentDate ?? null,
            appointment_slot: data.appointmentSlot ?? null,
            appointment_note: data.appointmentNote ?? null,
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

        // Send emails (best-effort — a failure here should not fail the request,
        // because we already stored the lead)
        try {
          await sendEmail(supabase, {
            templateName: 'quote-notification',
            recipient: OWNER_EMAIL,
            idempotencyKey: `quote-notification-${inserted.id}`,

            templateData: {
              name: data.name,
              phone: data.phone,
              email: data.email ?? undefined,
              postalCode: data.postalCode ?? undefined,
              jobType: data.jobType,
              message: data.message ?? undefined,
              locale: data.locale,
              sourcePath: data.sourcePath ?? undefined,
              appointmentDate: data.appointmentDate ?? undefined,
              appointmentSlot: data.appointmentSlot ?? undefined,
              appointmentNote: data.appointmentNote ?? undefined,
              attachments: attachmentLinks,
              submittedAt: new Date(inserted.created_at as string).toLocaleString('nl-NL', {
                timeZone: 'Europe/Amsterdam',
              }),
            },
          })
        } catch (err) {
          console.error('Owner notification failed', err)
        }

        // Klantbevestiging alleen bij een echt e-mailadres (nooit een placeholder).
        if (data.email) {
          try {
            await sendEmail(supabase, {
              templateName: 'quote-confirmation',
              recipient: data.email,
              idempotencyKey: `quote-confirmation-${inserted.id}`,

              templateData: {
                name: data.name,
                jobType: data.jobType,
                message: data.message ?? undefined,
                postalCode: data.postalCode ?? undefined,
                attachmentsCount: uploadedPaths.length,
                locale: data.locale,
                appointmentDate: data.appointmentDate ?? undefined,
                appointmentSlot: data.appointmentSlot ?? undefined,
                appointmentNote: data.appointmentNote ?? undefined,
              },
            })
          } catch (err) {
            console.error('Customer confirmation failed', err)
          }
        }

        // Lead aanmaken + direct doorsturen naar de Telegram-groep.
        // Fouten hier mogen de aanvraag nooit laten mislukken.
        try {
          const isUrgent =
            /spoed|storing|urgent|emergency/i.test(data.jobType) ||
            /spoed|storing|urgent|emergency/i.test(data.message ?? '')
          await createAndDispatchLead({
            name: data.name,
            phone: data.phone,
            email: data.email,
            postalCode: data.postalCode,
            address: groupBooking ? `${groupBooking.street} ${groupBooking.houseNumber}, ${groupBooking.postalCode.toUpperCase()}` : null,
            city: groupBooking?.city ?? null,
            jobType: data.jobType,
            description: [
              data.message,
              data.appointmentDate
                ? `Voorkeur: ${data.appointmentDate}${data.appointmentSlot ? ` · ${data.appointmentSlot}` : ''}`
                : null,
              uploadedPaths.length ? `${uploadedPaths.length} foto('s) meegestuurd` : null,
            ]
              .filter(Boolean)
              .join('\n'),
            isUrgent,
            source: data.appointmentDate ? 'booking_form' : 'website_form',
            sourcePath: data.sourcePath ?? null,
            imagePaths: leadImagePaths,

          })
        } catch (err) {
          console.error('Lead intake from quote request failed', err)
        }

        return Response.json({ success: true, id: inserted.id })

      },
    },
  },
})
