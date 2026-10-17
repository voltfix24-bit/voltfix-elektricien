import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { business } from '@/lib/business'
import { groepenkastSeedFromCode } from '@/lib/quotes/engine'

async function assertAdmin(context: any) {
  const { data, error } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' })
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Geen beheerdersrechten.')
}
const fail = (e: any) => { if (e) throw new Error(e.message) }

/* ---------------- Catalogus ---------------- */

export const getCatalog = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { serviceId: string }) => z.object({ serviceId: z.string().min(1).max(40) }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context)
    const sb = context.supabase
    const { data: versions, error } = await sb.from('catalog_versions').select('*')
      .eq('service_id', data.serviceId).order('version_no', { ascending: false })
    fail(error)
    const ids = (versions ?? []).filter(v => v.status !== 'archived').map(v => v.id)
    const { data: items, error: e2 } = ids.length
      ? await sb.from('catalog_items').select('*').in('version_id', ids).order('sort')
      : { data: [], error: null }
    fail(e2)
    const { data: audit } = await sb.from('catalog_audit').select('*').order('created_at', { ascending: false }).limit(30)
    return { versions: versions ?? [], items: items ?? [], audit: audit ?? [] }
  })

/** Eenmalig: versie 1 vullen uit de huidige websitecode en direct publiceren. */
export const seedGroepenkastCatalog = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const sb = context.supabase
    const { count } = await sb.from('catalog_versions').select('id', { count: 'exact', head: true }).eq('service_id', 'groepenkast')
    if ((count ?? 0) > 0) throw new Error('Catalogus bestaat al.')
    const seed = groepenkastSeedFromCode()
    const { data: v, error } = await sb.from('catalog_versions').insert({
      service_id: 'groepenkast', version_no: 1, status: 'draft', version_key: seed.versionKey,
      note: 'Overgenomen uit websiteprijzen', created_by: context.userId,
    }).select().single()
    fail(error)
    const { error: e2 } = await sb.from('catalog_items').insert(seed.items.map(i => ({ ...i, version_id: v!.id })) as never)
    fail(e2)
    await sb.from('catalog_audit').insert({ version_id: v!.id, actor_id: context.userId, action: 'seeded', diff: { items: seed.items.length } })
    const { error: e3 } = await sb.rpc('publish_catalog_version', { _version_id: v!.id })
    fail(e3)
    return { ok: true }
  })

/** Nieuw concept maken als kopie van de gepubliceerde versie. */
export const createCatalogDraft = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { serviceId: string }) => z.object({ serviceId: z.string().min(1).max(40) }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context)
    const sb = context.supabase
    const { data: pub } = await sb.from('catalog_versions').select('*').eq('service_id', data.serviceId).eq('status', 'published').maybeSingle()
    if (!pub) throw new Error('Geen gepubliceerde catalogus.')
    const { data: last } = await sb.from('catalog_versions').select('version_no').eq('service_id', data.serviceId).order('version_no', { ascending: false }).limit(1).single()
    const { data: v, error } = await sb.from('catalog_versions').insert({
      service_id: data.serviceId, version_no: (last?.version_no ?? 0) + 1, status: 'draft', created_by: context.userId,
    }).select().single()
    if (error?.code === '23505') throw new Error('Er is al een concept.')
    fail(error)
    const { data: items } = await sb.from('catalog_items').select('*').eq('version_id', pub.id)
    const copy = (items ?? []).map(({ id: _id, version_id: _v, ...rest }) => ({ ...rest, version_id: v!.id }))
    if (copy.length) fail((await sb.from('catalog_items').insert(copy)).error)
    await sb.from('catalog_audit').insert({ version_id: v!.id, actor_id: context.userId, action: 'draft_created', diff: { from: pub.version_no } })
    return { ok: true }
  })

const itemPatch = z.object({
  label_nl: z.string().trim().min(1).max(120),
  label_en: z.string().trim().min(1).max(120),
  price_inc_vat_cents: z.number().int().min(0).max(10_000_000),
  active: z.boolean(),
  show_on_website: z.boolean(),
  show_in_quotes: z.boolean(),
}).partial()

export const updateCatalogItem = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), patch: itemPatch }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context)
    const sb = context.supabase
    const { data: before } = await sb.from('catalog_items').select('*').eq('id', data.id).single()
    const { error } = await sb.from('catalog_items').update(data.patch).eq('id', data.id)
    fail(error)
    const diff: Record<string, unknown> = { item_key: before?.item_key }
    for (const [k, v] of Object.entries(data.patch)) diff[k] = { from: (before as any)?.[k], to: v }
    await sb.from('catalog_audit').insert({ version_id: before?.version_id, actor_id: context.userId, action: 'item_updated', diff: diff as never })
    return { ok: true }
  })

export const publishCatalog = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { versionId: string }) => z.object({ versionId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context)
    const { data: r, error } = await context.supabase.rpc('publish_catalog_version', { _version_id: data.versionId })
    fail(error)
    return r as { ok: boolean; reason?: string }
  })

/* ---------------- Offertes ---------------- */

export const listQuotes = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const { data, error } = await context.supabase.from('quotes')
      .select('id, quote_number, status, total_inc_vat_cents, created_at, valid_until, is_test, customer_snapshot, lead_id, leads(ref_number)')
      .order('created_at', { ascending: false }).limit(200)
    fail(error)
    return data ?? []
  })

export const createQuoteForLead = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ refNumber: z.number().int().positive(), language: z.enum(['nl', 'en']).default('nl') }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context)
    const sb = context.supabase
    const { data: lead } = await sb.from('leads').select('*').eq('ref_number', data.refNumber).maybeSingle()
    if (!lead) throw new Error('Dossier niet gevonden.')
    const { data: cat } = await sb.from('catalog_versions').select('id').eq('service_id', 'groepenkast').eq('status', 'published').maybeSingle()
    if (!cat) throw new Error('Publiceer eerst de groepenkastcatalogus.')
    const { data: q, error } = await sb.from('quotes').insert({
      lead_id: lead.id, service_id: 'groepenkast', catalog_version_id: cat.id, language: data.language,
      is_test: lead.is_test, created_by: context.userId,
      customer_snapshot: {
        name: lead.customer_name, phone: lead.customer_phone, email: lead.customer_email,
        address: lead.address, postal_code: lead.postal_code, city: lead.city, ref_number: lead.ref_number,
      },
      business_snapshot: {
        name: business.legalName, street: business.streetAddress, postal_code: business.postalCode, city: business.city,
        email: business.email, phone: business.phoneDisplay, kvk: business.kvk, btw: business.btw, url: business.url,
      },
    }).select('id').single()
    fail(error)
    // Voorvullen met pakket/opties uit de aanvraag, indien bekend.
    const { data: items } = await sb.from('catalog_items').select('*').eq('version_id', cat.id)
    const wanted = [lead.quote_package, ...(Array.isArray(lead.quote_options) ? lead.quote_options as string[] : [])].filter(Boolean)
    const pre = (items ?? []).filter(i => wanted.includes(i.item_key) && i.active && i.show_in_quotes)
    if (pre.length) {
      fail((await sb.from('quote_items').insert(pre.map((i, n) => ({
        quote_id: q!.id, sort: n, catalog_item_key: i.item_key, kind: i.kind, label: data.language === 'en' ? i.label_en : i.label_nl,
        qty: 1, unit: i.unit, catalog_unit_price_cents: i.price_inc_vat_cents, unit_price_inc_vat_cents: i.price_inc_vat_cents,
        vat_rate_bps: i.vat_rate_bps, line_total_inc_vat_cents: i.price_inc_vat_cents,
      })))).error)
    }
    await sb.from('quote_events').insert({ quote_id: q!.id, actor_id: context.userId, event: 'created', data: { ref_number: lead.ref_number } })
    return { id: q!.id }
  })

export const getQuote = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context)
    const sb = context.supabase
    const { data: quote, error } = await sb.from('quotes').select('*').eq('id', data.id).single()
    fail(error)
    if (!quote) throw new Error('Offerte niet gevonden.')
    const [items, events, catalog] = await Promise.all([
      sb.from('quote_items').select('*').eq('quote_id', data.id).order('sort'),
      sb.from('quote_events').select('*').eq('quote_id', data.id).order('created_at', { ascending: false }),
      quote.catalog_version_id
        ? sb.from('catalog_items').select('*').eq('version_id', quote.catalog_version_id).eq('active', true).eq('show_in_quotes', true).order('sort')
        : Promise.resolve({ data: [] as any[] }),
    ])
    return { quote, items: items.data ?? [], events: events.data ?? [], catalog: catalog.data ?? [] }
  })

const lineSchema = z.object({
  catalog_item_key: z.string().max(60).nullable(),
  kind: z.string().max(20),
  label: z.string().trim().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  qty: z.number().int().min(1).max(999),
  unit: z.string().max(20),
  unit_price_inc_vat_cents: z.number().int().min(0).max(10_000_000),
  override_reason: z.string().trim().max(300).nullable().optional(),
  is_internal: z.boolean(),
})

/** Regels vervangen; catalogusprijs wordt server-side opgezocht, nooit van de client vertrouwd. */
export const saveQuoteDraft = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid(), lines: z.array(lineSchema).max(60),
    customer_note: z.string().max(2000).nullable(), internal_note: z.string().max(2000).nullable(),
    language: z.enum(['nl', 'en']),
  }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context)
    const sb = context.supabase
    const { data: q } = await sb.from('quotes').select('status, catalog_version_id').eq('id', data.id).single()
    if (q?.status !== 'draft') throw new Error('Alleen een concept kan worden aangepast.')
    const { data: cat } = await sb.from('catalog_items').select('item_key, price_inc_vat_cents, vat_rate_bps').eq('version_id', q.catalog_version_id!)
    const byKey = new Map((cat ?? []).map(c => [c.item_key, c]))
    const rows = data.lines.map((l, n) => {
      const c = l.catalog_item_key ? byKey.get(l.catalog_item_key) : undefined
      if (l.catalog_item_key && !c) throw new Error(`Onbekend catalogusitem ${l.catalog_item_key}`)
      if (c && l.unit_price_inc_vat_cents !== c.price_inc_vat_cents && !l.override_reason?.trim()) {
        throw new Error(`Reden verplicht bij afwijkende prijs: ${l.label}`)
      }
      return {
        quote_id: data.id, sort: n, catalog_item_key: l.catalog_item_key, kind: l.kind, label: l.label,
        description: l.description ?? null, qty: l.qty, unit: l.unit,
        catalog_unit_price_cents: c?.price_inc_vat_cents ?? null, unit_price_inc_vat_cents: l.unit_price_inc_vat_cents,
        vat_rate_bps: c?.vat_rate_bps ?? 2100, line_total_inc_vat_cents: l.qty * l.unit_price_inc_vat_cents,
        override_reason: l.override_reason?.trim() || null, is_internal: l.is_internal,
      }
    })
    fail((await sb.from('quote_items').delete().eq('quote_id', data.id)).error)
    if (rows.length) fail((await sb.from('quote_items').insert(rows)).error)
    fail((await sb.from('quotes').update({ customer_note: data.customer_note, internal_note: data.internal_note, language: data.language }).eq('id', data.id)).error)
    const overrides = rows.filter(r => r.override_reason).map(r => ({ label: r.label, from: r.catalog_unit_price_cents, to: r.unit_price_inc_vat_cents, reason: r.override_reason }))
    await sb.from('quote_events').insert({ quote_id: data.id, actor_id: context.userId, event: 'saved', data: { lines: rows.length, overrides } })
    return { ok: true }
  })

export const finalizeQuote = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context)
    const { data: r, error } = await context.supabase.rpc('finalize_quote', { _quote_id: data.id })
    fail(error)
    return r as { ok: boolean; reason?: string; quote_number?: string }
  })

export const setQuoteStatus = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), status: z.enum(['sent', 'accepted', 'declined']) }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context)
    const sb = context.supabase
    const { data: q } = await sb.from('quotes').select('status').eq('id', data.id).single()
    const allowed: Record<string, string[]> = { final: ['sent', 'accepted', 'declined'], sent: ['accepted', 'declined'] }
    if (!allowed[q?.status ?? '']?.includes(data.status)) throw new Error('Deze statuswijziging is niet toegestaan.')
    const now = new Date().toISOString()
    const patch: Record<string, string> = { status: data.status } as any
    patch[data.status === 'sent' ? 'sent_at' : data.status === 'accepted' ? 'accepted_at' : 'declined_at'] = now
    fail((await sb.from('quotes').update(patch as any).eq('id', data.id)).error)
    await sb.from('quote_events').insert({ quote_id: data.id, actor_id: context.userId, event: data.status })
    return { ok: true }
  })

/** Nieuwe revisie van een definitieve offerte; de oude blijft bewaard als 'superseded'. */
export const reviseQuote = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context)
    const sb = context.supabase
    const { data: old } = await sb.from('quotes').select('*').eq('id', data.id).single()
    if (!old || old.status === 'draft') throw new Error('Alleen een definitieve offerte kan herzien worden.')
    const { data: cat } = await sb.from('catalog_versions').select('id').eq('service_id', old.service_id).eq('status', 'published').maybeSingle()
    const { data: q, error } = await sb.from('quotes').insert({
      lead_id: old.lead_id, service_id: old.service_id, catalog_version_id: cat?.id ?? old.catalog_version_id,
      language: old.language, is_test: old.is_test, created_by: context.userId, revision: old.revision + 1,
      parent_quote_id: old.id, customer_snapshot: old.customer_snapshot, business_snapshot: old.business_snapshot,
      customer_note: old.customer_note, internal_note: old.internal_note,
    }).select('id').single()
    fail(error)
    const { data: items } = await sb.from('quote_items').select('*').eq('quote_id', old.id)
    const copy = (items ?? []).map(({ id: _i, quote_id: _q, ...r }) => ({ ...r, quote_id: q!.id }))
    if (copy.length) fail((await sb.from('quote_items').insert(copy)).error)
    await sb.from('quotes').update({ status: 'superseded' }).eq('id', old.id)
    await sb.from('quote_events').insert([
      { quote_id: old.id, actor_id: context.userId, event: 'superseded', data: { by: q!.id } },
      { quote_id: q!.id, actor_id: context.userId, event: 'created', data: { revision_of: old.quote_number } },
    ])
    return { id: q!.id }
  })
