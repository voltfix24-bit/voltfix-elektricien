import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { CONTACT_EVENT_NAMES, clickIdentity, groupContactRoutes, type ContactEvent } from '@/lib/contact-routes'

async function assertAdmin(context: any) {
  const { data, error } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' })
  if (error) throw new Error('Rechten controleren mislukt.')
  if (!data) throw new Error('Geen beheerdersrechten.')
}

async function hashKey(raw: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
  return [...new Uint8Array(buf)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('')
}

const listInput = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source: z.enum(['google-ads', 'all']).default('google-ads'),
  action: z.enum(['all', ...CONTACT_EVENT_NAMES]).default('all'),
  review: z.enum(['all', 'open', 'real_contact', 'no_contact', 'unknown']).default('all'),
  page: z.number().int().min(0).max(500).default(0),
  pageSize: z.number().int().min(5).max(50).default(20),
})

/** Datum (Amsterdam) → UTC-grens; ruim genomen, daarna exact gefilterd op Amsterdamse dag. */
function amsDay(iso: string) {
  return new Date(iso).toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' })
}

export const listContactRoutes = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof listInput>) => listInput.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context)
    const sb = context.supabase
    const lo = new Date(`${data.from}T00:00:00Z`); lo.setUTCHours(lo.getUTCHours() - 3)
    const hi = new Date(`${data.to}T23:59:59Z`); hi.setUTCHours(hi.getUTCHours() + 3)
    let q = sb.from('conversion_events')
      .select('id, created_at, event_name, source, device, page_path, lead_id, gclid, gbraid, wbraid')
      .in('event_name', [...CONTACT_EVENT_NAMES])
      .eq('is_bot', false).eq('is_internal', false)
      .gte('created_at', lo.toISOString()).lte('created_at', hi.toISOString())
      .order('created_at', { ascending: false }).limit(3000)
    if (data.action !== 'all') q = q.eq('event_name', data.action)
    const { data: rows, error } = await q
    if (error) throw new Error('Gebeurtenissen laden mislukt.')

    const events: ContactEvent[] = []
    const rawByKey = new Map<string, { gclid: string | null; gbraid: string | null; wbraid: string | null }>()
    for (const r of rows ?? []) {
      const day = amsDay(r.created_at)
      if (day < data.from || day > data.to) continue
      const id = clickIdentity(r)
      const clickKey = id ? await hashKey(id) : null
      if (clickKey) rawByKey.set(clickKey, { gclid: r.gclid, gbraid: r.gclid ? null : r.gbraid, wbraid: r.gclid || r.gbraid ? null : r.wbraid })
      events.push({ id: r.id, createdAt: r.created_at, eventName: r.event_name, source: r.source, device: r.device,
        pagePath: r.page_path, leadId: r.lead_id, clickKey, hasClickId: Boolean(id) })
    }

    // Bestaande dossiers met exact dezelfde klik (zelfde regel: gclid exact, anders gbraid/wbraid).
    const leadIdsByClick = new Map<string, string[]>()
    const gclids = [...rawByKey.values()].map((v) => v.gclid).filter(Boolean) as string[]
    const gbraids = [...rawByKey.values()].map((v) => v.gbraid).filter(Boolean) as string[]
    const leadMatches: any[] = []
    if (gclids.length) { const { data: l } = await sb.from('leads').select('id, gclid, gbraid, wbraid').in('gclid', gclids.slice(0, 200)); leadMatches.push(...(l ?? [])) }
    if (gbraids.length) { const { data: l } = await sb.from('leads').select('id, gclid, gbraid, wbraid').is('gclid', null).in('gbraid', gbraids.slice(0, 200)); leadMatches.push(...(l ?? [])) }
    for (const l of leadMatches) {
      const id = clickIdentity(l); if (!id) continue
      const k = await hashKey(id)
      leadIdsByClick.set(k, [...new Set([...(leadIdsByClick.get(k) ?? []), l.id])])
    }

    let routes = groupContactRoutes(events, leadIdsByClick)
    if (data.source === 'google-ads') routes = routes.filter((r) => r.evidence !== 'none')

    const keys = routes.map((r) => r.key)
    const reviews = new Map<string, any>()
    for (let i = 0; i < keys.length; i += 200) {
      const { data: rv, error: e2 } = await sb.from('contact_route_reviews').select('*').in('route_key', keys.slice(i, i + 200))
      if (e2) throw new Error('Beoordelingen laden mislukt.')
      for (const r of rv ?? []) reviews.set(r.route_key, r)
    }

    const counts = {
      routes: routes.length,
      calls: routes.filter((r) => r.actions.includes('contact_call')).length,
      whatsapp: routes.filter((r) => r.actions.includes('contact_whatsapp')).length,
      forms: routes.filter((r) => r.actions.some((a) => a === 'quote_submitted' || a === 'schedule_request_success')).length,
      open: routes.filter((r) => !reviews.has(r.key)).length,
      realContact: routes.filter((r) => reviews.get(r.key)?.contact_status === 'real_contact').length,
      revenueCents: routes.reduce((s, r) => s + (reviews.get(r.key)?.revenue_cents ?? 0), 0),
    }

    if (data.review === 'open') routes = routes.filter((r) => !reviews.has(r.key))
    else if (data.review !== 'all') routes = routes.filter((r) => reviews.get(r.key)?.contact_status === data.review)

    const total = routes.length
    const pageRoutes = routes.slice(data.page * data.pageSize, (data.page + 1) * data.pageSize)

    const leadIds = [...new Set(pageRoutes.flatMap((r) => [...r.leadIds, reviews.get(r.key)?.lead_id].filter(Boolean)))] as string[]
    const leads: Record<string, { id: string; ref: number; name: string; status: string; jobType: string }> = {}
    if (leadIds.length) {
      const { data: l } = await sb.from('leads').select('id, ref_number, customer_name, status, job_type').in('id', leadIds)
      for (const x of l ?? []) leads[x.id] = { id: x.id, ref: x.ref_number, name: x.customer_name, status: x.status, jobType: x.job_type }
    }

    return {
      total, counts, leads,
      rows: pageRoutes.map((r) => ({
        key: r.key, firstAt: r.firstAt, lastAt: r.lastAt, source: r.source, device: r.device, evidence: r.evidence,
        actions: r.actions, leadIds: r.leadIds,
        // Geen klik-id's naar de browser: alleen soort, tijd en pagina.
        events: r.events.map((e) => ({ id: e.id, at: e.createdAt, eventName: e.eventName, pagePath: e.pagePath, hasClickId: e.hasClickId })),
        review: reviews.get(r.key) ?? null,
      })),
    }
  })

const saveInput = z.object({
  routeKey: z.string().regex(/^(c|e):[0-9a-f-]{8,40}$/),
  contactStatus: z.enum(['real_contact', 'no_contact', 'unknown']),
  outcome: z.enum(['remote_help', 'scheduled', 'completed', 'dropped']).nullable(),
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
    let leadId: string | null = null
    if (data.leadRef != null) {
      const { data: l, error } = await sb.from('leads').select('id').eq('ref_number', data.leadRef).maybeSingle()
      if (error) throw new Error('Dossier zoeken mislukt.')
      if (!l) throw new Error(`Dossier #${data.leadRef} bestaat niet.`)
      leadId = l.id
    }
    const { error } = await sb.from('contact_route_reviews').upsert({
      route_key: data.routeKey, contact_status: data.contactStatus,
      outcome: data.contactStatus === 'real_contact' ? data.outcome : null,
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
