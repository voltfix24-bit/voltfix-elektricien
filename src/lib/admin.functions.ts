import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { redactLeadText } from '@/lib/lead-privacy'
import { DEDUP_SCAN_LIMIT, dedupOrFilter, dedupSince, filterDuplicates, firstDuplicateId, hasUsableDedupInput } from '@/lib/lead-dedup'
import { parseWhatsApp } from '@/lib/whatsapp-parse'
import { DEFAULT_ESCALATION_MINUTES, escalationMinutes } from '@/lib/lead-overdue'
import { OUTCOMES } from '@/lib/lead-outcome'
import { suggestNextStep } from '@/lib/follow-up'
import { whatsappWindow } from '@/lib/whatsapp-window'

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
      context.supabase.from('leads').select('claimed_by, price_cents, claimed_at, status, outcome, reviewed_at').not('claimed_by', 'is', null),
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
      /** Zichtbaarheid zonder gevolgen: patroon zien, geen oordeel. */
      cancelledClaims30d: number
      completedCount: number
      reviewsReceived: number
    }
    const stats = new Map<string, Stat>()
    const stat = (id: string): Stat => {
      let s = stats.get(id)
      if (!s) {
        s = { claimedCount: 0, spentCents: 0, lastClaimAt: null, topupCount: 0, topupTotalCents: 0, lastTopupCents: null, lastTopupAt: null, lastTopupNote: null, cancelledClaims30d: 0, completedCount: 0, reviewsReceived: 0 }
        stats.set(id, s)
      }
      return s
    }

    const since30d = new Date(Date.now() - 30 * 86_400_000).toISOString()
    for (const lead of (leads.data ?? []) as any[]) {
      const s = stat(lead.claimed_by as string)
      if (lead.status === 'cancelled') {
        if (lead.claimed_at && lead.claimed_at >= since30d) s.cancelledClaims30d += 1
        continue
      }
      s.claimedCount += 1
      if (lead.outcome === 'done') {
        s.completedCount += 1
        if (lead.reviewed_at) s.reviewsReceived += 1
      }
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

    return ((contractors.data ?? []) as any[]).map((c) => {
      const s = stat(c.id as string)
      return { ...c, ...s, reviewPercentage: s.completedCount ? Math.round((s.reviewsReceived / s.completedCount) * 100) : 0 }
    })
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
    await assertTestSafeContractor(context, data.contractorId)
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

import type { StagePill } from './lead-status'

const LEAD_SELECT = '*, contractors:claimed_by (name, company, phone)'

/** Bovengrens van de bak; daarboven klopt de teller niet meer en zeggen we dat. */
const STAGE_SCAN_LIMIT = 1000

/**
 * Zoekfilter op leads: tekstvelden én het aanvraagnummer. "1033" en "#1033"
 * leveren allebei dezelfde aanvraag op.
 */
function leadSearchOr(raw: string): string | null {
  const search = raw.trim()
  if (!search) return null
  const safe = search.replace(/[%,()]/g, ' ')
  const parts = ['customer_name', 'customer_phone', 'postal_code', 'city', 'address', 'job_type'].map(
    (column) => `${column}.ilike.%${safe}%`,
  )
  const refDigits = safe.replace(/^#/, '').trim()
  if (/^\d{1,9}$/.test(refDigits)) parts.push(`ref_number.eq.${Number(refDigits)}`)
  return parts.join(',')
}

/**
 * Klussenbak op afgeleide status. De status staat niet als kolom in de
 * database — hij volgt uit claim, plandatum, afloop en review — dus tellen en
 * filteren gebeurt hier, op dezelfde verzameling. Zo toont een pil altijd
 * precies wat zijn teller zegt.
 */
async function listLeadsByStage(
  context: any,
  data: { stage: StagePill; limit: number; sort: 'newest' | 'oldest' | 'urgency'; page: number | null; search?: string },
) {
  const { leadStage, countByPill, pillMatches } = await import('./lead-status')
  let query = context.supabase
    .from('leads')
    .select(LEAD_SELECT)
    // Zekere spam en geannuleerde aanvragen blijven buiten de bak. Een aanvraag
    // uit de piekbeveiliging heeft status spam_review en blijft controleerbaar.
    .not('status', 'in', '(cancelled,blocked_spam)')

  const searchOr = leadSearchOr(data.search ?? '')
  if (searchOr) query = query.or(searchOr)

  if (data.sort === 'oldest') query = query.order('created_at', { ascending: true }).order('id', { ascending: true })
  else if (data.sort === 'urgency')
    query = query
      .order('is_urgent', { ascending: false })
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
  else query = query.order('created_at', { ascending: false }).order('id', { ascending: false })

  const { data: rows, error } = await query.limit(STAGE_SCAN_LIMIT)
  if (error) throw new Error(error.message)

  const now = Date.now()
  const withStage = (rows ?? []).map((row: any) => ({ row, stage: leadStage(row, now) }))
  const counts = countByPill(withStage.map((entry: any) => entry.stage))
  const matching = withStage.filter((entry: any) => pillMatches(data.stage, entry.stage))

  const page = data.page ?? 0
  const pageRows = matching.slice(page * data.limit, page * data.limit + data.limit).map((entry: any) => entry.row)
  const dispatchByLead = await latestDispatchByLead(context, pageRows.map((row: any) => row.id))

  return {
    rows: pageRows.map((row: any) => ({ ...row, dispatch: dispatchByLead.get(row.id) ?? null })),
    nextCursor: null,
    total: matching.length,
    page,
    counts,
  }
}

export const listLeads = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        limit: z.number().int().min(1).max(100).default(25),
        status: z.enum(['all', 'open', 'urgent', 'overdue', 'no-outcome']).default('all'),
        // Klussenbak: één filterpil uit het statusmodel. Wint van `status`.
        stage: z
          .enum(['work', 'new', 'dispatched', 'claimed', 'scheduled', 'awaiting_review', 'closed', 'not_proceeded', 'spam_review'])
          .nullable()
          .default(null),
        search: z.string().trim().max(80).default(''),
        cursor: z.object({ created_at: z.string(), id: z.string().uuid() }).nullable().default(null),
        // Paginering (0-gebaseerd). Meegeven schakelt de cursor uit en levert
        // ook het totaal binnen de actieve filters.
        page: z.number().int().min(0).max(10000).nullable().default(null),
        sort: z.enum(['newest', 'oldest', 'urgency']).default('newest'),
      })
      .partial()
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const limit = data.limit ?? 25
    const status = data.status ?? 'all'
    const sort = data.sort ?? 'newest'
    const page = data.page ?? null
    const stage = data.stage ?? null
    if (stage) return await listLeadsByStage(context, { ...data, stage, limit, sort, page })
    let query =
      page === null
        ? context.supabase.from('leads').select(LEAD_SELECT)
        : context.supabase.from('leads').select(LEAD_SELECT, { count: 'exact' })

    if (status === 'open') query = query.in('status', ['new', 'dispatched', 'spam_review'])
    if (status === 'urgent') query = query.eq('is_urgent', true)
    if (status === 'overdue') {
      // Grove voorselectie op de kortste termijn (spoed); de precieze grens per
      // klustype komt uit `isLeadOverdue`, de enige definitie van "te laat".
      query = query
        .in('status', ['new', 'dispatched'])
        .is('claimed_by', null)
        .lt('created_at', new Date(Date.now() - DEFAULT_ESCALATION_MINUTES.urgent * 60_000).toISOString())
    }
    // "Zonder afloop": opgepakt, maar er is nog geen review uitgezet — dus nog
    // geen afronding vastgelegd.
    if (status === 'no-outcome') query = query.eq('status', 'claimed').is('outcome', null)

    const searchOr = leadSearchOr(data.search ?? '')
    if (searchOr) query = query.or(searchOr)

    // De cursor hoort bij de standaardsortering; paginering gebruikt `range`.
    const cursor = page === null ? (data.cursor ?? null) : null
    if (cursor) {
      query = query.or(
        `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`,
      )
    }

    if (sort === 'oldest') query = query.order('created_at', { ascending: true }).order('id', { ascending: true })
    else if (sort === 'urgency')
      query = query
        .order('is_urgent', { ascending: false })
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
    else query = query.order('created_at', { ascending: false }).order('id', { ascending: false })

    const { data: rows, error, count } = await (page === null
      ? query.limit(limit + 1)
      : query.range(page * limit, page * limit + limit - 1))
    if (error) throw new Error(error.message)

    const all = rows ?? []
    const pageRows = page === null ? all.slice(0, limit) : all
    const last = pageRows[pageRows.length - 1]

    // Verzendstatus komt uit de outbox — geen kolom op `leads`, en geen query
    // per kaart: één extra query op de id's van deze pagina. De sortering en
    // de cursor blijven hierdoor onaangeroerd.
    const dispatchByLead = await latestDispatchByLead(context, pageRows.map((row: any) => row.id))

    return {
      rows: pageRows.map((row: any) => ({ ...row, dispatch: dispatchByLead.get(row.id) ?? null })),
      nextCursor:
        page === null && all.length > limit && last ? { created_at: last.created_at, id: last.id } : null,
      total: page === null ? null : (count ?? 0),
      page,
    }
  })

/* ---------------- Bulkacties op leads ---------------- */

export type BulkLeadResult = {
  ok: string[]
  failed: string[]
  undelivered: string[]
  /** Reden per mislukte lead, bijvoorbeeld "heeft al een eigenaar". */
  reasons: Record<string, string>
  groupNotUpdated: string[]
}

/**
 * Eén actie op maximaal 50 leads. Per lead apart uitgevoerd: wat lukt, lukt —
 * de rest komt terug als `failed`, zodat de lijst die selectie kan vasthouden.
 */
export const bulkLeadAction = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        action: z.enum(['dispatch', 'assign', 'spam', 'cancel']),
        ids: z.array(z.string().uuid()).min(1).max(50),
        contractorId: z.string().uuid().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<BulkLeadResult> => {
    await assertAdmin(context)
    for (const id of data.ids) await assertTestSafeLead(context, id)
    if (data.action === 'assign' && !data.contractorId) throw new Error('Kies eerst een ZZP\u2019er.')

    const ok: string[] = []
    const failed: string[] = []
    // Per mislukte regel de reden, niet alleen "mislukt".
    const reasons: Record<string, string> = {}
    // Toegewezen, maar het groepsbericht is niet bijgewerkt.
    const groupNotUpdated: string[] = []
    // Toegewezen, maar het privébericht kwam (nog) niet aan.
    const undelivered: string[] = []

    for (const leadId of data.ids) {
      try {
        if (data.action === 'dispatch') {
          const { data: row, error } = await context.supabase.from('leads').select('*').eq('id', leadId).single()
          if (error) throw new Error(error.message)
          if (row.status === 'claimed') throw new Error('Al geclaimd.')
          await dispatchToTelegram(row, context)
          await writeAudit(leadId, context.userId, 'dispatched', { bulk: true })
        } else if (data.action === 'assign') {
          // Bulk werkt uitsluitend op klussen zonder eigenaar: terugbetalen aan
          // de vorige monteur is een keuze per geval en kan hier niet gemaakt
          // worden. Dezelfde controles als elke andere weg (actief, saldo,
          // gelijktijdige beheerders) worden in de database afgedwongen.
          const { data: result, error } = await context.supabase.rpc('admin_assign_lead', {
            _lead_id: leadId,
            _contractor_id: data.contractorId!,
            _expected_owner: null as unknown as string,
            _allow_owner_change: false,
            _refund_previous: false,
            _charge_new: true,
            _reason: 'Toewijzing door kantoor (bulk)',
          })
          if (error) throw new Error(error.message)
          const refusal = assignmentRefusal(result)
          if (refusal) throw new Error(refusal)

          const outcome = result as any
          const { deliverAssignedLead, syncGroupClaimed } = await import('@/lib/lead-assignment.server')
          const group = await syncGroupClaimed(leadId, outcome.contractor_name ?? 'VoltFix')
          const delivery = await deliverAssignedLead(leadId, data.contractorId!)
          if (!delivery.delivered) undelivered.push(leadId)
          if (!group.ok) groupNotUpdated.push(leadId)
          await writeAudit(leadId, context.userId, 'assigned', {
            bulk: true,
            contractor_id: data.contractorId,
            charged_cents: outcome.charged_cents ?? 0,
            delivered: delivery.delivered,
            delivery_reason: delivery.reason,
            group_message_updated: group.ok,
          })
        } else if (data.action === 'spam') {
          const { error } = await context.supabase
            .from('leads')
            .update({ status: 'blocked_spam' })
            .eq('id', leadId)
            .neq('status', 'claimed')
          if (error) throw new Error(error.message)
          await writeAudit(leadId, context.userId, 'marked_spam', { bulk: true })
        } else {
          const { error } = await context.supabase
            .from('leads')
            .update({ status: 'cancelled' })
            .eq('id', leadId)
            .neq('status', 'claimed')
          if (error) throw new Error(error.message)
          await writeAudit(leadId, context.userId, 'cancelled', { bulk: true })
        }
        ok.push(leadId)
      } catch (error) {
        failed.push(leadId)
        reasons[leadId] = error instanceof Error ? error.message : 'Onbekende fout.'
      }
    }

    return { ok, failed, undelivered, reasons, groupNotUpdated }
  })

/* ---------------- Opgeslagen weergaven ---------------- */

const viewFilters = z.object({
  filter: z.enum(['all', 'open', 'urgent', 'overdue', 'no-outcome']),
  search: z.string().max(80),
  sort: z.enum(['newest', 'oldest', 'urgency']),
})

export const listAdminViews = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const { data, error } = await context.supabase
      .from('admin_views')
      .select('id, name, filters, is_shared, user_id, created_at')
      .order('created_at', { ascending: true })
    if (error) throw new Error(error.message)
    return data ?? []
  })

export const saveAdminView = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().nullable().optional(),
        name: z.string().trim().min(1).max(60),
        filters: viewFilters,
        isShared: z.boolean().default(true),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    if (data.id) {
      const { error } = await context.supabase
        .from('admin_views')
        .update({ name: data.name, filters: data.filters as any, is_shared: data.isShared })
        .eq('id', data.id)
        .eq('user_id', context.userId)
      if (error) throw new Error(error.message)
      return { id: data.id }
    }
    const { data: row, error } = await context.supabase
      .from('admin_views')
      .insert({ user_id: context.userId, name: data.name, filters: data.filters as any, is_shared: data.isShared })
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    return { id: row.id as string }
  })

export const deleteAdminView = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { error } = await context.supabase
      .from('admin_views')
      .delete()
      .eq('id', data.id)
      .eq('user_id', context.userId)
    if (error) throw new Error(error.message)
    return { ok: true }
  })

export type LeadDispatchInfo = {
  state: 'queued' | 'sent' | 'failed'
  attempts: number
  lastAttemptAt: string
  lastError: string | null
}

/** Laatste outbox-regel per lead. Eén query voor de hele pagina. */
async function latestDispatchByLead(context: any, leadIds: string[]): Promise<Map<string, LeadDispatchInfo>> {
  const result = new Map<string, LeadDispatchInfo>()
  if (!leadIds.length) return result
  const { data: tasks } = await context.supabase
    .from('lead_notification_outbox')
    .select('lead_id, status, retry_count, last_error, created_at, updated_at')
    .in('lead_id', leadIds)
    .order('created_at', { ascending: false })
  for (const task of tasks ?? []) {
    if (result.has(task.lead_id)) continue // nieuwste eerst: de eerste is de laatste poging
    const state: LeadDispatchInfo['state'] =
      task.status === 'sent' ? 'sent' : task.status === 'failed' ? 'failed' : 'queued'
    result.set(task.lead_id, {
      state,
      attempts: Math.max(1, Number(task.retry_count ?? 0) || (state === 'queued' ? 0 : 1)),
      lastAttemptAt: task.updated_at ?? task.created_at,
      lastError: task.last_error ? String(task.last_error).slice(0, 200) : null,
    })
  }
  return result
}

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
  /** Tijdstip laatste klantbericht; bepaalt het WhatsApp-venster van 24 uur. */
  last_customer_message_at: z.string().datetime().optional().nullable(),
  /** Waar: het tijdstip is een schatting (moment van plakken), geen gelezen tijdstempel. */
  last_customer_message_estimated: z.boolean().default(false),
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

    // 2. Zachte dubbelcontrole over de laatste 7 dagen (gedeelde regels),
    //    voorgefilterd in de database zodat drukke weken niets missen.
    const dedupInput = { phone: fields.customer_phone, postalCode: fields.postal_code, address: fields.address }
    let dedupQuery = context.supabase.from('leads').select(DEDUP_COLUMNS).gte('created_at', dedupSince())
    const dedupFilter = dedupOrFilter(dedupInput)
    if (dedupFilter) dedupQuery = dedupQuery.or(dedupFilter)
    const { data: recent } = await dedupQuery.order('created_at', { ascending: false }).limit(DEDUP_SCAN_LIMIT)
    const duplicateOfId = firstDuplicateId(recent ?? [], dedupInput)


    const resolvedPricing = pricing_type ?? (fields.price_status === 'none' ? 'standard' : fields.price_status)
    const resolvedNote = pricing_note ?? fields.agreed_price_details ?? null
    // price_status en pricing_type moeten altijd hetzelfde zeggen: het
    // Telegram-bericht leest price_status, de backoffice leest pricing_type.
    const resolvedStatus = resolvedPricing === 'standard' ? 'none' : resolvedPricing

    // 3. De wachttijd tot escalatie hoort bij de lead, niet bij de database:
    //    de app is de enige plek die weet wat een spoedklus is.
    const { data: escalationSettings } = await context.supabase
      .from('lead_settings')
      .select('escalation_urgent_minutes, escalation_planned_minutes')
      .eq('id', 1)
      .maybeSingle()

    const { data: row, error } = await context.supabase
      .from('leads')
      .insert({
        ...fields,
        escalation_minutes: escalationMinutes(
          { is_urgent: fields.is_urgent, job_type: fields.job_type },
          escalationSettings ?? undefined,
        ),
        customer_email: fields.customer_email || null,
        postal_code: fields.postal_code || null,
        address: fields.address || null,
        city: fields.city || null,
        description: fields.description || null,
        source: source || 'admin',
        image_urls: image_urls ?? [],
        pricing_type: resolvedPricing,
        pricing_note: resolvedNote,
        price_status: resolvedStatus,
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
    const { data: proof } = await context.supabase
      .from('lead_completion_proofs')
      .select('*')
      .eq('lead_id', data.leadId)
      .maybeSingle()
    let photoUrls: string[] = []
    let meterCabinetPhotoUrls: string[] = []
    if ((lead.image_urls ?? []).length) {
      const { signedLeadImageUrls } = await import('@/lib/lead-dispatch.server')
      photoUrls = await signedLeadImageUrls(lead.image_urls as string[])
      meterCabinetPhotoUrls = await signedLeadImageUrls((lead.image_urls as string[]).filter((path) => path.startsWith('meter-cabinet/')))
    }
    let evidenceUrls: Record<string, string> = {}
    if (proof) {
      const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
      for (const [kind, path] of [['before', proof.before_photo_path], ['result', proof.result_photo_path], ['signature', proof.signature_path]] as const) {
        if (!path) continue
        const { data: signed } = await supabaseAdmin.storage.from('lead-completion-proof').createSignedUrl(path, 600)
        if (signed?.signedUrl) evidenceUrls[kind] = signed.signedUrl
      }
    }
    // Bezorging van de klantgegevens in de privéchat van de monteur. Blijft
    // die hangen, dan hoort dat zichtbaar in het dossier te staan.
    const { data: privateDelivery } = await context.supabase
      .from('lead_deliveries')
      .select('status, attempts, last_error, sent_at, contractor_id')
      .eq('lead_id', data.leadId)
      .maybeSingle()
    return {
      lead,
      timeline: timeline ?? [],
      deliveries: deliveries ?? [],
      privateDelivery: privateDelivery ?? null,
      photoUrls,
      meterCabinetPhotoUrls,
      proof,
      evidenceUrls,
    }
  })

export const listIncompleteCompletionProofs = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const { data, error } = await context.supabase.from('lead_completion_proofs')
      .select('lead_id, started_at, state, leads:lead_id(id, customer_name, customer_phone, job_type, city, postal_code, created_at), contractors:contractor_id(name, phone)')
      .is('completed_at', null).order('started_at', { ascending: true }).limit(50)
    if (error) throw new Error(error.message)
    return data ?? []
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
    await assertTestSafeLead(context, data.leadId)
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
    await assertTestSafeLead(context, data.leadId)
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

/**
 * Een opgeslagen foto verwijderen. Kantoor moet een verkeerde of privacygevoelige
 * foto uit een dossier kunnen halen; het bestand gaat ook echt uit de opslag.
 */
export const removeLeadPhoto = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ leadId: z.string().uuid(), path: z.string().min(3).max(300) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { data: lead, error } = await context.supabase
      .from('leads')
      .select('id, image_urls')
      .eq('id', data.leadId)
      .single()
    if (error) throw new Error(error.message)
    const current = (lead.image_urls ?? []) as string[]
    if (!current.includes(data.path)) throw new Error('Deze foto hoort niet bij dit dossier.')
    const next = current.filter((path) => path !== data.path)
    const { error: updateError } = await context.supabase
      .from('leads')
      .update({ image_urls: next })
      .eq('id', data.leadId)
    if (updateError) throw new Error(updateError.message)
    try {
      const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
      await supabaseAdmin.storage.from('lead-attachments').remove([data.path])
    } catch (e) {
      console.error('removeLeadPhoto: bestand verwijderen mislukt', data.path, e)
    }
    await writeAudit(data.leadId, context.userId, 'photo_removed', { path: data.path })
    return { ok: true, remaining: next.length }
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
    return (
      data ?? {
        id: 1,
        default_price_cents: 1000,
        urgent_price_cents: 1000,
        escalation_urgent_minutes: DEFAULT_ESCALATION_MINUTES.urgent,
        escalation_planned_minutes: DEFAULT_ESCALATION_MINUTES.planned,
      }
    )
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

export const updateEscalationSettings = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        escalation_urgent_minutes: z.number().int().min(1).max(1440),
        escalation_planned_minutes: z.number().int().min(1).max(10080),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { error } = await context.supabase.from('lead_settings').upsert({ id: 1, ...data })
    if (error) throw new Error(error.message)

    // Nieuwe termijn geldt ook voor wat nu nog openstaat; afgehandelde leads
    // houden de termijn waaronder ze zijn beoordeeld.
    const { data: open } = await context.supabase
      .from('leads')
      .select('id, is_urgent, job_type')
      .in('status', ['new', 'dispatched'])
      .is('claimed_by', null)
      .is('escalated_at', null)
    const rows = open ?? []
    for (const minutes of [data.escalation_urgent_minutes, data.escalation_planned_minutes]) {
      const ids = rows.filter((row: any) => escalationMinutes(row, data) === minutes).map((row: any) => row.id)
      if (ids.length) await context.supabase.from('leads').update({ escalation_minutes: minutes }).in('id', ids)
    }
    return { ok: true, updatedOpenLeads: rows.length }
  })

export const updateClaimPrioritySettings = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        claim_priority_enabled: z.boolean(),
        busy_window_minutes: z.number().int().min(5).max(1440),
        claim_delay_seconds: z.number().int().min(0).max(600),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { error } = await context.supabase.from('lead_settings').upsert({ id: 1, ...data })
    if (error) throw new Error(error.message)
    return { ok: true }
  })

/** Leeslijst voor kantoor: wie is bezig, wie is vrij. Geen prestatiemeting. */
export const listClaimPriorityState = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const { data, error } = await context.supabase
      .from('contractors')
      .select('id, name, is_active, last_storing_claim_at')
      .eq('is_active', true)
      .order('name')
    if (error) throw new Error(error.message)
    return data ?? []
  })

/**
 * Eerste contact: alleen de eerste keer vastleggen, daarna nooit overschrijven.
 * Een claim door een monteur zet hetzelfde veld in de database.
 */
export const markFirstContact = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ leadId: z.string().uuid(), channel: z.enum(['call', 'whatsapp']) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { data: rows, error } = await context.supabase
      .from('leads')
      .update({ first_contact_at: new Date().toISOString() })
      .eq('id', data.leadId)
      .is('first_contact_at', null)
      .select('id')
    if (error) throw new Error(error.message)
    const marked = (rows ?? []).length > 0
    if (marked) await writeAudit(data.leadId, context.userId, 'first_contact', { channel: data.channel })
    return { marked }
  })

/**
 * Afloop vastleggen. Alleen op een opgepakte lead, en maar één keer: wijzigen
 * kan alleen kantoor, met `override`, en dat komt in de tijdlijn.
 */
export const setLeadOutcome = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        leadId: z.string().uuid(),
        outcome: z.enum(OUTCOMES),
        note: z.string().trim().max(300).optional(),
        override: z.boolean().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { data: lead, error: readError } = await context.supabase
      .from('leads')
      .select('id, status, outcome')
      .eq('id', data.leadId)
      .maybeSingle()
    if (readError) throw new Error(readError.message)
    if (!lead) throw new Error('Lead niet gevonden')
    if ((lead as any).status !== 'claimed') throw new Error('Afloop kan alleen bij een opgepakte lead')
    const previous = (lead as any).outcome as string | null
    if (previous && !data.override) throw new Error('Er staat al een afloop')

    const needsNote = data.outcome !== 'done'
    const { error } = await context.supabase
      .from('leads')
      .update({
        outcome: data.outcome,
        outcome_at: new Date().toISOString(),
        outcome_note: needsNote ? (data.note?.trim() || null) : null,
        next_step_at: null,
        next_step_kind: null,
      })
      .eq('id', data.leadId)
    if (error) throw new Error(error.message)
    await writeAudit(data.leadId, context.userId, previous ? 'outcome_changed' : 'outcome_set', {
      outcome: data.outcome,
      previous,
      note: needsNote ? (data.note?.trim() || null) : null,
    })
    return { ok: true }
  })

/**
 * "Geen antwoord": poging tellen en meteen de volgende stap voorstellen.
 * Na drie pogingen is het voorstel afsluiten als onbereikbaar.
 */
export const recordNoAnswer = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ leadId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { data: lead, error: readError } = await context.supabase
      .from('leads')
      .select('id, contact_attempts, last_customer_message_at')
      .eq('id', data.leadId)
      .maybeSingle()
    if (readError) throw new Error(readError.message)
    if (!lead) throw new Error('Lead niet gevonden')

    const attempts = Number((lead as any).contact_attempts ?? 0) + 1
    const windowOpen = ['open', 'closing'].includes(whatsappWindow((lead as any).last_customer_message_at ?? null).state)
    const step = suggestNextStep(attempts, windowOpen)
    const patch =
      step.kind === 'close'
        ? { contact_attempts: attempts, next_step_at: null, next_step_kind: 'close' as const }
        : { contact_attempts: attempts, next_step_at: step.at, next_step_kind: step.kind }
    const { error } = await context.supabase.from('leads').update(patch).eq('id', data.leadId)
    if (error) throw new Error(error.message)
    await writeAudit(data.leadId, context.userId, 'no_answer', { attempts, next: step.kind })
    return { attempts, step }
  })

/** Vervolgstap handmatig zetten of wissen. */
export const setNextStep = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        leadId: z.string().uuid(),
        kind: z.enum(['call', 'whatsapp', 'close']).nullable(),
        at: z.string().datetime({ offset: true }).nullable().default(null),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { error } = await context.supabase
      .from('leads')
      .update({
        next_step_kind: data.kind,
        next_step_at: data.kind && data.kind !== 'close' ? data.at : null,
      })
      .eq('id', data.leadId)
    if (error) throw new Error(error.message)
    await writeAudit(data.leadId, context.userId, 'next_step_set', { kind: data.kind, at: data.at })
    return { ok: true }
  })

/** Mediane tijd tot eerste contact over de laatste zeven dagen, plus het aantal zonder contact. */
export const getResponseStats = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const since = new Date(Date.now() - 7 * 86_400_000).toISOString()
    const { data, error } = await context.supabase
      .from('leads')
      .select('created_at, dispatched_at, first_contact_at')
      .gte('created_at', since)
      .not('status', 'in', '(cancelled,blocked_spam)')
    if (error) throw new Error(error.message)
    const rows = data ?? []
    const minutes = rows
      .filter((row: any) => row.first_contact_at)
      .map((row: any) => (Date.parse(row.first_contact_at) - Date.parse(row.dispatched_at ?? row.created_at)) / 60_000)
      .filter((value: number) => Number.isFinite(value) && value >= 0)
      .sort((a: number, b: number) => a - b)
    const median = minutes.length
      ? Math.round(minutes.length % 2 ? minutes[Math.floor(minutes.length / 2)]! : (minutes[minutes.length / 2 - 1]! + minutes[minutes.length / 2]!) / 2)
      : null
    return { medianMinutes: median, targetMinutes: 15, withoutContact: rows.filter((row: any) => !row.first_contact_at).length }
  })


/** Interne notitie: alleen een regel in het append-only auditlog, geen kolomwijziging. */
export const addLeadNote = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ leadId: z.string().uuid(), note: z.string().trim().min(1).max(500) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    await writeAudit(data.leadId, context.userId, 'note_added', { note: data.note })
    return { ok: true }
  })

/** Vertaalt een weigering van de database naar tekst die kantoor begrijpt. */
function assignmentRefusal(result: any): string | null {
  const euro = (cents: number) => `\u20ac\u00a0${(Number(cents ?? 0) / 100).toFixed(2).replace('.', ',')}`
  switch (result?.reason) {
    case 'not_found':
      return 'Deze klus bestaat niet meer.'
    case 'not_assignable':
      return 'Deze klus is geannuleerd of geblokkeerd en kan niet worden toegewezen.'
    case 'owner_changed':
      return `Niet doorgevoerd: de klus staat inmiddels op naam van ${result.current_owner_name ?? 'een andere monteur'}. Ververs en probeer opnieuw.`
    case 'already_owned':
      return 'Heeft al een eigenaar \u2014 gebruik Overdragen.'
    case 'already_assigned':
      return 'Deze klus staat al op deze monteur.'
    case 'contractor_not_found':
      return 'Deze monteur bestaat niet meer.'
    case 'inactive':
      return `${result.contractor_name ?? 'Deze monteur'} staat op inactief en kan geen klussen krijgen.`
    case 'insufficient_balance':
      return `${result.contractor_name ?? 'Deze monteur'} heeft te weinig saldo: ${euro(result.balance_cents)} beschikbaar, ${euro(result.price_cents)} nodig.`
    case 'not_owned':
      return 'Deze klus heeft geen eigenaar.'
    default:
      return result?.ok ? null : 'Niet doorgevoerd.'
  }
}

/**
 * Toewijzen en overdragen van één lead. Alle regels (actief, saldo, bestaande
 * eigenaar, gelijktijdige beheerders) worden in de database afgedwongen, en
 * eigenaarwissel, terugbetaling en afboeking gebeuren als één transactie.
 * Terugbetalen aan de vorige monteur is een bewuste keuze per geval.
 */
export const reassignLead = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        leadId: z.string().uuid(),
        toContractorId: z.string().uuid(),
        /** Verwachte huidige eigenaar; beschermt tegen twee beheerders tegelijk. */
        expectedOwnerId: z.string().uuid().nullable(),
        /** Verplichte keuze zodra er een vorige eigenaar is. */
        refundPrevious: z.boolean(),
        chargeNew: z.boolean().default(true),
        reason: z.string().trim().max(200).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    await assertTestSafeLead(context, data.leadId)

    const { data: result, error } = await context.supabase.rpc('admin_assign_lead', {
      _lead_id: data.leadId,
      _contractor_id: data.toContractorId,
      _expected_owner: data.expectedOwnerId as unknown as string,
      _allow_owner_change: true,
      _refund_previous: data.refundPrevious,
      _charge_new: data.chargeNew,
      _reason: data.reason ? `Overdracht: ${data.reason}` : 'Overdracht door kantoor',
    })
    if (error) throw new Error(error.message)
    const refusal = assignmentRefusal(result)
    if (refusal) throw new Error(refusal)

    const outcome = result as any
    const { syncGroupClaimed, deliverAssignedLead } = await import('@/lib/lead-assignment.server')
    const group = await syncGroupClaimed(data.leadId, outcome.contractor_name ?? 'VoltFix')
    const delivery = await deliverAssignedLead(data.leadId, data.toContractorId)

    await writeAudit(data.leadId, context.userId, 'reassigned', {
      from_contractor_id: outcome.previous_owner_id ?? null,
      to_contractor_id: data.toContractorId,
      refunded_cents: outcome.refunded_cents ?? 0,
      charged_cents: outcome.charged_cents ?? 0,
      reason: data.reason ?? null,
      delivered: delivery.delivered,
      delivery_reason: delivery.reason,
      group_message_updated: group.ok,
    })
    return {
      ok: true,
      delivered: delivery.delivered,
      deliveryReason: delivery.reason,
      groupMessageUpdated: group.ok,
    }
  })

/**
 * Toewijzing opheffen: de klus komt terug op de stand van vóór de toewijzing en
 * de knop in de groep wordt weer actief. Terugbetalen is een verplichte keuze;
 * eigenaarwissel en geld gaan als één transactie.
 */
export const releaseLead = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        leadId: z.string().uuid(),
        expectedOwnerId: z.string().uuid(),
        refundPrevious: z.boolean(),
        reason: z.string().trim().max(200).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    await assertTestSafeLead(context, data.leadId)
    const { data: result, error } = await context.supabase.rpc('admin_release_lead', {
      _lead_id: data.leadId,
      _expected_owner: data.expectedOwnerId as unknown as string,
      _refund_previous: data.refundPrevious,
      _reason: data.reason ? `Toewijzing opgeheven: ${data.reason}` : 'Toewijzing opgeheven door kantoor',
    })
    if (error) throw new Error(error.message)
    const refusal = assignmentRefusal(result)
    if (refusal) throw new Error(refusal)

    const outcome = result as any
    const { syncGroupOpen } = await import('@/lib/lead-assignment.server')
    const group = await syncGroupOpen(data.leadId)

    await writeAudit(data.leadId, context.userId, 'released', {
      from_contractor_id: data.expectedOwnerId,
      refunded_cents: outcome.refunded_cents ?? 0,
      reason: data.reason ?? null,
      status: outcome.status,
      group_message_updated: group.ok,
    })
    return { ok: true, groupMessageUpdated: group.ok, status: outcome.status as string }
  })

/**
 * Nieuwe poging voor berichten die niet zijn aangekomen: het groepsbericht en
 * het privébericht met klantgegevens.
 */
export const retryLeadMessages = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ leadId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { data: lead, error } = await context.supabase
      .from('leads')
      .select('id, claimed_by, contractors:claimed_by(name)')
      .eq('id', data.leadId)
      .single()
    if (error) throw new Error(error.message)

    const { syncGroupClaimed, syncGroupOpen, deliverAssignedLead } = await import('@/lib/lead-assignment.server')
    const group = lead.claimed_by
      ? await syncGroupClaimed(data.leadId, (lead as any).contractors?.name ?? 'VoltFix')
      : await syncGroupOpen(data.leadId)
    const delivery = lead.claimed_by
      ? await deliverAssignedLead(data.leadId, lead.claimed_by as string)
      : { delivered: true, reason: 'sent' as const }

    await writeAudit(data.leadId, context.userId, 'messages_retried', {
      group_message_updated: group.ok,
      delivered: delivery.delivered,
    })
    return { groupMessageUpdated: group.ok, delivered: delivery.delivered }
  })

/**
 * Berichten die niet zijn aangekomen: privébericht blijft hangen of het
 * groepsbericht is niet bijgewerkt. Voedt de waarschuwing op Vandaag.
 */
/**
 * Alles wat je nodig hebt om te beslissen wie een spoedklus krijgt: per monteur
 * de open klussen, de planning, botsende afspraken en het saldo.
 * Een afspraak duurt in de praktijk ongeveer twee uur; binnen dat venster
 * noemen we twee afspraken botsend.
 */
const SLOT_MS = 2 * 60 * 60 * 1000
/** Langer dan vier dagen op naam zonder afloop noemen we "te lang open". */
const STALE_MS = 4 * 86_400_000


/**
 * Testmodus: staat VOLTFIX_TEST_MODE aan, dan mag de backoffice alleen
 * verzonnen testdossiers wijzigen. Zo kan er in de preview-omgeving nooit een
 * echt dossier of een echt saldo veranderen.
 */
function testModeOn(): boolean {
  const flag = process.env['VOLTFIX_TEST_MODE']?.trim().toLowerCase()
  return flag === '1' || flag === 'true'
}

async function assertTestSafeLead(context: any, leadId: string) {
  if (!testModeOn()) return
  const { data } = await context.supabase.from('leads').select('is_test').eq('id', leadId).maybeSingle()
  if (!data?.is_test) {
    throw new Error('Testmodus staat aan: dit is een echt dossier, er is niets gewijzigd. Gebruik een testdossier.')
  }
}

async function assertTestSafeContractor(context: any, contractorId: string) {
  if (!testModeOn()) return
  const { data } = await context.supabase.from('contractors').select('is_test').eq('id', contractorId).maybeSingle()
  if (!data?.is_test) {
    throw new Error('Testmodus staat aan: dit is een echte ZZP\u2019er, het saldo is niet gewijzigd.')
  }
}

export const listContractorPlanning = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const [contractorsRes, leadsRes] = await Promise.all([
      context.supabase
        .from('contractors')
        .select('id, name, company, phone, balance_cents, is_active')
        .order('name'),
      context.supabase
        .from('leads')
        .select('id, ref_number, customer_name, address, city, job_type, status, is_urgent, price_cents, claimed_by, claimed_at, scheduled_at, outcome')
        .not('claimed_by', 'is', null)
        .not('status', 'in', '(closed,not_proceeded,cancelled,spam_review)')
        .is('outcome', null),
    ])
    if (contractorsRes.error) throw new Error(contractorsRes.error.message)
    if (leadsRes.error) throw new Error(leadsRes.error.message)

    const now = Date.now()
    const byContractor = new Map<string, any[]>()
    for (const lead of (leadsRes.data ?? []) as any[]) {
      const list = byContractor.get(lead.claimed_by) ?? []
      list.push(lead)
      byContractor.set(lead.claimed_by, list)
    }

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const endOfToday = startOfToday.getTime() + 86_400_000

    return ((contractorsRes.data ?? []) as any[]).map((contractor) => {
      const leads = (byContractor.get(contractor.id) ?? []).slice()
      const planned = leads
        .filter((lead) => lead.scheduled_at)
        .sort((a, b) => String(a.scheduled_at).localeCompare(String(b.scheduled_at)))

      // Botsing: twee afspraken die elkaar binnen twee uur overlappen.
      const clashing = new Set<string>()
      for (let i = 0; i < planned.length - 1; i += 1) {
        const a = new Date(planned[i].scheduled_at).getTime()
        const b = new Date(planned[i + 1].scheduled_at).getTime()
        if (Math.abs(b - a) < SLOT_MS) {
          clashing.add(planned[i].id)
          clashing.add(planned[i + 1].id)
        }
      }

      const jobs = leads
        .map((lead) => ({
          id: lead.id as string,
          ref: lead.ref_number as number | null,
          name: lead.customer_name as string,
          address: [lead.address, lead.city].filter(Boolean).join(', '),
          jobType: lead.job_type as string,
          status: lead.status as string,
          urgent: Boolean(lead.is_urgent),
          scheduledAt: (lead.scheduled_at as string | null) ?? null,
          claimedAt: (lead.claimed_at as string | null) ?? null,
          openDays: lead.claimed_at ? Math.floor((now - new Date(lead.claimed_at).getTime()) / 86_400_000) : null,
          stale: Boolean(lead.claimed_at && now - new Date(lead.claimed_at).getTime() > STALE_MS && !lead.scheduled_at),
          clash: clashing.has(lead.id),
        }))
        .sort((a, b) => {
          if (a.scheduledAt && b.scheduledAt) return a.scheduledAt.localeCompare(b.scheduledAt)
          if (a.scheduledAt) return -1
          if (b.scheduledAt) return 1
          return String(b.claimedAt ?? '').localeCompare(String(a.claimedAt ?? ''))
        })

      const todayCount = jobs.filter(
        (job) => job.scheduledAt && new Date(job.scheduledAt).getTime() >= startOfToday.getTime() && new Date(job.scheduledAt).getTime() < endOfToday,
      ).length

      return {
        id: contractor.id as string,
        name: contractor.name as string,
        company: (contractor.company as string | null) ?? null,
        phone: (contractor.phone as string | null) ?? null,
        balanceCents: Number(contractor.balance_cents ?? 0),
        isActive: Boolean(contractor.is_active),
        openCount: jobs.length,
        todayCount,
        staleCount: jobs.filter((job) => job.stale).length,
        clashCount: jobs.filter((job) => job.clash).length,
        unplannedCount: jobs.filter((job) => !job.scheduledAt).length,
        jobs,
      }
    })
  })

export const listMessageProblems = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const { data: stuck } = await context.supabase
      .from('lead_deliveries')
      .select('lead_id, status, attempts, leads:lead_id(id, ref_number, customer_name)')
      .neq('status', 'sent')
      .limit(25)
    const { data: groupFailed } = await context.supabase
      .from('lead_notification_outbox')
      .select('lead_id, status, channel, leads:lead_id(id, ref_number, customer_name)')
      .eq('channel', 'telegram_group')
      .eq('status', 'failed')
      .limit(25)

    const rows = new Map<string, { leadId: string; ref: number | null; name: string; kinds: string[] }>()
    const add = (leadId: string, lead: any, kind: string) => {
      const current = rows.get(leadId) ?? {
        leadId,
        ref: lead?.ref_number ?? null,
        name: lead?.customer_name ?? 'Onbekend',
        kinds: [] as string[],
      }
      if (!current.kinds.includes(kind)) current.kinds.push(kind)
      rows.set(leadId, current)
    }
    for (const row of stuck ?? []) add(row.lead_id as string, (row as any).leads, 'priv\u00e9bericht')
    for (const row of groupFailed ?? []) add(row.lead_id as string, (row as any).leads, 'groepsbericht')
    return [...rows.values()].slice(0, 20)
  })

export const cancelLead = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ leadId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    await assertTestSafeLead(context, data.leadId)
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

/**
 * Herkenning van een geplakt WhatsApp-gesprek. Server-side, zodat de regels
 * op één plek staan; het gesprek zelf wordt nergens opgeslagen.
 */
export const parsePastedConversation = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ text: z.string().max(20000) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    return parseWhatsApp(data.text)
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

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data: result, error } = await supabaseAdmin.rpc('approve_review_bonus', {
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
        context.supabase.from('leads').select('claimed_by, outcome, reviewed_at, review_rating').eq('outcome', 'done'),
      ])
    if (cErr) throw new Error(cErr.message)
    if (tErr) throw new Error(tErr.message)
    if (rErr) throw new Error(rErr.message)
    const bonus = new Map<string, number>()
    for (const t of tx ?? []) {
      bonus.set(t.contractor_id, (bonus.get(t.contractor_id) ?? 0) + (t.amount_cents ?? 0))
    }
    const counts = new Map<string, Record<number, number>>()
    const completionCounts = new Map<string, { completed: number; reviewed: number }>()
    for (const r of rated ?? []) {
      if (!r.claimed_by) continue
      const completion = completionCounts.get(r.claimed_by) ?? { completed: 0, reviewed: 0 }
      completion.completed += 1
      if (r.reviewed_at) completion.reviewed += 1
      completionCounts.set(r.claimed_by, completion)
      if (!r.review_rating) continue
      const entry = counts.get(r.claimed_by) ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      entry[r.review_rating] = (entry[r.review_rating] ?? 0) + 1
      counts.set(r.claimed_by, entry)
    }
    return (contractors ?? []).map((c) => {
      const completion = completionCounts.get(c.id) ?? { completed: 0, reviewed: 0 }
      return {
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
      completedCount: completion.completed,
      reviewsReceived: completion.reviewed,
      reviewPercentage: completion.completed ? Math.round((completion.reviewed / completion.completed) * 100) : 0,
    }
    })
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

/* ---------------- Plandatum en reviewafsluiting vanuit kantoor ---------------- */

/** Kantoor vult of wijzigt dag en tijd; elke wijziging krijgt een tijdlijnregel. */
export const setLeadSchedule = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        leadId: z.string().uuid(),
        day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        slot: z.string().regex(/^\d{2}:\d{2}$/),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context)
    const { isValidDay, isValidSlot, toScheduleIso, scheduleText } = await import('./lead-schedule')
    if (!isValidDay(data.day) || !isValidSlot(data.slot)) throw new Error('Kies een geldige dag en tijd.')
    const iso = toScheduleIso(data.day, data.slot)
    const { data: before } = await context.supabase
      .from('leads')
      .select('scheduled_at')
      .eq('id', data.leadId)
      .maybeSingle()
    const { error } = await context.supabase.from('leads').update({ scheduled_at: iso }).eq('id', data.leadId)
    if (error) throw new Error(error.message)
    await writeAudit(data.leadId, context.userId, before?.scheduled_at ? 'schedule_changed' : 'schedule_set', {
      by: 'Kantoor',
      from: before?.scheduled_at ? scheduleText(before.scheduled_at) : null,
      to: scheduleText(iso),
    })
    return { ok: true, scheduledAt: iso }
  })

/** Kantoor sluit het reviewverzoek eerder dan de automatische zevende dag. */
export const closeReviewWithoutReview = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ leadId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    await assertAdmin(context)
    const { error } = await context.supabase
      .from('leads')
      .update({ review_closed_at: new Date().toISOString() })
      .eq('id', data.leadId)
      .is('reviewed_at', null)
      .is('review_closed_at', null)
    if (error) throw new Error(error.message)
    await writeAudit(data.leadId, context.userId, 'review_closed_manual', {})
    return { ok: true }
  })
