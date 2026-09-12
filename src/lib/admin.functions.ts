import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { redactLeadText } from '@/lib/lead-privacy'
import { DEDUP_SCAN_LIMIT, dedupOrFilter, dedupSince, filterDuplicates, firstDuplicateId, hasUsableDedupInput } from '@/lib/lead-dedup'

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

/**
 * Overzicht per ZZP'er met de cijfers die de backoffice nodig heeft:
 * saldo, aantal geclaimde leads, besteed bedrag, opwaarderingen en laatste activiteit.
 */
export const listContractorOverview = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const [contractors, leads, transactions] = await Promise.all([
      context.supabase.from('contractors').select('*').order('created_at', { ascending: false }),
      context.supabase.from('leads').select('claimed_by, price_cents, claimed_at').not('claimed_by', 'is', null),
      context.supabase
        .from('contractor_transactions')
        .select('contractor_id, amount_cents, kind, note, created_at')
        .order('created_at', { ascending: false }),
    ])
    for (const res of [contractors, leads, transactions]) {
      if (res.error) throw new Error(res.error.message)
    }

    type Stat = {
      claimedCount: number
      spentCents: number
      lastClaimAt: string | null
      topupCount: number
      topupTotalCents: number
      lastTopupCents: number | null
      lastTopupAt: string | null
      lastTopupNote: string | null
    }
    const stats = new Map<string, Stat>()
    const stat = (id: string): Stat => {
      let s = stats.get(id)
      if (!s) {
        s = { claimedCount: 0, spentCents: 0, lastClaimAt: null, topupCount: 0, topupTotalCents: 0, lastTopupCents: null, lastTopupAt: null, lastTopupNote: null }
        stats.set(id, s)
      }
      return s
    }

    for (const lead of (leads.data ?? []) as any[]) {
      const s = stat(lead.claimed_by as string)
      s.claimedCount += 1
      s.spentCents += lead.price_cents ?? 0
      if (lead.claimed_at && (!s.lastClaimAt || lead.claimed_at > s.lastClaimAt)) s.lastClaimAt = lead.claimed_at
    }
    // Transacties staan aflopend op datum: de eerste opwaardering per ZZP'er is de recentste.
    for (const tx of (transactions.data ?? []) as any[]) {
      if (tx.amount_cents <= 0) continue
      const s = stat(tx.contractor_id as string)
      s.topupCount += 1
      s.topupTotalCents += tx.amount_cents
      if (!s.lastTopupAt) {
        s.lastTopupAt = tx.created_at
        s.lastTopupCents = tx.amount_cents
        s.lastTopupNote = tx.note ?? null
      }
    }

    return ((contractors.data ?? []) as any[]).map((c) => ({ ...c, ...stat(c.id as string) }))
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

/** Schrijft een regel in de leadtijdlijn. Mag een actie nooit laten mislukken. */
async function writeAudit(leadId: string, actorId: string, action: string, changes: Record<string, unknown>) {
  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    await supabaseAdmin.from('lead_audit_logs').insert({ lead_id: leadId, actor_id: actorId, action, changes: changes as any })
  } catch (err) {
    console.error('Audit log failed', action, err)
  }
}

const LEAD_SELECT = '*, contractors:claimed_by (name, company)'

export const listLeads = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        limit: z.number().int().min(1).max(100).default(25),
        status: z.enum(['all', 'open', 'urgent', 'overdue']).default('all'),
        search: z.string().trim().max(80).default(''),
        cursor: z.object({ created_at: z.string(), id: z.string().uuid() }).nullable().default(null),
      })
      .partial()
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const limit = data.limit ?? 25
    const status = data.status ?? 'all'
    let query = context.supabase.from('leads').select(LEAD_SELECT)

    if (status === 'open') query = query.in('status', ['new', 'dispatched', 'spam_review'])
    if (status === 'urgent') query = query.eq('is_urgent', true)
    if (status === 'overdue') {
      query = query
        .eq('status', 'dispatched')
        .is('claimed_by', null)
        .lt('dispatched_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
    }

    const search = (data.search ?? '').trim()
    if (search) {
      const safe = search.replace(/[%,()]/g, ' ')
      query = query.or(
        ['customer_name', 'customer_phone', 'postal_code', 'city', 'address', 'job_type']
          .map((column) => `${column}.ilike.%${safe}%`)
          .join(','),
      )
    }

    const cursor = data.cursor ?? null
    if (cursor) {
      query = query.or(
        `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`,
      )
    }

    const { data: rows, error } = await query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1)
    if (error) throw new Error(error.message)

    const page = (rows ?? []).slice(0, limit)
    const last = page[page.length - 1]
    return {
      rows: page,
      nextCursor: (rows ?? []).length > limit && last ? { created_at: last.created_at, id: last.id } : null,
    }
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
  is_urgent: z.boolean().default(false),
  image_urls: z.array(z.string().max(300)).max(3).optional(),
  price_status: z.enum(['none', 'hourly', 'fixed']).default('none'),
  agreed_price_details: z.string().max(160).optional().nullable(),
  pricing_type: z.enum(['standard', 'hourly', 'fixed']).optional(),
  pricing_note: z.string().max(300).optional().nullable(),
  idempotency_key: z.string().uuid().optional().nullable(),
  /** Taal van de klant: bepaalt de taal van het reviewverzoek. */
  customer_language: z.enum(['nl', 'en']).default('nl'),
})

/** Velden die de gedeelde dubbelcontrole nodig heeft. */
const DEDUP_COLUMNS = 'id, customer_phone, postal_code, address'


export const createLead = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => leadInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { dispatch, source, image_urls, idempotency_key, pricing_type, pricing_note, ...fields } = data

    // 1. Zelfde sleutel binnen 24 uur = dezelfde lead, geen tweede invoer.
    if (idempotency_key) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: existing } = await context.supabase
        .from('leads')
        .select('id, status')
        .eq('idempotency_key', idempotency_key)
        .gte('created_at', since)
        .maybeSingle()
      if (existing) {
        return { id: existing.id, dispatched: existing.status === 'dispatched', duplicateOfId: null, reused: true }
      }
    }

    // 2. Zachte dubbelcontrole over de laatste 7 dagen (gedeelde regels).
    const { data: recent } = await context.supabase
      .from('leads')
      .select(DEDUP_COLUMNS)
      .gte('created_at', dedupSince())
      .order('created_at', { ascending: false })
      .limit(DEDUP_SCAN_LIMIT)
    const duplicateOfId = firstDuplicateId(recent ?? [], {
      phone: fields.customer_phone,
      postalCode: fields.postal_code,
      address: fields.address,
    })


    const resolvedPricing = pricing_type ?? (fields.price_status === 'none' ? 'standard' : fields.price_status)
    const resolvedNote = pricing_note ?? fields.agreed_price_details ?? null

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
        pricing_type: resolvedPricing,
        pricing_note: resolvedNote,
        agreed_price_details: resolvedNote,
        idempotency_key: idempotency_key || null,
        duplicate_of_id: duplicateOfId,
      })
      .select('*')
      .single()
    if (error) {
      // Race met een gelijktijdige verzending van dezelfde sleutel.
      if (error.code === '23505' && idempotency_key) {
        const { data: existing } = await context.supabase
          .from('leads')
          .select('id, status')
          .eq('idempotency_key', idempotency_key)
          .maybeSingle()
        if (existing) return { id: existing.id, dispatched: existing.status === 'dispatched', duplicateOfId: null, reused: true }
      }
      throw new Error(error.message)
    }

    await writeAudit(row.id, context.userId, 'created', {
      source: row.source,
      dispatch,
      duplicate_of_id: duplicateOfId,
      photos: (image_urls ?? []).length,
    })

    if (!dispatch) return { id: row.id, dispatched: false, duplicateOfId, reused: false }

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data: task } = await supabaseAdmin
      .from('lead_notification_outbox')
      .insert({ lead_id: row.id, channel: 'telegram', payload: { kind: 'dispatch' }, status: 'processing' })
      .select('id')
      .single()
    try {
      await dispatchToTelegram(row, context)
      if (task) await supabaseAdmin.from('lead_notification_outbox').update({ status: 'sent' }).eq('id', task.id)
      await writeAudit(row.id, context.userId, 'dispatched', { channel: 'telegram' })
      return { id: row.id, dispatched: true, duplicateOfId, reused: false }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'onbekende fout'
      if (task) {
        await supabaseAdmin
          .from('lead_notification_outbox')
          .update({ status: 'failed', last_error: message.slice(0, 500), retry_count: 1 })
          .eq('id', task.id)
      }
      await writeAudit(row.id, context.userId, 'dispatch_failed', { error: message.slice(0, 200) })
      return { id: row.id, dispatched: false, duplicateOfId, reused: false }
    }
  })

/**
 * Vooruitblik tijdens het invullen: staat deze klant misschien al in de lijst?
 * Strikt read-only — geen insert, geen update, geen auditregel. Eén query.
 * De respons bevat bewust geen telefoonnummer of adres; die heeft de invoerder
 * zelf al voor zich.
 */
export const findPossibleDuplicates = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        phone: z.string().max(40).optional(),
        postalCode: z.string().max(12).optional(),
        address: z.string().max(160).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const input = { phone: data.phone, postalCode: data.postalCode, address: data.address }
    if (!hasUsableDedupInput(input)) return []

    // Filter in de database, niet pas in het geheugen: anders valt een match
    // buiten beeld zodra er meer dan DEDUP_SCAN_LIMIT leads per week zijn.
    let query = context.supabase
      .from('leads')
      .select(`${DEDUP_COLUMNS}, customer_name, job_type, status, created_at`)
      .gte('created_at', dedupSince())
    const orFilter = dedupOrFilter(input)
    if (orFilter) query = query.or(orFilter)
    const { data: recent } = await query.order('created_at', { ascending: false }).limit(DEDUP_SCAN_LIMIT)

    return filterDuplicates(recent ?? [], input, 3).map(row => ({
      id: row.id,
      customer_name: row.customer_name,
      job_type: row.job_type,
      status: row.status,
      created_at: row.created_at,
    }))
  })


/** Detail voor de bottom sheet: lead, tijdlijn en tijdelijke fotolinks. */
export const getLeadDetail = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ leadId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { data: lead, error } = await context.supabase
      .from('leads')
      .select(LEAD_SELECT)
      .eq('id', data.leadId)
      .single()
    if (error) throw new Error(error.message)
    const { data: timeline } = await context.supabase
      .from('lead_audit_logs')
      .select('*')
      .eq('lead_id', data.leadId)
      .order('created_at', { ascending: false })
      .limit(50)
    const { data: deliveries } = await context.supabase
      .from('lead_notification_outbox')
      .select('id, status, retry_count, last_error, created_at')
      .eq('lead_id', data.leadId)
      .order('created_at', { ascending: false })
      .limit(10)
    let photoUrls: string[] = []
    if ((lead.image_urls ?? []).length) {
      const { signedLeadImageUrls } = await import('@/lib/lead-dispatch.server')
      photoUrls = await signedLeadImageUrls(lead.image_urls as string[])
    }
    return { lead, timeline: timeline ?? [], deliveries: deliveries ?? [], photoUrls }
  })

/** Inline bewerken vanuit de bottom sheet. */
export const updateLead = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        leadId: z.string().uuid(),
        changes: z
          .object({
            customer_name: z.string().min(2).max(120),
            customer_phone: z.string().min(6).max(30),
            customer_email: z.string().max(160).nullable(),
            postal_code: z.string().max(12).nullable(),
            address: z.string().max(200).nullable(),
            city: z.string().max(80).nullable(),
            job_type: z.string().min(2).max(120),
            description: z.string().max(2000).nullable(),
            is_urgent: z.boolean(),
            price_cents: z.number().int().min(0).max(100000),
            pricing_type: z.enum(['standard', 'hourly', 'fixed']),
            pricing_note: z.string().max(300).nullable(),
            customer_language: z.enum(['nl', 'en']),
          })
          .partial(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    if (!Object.keys(data.changes).length) return { ok: true }
    const patch: Record<string, unknown> = { ...data.changes }
    if (patch['pricing_type']) {
      patch['price_status'] = patch['pricing_type'] === 'standard' ? 'none' : patch['pricing_type']
    }
    if ('pricing_note' in patch) patch['agreed_price_details'] = patch['pricing_note']
    const { error } = await context.supabase.from('leads').update(patch as any).eq('id', data.leadId)
    if (error) throw new Error(error.message)
    await writeAudit(data.leadId, context.userId, 'updated', data.changes)
    return { ok: true }
  })

/** Ondertekende upload-URL: de browser stuurt de verkleinde foto rechtstreeks naar de opslag. */
export const createLeadUploadUrl = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const ext = data.contentType === 'image/png' ? 'png' : data.contentType === 'image/webp' ? 'webp' : 'jpg'
    const path = `whatsapp/${crypto.randomUUID()}.${ext}`
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data: signed, error } = await supabaseAdmin.storage
      .from('lead-attachments')
      .createSignedUploadUrl(path)
    if (error || !signed) throw new Error(error?.message ?? 'Upload-URL aanmaken mislukt.')
    return { path, token: signed.token }
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

export const addLeadPhotos = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    leadId: z.string().uuid(),
    paths: z.array(z.string().regex(/^whatsapp\/[a-f0-9-]+\.(jpg|png|webp)$/)).min(1).max(3),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { data: lead, error } = await context.supabase.rpc('append_lead_photos', { _lead_id: data.leadId, _paths: data.paths })
    if (error) throw new Error('Foto’s bewaren mislukt.')
    // Additional photos are stored for every status, without creating another claim button.
    // Already claimed leads receive the new photos only in the winner's private chat.
    let delivered = false
    try {
      const tg = await import('@/lib/telegram.server')
      const { signedLeadImageUrls } = await import('@/lib/lead-dispatch.server')
      let chatId: string | number | null = null
      if (lead.status === 'claimed' && lead.claimed_by) {
        const { data: contractor } = await context.supabase.from('contractors').select('telegram_user_id').eq('id', lead.claimed_by).single()
        chatId = contractor?.telegram_user_id ?? null
      } else if (lead.status === 'dispatched') {
        chatId = tg.groupChatId()
      }
      if (chatId) {
        const urls = await signedLeadImageUrls(data.paths)
        if (urls.length !== data.paths.length) throw new Error('Foto’s niet beschikbaar')
        const label = `${lead.job_type}${lead.city ? ` · ${lead.city}` : ''}`
        await tg.sendMessage({ chat_id: chatId, text: `📷 Aanvullende foto’s — ${tg.escapeHtml(lead.status === 'claimed' ? label : redactLeadText(label, lead))}\nLead: ${lead.id.slice(0, 8)}` })
        if (urls.length === 1) await tg.sendPhoto({ chat_id: chatId, photo: urls[0] })
        else await tg.sendMediaGroup({ chat_id: chatId, photos: urls })
        delivered = true
      }
    } catch { console.error('Additional lead photos saved but Telegram delivery failed', data.leadId) }
    return { saved: true, delivered, deliveryExpected: lead.status === 'claimed' || lead.status === 'dispatched' }
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

  // Niet overschrijven wanneer er tijdens het versturen al geclaimd is.
  const { error } = await context.supabase
    .from('leads')
    .update({
      status: 'dispatched',
      telegram_message_id: messageId,

      dispatched_at: new Date().toISOString(),
    })
    .eq('id', row.id)
    .is('claimed_by', null)
    .neq('status', 'claimed')
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

/* ---------------- Reviews & bonussen ---------------- */

/** Leads waarvoor de monteur een reviewverzoek heeft aangevraagd. */
export const listReviewRequests = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        status: z
          .enum(['open', 'tosend', 'waiting', 'reminder', 'rewarded', 'nobonus', 'all'])
          .default('open'),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    let query = context.supabase
      .from('leads')
      .select(
        'id, customer_name, customer_phone, city, postal_code, job_type, customer_language, review_requested_at, review_sent_at, reminder_sent_at, reviewed_at, review_rating, claimed_by, contractors:claimed_by (id, name, company, telegram_user_id)',
      )
      .not('review_requested_at', 'is', null)
      .order('review_requested_at', { ascending: false })
      .limit(100)
    if (data.status === 'open') query = query.is('reviewed_at', null)
    if (data.status === 'tosend') query = query.is('reviewed_at', null).is('review_sent_at', null)
    if (data.status === 'waiting') query = query.is('reviewed_at', null).not('review_sent_at', 'is', null)
    if (data.status === 'reminder') {
      const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
      query = query
        .is('reviewed_at', null)
        .is('reminder_sent_at', null)
        .not('review_sent_at', 'is', null)
        .lt('review_sent_at', cutoff)
    }
    if (data.status === 'rewarded') query = query.not('reviewed_at', 'is', null).eq('review_rating', 5)
    if (data.status === 'nobonus') query = query.not('reviewed_at', 'is', null).lt('review_rating', 5)
    const { data: rows, error } = await query
    if (error) throw new Error(error.message)
    const list = rows ?? []
    const ids = list.map((r) => r.id)
    const txMap = new Map<string, { id: string; amount_cents: number; balance_after_cents: number }>()
    if (ids.length) {
      const { data: tx } = await context.supabase
        .from('contractor_transactions')
        .select('id, lead_id, amount_cents, balance_after_cents')
        .eq('kind', 'review_bonus')
        .in('lead_id', ids)
      for (const t of tx ?? []) {
        if (t.lead_id) txMap.set(t.lead_id, t as any)
      }
    }
    return list.map((r) => {
      const t = txMap.get(r.id)
      return {
        ...r,
        transaction_id: t?.id ?? null,
        bonus_cents: t?.amount_cents ?? 0,
        balance_after_cents: t?.balance_after_cents ?? null,
      }
    })

  })

/** Legt een review handmatig vast voor een klus die niet via de Telegram-knop liep. */
/** Zoek bestaande klanten (leads) voor de handmatige-reviewkiezer. */
export const searchCustomers = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ query: z.string().trim().min(2).max(120) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const q = data.query.replace(/[%,]/g, ' ').trim()
    if (!q) return []
    const like = `%${q}%`
    const { data: rows, error } = await context.supabase
      .from('leads')
      .select(
        'id, customer_name, customer_phone, city, job_type, customer_language, claimed_by, review_requested_at, reviewed_at, created_at, contractors:claimed_by(name)',
      )
      .or(`customer_name.ilike.${like},customer_phone.ilike.${like},city.ilike.${like}`)
      .order('created_at', { ascending: false })
      .limit(8)
    if (error) throw new Error(error.message)
    return (rows ?? []).map((r: any) => ({
      leadId: r.id,
      name: r.customer_name,
      phone: r.customer_phone,
      city: r.city,
      jobType: r.job_type,
      language: (r.customer_language === 'en' ? 'en' : 'nl') as 'nl' | 'en',
      contractorId: r.claimed_by,
      contractorName: r.contractors?.name ?? null,
      reviewRequestedAt: r.review_requested_at,
      reviewedAt: r.reviewed_at,
    }))
  })

export const createManualReview = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        contractorId: z.string().uuid(),
        existingLeadId: z.string().uuid().optional(),
        customerName: z.string().trim().min(1).max(120),
        customerPhone: z.string().trim().max(30).optional().or(z.literal('')),
        customerLanguage: z.enum(['nl', 'en']).default('nl'),
        city: z.string().trim().max(120).optional().or(z.literal('')),
        jobType: z.string().trim().max(160).optional().or(z.literal('')),
        rating: z.number().int().min(1).max(5),
        amountCents: z.number().int().min(0).max(100000).default(0),
        notifyMonteur: z.boolean().default(true),
      })
      .refine((v) => v.rating === 5 || v.amountCents === 0, {
        message: 'Bonus is alleen mogelijk bij een 5-sterrenreview.',
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const now = new Date().toISOString()

    // Koppeling aan een bestaande klus uit de klantenbase: geen nieuwe lead aanmaken.
    if (data.existingLeadId) {
      const { data: existing, error: lookupError } = await context.supabase
        .from('leads')
        .select('id, claimed_by, review_requested_at, reviewed_at')
        .eq('id', data.existingLeadId)
        .single()
      if (lookupError || !existing) throw new Error('Geselecteerde klus niet gevonden.')
      if (existing.reviewed_at) throw new Error('Voor deze klus is de review al verwerkt.')
      const claimedBy = (existing.claimed_by as string | null) ?? data.contractorId
      {
        const { error: linkError } = await context.supabase
          .from('leads')
          .update({
            ...(existing.claimed_by ? {} : { claimed_by: claimedBy, claimed_at: now }),
            ...(existing.review_requested_at ? {} : { review_requested_at: now }),
            customer_language: data.customerLanguage,
          })
          .eq('id', existing.id)
        if (linkError) throw new Error(linkError.message)
      }
      return approveReviewBonusInternal(context, {
        leadId: existing.id,
        amountCents: data.amountCents,
        rating: data.rating,
        notifyMonteur: data.notifyMonteur,
      })
    }

    const { data: lead, error } = await context.supabase
      .from('leads')
      .insert({
        customer_name: data.customerName,
        customer_phone: data.customerPhone?.trim() || '-',
        city: data.city || null,
        job_type: data.jobType || 'Handmatige review',
        customer_language: data.customerLanguage,
        price_cents: 0,
        status: 'claimed',
        source: 'phone_manual',
        claimed_by: data.contractorId,
        claimed_at: now,
        review_requested_at: now,
      })
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    try {
      return await approveReviewBonusInternal(context, {
        leadId: lead.id,
        amountCents: data.amountCents,
        rating: data.rating,
        notifyMonteur: data.notifyMonteur,
      })
    } catch (err) {
      // Rol de zojuist aangemaakte klusregel terug zodat er geen lege records achterblijven.
      await context.supabase.from('leads').delete().eq('id', lead.id).is('reviewed_at', null)
      throw err
    }
  })


type ReviewBonusInput = { leadId: string; amountCents: number; rating: number; notifyMonteur: boolean }

/** Gedeelde verwerking van een review: RPC, optionele Telegram-melding en auditlog. */
async function approveReviewBonusInternal(context: any, data: ReviewBonusInput) {
  {

    const { data: result, error } = await context.supabase.rpc('approve_review_bonus', {
      _lead_id: data.leadId,
      _amount_cents: data.amountCents,
      _rating: data.rating,
    })
    if (error) throw new Error(error.message)
    const res = result as any
    if (!res?.ok) {
      throw new Error(res?.reason === 'already_rewarded' ? 'Deze review is al verwerkt.' : 'Verwerken mislukt.')
    }

    if (data.notifyMonteur && res.telegram_user_id) {
      try {
        const tg = await import('@/lib/telegram.server')
        const { data: lead } = await context.supabase
          .from('leads')
          .select('customer_name')
          .eq('id', data.leadId)
          .maybeSingle()
        const monteur = tg.escapeHtml(String(res.contractor_name ?? ''))
        const klant = tg.escapeHtml(String(lead?.customer_name ?? 'de klant'))
        const stars = '⭐'.repeat(data.rating)
        const text =
          data.amountCents > 0
            ? [
                `🏆 <b>Gefeliciteerd${monteur ? ` ${monteur}` : ''}!</b>`,
                ``,
                `${klant} heeft een 5-sterrenreview geplaatst.`,
                `💰 <b>+ ${tg.euro(data.amountCents)}</b> is toegevoegd aan je saldo.`,
                `📊 <b>Nieuw saldo:</b> ${tg.euro(res.balance_cents as number)}`,
              ]
            : [
                `⭐ <b>Review verwerkt</b>`,
                ``,
                `${klant} gaf ${stars} (${data.rating}/5).`,
                `Bij een 5-sterrenreview volgt een bonus op je saldo.`,
              ]
        await tg.sendMessage({ chat_id: res.telegram_user_id as number, text: text.join('\n') })
      } catch (e) {
        console.error('review bonus notify failed', e)
      }
    }

    await writeAudit(data.leadId, context.userId, 'review_bonus', {
      amount_cents: data.amountCents,
      rating: data.rating,
      contractor_id: res.contractor_id,
    })
    return {
      ok: true,
      balanceCents: res.balance_cents as number,
      avgRating: res.avg_rating as number | null,
      totalReviews: res.total_reviews as number,
      fiveStarReviews: res.five_star_reviews as number,
    }
  }
}

/** Kent de reviewbonus toe: saldo ophogen, teller ophogen en transactie vastleggen. */
export const approveReviewBonus = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        leadId: z.string().uuid(),
        amountCents: z.number().int().min(0).max(100000),
        rating: z.number().int().min(1).max(5).default(5),
        notifyMonteur: z.boolean().default(true),
      })
      .refine((v) => v.rating === 5 || v.amountCents === 0, {
        message: 'Bonus is alleen mogelijk bij een 5-sterrenreview.',
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    return await approveReviewBonusInternal(context, data)
  })



/** Prestatie-overzicht per monteur: reviews, gemiddelde score en uitgekeerde bonus. */
export const listMonteurPerformance = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const [{ data: contractors, error: cErr }, { data: tx, error: tErr }, { data: rated, error: rErr }] =
      await Promise.all([
        context.supabase
          .from('contractors')
          .select('id, name, company, is_active, review_count, five_star_reviews, avg_rating, telegram_user_id')
          .order('name'),
        context.supabase
          .from('contractor_transactions')
          .select('contractor_id, amount_cents')
          .eq('kind', 'review_bonus'),
        context.supabase.from('leads').select('claimed_by, review_rating').not('review_rating', 'is', null),
      ])
    if (cErr) throw new Error(cErr.message)
    if (tErr) throw new Error(tErr.message)
    if (rErr) throw new Error(rErr.message)
    const bonus = new Map<string, number>()
    for (const t of tx ?? []) {
      bonus.set(t.contractor_id, (bonus.get(t.contractor_id) ?? 0) + (t.amount_cents ?? 0))
    }
    const counts = new Map<string, Record<number, number>>()
    for (const r of rated ?? []) {
      if (!r.claimed_by || !r.review_rating) continue
      const entry = counts.get(r.claimed_by) ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      entry[r.review_rating] = (entry[r.review_rating] ?? 0) + 1
      counts.set(r.claimed_by, entry)
    }
    return (contractors ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      company: c.company,
      isActive: c.is_active,
      telegramLinked: Boolean(c.telegram_user_id),
      totalReviews: c.review_count ?? 0,
      fiveStarReviews: c.five_star_reviews ?? 0,
      avgRating: c.avg_rating === null || c.avg_rating === undefined ? null : Number(c.avg_rating),
      bonusTotalCents: bonus.get(c.id) ?? 0,
      ratingCounts: counts.get(c.id) ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },

    }))
  })

/* ---------------- Review text generator ---------------- */

export const markReviewRequested = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ leadId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    await assertAdmin(context)
    const { error } = await context.supabase
      .from('leads')
      .update({ review_requested_at: new Date().toISOString() })
      .eq('id', data.leadId)
      .is('review_requested_at', null)
    if (error) throw new Error(error.message)
    return { ok: true }
  })

/** Legt vast dat het reviewverzoek daadwerkelijk naar de klant is gestuurd. */
export const markReviewSent = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ leadId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    await assertAdmin(context)
    const { error } = await context.supabase
      .from('leads')
      .update({ review_sent_at: new Date().toISOString() })
      .eq('id', data.leadId)
      .is('review_sent_at', null)
    if (error) throw new Error(error.message)
    return { ok: true }
  })

/** Legt vast dat de 72-uurs herinnering naar de klant is gestuurd. */
export const markReminderSent = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ leadId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    await assertAdmin(context)
    const { error } = await context.supabase
      .from('leads')
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq('id', data.leadId)
      .is('reminder_sent_at', null)
    if (error) throw new Error(error.message)
    return { ok: true }
  })
