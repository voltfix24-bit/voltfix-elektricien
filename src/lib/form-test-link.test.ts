import { describe, expect, it, vi } from 'vitest'
import { createFakeSupabase } from '@/test/fake-supabase'
import {
  assertFormTestAdmin,
  claimFormTestLink,
  createFormTestLink,
  formTestRejection,
  hashFormTestToken,
} from './form-test-link.server'
import { appendFormTest, formTestActivationInlineScript, FORM_TEST_STORAGE_KEY } from './form-test-link'
import { conversionEligibility } from './ads-outbox'

const UNIQUE = [{ table: 'form_test_links', columns: ['token_hash'] }]
const T0 = new Date('2026-09-24T09:00:00Z')

async function newLink(withTestClick = false) {
  const fake = createFakeSupabase({}, { unique: UNIQUE })
  const link = await createFormTestLink(fake as any, {
    createdBy: 'admin-1',
    path: '/contact',
    label: 'Test A',
    withTestClick,
    origin: 'https://example.test',
    now: T0,
  })
  const token = link.url.split('#vftest=')[1]!
  return { fake, link, token }
}

describe('aanmaken: alleen beheerder', () => {
  const userDb = (role: boolean | null, error: any = null) => ({ rpc: vi.fn(async () => ({ data: role, error })) })
  it('weigert een ingelogde niet-beheerder', async () => {
    await expect(assertFormTestAdmin(userDb(false) as any, 'u1')).rejects.toThrow('Geen beheerdersrechten')
  })
  it('weigert zonder inlog', async () => {
    await expect(assertFormTestAdmin(userDb(true) as any, null)).rejects.toThrow('Niet ingelogd')
  })
  it('weigert als de rolcontrole faalt', async () => {
    await expect(assertFormTestAdmin(userDb(null, { message: 'down' }) as any, 'u1')).rejects.toThrow('down')
  })
  it('laat een beheerder toe', async () => {
    await expect(assertFormTestAdmin(userDb(true) as any, 'u1')).resolves.toBeUndefined()
  })
})

describe('link', () => {
  it('slaat alleen de hash op, verloopt na 30 minuten, token in #-fragment', async () => {
    const { fake, link, token } = await newLink(true)
    const row = fake.db.form_test_links![0]!
    expect(row.token_hash).toBe(await hashFormTestToken(token))
    expect(JSON.stringify(row)).not.toContain(token)
    expect(new Date(row.expires_at).getTime() - T0.getTime()).toBe(30 * 60 * 1000)
    expect(link.url).toMatch(/^https:\/\/example\.test\/contact\?gclid=TEST-VOLTFIX-FICTIEF-[0-9A-F]{12}#vftest=/)
  })
})

describe('reserveren', () => {
  it('eerste poging slaagt, herhaling met dezelfde sleutel blijft mogelijk (ook na verlopen)', async () => {
    const { fake, token } = await newLink()
    const a = await claimFormTestLink(fake as any, { token, idempotencyKey: 'key-aaaaaaaa', now: T0 })
    expect(a.ok).toBe(true)
    const later = new Date(T0.getTime() + 45 * 60 * 1000)
    const b = await claimFormTestLink(fake as any, { token, idempotencyKey: 'key-aaaaaaaa', now: later })
    expect(b).toMatchObject({ ok: true })
  })
  it('een tweede, andere aanvraag krijgt "gebruikt"', async () => {
    const { fake, token } = await newLink()
    await claimFormTestLink(fake as any, { token, idempotencyKey: 'key-aaaaaaaa', now: T0 })
    expect(await claimFormTestLink(fake as any, { token, idempotencyKey: 'key-bbbbbbbb', now: T0 })).toEqual({ ok: false, reason: 'used' })
  })
  it('verlopen link wordt geblokkeerd', async () => {
    const { fake, token } = await newLink()
    const late = new Date(T0.getTime() + 31 * 60 * 1000)
    expect(await claimFormTestLink(fake as any, { token, idempotencyKey: 'key-aaaaaaaa', now: late })).toEqual({ ok: false, reason: 'expired' })
  })
  it('onbekend of misvormd token wordt geblokkeerd', async () => {
    const { fake } = await newLink()
    expect(await claimFormTestLink(fake as any, { token: 'x'.repeat(43), idempotencyKey: 'key-aaaaaaaa', now: T0 })).toEqual({ ok: false, reason: 'invalid' })
    expect(await claimFormTestLink(fake as any, { token: 'kort', idempotencyKey: 'key-aaaaaaaa', now: T0 })).toEqual({ ok: false, reason: 'invalid' })
  })
  it('zonder herhaalsleutel geweigerd', async () => {
    const { fake, token } = await newLink()
    expect(await claimFormTestLink(fake as any, { token, idempotencyKey: null, now: T0 })).toEqual({ ok: false, reason: 'missing_key' })
  })
  it('databasefout = niet beschikbaar (503), nooit doorlaten', async () => {
    const { token } = await newLink()
    const broken = createFakeSupabase({}, { failures: { form_test_links: { code: '42P01', message: 'relation does not exist' } } })
    const r = await claimFormTestLink(broken as any, { token, idempotencyKey: 'key-aaaaaaaa', now: T0 })
    expect(r).toEqual({ ok: false, reason: 'unavailable' })
    expect(formTestRejection('unavailable', 'nl').status).toBe(503)
    expect(formTestRejection('used', 'en').status).toBe(403)
  })
  it('gelijktijdig: twee verschillende aanvragen → precies één winnaar', async () => {
    const { fake, token } = await newLink()
    const results = await Promise.all([
      claimFormTestLink(fake as any, { token, idempotencyKey: 'key-aaaaaaaa', now: T0 }),
      claimFormTestLink(fake as any, { token, idempotencyKey: 'key-bbbbbbbb', now: T0 }),
      claimFormTestLink(fake as any, { token, idempotencyKey: 'key-cccccccc', now: T0 }),
    ])
    expect(results.filter((r) => r.ok)).toHaveLength(1)
    expect(fake.db.form_test_links![0]!.idempotency_key).toMatch(/^key-/)
  })
  it('gelijktijdig: dubbelklik met dezelfde sleutel → dezelfde link (één aanvraag via unieke sleutel)', async () => {
    const { fake, token } = await newLink()
    const [a, b] = await Promise.all([
      claimFormTestLink(fake as any, { token, idempotencyKey: 'key-aaaaaaaa', now: T0 }),
      claimFormTestLink(fake as any, { token, idempotencyKey: 'key-aaaaaaaa', now: T0 }),
    ])
    expect(a.ok && b.ok && a.linkId === b.linkId).toBe(true)
  })
})

describe('browser', () => {
  it('activatiescript zet token in sessionStorage, haalt het uit de URL en blokkeert tags', () => {
    const store = new Map<string, string>()
    const replace = vi.fn()
    const token = 'A'.repeat(43)
    const w: any = {
      location: { hash: `#vftest=${token}`, pathname: '/contact', search: '?gclid=TEST-VOLTFIX-FICTIEF-1' },
      history: { state: null, replaceState: replace },
      sessionStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v) },
    }
    new Function('window', formTestActivationInlineScript)(w)
    expect(store.get(FORM_TEST_STORAGE_KEY)).toBe(token)
    expect(replace).toHaveBeenCalledWith(null, '', '/contact?gclid=TEST-VOLTFIX-FICTIEF-1')
    expect(w.__vfFormTest).toBe(true)
  })
  it('zonder testsessie verandert een gewone verzending niet', () => {
    const fd = new FormData()
    appendFormTest(fd)
    expect([...fd.keys()]).toEqual([])
  })
})

describe('geen echte opvolging', () => {
  it('testdossier gaat nooit naar Google', () => {
    expect(
      conversionEligibility({ isTest: true, gclid: 'TEST-VOLTFIX-FICTIEF-1', evidence: 'form', consentAdUserData: 'granted', configured: true } as any),
    ).toBe('skipped_test')
  })
})
