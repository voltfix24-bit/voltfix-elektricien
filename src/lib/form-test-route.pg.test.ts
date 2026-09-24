/**
 * Echte route-test tegen een wegwerp-PostgreSQL met PostgREST.
 * Draait alleen via: node scripts/form-test-db/run.mjs <postgrest>
 * Zonder die omgeving wordt het bestand overgeslagen.
 *
 * Nagebootst is uitsluitend het versturen naar Telegram (de bestemming wordt
 * wel met de echte routeringsfunctie bepaald). Database, unieke sleutels,
 * toestemmingsfuncties, wachtrij en de aanvraagroute zijn echt.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import postgres from 'postgres'

const REST = process.env['VF_FT_REST']
const KEY = process.env['VF_FT_KEY']
const PG = process.env['VF_FT_PG']
const suite = REST && KEY && PG ? describe : describe.skip

const dispatched = vi.hoisted(() => [] as Array<{ id: string; isTest: boolean; chat: string }>)

vi.mock('@/integrations/supabase/client.server', async () => {
  const { createClient } = await import('@supabase/supabase-js')
  return {
    supabaseAdmin: createClient(process.env['VF_FT_REST'] ?? 'http://127.0.0.1:1', process.env['VF_FT_KEY'] ?? 'x', {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
  }
})
vi.mock('@/lib/lead-dispatch.server', async () => {
  const tg = await import('@/lib/telegram.server')
  return {
    dispatchLeadToGroup: async (lead: { id: string; is_test?: boolean }) => {
      dispatched.push({ id: lead.id, isTest: Boolean(lead.is_test), chat: tg.groupChatId(lead) })
      return 1000 + dispatched.length
    },
  }
})

const ADMIN = '00000000-0000-4000-8000-00000000a001'
let sql: ReturnType<typeof postgres>
let POST: (ctx: { request: Request }) => Promise<Response>
let admin: any

type Link = { url: string; token: string; gclid: string }
async function newLink(path: '/contact' | '/en-gb/contact' | '/perilex-amsterdam', label: string): Promise<Link> {
  const { createFormTestLink } = await import('./form-test-link.server')
  const link = await createFormTestLink(admin, { createdBy: ADMIN, path, label, withTestClick: true, origin: 'http://localhost:8080' })
  const u = new URL(link.url)
  return { url: link.url, token: u.hash.replace('#vftest=', ''), gclid: u.searchParams.get('gclid')! }
}

let ipSeq = 1
function submit(fields: Record<string, string | undefined>, ip = `203.0.113.${ipSeq++}`) {
  const fd = new FormData()
  const base: Record<string, string> = {
    name: 'Test Formulier', phone: `+3161234${String(5000 + ipSeq).slice(-4)}`, email: '', postalCode: '1011AB',
    jobType: 'Stopcontact bijplaatsen', message: 'Formuliertest, fictieve aanvraag.', locale: 'nl', sourcePath: '/contact', hp: '',
  }
  for (const [k, v] of Object.entries({ ...base, ...fields })) if (v !== undefined) fd.set(k, v)
  return POST({ request: new Request('http://localhost:8080/api/public/quote-request', { method: 'POST', body: fd, headers: { 'cf-connecting-ip': ip } }) })
}
const json = async (r: Response) => ({ status: r.status, body: (await r.json()) as any })
const consent = (value: 'granted' | 'denied', visitor: string) => ({
  adVisitorToken: visitor, adConsentSeq: '1', adConsentAdUserData: value, adConsentAdStorage: value,
})

suite('formuliertest via de echte aanvraagroute en database', () => {
  beforeAll(async () => {
    process.env['SUPABASE_SERVICE_ROLE_KEY'] = KEY
    process.env['TELEGRAM_CHAT_ID'] = '-100ECHTE_GROEP'
    process.env['TELEGRAM_TEST_CHAT_ID'] = '-100TESTGROEP'
    delete process.env['TURNSTILE_SECRET_KEY']
    delete process.env['VOLTFIX_TEST_MODE']
    vi.stubEnv('VITE_SUPABASE_URL', REST!)
    sql = postgres(PG!, { max: 4, onnotice: () => {} })
    await sql`insert into auth.users (id) values (${ADMIN}) on conflict do nothing`
    admin = (await import('@/integrations/supabase/client.server')).supabaseAdmin
    const mod = await import('@/routes/api/public/quote-request')
    POST = (mod.Route.options as any).server.handlers.POST
  })
  afterAll(async () => { await sql?.end() })
  beforeEach(async () => {
    dispatched.length = 0
    // Burstvenster leeg: elke test begint zonder eerdere aanvragen.
    await sql`truncate public.notification_outbox, public.form_test_links, public.quote_requests, public.leads, public.ads_conversion_outbox cascade`
  })

  it('A: toestemming — klik-id opgeslagen, één aanvraag, één testdossier, alleen testkanaal', async () => {
    const link = await newLink('/contact', 'A')
    const fields = { formTestToken: link.token, idempotencyKey: 'ftAAAAAAAAAAAAAAAAAAAA', gclid: link.gclid, ...consent('granted', 'visitor-token-test-A-000000001') }
    const first = await json(await submit(fields, '203.0.113.10'))
    expect(first.status).toBe(200)
    // Netwerkfout + opnieuw proberen, ook tweemaal tegelijk.
    const again = await Promise.all([submit(fields, '203.0.113.10'), submit(fields, '203.0.113.10'), submit(fields, '203.0.113.10')].map(async (p) => json(await p)))
    for (const r of again) { expect(r.status).toBe(200); expect(r.body.id).toBe(first.body.id) }

    const quotes = await sql`select id, is_test, gclid, ad_consent_ad_user_data from quote_requests`
    expect(quotes).toHaveLength(1)
    expect(quotes[0]).toMatchObject({ is_test: true, gclid: link.gclid, ad_consent_ad_user_data: 'granted' })
    const leads = await sql`select is_test, gclid, external_ref, status from leads`
    expect(leads).toHaveLength(1)
    expect(leads[0]).toMatchObject({ is_test: true, gclid: link.gclid, external_ref: `quote:${quotes[0]!.id}` })
    const outbox = await sql`select kind from notification_outbox`
    expect(outbox.map((r) => r.kind)).toEqual(['internal_lead'])
    expect(dispatched).toHaveLength(1)
    expect(dispatched[0]).toMatchObject({ isTest: true, chat: '-100TESTGROEP' })
    const [l] = await sql`select idempotency_key, quote_request_id from form_test_links`
    expect(l).toMatchObject({ idempotency_key: 'ftAAAAAAAAAAAAAAAAAAAA', quote_request_id: quotes[0]!.id })
  })

  it('B: geweigerd — klik-id niet opgeslagen, wel testaanvraag', async () => {
    const link = await newLink('/en-gb/contact', 'B')
    const r = await json(await submit({ formTestToken: link.token, idempotencyKey: 'ftBBBBBBBBBBBBBBBBBBBB', gclid: link.gclid, locale: 'en', sourcePath: '/en-gb/contact', ...consent('denied', 'visitor-token-test-B-000000001') }))
    expect(r.status).toBe(200)
    const [q] = await sql`select is_test, gclid, locale from quote_requests`
    expect(q).toMatchObject({ is_test: true, gclid: null, locale: 'en' })
    const [lead] = await sql`select is_test, gclid, ad_click_evidence from leads`
    expect(lead).toMatchObject({ is_test: true, gclid: null, ad_click_evidence: null })
  })

  it('C: geen keuze — klik-id niet opgeslagen', async () => {
    const link = await newLink('/perilex-amsterdam', 'C')
    const r = await json(await submit({ formTestToken: link.token, idempotencyKey: 'ftCCCCCCCCCCCCCCCCCCCC', gclid: link.gclid, sourcePath: '/perilex-amsterdam' }))
    expect(r.status).toBe(200)
    const [q] = await sql`select is_test, gclid, ad_consent_ad_user_data from quote_requests`
    expect(q).toMatchObject({ is_test: true, gclid: null })
    expect(q!.ad_consent_ad_user_data).not.toBe('granted')
    const [lead] = await sql`select is_test, gclid from leads`
    expect(lead).toMatchObject({ is_test: true, gclid: null })
  })

  it('één link, tien gelijktijdige verschillende aanvragen: precies één wint', async () => {
    const link = await newLink('/contact', 'race')
    const results = await Promise.all(Array.from({ length: 10 }, (_, i) =>
      submit({ formTestToken: link.token, idempotencyKey: `ftRACE${String(i).padStart(16, '0')}`, message: `Formuliertest race ${i}.` }, '203.0.113.50').then(json)))
    expect(results.filter((r) => r.status === 200)).toHaveLength(1)
    expect(results.filter((r) => r.status === 403)).toHaveLength(9)
    expect(await sql`select id from quote_requests`).toHaveLength(1)
    expect(await sql`select id from leads`).toHaveLength(1)
  })

  it('ongeldige, verlopen en gebruikte links slaan niets op', async () => {
    const bad = await json(await submit({ formTestToken: 'x'.repeat(43), idempotencyKey: 'ftINVALID000000000000' }))
    expect(bad.status).toBe(403)
    const link = await newLink('/contact', 'verlopen')
    await sql`update form_test_links set expires_at = now() - interval '1 minute'`
    const expired = await json(await submit({ formTestToken: link.token, idempotencyKey: 'ftEXPIRED000000000000' }))
    expect(expired.status).toBe(403)
    const used = await newLink('/contact', 'gebruikt')
    expect((await submit({ formTestToken: used.token, idempotencyKey: 'ftUSED1000000000000000' })).status).toBe(200)
    await sql`delete from leads`; await sql`delete from notification_outbox`; await sql`delete from quote_requests`
    const reuse = await json(await submit({ formTestToken: used.token, idempotencyKey: 'ftUSED2000000000000000' }))
    expect(reuse.status).toBe(403)
    expect(await sql`select id from quote_requests`).toHaveLength(0)
    expect(await sql`select id from leads`).toHaveLength(0)
    expect(dispatched.filter((d) => !d.isTest)).toHaveLength(0)
  })

  it('gewone klant: zelfde sleutel geeft één aanvraag, één dossier, geen dubbele taken; nieuwe sleutel is een nieuwe aanvraag', async () => {
    const fields = { idempotencyKey: 'custKEY1000000000000000', phone: '+31687654321' }
    const first = await json(await submit(fields, '198.51.100.7'))
    expect(first.status).toBe(200)
    const retries = await Promise.all([submit(fields, '198.51.100.7'), submit(fields, '198.51.100.7'), submit(fields, '198.51.100.7')].map(async (p) => json(await p)))
    for (const r of retries) expect(r.body.id).toBe(first.body.id)
    expect(await sql`select id from quote_requests`).toHaveLength(1)
    const leads = await sql`select is_test from leads`
    expect(leads).toHaveLength(1)
    expect(leads[0]!.is_test).toBe(false)
    const kinds = (await sql`select kind from notification_outbox order by kind`).map((r) => r.kind)
    expect(kinds).toEqual([...new Set(kinds)])
    expect(kinds).toContain('internal_lead')
    expect(dispatched).toHaveLength(1)

    const second = await json(await submit({ ...fields, idempotencyKey: 'custKEY2000000000000000' }, '198.51.100.7'))
    expect(second.status).toBe(200)
    expect(second.body.id).not.toBe(first.body.id)
    expect(await sql`select id from quote_requests`).toHaveLength(2)
  })
})
