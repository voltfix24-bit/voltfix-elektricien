/**
 * Centrale leadintake voor externe frontends (bijv. groepenkast.app).
 *
 * Beveiliging: per frontend een eigen API-sleutel in een secret. Zonder geldige
 * sleutel: 401 en een logregel. Verder exact dezelfde molen als een handmatig
 * ingevoerde lead: Telegram-groepsbericht, claimregels, saldocontrole en
 * privélevering.
 */

import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { createAndDispatchLead } from '@/lib/leads-intake.server'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key, Authorization',
}

/** Welke bron welke sleutel gebruikt. Per frontend een eigen secret. */
const SOURCE_KEYS: Record<string, string> = {
  'groepenkast.app': 'INTAKE_API_KEY_GROEPENKAST',
  'voltfix.nl': 'INTAKE_API_KEY_VOLTFIX',
}

const MAX_PHOTOS = 3
const MAX_PHOTO_BYTES = 5 * 1024 * 1024
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

const photoSchema = z.object({
  filename: z.string().trim().max(120).optional(),
  contentType: z.enum(PHOTO_TYPES),
  dataBase64: z.string().min(16).max(9_000_000),
})

const bodySchema = z.object({
  source: z.string().trim().min(2).max(60),
  externalRef: z.string().trim().min(3).max(120),
  jobType: z.string().trim().min(2).max(120),
  isTest: z.boolean().default(false),
  locale: z.enum(['nl', 'en']).default('nl'),
  isUrgent: z.boolean().default(false),
  customer: z.object({
    name: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(6).max(40),
    email: z.string().trim().email().max(160).optional().nullable(),
    street: z.string().trim().max(160).optional().nullable(),
    houseNumber: z.string().trim().max(20).optional().nullable(),
    postalCode: z.string().trim().max(16).optional().nullable(),
    city: z.string().trim().max(80).optional().nullable(),
  }),
  job: z
    .object({
      quoteKind: z.enum(['package', 'photo', 'survey']).optional().nullable(),
      packageName: z.string().trim().max(120).optional().nullable(),
      basePriceCents: z.number().int().min(0).max(1_000_000).optional().nullable(),
      options: z
        .array(z.object({ label: z.string().trim().min(1).max(120), priceCents: z.number().int().min(0).max(1_000_000) }))
        .max(30)
        .optional()
        .nullable(),
      totalPriceCents: z.number().int().min(0).max(1_000_000).optional().nullable(),
      preferredDate: z.string().trim().max(40).optional().nullable(),
      preferredPart: z.string().trim().max(40).optional().nullable(),
      note: z.string().trim().max(4000).optional().nullable(),
    })
    .default({}),
  photos: z.array(photoSchema).max(MAX_PHOTOS).optional(),
})

type Body = z.infer<typeof bodySchema>

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return Response.json({ error: code, message, details }, { status, headers: CORS })
}

/** Korte installatievoorkeur; de keuzes zelf staan in losse velden. */
function installPreference(data: Body): string | null {
  const job = data.job ?? {}
  const value = [job.preferredDate, job.preferredPart].filter(Boolean).join(' · ').trim()
  return value || null
}

/** Slaat de meegestuurde foto's op in de eigen afgeschermde opslag. */
async function storePhotos(photos: Body['photos']): Promise<string[]> {
  if (!photos || photos.length === 0) return []
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const paths: string[] = []
  for (const photo of photos.slice(0, MAX_PHOTOS)) {
    let bytes: Uint8Array
    try {
      const binary = atob(photo.dataBase64.replace(/^data:[^,]+,/, ''))
      bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    } catch {
      throw new Error('photo_decode_failed')
    }
    if (bytes.byteLength > MAX_PHOTO_BYTES) throw new Error('photo_too_large')
    const ext = photo.contentType === 'image/png' ? 'png' : photo.contentType === 'image/webp' ? 'webp' : 'jpg'
    const path = `whatsapp/${crypto.randomUUID()}.${ext}`
    const { error } = await supabaseAdmin.storage
      .from('lead-attachments')
      .upload(path, bytes, { contentType: photo.contentType, upsert: false })
    if (error) {
      console.error('intake photo upload failed', error)
      throw new Error('photo_upload_failed')
    }
    paths.push(path)
  }
  return paths
}

export const Route = createFileRoute('/api/public/leads/intake')({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),

      POST: async ({ request }) => {
        let raw: unknown
        try {
          raw = await request.json()
        } catch {
          return jsonError(400, 'invalid_json', 'De body is geen geldige JSON.')
        }

        const parsed = bodySchema.safeParse(raw)
        if (!parsed.success) {
          return jsonError(422, 'invalid_payload', 'Een of meer velden kloppen niet.', parsed.error.flatten())
        }
        const data = parsed.data

        const presented =
          request.headers.get('x-api-key') ??
          request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
          ''
        const secretName = SOURCE_KEYS[data.source]
        const expected = secretName ? process.env[secretName] : undefined
        const ip =
          request.headers.get('cf-connecting-ip') ??
          request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
          null
        if (!secretName || !expected || !presented || presented !== expected) {
          console.warn('Lead intake geweigerd', { source: data.source, ip, reason: !secretName ? 'unknown_source' : !expected ? 'no_key_configured' : 'bad_key' })
          return jsonError(401, 'unauthorized', 'Ongeldige of ontbrekende API-sleutel voor deze bron.')
        }

        const address = [data.customer.street, data.customer.houseNumber].filter(Boolean).join(' ').trim() || null

        let imagePaths: string[] = []
        try {
          imagePaths = await storePhotos(data.photos)
        } catch (error) {
          const code = error instanceof Error ? error.message : 'photo_upload_failed'
          return jsonError(code === 'photo_too_large' ? 413 : 400, code, 'De meegestuurde foto kon niet worden opgeslagen.')
        }

        let created: { id: string } | null = null
        try {
          created = await createAndDispatchLead({
            name: data.customer.name,
            phone: data.customer.phone,
            email: data.customer.email ?? null,
            postalCode: data.customer.postalCode ?? null,
            address,
            city: data.customer.city ?? null,
            jobType: data.jobType,
            description: data.job?.note?.trim() || null,
            isUrgent: data.isUrgent,
            source: data.source,
            sourcePath: null,
            imagePaths,
            locale: data.locale,
            externalRef: `${data.source}:${data.externalRef}`,
            isTest: data.isTest,
            customerPriceCents: data.job?.totalPriceCents ?? null,
            quoteKind: data.job?.quoteKind ?? null,
            quotePackage: data.job?.packageName ?? null,
            quoteOptions: (data.job?.options ?? []).filter((option) => option.priceCents > 0),
            quoteBasePriceCents: data.job?.basePriceCents ?? null,
            installPreference: installPreference(data),
          })
        } catch (error) {
          console.error('Lead intake failed', error)
          return jsonError(500, 'intake_failed', 'De aanvraag kon niet worden vastgelegd.')
        }

        if (!created) return jsonError(500, 'intake_failed', 'De aanvraag kon niet worden vastgelegd.')

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const { data: row } = await supabaseAdmin
          .from('leads')
          .select('ref_number, status, is_test')
          .eq('id', created.id)
          .maybeSingle()

        return Response.json(
          {
            success: true,
            id: created.id,
            refNumber: row?.ref_number ?? null,
            status: row?.status ?? 'new',
            isTest: Boolean(row?.is_test),
          },
          { headers: CORS },
        )
      },
    },
  },
})
