import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

// Publieke serverfuncties voor de aanmelding van ZZP'ers (op uitnodiging).

export const SPECIALTIES = [
  'Groepenkast vervangen/uitbreiden',
  'Storingen & stroomuitval',
  'Laadpaal installeren',
  'Zonnepanelen / omvormer',
  'Verlichting & wandcontactdozen',
  'Data/netwerk',
  'Inspectie & NEN 3140',
] as const

export const AVAILABILITY = [
  'Maandag t/m vrijdag overdag',
  'Avonden',
  'Weekend',
  'Op afroep / flexibel',
] as const

export const CERTIFICATIONS = [
  'NEN 3140',
  'VCA',
  'Erkend installateur (Techniek Nederland)',
  'Laadpaal-certificering',
  'Zonnepanelen-certificering',
] as const

export const checkInvite = createServerFn({ method: 'GET' })
  .inputValidator((input: unknown) => z.object({ token: z.string().min(8).max(64) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data: invite } = await supabaseAdmin
      .from('contractor_invites')
      .select('id, email, expires_at, used_at')
      .eq('token', data.token)
      .maybeSingle()
    if (!invite) return { valid: false as const, reason: 'unknown' as const }
    if (invite.used_at) return { valid: false as const, reason: 'used' as const }
    if (new Date(invite.expires_at).getTime() < Date.now())
      return { valid: false as const, reason: 'expired' as const }
    return { valid: true as const, email: invite.email }
  })

export const uploadApplicationDocument = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) =>
    z
      .object({
        token: z.string().min(8).max(64),
        filename: z.string().min(1).max(120),
        contentType: z.enum(['image/jpeg', 'image/png', 'application/pdf']),
        dataBase64: z.string().min(10).max(9_000_000),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data: invite } = await supabaseAdmin
      .from('contractor_invites')
      .select('id, used_at, expires_at')
      .eq('token', data.token)
      .maybeSingle()
    if (!invite || invite.used_at || new Date(invite.expires_at).getTime() < Date.now()) {
      throw new Error('Uitnodiging is niet (meer) geldig.')
    }
    const bytes = Buffer.from(data.dataBase64, 'base64')
    if (bytes.byteLength > 5 * 1024 * 1024) throw new Error('Bestand is groter dan 5 MB.')
    const ext =
      data.contentType === 'application/pdf' ? 'pdf' : data.contentType === 'image/png' ? 'png' : 'jpg'
    const path = `contractor-docs/${crypto.randomUUID()}.${ext}`
    const { error } = await supabaseAdmin.storage
      .from('quote-attachments')
      .upload(path, bytes, { contentType: data.contentType, upsert: false })
    if (error) throw new Error(error.message)
    return { path }
  })

const applicationSchema = z.object({
  token: z.string().min(8).max(64),
  company_name: z.string().trim().min(2).max(120),
  contact_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(30),
  email: z.string().trim().email().max(255),
  kvk_number: z.string().trim().min(6).max(20),
  vat_number: z.string().trim().max(30).optional().or(z.literal('')),
  street: z.string().trim().max(160).optional().or(z.literal('')),
  postal_code: z.string().trim().max(12).optional().or(z.literal('')),
  city: z.string().trim().max(80).optional().or(z.literal('')),
  service_areas: z.array(z.string().trim().min(2).max(60)).max(20).default([]),
  travel_radius_km: z.number().int().min(1).max(200).default(25),
  specialties: z.array(z.string().max(80)).max(20).default([]),
  availability: z.array(z.string().max(80)).max(10).default([]),
  emergency_available: z.boolean().default(false),
  certifications: z.array(z.string().max(80)).max(20).default([]),
  certification_notes: z.string().trim().max(1000).optional().or(z.literal('')),
  insurer: z.string().trim().max(120).optional().or(z.literal('')),
  policy_number: z.string().trim().max(80).optional().or(z.literal('')),
  document_paths: z.array(z.string().max(200)).max(5).default([]),
  telegram_username: z.string().trim().max(60).optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
  terms_accepted: z.literal(true),
  hp: z.string().max(0).optional(),
})

export const submitApplication = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => applicationSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data: invite } = await supabaseAdmin
      .from('contractor_invites')
      .select('id, used_at, expires_at')
      .eq('token', data.token)
      .maybeSingle()
    if (!invite || invite.used_at || new Date(invite.expires_at).getTime() < Date.now()) {
      throw new Error('Deze uitnodiging is niet (meer) geldig.')
    }

    const { token, hp: _hp, ...fields } = data
    const { data: application, error } = await supabaseAdmin
      .from('contractor_applications')
      .insert({
        ...fields,
        vat_number: fields.vat_number || null,
        street: fields.street || null,
        postal_code: fields.postal_code || null,
        city: fields.city || null,
        certification_notes: fields.certification_notes || null,
        insurer: fields.insurer || null,
        policy_number: fields.policy_number || null,
        telegram_username: fields.telegram_username || null,
        notes: fields.notes || null,
        invite_id: invite.id,
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString(),
        status: 'new',
      })
      .select('id')
      .single()
    if (error) throw new Error(error.message)

    await supabaseAdmin
      .from('contractor_invites')
      .update({ used_at: new Date().toISOString(), application_id: application.id })
      .eq('id', invite.id)

    // Melding per e-mail en in Telegram.
    const { sendTemplateEmail } = await import('@/lib/email-templates/send-email')
    await sendTemplateEmail('contractor-application', '', {
      idempotencyKey: `application-${application.id}`,
      templateData: {
        company: fields.company_name,
        name: fields.contact_name,
        phone: fields.phone,
        email: fields.email,
        kvk: fields.kvk_number,
        vat: fields.vat_number || '—',
        areas: fields.service_areas.join(', ') || '—',
        radius: `${fields.travel_radius_km} km`,
        specialties: fields.specialties.join(', ') || '—',
        availability: fields.availability.join(', ') || '—',
        certifications: fields.certifications.join(', ') || '—',
        insurance: [fields.insurer, fields.policy_number].filter(Boolean).join(' — ') || '—',
      },
    }).catch((e) => console.error('application email failed', e))

    const tg = await import('@/lib/telegram.server')
    await tg
      .sendMessage({
        chat_id: tg.groupChatId(),
        text: [
          `🧾 <b>Nieuwe ZZP-aanmelding</b>`,
          ``,
          `<b>Bedrijf:</b> ${tg.escapeHtml(fields.company_name)}`,
          `<b>Contact:</b> ${tg.escapeHtml(fields.contact_name)} — ${tg.escapeHtml(fields.phone)}`,
          `<b>KvK:</b> ${tg.escapeHtml(fields.kvk_number)}`,
          `<b>Werkgebied:</b> ${tg.escapeHtml(fields.service_areas.join(', ') || '—')} (${fields.travel_radius_km} km)`,
          `<b>Specialismen:</b> ${tg.escapeHtml(fields.specialties.join(', ') || '—')}`,
          ``,
          `Beoordeel de aanmelding in de backoffice.`,
        ].join('\n'),
      })
      .catch((e) => console.error('application telegram failed', e))

    return { ok: true as const }
  })
