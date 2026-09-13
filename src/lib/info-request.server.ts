import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/integrations/supabase/types'
import {
  buildCustomerView,
  evaluateAccess,
  infoRequestExpiresAt,
  isActionAllowed,
  isInfoRequestItemCode,
  sessionExpiresAt,
  type InfoRequestItemCode,
} from '@/lib/booking/info-request'

/**
 * Server-only kern van de klantaanvulling (fase 5B).
 *
 * Alles wat met tokens, sessies en eigenaarschap te maken heeft staat hier en
 * nergens anders. De klantpagina krijgt uitsluitend afgeleide gegevens terug;
 * een aanvraag-ID, een storagepad of een lead komt er nooit uit.
 */

/* ----------------------------- activatie --------------------------------- */

/**
 * De publieke aanvullingsfuncties staan uit, net als Perilex zelf. Activeren
 * kan alleen via een servervariabele in een geïsoleerde testomgeving —
 * bewust nooit via een queryparameter of header.
 */
export function isInfoRequestPublicEnabled(): boolean {
  return process.env['PERILEX_INFO_REQUEST_PUBLIC'] === 'enabled'
}

/* ------------------------------- client ---------------------------------- */

export function adminClient(): SupabaseClient<Database> | null {
  const url = process.env['SUPABASE_URL']
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY']
  if (!url || !key) return null
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

/* -------------------------------- tokens --------------------------------- */

const encoder = new TextEncoder()

function base64url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** 32 cryptografisch willekeurige bytes; alleen de hash gaat naar de database. */
export function newToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return base64url(bytes)
}

export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(token) as unknown as ArrayBuffer)
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')
}

/* ------------------------------- cookies --------------------------------- */

export const sessionCookieName = 'vf_ir'

export function sessionCookie(value: string, maxAgeSeconds: number): string {
  const parts = [
    `${sessionCookieName}=${value}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`,
  ]
  return parts.join('; ')
}

export function clearedSessionCookie(): string {
  return sessionCookie('', 0)
}

export function readSessionCookie(request: Request): string | null {
  const header = request.headers.get('cookie')
  if (!header) return null
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name === sessionCookieName) return rest.join('=') || null
  }
  return null
}

/* ------------------------------ CSRF/origin ------------------------------ */

/**
 * Schrijvende acties komen uitsluitend van de eigen site. We toetsen de
 * Origin-header tegen de eigen URL van het verzoek, niet tegen de Host-header
 * van een doorstuurpunt.
 */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return request.headers.get('sec-fetch-site') === 'same-origin'
  try {
    return new URL(origin).origin === new URL(request.url).origin
  } catch {
    return false
  }
}

/* ---------------------------- rate limiting ------------------------------ */

const hits = new Map<string, { count: number; resetAt: number }>()

/**
 * Eenvoudige gedeelde begrenzing per sleutel. Best effort: serverinstanties
 * delen dit geheugen niet, dus dit is een rem op herhaald proberen en geen
 * sluitend slot. De echte grenzen staan in de database en in de validatie.
 */
export function rateLimit(key: string, max: number, windowSeconds: number): boolean {
  const now = Date.now()
  const entry = hits.get(key)
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowSeconds * 1000 })
    return true
  }
  if (entry.count >= max) return false
  entry.count += 1
  return true
}

/* ------------------------------- queries --------------------------------- */

export type InfoRequestRow = Database['public']['Tables']['quote_request_info_requests']['Row']

export async function infoRequestByToken(
  supabase: SupabaseClient<Database>,
  token: string,
): Promise<InfoRequestRow | null> {
  const hash = await hashToken(token)
  const { data } = await supabase
    .from('quote_request_info_requests')
    .select('*')
    .eq('token_hash', hash)
    .maybeSingle()
  return data ?? null
}

export type SessionContext = {
  request: InfoRequestRow
  sessionId: string
}

/**
 * Eigenaarschap komt altijd uit de sessie. Een meegegeven aanvraag-ID of
 * storagepad uit de browser wordt nooit vertrouwd.
 */
export async function sessionContext(
  supabase: SupabaseClient<Database>,
  httpRequest: Request,
): Promise<SessionContext | null> {
  const raw = readSessionCookie(httpRequest)
  if (!raw) return null
  const hash = await hashToken(raw)
  const { data: session } = await supabase
    .from('quote_request_info_sessions')
    .select('*')
    .eq('session_hash', hash)
    .maybeSingle()
  if (!session) return null
  if (session.revoked_at) return null
  if (new Date(session.expires_at).getTime() <= Date.now()) return null

  const { data: infoRequest } = await supabase
    .from('quote_request_info_requests')
    .select('*')
    .eq('id', session.info_request_id)
    .maybeSingle()
  if (!infoRequest) return null
  // Een vernieuwde toegangscode maakt oudere sessies ongeldig.
  if (session.token_version !== infoRequest.token_version) return null
  return { request: infoRequest, sessionId: session.id }
}

export async function createSession(
  supabase: SupabaseClient<Database>,
  infoRequest: InfoRequestRow,
): Promise<{ cookie: string; maxAge: number } | null> {
  const token = newToken()
  const expires = sessionExpiresAt(infoRequest.expires_at)
  const { error } = await supabase.from('quote_request_info_sessions').insert({
    info_request_id: infoRequest.id,
    session_hash: await hashToken(token),
    token_version: infoRequest.token_version,
    expires_at: expires,
  })
  if (error) return null
  const maxAge = Math.max(0, Math.floor((new Date(expires).getTime() - Date.now()) / 1000))
  return { cookie: sessionCookie(token, maxAge), maxAge }
}

export async function revokeSessions(supabase: SupabaseClient<Database>, infoRequestId: string) {
  await supabase
    .from('quote_request_info_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('info_request_id', infoRequestId)
    .is('revoked_at', null)
}

/* ------------------------------- beheer ---------------------------------- */

export type CreateResult =
  | { ok: true; id: string; token: string; expiresAt: string; revision: number }
  | { ok: false; reason: string }

/**
 * Maakt een informatieverzoek binnen een bestaande aanvraag. Nooit een tweede
 * lead, nooit een tweede aanvraag. Een lopend verzoek wordt eerst vervangen:
 * dat trekt het vorige verzoek én zijn toegang in.
 */
export async function createInfoRequest(
  supabase: SupabaseClient<Database>,
  input: {
    quoteRequestId: string
    assessmentId: string | null
    items: string[]
    language: string
    customerNote: string
    extraQuestion?: string
    actorId: string | null
    leadStatus: string | null
    openNow: boolean
  },
): Promise<CreateResult> {
  const items = input.items.filter(isInfoRequestItemCode)
  if (!items.length) return { ok: false, reason: 'no_items' }
  if (!isActionAllowed(input.leadStatus, 'create')) return { ok: false, reason: 'status_blocked' }

  const { data: live } = await supabase
    .from('quote_request_info_requests')
    .select('id, revision')
    .eq('quote_request_id', input.quoteRequestId)
    .in('status', ['draft', 'open'])
    .maybeSingle()

  const revision = (live?.revision ?? 0) + 1
  const token = input.openNow ? newToken() : null
  const expiresAt = infoRequestExpiresAt()

  const { data: created, error } = await supabase
    .from('quote_request_info_requests')
    .insert({
      quote_request_id: input.quoteRequestId,
      assessment_id: input.assessmentId,
      status: input.openNow ? 'open' : 'draft',
      revision,
      language: input.language === 'en' ? 'en' : 'nl',
      items,
      customer_note: input.customerNote.slice(0, 600),
      extra_question: items.includes('extra_question') ? (input.extraQuestion ?? '').slice(0, 300) || null : null,
      token_hash: token ? await hashToken(token) : null,
      expires_at: expiresAt,
      created_by: input.actorId,
      opened_at: input.openNow ? new Date().toISOString() : null,
    })
    .select('id, revision')
    .single()

  if (error || !created) {
    // De partiële unieke index bewaakt "één lopend verzoek per aanvraag".
    return { ok: false, reason: error?.code === '23505' ? 'already_open' : 'insert_failed' }
  }

  if (live) {
    await supabase
      .from('quote_request_info_requests')
      .update({ status: 'superseded', superseded_by: created.id, token_hash: null })
      .eq('id', live.id)
    await revokeSessions(supabase, live.id)
  }

  return { ok: true, id: created.id, token: token ?? '', expiresAt, revision: created.revision }
}

export async function withdrawInfoRequest(supabase: SupabaseClient<Database>, id: string) {
  const { error } = await supabase
    .from('quote_request_info_requests')
    .update({ status: 'withdrawn', withdrawn_at: new Date().toISOString(), token_hash: null })
    .eq('id', id)
    .in('status', ['draft', 'open'])
  if (error) return { ok: false as const, reason: 'update_failed' }
  await revokeSessions(supabase, id)
  return { ok: true as const }
}

/* --------------------------- klantweergave -------------------------------- */

/** Exact wat de klantpagina mag zien — niets meer. */
export async function customerState(supabase: SupabaseClient<Database>, row: InfoRequestRow) {
  const access = evaluateAccess({ status: row.status as never, expiresAt: row.expires_at })
  const view = buildCustomerView({
    language: row.language,
    customerNote: row.customer_note,
    items: row.items,
    extraQuestion: row.extra_question,
  })
  const { data: files } = await supabase
    .from('quote_request_attachments')
    .select('attachment_id, category, original_filename, size_bytes')
    .eq('draft_id', row.id)
    .eq('status', 'stored')
  return {
    access,
    language: view.language,
    note: view.note,
    items: view.items as InfoRequestItemCode[],
    extraQuestion: view.extraQuestion,
    callbackRequested: row.callback_requested,
    revision: row.revision,
    draftRevision: row.draft_revision,
    answers: (row.draft_answers ?? {}) as Record<string, unknown>,
    files: (files ?? []).map(file => ({
      attachmentId: file.attachment_id,
      category: file.category,
      filename: file.original_filename,
      size: file.size_bytes,
    })),
    submittedAt: row.submitted_at,
  }
}
