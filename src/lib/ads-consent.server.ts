/** Consent belongs to a browser secret, never to a public advertising ID. */
export const AD_ID_PATTERN = /^[A-Za-z0-9._-]{6,200}$/
export const CLICK_REF_PATTERN = /^[23456789BCDFGHJKLMNPQRSTVWXZ]{6,10}$/
export const VISITOR_TOKEN_PATTERN = /^[A-Za-z0-9._-]{16,200}$/

export type ConsentApplyInput = {
  token?: string | null
  visitorToken?: string | null
  adUserData: 'granted' | 'denied'
  adStorage: 'granted' | 'denied' | null
  seq: number
  origin?: string
  version?: number
}
export type ConsentApplyResult =
  | { ok: true; events: number; leads: number; blocked: number; unblocked: number }
  | { ok: false; reason: 'unknown_ticket' | 'stale' | 'busy' | 'conflict' }

async function sha256(prefix: string, value: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(prefix + value))
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
export const hashConsentToken = (token: string) => sha256('voltfix-consent:', token)
export const hashVisitorToken = (token: string) => sha256('voltfix-visitor:', token)

export async function visitorHashFrom(token: string | null | undefined): Promise<string | null> {
  const value = (token ?? '').trim()
  return VISITOR_TOKEN_PATTERN.test(value) ? hashVisitorToken(value) : null
}

export type TicketIds = {
  gclid: string | null
  gbraid: string | null
  wbraid: string | null
  clickRef: string | null
}
export function sanitizeTicketIds(input: Partial<TicketIds>): TicketIds {
  const clean = (v: string | null | undefined, pattern: RegExp) =>
    typeof v === 'string' && pattern.test(v.trim()) ? v.trim() : null
  return { gclid: clean(input.gclid, AD_ID_PATTERN), gbraid: clean(input.gbraid, AD_ID_PATTERN),
    wbraid: clean(input.wbraid, AD_ID_PATTERN), clickRef: clean(input.clickRef, CLICK_REF_PATTERN) }
}

/** Reissuing is stable: losing a response never invalidates a previous receipt. */
export async function issueConsentTicket(
  input: Partial<TicketIds> & { visitorToken?: string | null },
): Promise<{ token: string; resumed: boolean } | null> {
  const visitor = input.visitorToken?.trim()
  const visitorHash = await visitorHashFrom(visitor)
  if (!visitorHash || !visitor) return null
  const token = await sha256('voltfix-consent-receipt-v2:', visitor)
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const result = await (supabaseAdmin as any).rpc('ads_consent_subject_v2', {
    p_visitor_hash: visitorHash, p_token_hash: await hashConsentToken(token),
  })
  if (result.error) throw new Error(result.error.message)
  return { token, resumed: Boolean(result.data?.resumed) }
}

/** The SQL function commits the decision and its projections in one transaction. */
export async function applyConsentDecision(input: ConsentApplyInput): Promise<ConsentApplyResult> {
  if (!Number.isSafeInteger(input.seq) || input.seq < 1) throw new Error('Invalid consent sequence')
  let token = input.token
  if (input.visitorToken) {
    // The browser credential also recovers from an old, rotated receipt.
    token = (await issueConsentTicket({ visitorToken: input.visitorToken }))?.token
    if (!token) return { ok: false, reason: 'unknown_ticket' }
  }
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return { ok: false, reason: 'unknown_ticket' }
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const result = await (supabaseAdmin as any).rpc('ads_consent_apply_v2', {
    p_token_hash: await hashConsentToken(token), p_seq: input.seq,
    p_ad_user_data: input.adUserData, p_ad_storage: input.adStorage,
    p_origin: input.origin ?? 'cookie_banner', p_version: input.version ?? 2,
  })
  if (result.error) throw new Error(result.error.message)
  if (!result.data) throw new Error('Consent decision was not confirmed')
  return result.data as ConsentApplyResult
}

/** Unknown and legacy consent is not permission. Click IDs never expand this scope. */
export async function authoritativeConsent(
  db: any,
  record: { consent_visitor_hash?: string | null; gclid?: string | null; gbraid?: string | null; wbraid?: string | null },
): Promise<'granted' | 'denied' | null> {
  if (!record.consent_visitor_hash) return null
  const result = await db.from('ad_consent_subjects_v2')
    .select('ad_user_data, ad_storage').eq('visitor_hash', record.consent_visitor_hash).maybeSingle()
  if (result.error) throw new Error(result.error.message)
  if (!result.data?.ad_user_data) return null
  return result.data.ad_user_data === 'granted' && result.data.ad_storage === 'granted' ? 'granted' : 'denied'
}

/** Missing optional fields must not lose a customer request during deployment. */
export function missingConsentColumn(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code
  return code === '42703' || code === 'PGRST204'
}

export async function consentForStorage(db: any, visitorHash: string | null): Promise<'granted' | 'denied' | null> {
  try { return await authoritativeConsent(db, { consent_visitor_hash: visitorHash }) }
  catch { return null }
}

/** Admin proof can bind a lead only to one unambiguous recorded browser owner. */
export async function resolveRecordedClickOwner(db: any, ids: Partial<TicketIds>): Promise<string | null> {
  const clean = sanitizeTicketIds(ids)
  if (!clean.gclid && !clean.gbraid && !clean.wbraid) return null
  let query = db.from('conversion_events').select('consent_visitor_hash')
  for (const key of ['gclid','gbraid','wbraid'] as const) if (clean[key]) query = query.eq(key, clean[key])
  const result = await query.eq('is_internal', false).eq('is_bot', false).limit(201)
  if (result.error) throw new Error(result.error.message)
  const rows = result.data ?? []
  if (rows.length === 0 || rows.length > 200 || rows.some((r: any) => !r.consent_visitor_hash)) return null
  const owners = new Set<string>(rows.map((r: any) => r.consent_visitor_hash))
  return owners.size === 1 ? [...owners][0]! : null
}

/** Carry the original choice/sequence with a form; never manufacture a new grant. */
export async function recordFormConsent(input: {
  adVisitorToken?: string | null; adConsentSeq?: number | null;
  adConsentAdUserData?: 'granted' | 'denied' | null; adConsentAdStorage?: 'granted' | 'denied' | null;
}): Promise<void> {
  if (!input.adVisitorToken || !input.adConsentAdUserData || !input.adConsentAdStorage ||
      !Number.isSafeInteger(input.adConsentSeq) || (input.adConsentSeq ?? 0) < 1) return
  try {
    await applyConsentDecision({ visitorToken: input.adVisitorToken, seq: input.adConsentSeq!,
      adUserData: input.adConsentAdUserData, adStorage: input.adConsentAdStorage, origin: 'form_snapshot' })
  } catch (error) {
    // Customer intake continues; SQL strips identifiers without authoritative consent.
    console.error('Toestemming nog niet bevestigd; aanvraag blijft buiten advertentie-export', error)
  }
}
