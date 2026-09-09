import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

async function assertAdmin(context: any) {
  const { data, error } = await context.supabase.rpc('has_role', {
    _user_id: context.userId,
    _role: 'admin',
  })
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Geen beheerdersrechten.')
}

export const getIsAdmin = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc('has_role', {
      _user_id: context.userId,
      _role: 'admin',
    })
    return { isAdmin: Boolean(data), userId: context.userId }
  })

/* ---------------- Contractors ---------------- */

export const listContractors = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const { data, error } = await context.supabase
      .from('contractors')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data ?? []
  })

const contractorInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2),
  company: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  telegram_user_id: z.union([z.number(), z.string(), z.null()]).optional(),
  is_active: z.boolean().default(true),
  notes: z.string().optional().nullable(),
})

export const saveContractor = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => contractorInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const tgRaw = data.telegram_user_id
    const telegram_user_id =
      tgRaw === null || tgRaw === undefined || tgRaw === '' ? null : Number(tgRaw)
    if (telegram_user_id !== null && !Number.isFinite(telegram_user_id)) {
      throw new Error('Telegram-ID moet een getal zijn.')
    }
    const payload = {
      name: data.name,
      company: data.company || null,
      phone: data.phone || null,
      email: data.email || null,
      telegram_user_id,
      is_active: data.is_active,
      notes: data.notes || null,
    }
    if (data.id) {
      const { error } = await context.supabase.from('contractors').update(payload).eq('id', data.id)
      if (error) throw new Error(error.message)
      return { id: data.id }
    }
    const { data: row, error } = await context.supabase
      .from('contractors')
      .insert(payload)
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    return { id: row.id }
  })

export const adjustBalance = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        contractorId: z.string().uuid(),
        amountCents: z.number().int(),
        note: z.string().max(200).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { data: balance, error } = await context.supabase.rpc('adjust_contractor_balance', {
      _contractor_id: data.contractorId,
      _amount_cents: data.amountCents,
      _note: data.note ?? '',
    })
    if (error) throw new Error(error.message)
    return { balanceCents: balance as number }
  })

export const listTransactions = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ contractorId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { data: rows, error } = await context.supabase
      .from('contractor_transactions')
      .select('*')
      .eq('contractor_id', data.contractorId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw new Error(error.message)
    return rows ?? []
  })

/* ---------------- Leads ---------------- */

export const listLeads = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const { data, error } = await context.supabase
      .from('leads')
      .select('*, contractors:claimed_by (name, company)')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) throw new Error(error.message)
    return data ?? []
  })

const leadInput = z.object({
  customer_name: z.string().min(2),
  customer_phone: z.string().min(6),
  customer_email: z.string().optional().nullable(),
  postal_code: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  job_type: z.string().min(2),
  description: z.string().optional().nullable(),
  price_cents: z.number().int().min(0).max(100000),
  dispatch: z.boolean().default(false),
  source: z.string().max(40).optional(),
  image_urls: z.array(z.string().max(300)).max(3).optional(),
  price_status: z.enum(['none', 'hourly', 'fixed']).default('none'),
  agreed_price_details: z.string().max(160).optional().nullable(),
})

export const createLead = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => leadInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { dispatch, source, image_urls, ...fields } = data
    const { data: row, error } = await context.supabase
      .from('leads')
      .insert({
        ...fields,
        customer_email: fields.customer_email || null,
        postal_code: fields.postal_code || null,
        address: fields.address || null,
        city: fields.city || null,
        description: fields.description || null,
        source: source || 'admin',
        image_urls: image_urls ?? [],
      })
      .select('*')
      .single()
    if (error) throw new Error(error.message)
    if (dispatch) {
      await dispatchToTelegram(row, context)
    }
    return { id: row.id }
  })

/**
 * Foto uit een WhatsApp-gesprek opslaan in de afgeschermde bucket.
 * De browser stuurt de afbeelding als base64; wij bewaren alleen het pad.
 */
export const uploadLeadImage = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        filename: z.string().min(1).max(120),
        contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
        dataBase64: z.string().min(10).max(9_000_000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const bytes = Buffer.from(data.dataBase64, 'base64')
    if (bytes.byteLength > 5 * 1024 * 1024) throw new Error('Foto is groter dan 5 MB.')
    const ext = data.contentType === 'image/png' ? 'png' : data.contentType === 'image/webp' ? 'webp' : 'jpg'
    const path = `whatsapp/${crypto.randomUUID()}.${ext}`
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { error } = await supabaseAdmin.storage
      .from('lead-attachments')
      .upload(path, bytes, { contentType: data.contentType, upsert: false })
    if (error) throw new Error(error.message)
    return { path }
  })


export const dispatchLead = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ leadId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { data: row, error } = await context.supabase
      .from('leads')
      .select('*')
      .eq('id', data.leadId)
      .single()
    if (error) throw new Error(error.message)
    if (row.status === 'claimed') throw new Error('Deze lead is al geclaimd.')
    await dispatchToTelegram(row, context)
    return { ok: true }
  })

/* ---------------- Lead settings ---------------- */

export const getLeadSettings = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const { data, error } = await context.supabase
      .from('lead_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data ?? { id: 1, default_price_cents: 1000, urgent_price_cents: 1000 }
  })

export const updateLeadSettings = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        default_price_cents: z.number().int().min(0).max(100000),
        urgent_price_cents: z.number().int().min(0).max(100000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { error } = await context.supabase
      .from('lead_settings')
      .upsert({ id: 1, ...data })
    if (error) throw new Error(error.message)
    return { ok: true }
  })


export const cancelLead = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ leadId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { error } = await context.supabase
      .from('leads')
      .update({ status: 'cancelled' })
      .eq('id', data.leadId)
      .neq('status', 'claimed')
    if (error) throw new Error(error.message)
    return { ok: true }
  })

async function dispatchToTelegram(row: any, context: any) {
  const { dispatchLeadToGroup } = await import('@/lib/lead-dispatch.server')
  const messageId = await dispatchLeadToGroup(row)

  const { error } = await context.supabase
    .from('leads')
    .update({
      status: 'dispatched',
      telegram_message_id: messageId,

      dispatched_at: new Date().toISOString(),
    })
    .eq('id', row.id)
  if (error) throw new Error(error.message)
}

/* ---------------- Telegram setup ---------------- */

export const registerTelegramWebhook = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ origin: z.string().url() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const token = process.env['TELEGRAM_BOT_TOKEN']
    const secret = process.env['TELEGRAM_WEBHOOK_SECRET']
    if (!token || !secret) throw new Error('Telegram-instellingen ontbreken.')
    const url = `${data.origin.replace(/\/$/, '')}/api/public/telegram/webhook`
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        secret_token: secret,
        allowed_updates: ['callback_query', 'message'],
      }),
    })
    const body = await res.text()
    if (!res.ok) throw new Error(`Telegram setWebhook mislukt [${res.status}]: ${body}`)
    const json = JSON.parse(body)
    if (json.ok === false) throw new Error(`Telegram setWebhook mislukt: ${body}`)
    return { url }
  })

export const sendTelegramTest = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const tg = await import('@/lib/telegram.server')
    await tg.sendMessage({
      chat_id: tg.groupChatId(),
      text: '✅ VoltFix leadbot is verbonden met deze groep.',
    })
    return { ok: true }
  })

/* ---------------- Adres opzoeken (PDOK, gratis) ---------------- */

export const lookupAddress = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        postcode: z.string().min(6).max(10),
        houseNumber: z.string().min(1).max(10),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const pc = data.postcode.replace(/\s+/g, '').toUpperCase()
    if (!/^[1-9][0-9]{3}[A-Z]{2}$/.test(pc)) throw new Error('Ongeldige postcode.')
    const q = encodeURIComponent(`${pc} ${data.houseNumber.trim()}`)
    const url =
      `https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?q=${q}` +
      `&fq=type:adres&rows=1&fl=straatnaam,woonplaatsnaam,huis_nlt,postcode`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(`Adresdienst gaf ${res.status}`)
    const body: any = await res.json()
    const doc = body?.response?.docs?.[0]
    if (!doc) throw new Error('Geen adres gevonden bij deze postcode en huisnummer.')
    return {
      street: String(doc.straatnaam ?? ''),
      city: String(doc.woonplaatsnaam ?? ''),
      houseNumber: String(doc.huis_nlt ?? data.houseNumber),
    }
  })

/* ---------------- ZZP-aanmeldingen (op uitnodiging) ---------------- */

export const createInvite = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        email: z.string().trim().email().max(255).optional().or(z.literal('')),
        note: z.string().trim().max(200).optional().or(z.literal('')),
        days: z.number().int().min(1).max(180).default(30),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const token = crypto.randomUUID().replace(/-/g, '')
    const expires = new Date(Date.now() + data.days * 24 * 60 * 60 * 1000).toISOString()
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data: invite, error } = await supabaseAdmin
      .from('contractor_invites')
      .insert({
        token,
        email: data.email || null,
        note: data.note || null,
        expires_at: expires,
      })
      .select('*')
      .single()
    if (error) throw new Error(error.message)
    return invite
  })

export const listInvites = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const { data, error } = await context.supabase
      .from('contractor_invites')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw new Error(error.message)
    return data ?? []
  })

export const listApplications = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const { data, error } = await context.supabase
      .from('contractor_applications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw new Error(error.message)
    return data ?? []
  })

export const getApplicationDocumentUrls = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ paths: z.array(z.string().max(200)).max(5) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const urls: string[] = []
    for (const path of data.paths) {
      const { data: signed } = await supabaseAdmin.storage
        .from('quote-attachments')
        .createSignedUrl(path, 60 * 30)
      if (signed?.signedUrl) urls.push(signed.signedUrl)
    }
    return { urls }
  })

export const decideApplication = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        applicationId: z.string().uuid(),
        decision: z.enum(['approved', 'rejected']),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data: app, error } = await supabaseAdmin
      .from('contractor_applications')
      .select('*')
      .eq('id', data.applicationId)
      .single()
    if (error) throw new Error(error.message)

    if (data.decision === 'rejected') {
      await supabaseAdmin
        .from('contractor_applications')
        .update({ status: 'rejected' })
        .eq('id', app.id)
      return { ok: true as const }
    }

    let contractorId = app.contractor_id as string | null
    if (!contractorId) {
      const { data: created, error: cErr } = await supabaseAdmin
        .from('contractors')
        .insert({
          name: app.contact_name,
          company: app.company_name,
          phone: app.phone,
          email: app.email,
          iban: app.iban ?? null,
          invoice_email: app.invoice_email ?? null,
          telegram_user_id: app.telegram_user_id ?? null,
          balance_cents: 5000,
          notes: [
            `KvK ${app.kvk_number}`,
            app.vat_number ? `Btw ${app.vat_number}` : null,
            app.iban ? `IBAN ${app.iban}` : null,
            app.service_areas?.length ? `Werkgebied: ${app.service_areas.join(', ')}` : null,
            `Straal: ${app.travel_radius_km} km`,
            app.specialties?.length ? `Specialismen: ${app.specialties.join(', ')}` : null,
            app.certifications?.length ? `Certificeringen: ${app.certifications.join(', ')}` : null,
            app.insurer ? `Verzekering: ${app.insurer} ${app.policy_number ?? ''}`.trim() : null,
            app.telegram_username ? `Telegram: ${app.telegram_username}` : null,
          ]
            .filter(Boolean)
            .join('\n'),
          is_active: true,
        })
        .select('id')
        .single()
      if (cErr) throw new Error(cErr.message)
      contractorId = created.id
    } else {
      await supabaseAdmin
        .from('contractors')
        .update({
          is_active: true,
          ...(app.telegram_user_id ? { telegram_user_id: app.telegram_user_id } : {}),
        })
        .eq('id', contractorId)
    }

    await supabaseAdmin
      .from('contractor_applications')
      .update({ status: 'approved', contractor_id: contractorId })
      .eq('id', app.id)

    // Monteur persoonlijk laten weten dat het account klaarstaat.
    if (app.telegram_user_id) {
      const tg = await import('@/lib/telegram.server')
      await tg
        .sendMessage({
          chat_id: app.telegram_user_id as number,
          text: '🎉 Je account is goedgekeurd! Je €50 startkrediet staat klaar. Je kunt nu leads claimen.',
        })
        .catch((e) => console.error('approval telegram failed', e))
    }

    return { ok: true as const, contractorId }
  })

/* ---------------- Telegram webhook status ---------------- */

export const getTelegramWebhookStatus = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const token = process.env['TELEGRAM_BOT_TOKEN']
    if (!token) return { live: false, url: null as string | null, error: 'Telegram-token ontbreekt.' }
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`)
      const json: any = await res.json()
      const info = json?.result ?? {}
      return {
        live: Boolean(info.url),
        url: (info.url as string) || null,
        pending: (info.pending_update_count as number) ?? 0,
        error: (info.last_error_message as string) ?? null,
      }
    } catch (e) {
      return { live: false, url: null, error: e instanceof Error ? e.message : 'Onbekende fout' }
    }
  })
