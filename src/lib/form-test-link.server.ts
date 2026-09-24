import type { SupabaseClient } from '@supabase/supabase-js'
import { FORM_TEST_TOKEN_PATTERN, FORM_TEST_TTL_MS, FORM_TEST_HASH_PARAM } from './form-test-link'

/** Toegestane formulierpagina's voor een testlink. */
export const FORM_TEST_PATHS = ['/contact', '/en-gb/contact', '/perilex-amsterdam', '/en-gb/perilex-amsterdam'] as const
export type FormTestPath = (typeof FORM_TEST_PATHS)[number]

type Db = SupabaseClient<any, any, any>

/** Gooit tenzij de ingelogde gebruiker de beheerdersrol heeft. */
export async function assertFormTestAdmin(userDb: Db, userId: string | null | undefined): Promise<void> {
  if (!userId) throw new Error('Niet ingelogd.')
  const { data, error } = await userDb.rpc('has_role', { _user_id: userId, _role: 'admin' })
  if (error) throw new Error(error.message)
  if (data !== true) throw new Error('Geen beheerdersrechten.')
}

export async function hashFormTestToken(token: string): Promise<string> {
  const bytes = new TextEncoder().encode(token)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function randomToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomSuffix(): string {
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()
}

/** Duidelijk fictief klik-id voor test A. */
export function fictitiousTestGclid(): string {
  return `TEST-VOLTFIX-FICTIEF-${randomSuffix()}`
}

export type CreatedFormTestLink = { url: string; expiresAt: string; label: string; gclid: string | null }

/**
 * Maakt een testlink aan. De aanroeper MOET vooraf hebben vastgesteld dat de
 * gebruiker beheerder is; deze functie schrijft met de serverrol.
 */
export async function createFormTestLink(
  db: Db,
  opts: { createdBy: string; path: FormTestPath; label: string; withTestClick: boolean; origin: string; now?: Date },
): Promise<CreatedFormTestLink> {
  if (!FORM_TEST_PATHS.includes(opts.path)) throw new Error('Onbekende formulierpagina')
  const now = opts.now ?? new Date()
  const token = randomToken()
  const expiresAt = new Date(now.getTime() + FORM_TEST_TTL_MS).toISOString()
  const { error } = await db.from('form_test_links').insert({
    token_hash: await hashFormTestToken(token),
    created_by: opts.createdBy,
    label: opts.label.slice(0, 80),
    target_path: opts.path,
    created_at: now.toISOString(),
    expires_at: expiresAt,
  })
  if (error) throw new Error(`Testlink aanmaken mislukt: ${error.message}`)
  const gclid = opts.withTestClick ? fictitiousTestGclid() : null
  const search = gclid ? `?gclid=${encodeURIComponent(gclid)}` : ''
  return { url: `${opts.origin}${opts.path}${search}#${FORM_TEST_HASH_PARAM}=${token}`, expiresAt, label: opts.label, gclid }
}

export type FormTestClaim =
  | { ok: true; linkId: string; quoteRequestId: string | null }
  | { ok: false; reason: 'invalid' | 'expired' | 'used' | 'missing_key' | 'unavailable' }

/**
 * Reserveert een testlink voor precies één aanvraag. Dezelfde herhaalsleutel
 * mag altijd opnieuw (ook na verlopen): die hoort bij de al gereserveerde
 * aanvraag. Een andere sleutel krijgt de link nooit. Beide updates zijn
 * voorwaardelijk; de database controleert de voorwaarde opnieuw onder
 * rijvergrendeling, dus twee gelijktijdige pogingen kunnen niet allebei winnen.
 */
export async function claimFormTestLink(
  db: Db,
  input: { token: string; idempotencyKey: string | null; now?: Date },
): Promise<FormTestClaim> {
  if (!FORM_TEST_TOKEN_PATTERN.test(input.token)) return { ok: false, reason: 'invalid' }
  if (!input.idempotencyKey) return { ok: false, reason: 'missing_key' }
  const now = (input.now ?? new Date()).toISOString()
  const hash = await hashFormTestToken(input.token)

  const same = await db
    .from('form_test_links')
    .update({ used_at: now })
    .eq('token_hash', hash)
    .eq('idempotency_key', input.idempotencyKey)
    .select('id, quote_request_id')
    .maybeSingle()
  if (same.error) return { ok: false, reason: 'unavailable' }
  if (same.data) return { ok: true, linkId: same.data.id, quoteRequestId: same.data.quote_request_id ?? null }

  const fresh = await db
    .from('form_test_links')
    .update({ idempotency_key: input.idempotencyKey, used_at: now })
    .eq('token_hash', hash)
    .is('idempotency_key', null)
    .gt('expires_at', now)
    .select('id, quote_request_id')
    .maybeSingle()
  if (fresh.error) return { ok: false, reason: 'unavailable' }
  if (fresh.data) return { ok: true, linkId: fresh.data.id, quoteRequestId: null }

  const { data: row, error } = await db
    .from('form_test_links')
    .select('id, expires_at, idempotency_key')
    .eq('token_hash', hash)
    .maybeSingle()
  if (error) return { ok: false, reason: 'unavailable' }
  if (!row) return { ok: false, reason: 'invalid' }
  if (row.idempotency_key) return { ok: false, reason: 'used' }
  return { ok: false, reason: 'expired' }
}

export async function bindFormTestLink(db: Db, linkId: string, quoteRequestId: string): Promise<void> {
  await db
    .from('form_test_links')
    .update({ quote_request_id: quoteRequestId })
    .eq('id', linkId)
    .is('quote_request_id', null)
}

export function formTestRejection(reason: Exclude<FormTestClaim, { ok: true }>['reason'], locale: 'nl' | 'en') {
  const nl: Record<string, string> = {
    invalid: 'Deze testlink is ongeldig. Er is niets opgeslagen.',
    expired: 'Deze testlink is verlopen. Er is niets opgeslagen.',
    used: 'Deze testlink is al gebruikt. Er is niets opgeslagen.',
    missing_key: 'Testaanvraag zonder herhaalsleutel geweigerd. Er is niets opgeslagen.',
    unavailable: 'Testlinks zijn nu niet beschikbaar. Er is niets opgeslagen.',
  }
  const en: Record<string, string> = {
    invalid: 'This test link is invalid. Nothing was stored.',
    expired: 'This test link has expired. Nothing was stored.',
    used: 'This test link was already used. Nothing was stored.',
    missing_key: 'Test request without retry key rejected. Nothing was stored.',
    unavailable: 'Test links are currently unavailable. Nothing was stored.',
  }
  return { status: reason === 'unavailable' ? 503 : 403, message: (locale === 'en' ? en : nl)[reason] }
}
