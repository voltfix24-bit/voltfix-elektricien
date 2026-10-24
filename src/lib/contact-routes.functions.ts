import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import {
  CONTACT_EVENT_NAMES, groupContactRoutes, hashIdentity, revenueTotals, routeIdentity, type ContactEvent, type RawEvent,
} from '@/lib/contact-routes'

async function assertAdmin(context: any) {
  const { data, error } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' })
  if (error) throw new Error('Rechten controleren mislukt.')
  if (!data) throw new Error('Geen beheerdersrechten.')
}

const MAX_ROWS = 3000
const COLS = 'id, created_at, event_name, source, device, page_path, lead_id, gclid, gbraid, wbraid, click_ref'

/** Alle gclids die in de database bij deze referenties horen (bepaalt eenduidigheid). */
async function gclidsForRefs(sb: any, refs: string[]) {
  const out = new Map<string, Set<string>>()
  for (let i = 0; i < refs.length; i += 200) {
    const { data, error } = await sb.from('conversion_events').select('click_ref, gclid')
      .in('click_ref', refs.slice(i, i + 200)).not('gclid', 'is', null)
    if (error) throw new Error('Referenties controleren mislukt.')
    for (const r of data ?? []) {
      const s = out.get(r.click_ref) ?? new Set<string>()
      s.add(r.gclid); out.set(r.click_ref, s)
    }
  }
  return out
}

const listInput = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source: z.enum(['google-ads', 'all']).default('google-ads'),
  action: z.enum(['all', ...CONTACT_EVENT_NAMES]).default('all'),
  review: z.enum(['all', 'open', 'real_contact', 'no_contact', 'unknown']).default('all'),
  search: z.string().trim().max(20).default(''),
  page: z.number().int().min(0).max(500).default(0),
  pageSize: z.number().int().min(5).max(50).default(20),
})

const amsDay = (iso: string) => new Date(iso).toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' })

export const listContactRoutes = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof listInput>) => listInput.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context)
    const sb = context.supabase
    const lo = new Date(`${data.from}T00:00:00Z`); lo.setUTCHours(lo.getUTCHours() - 3)
    const hi = new Date(`${data.to}T23:59:59Z`); hi.setUTCHours(hi.getUTCHours() + 3)
    const { data: rows, error } = await sb.from('conversion_events').select(COLS)
      .in('event_name', [...CONTACT_EVENT_NAMES])
      .eq('is_bot', false).eq('is_internal', false)
      .gte('created_at', lo.toISOString()).lte('created_at', hi.toISOString())
      .order('created_at', { ascending: false }).limit(MAX_ROWS)
    if (error) throw new Error('Gebeurtenissen laden mislukt.')
    const truncated = (rows?.length ?? 0) >= MAX_ROWS

    const inRange = (rows ?? []).filter((r) => { const d = amsDay(r.created_at); return d >= data.from && d <= data.to })
    const refs = [...new Set(inRange.filter((r) => !r.gclid && r.click_ref).map((r) => r.click_ref as string))]
    const refGclids = await gclidsForRefs(sb, refs)

    const events: ContactEvent[] = []
    const gclidByKey = new Map<string, string>()
    for (const r of inRange) {
      const ident = routeIdentity(r as RawEvent, refGclids)
      const routeKey = await hashIdentity(ident)
      if (ident.startsWith('g:')) gclidByKey.set(routeKey, ident.slice(2))
      events.push({ id: r.id, createdAt: r.created_at, eventName: r.event_name, source: r.source, device: r.device,
        pagePath: r.page_path, leadId: r.lead_id, clickRef: r.click_ref, hasGclid: Boolean(r.gclid),
        hasBraid: Boolean(r.gbraid || r.wbraid), routeKey })
    }

    // Automatische dossierkoppeling alleen op exact dezelfde gclid (nooit braid).
    const leadIdsByKey = new Map<string, string[]>()
    const gclids = [...new Set(gclidByKey.values())]
    for (let i = 0; i < gclids.length; i += 200) {
      const { data: l } = await sb.from('leads').select('id, gclid').eq('is_test', false).in('gclid', gclids.slice(i, i + 200))
      for (const x of l ?? []) for (const [k, g] of gclidByKey) if (g === x.gclid) leadIdsByKey.set(k, [...(leadIdsByKey.get(k) ?? []), x.id])
    }

    let routes = groupContactRoutes(events, leadIdsByKey)
    if (data.source === 'google-ads') routes = routes.filter((r) => r.evidence !== 'none')

    const reviews = new Map<string, any>()
    const keys = routes.map((r) => r.key)
    for (let i = 0; i < keys.length; i += 200) {
      const { data: rv, error: e2 } = await sb.from('contact_route_reviews').select('*').in('route_key', keys.slice(i, i + 200))
      if (e2) throw new Error('Beoordelingen laden mislukt.')
      for (const r of rv ?? []) reviews.set(r.route_key, r)
    }

    // Dossiers ophalen (auto + handmatig) voor weergave en zoeken.
    const allLeadIds = [...new Set(routes.flatMap((r) => [...r.leadIds, reviews.get(r.key)?.lead_id].filter(Boolean)))] as string[]
    const leads: Record<string, { id: string; ref: number; status: string; isTest: boolean }> = {}
    for (let i = 0; i < allLeadIds.length; i += 200) {
      const { data: l } = await sb.from('leads').select('id, ref_number, status, is_test').in('id', allLeadIds.slice(i, i + 200))
      for (const x of l ?? []) leads[x.id] = { id: x.id, ref: x.ref_number, status: x.status, isTest: x.is_test }
    }

    // Filters pas ná het groeperen: de hele route blijft zichtbaar.
    if (data.action !== 'all') routes = routes.filter((r) => r.actions.includes(data.action))
    if (data.search) {
      const s = data.search.replace('#', '').toUpperCase()
      routes = routes.filter((r) => r.clickRefs.some((c) => c.toUpperCase().includes(s)) ||
        [...r.leadIds, reviews.get(r.key)?.lead_id].some((id) => id && String(leads[id]?.ref) === s))
    }

    const reviewed = routes.map((r) => reviews.get(r.key)).filter(Boolean)
    const rev = revenueTotals(reviewed)
    const counts = {
      routes: routes.length,
      calls: routes.filter((r) => r.actions.includes('contact_call')).length,
      whatsapp: routes.filter((r) => r.actions.includes('contact_whatsapp')).length,
      forms: routes.filter((r) => r.actions.some((a) => a === 'quote_submitted' || a === 'schedule_request_success')).length,
      open: routes.filter((r) => !reviews.has(r.key)).length,
      realContact: reviewed.filter((r) => r.contact_status === 'real_contact').length,
      revenueCents: rev.cents,
      revenueUnknown: rev.unknown,
    }

    if (data.review === 'open') routes = routes.filter((r) => !reviews.has(r.key))
    else if (data.review !== 'all') routes = routes.filter((r) => reviews.get(r.key)?.contact_status === data.review)

    const total = routes.length
    const pageRoutes = routes.slice(data.page * data.pageSize, (data.page + 1) * data.pageSize)

    return {
      total, counts, leads, truncated, maxRows: MAX_ROWS,
      rows: pageRoutes.map((r) => ({
        key: r.key, firstAt: r.firstAt, lastAt: r.lastAt, source: r.source, device: r.device, evidence: r.evidence,
        actions: r.actions, leadIds: r.leadIds, clickRefs: r.clickRefs, anchorEventId: r.events[0].id,
        // Geen Google-klik-id's naar de browser.
        events: r.events.map((e) => ({ id: e.id, at: e.createdAt, eventName: e.eventName, pagePath: e.pagePath })),
        review: reviews.get(r.key) ?? null,
      })),
    }
  })

/** Herberekent de route-sleutel van een bestaande, niet-bot, niet-interne actie. */
export async function expectedRouteKey(sb: any, eventId: string): Promise<string | null> {
  const { data: e, error } = await sb.from('conversion_events').select('id, gclid, gbraid, wbraid, click_ref, lead_id, event_name')
    .eq('id', eventId).eq('is_bot', false).eq('is_internal', false).maybeSingle()
  if (error) throw new Error('Actie controleren mislukt.')
  if (!e || !(CONTACT_EVENT_NAMES as readonly string[]).includes(e.event_name)) return null
  const refGclids = !e.gclid && e.click_ref ? await gclidsForRefs(sb, [e.click_ref]) : new Map()
  return hashIdentity(routeIdentity(e, refGclids))
}

const saveInput = z.object({
  routeKey: z.string().regex(/^c:[0-9a-f]{24}$/),
  eventId: z.string().uuid(),
  contactStatus: z.enum(['real_contact', 'no_contact', 'unknown']),
  outcome: z.enum(['remote_help', 'scheduled', 'completed', 'dropped']).nullable(),
  verificationSource: z.enum(['call_history', 'whatsapp', 'form', 'manual']).nullable(),
  note: z.string().trim().max(2000).nullable(),
  leadRef: z.number().int().positive().nullable(),
  revenueCents: z.number().int().min(0).max(10_000_000).nullable(),
})

export const saveContactRouteReview = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof saveInput>) => saveInput.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context)
    const sb = context.supabase
    const expected = await expectedRouteKey(sb, data.eventId)
    if (!expected) throw new Error('Deze actie bestaat niet (meer) of telt niet mee.')
    if (expected !== data.routeKey) throw new Error('Route klopt niet met de actie; vernieuw de pagina.')
    let leadId: string | null = null
    if (data.leadRef != null) {
      const { data: l, error } = await sb.from('leads').select('id, is_test').eq('ref_number', data.leadRef).maybeSingle()
      if (error) throw new Error('Dossier zoeken mislukt.')
      if (!l) throw new Error(`Dossier #${data.leadRef} bestaat niet.`)
      if (l.is_test) throw new Error(`Dossier #${data.leadRef} is een testdossier.`)
      leadId = l.id
    }
    const { error } = await sb.from('contact_route_reviews').upsert({
      route_key: data.routeKey, anchor_event_id: data.eventId, contact_status: data.contactStatus,
      outcome: data.contactStatus === 'real_contact' ? data.outcome : null,
      verification_source: data.verificationSource,
      note: data.note || null, lead_id: leadId, revenue_cents: data.revenueCents, reviewed_by: context.userId,
    }, { onConflict: 'route_key' })
    if (error) throw new Error('Beoordeling opslaan mislukt.')
    return { ok: true }
  })

export const getContactRouteHistory = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { routeKey: string }) => z.object({ routeKey: z.string().max(60) }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context)
    const { data: rows, error } = await context.supabase.from('contact_route_review_history')
      .select('id, actor_id, new_value, created_at').eq('route_key', data.routeKey).order('created_at', { ascending: false }).limit(50)
    if (error) throw new Error('Geschiedenis laden mislukt.')
    return rows ?? []
  })
