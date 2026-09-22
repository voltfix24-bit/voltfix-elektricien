/**
 * Toestemming als serverbesluit, gebonden aan de bezoeker zelf.
 *
 * Waarom niet aan het klik-id: een klik-id is geen geheim. Wie het klik-id van
 * een ander kent, kon eerder als eerste een bon ophalen en werd daarmee
 * "eigenaar" van die klik. De volgorde waarin iemand een publiek klik-id noemt
 * mag nooit bevoegdheid bepalen.
 *
 * Daarom geldt nu: de browser bewaart een eigen geheim (zie visitor-consent.ts)
 * en de server bewaart daarvan alleen een vingerafdruk op de bon. Metingen en
 * dossiers krijgen diezelfde vingerafdruk mee zodra ze ontstaan. Een keuze
 * werkt door op precies die gegevens.
 *
 * Twee harde regels:
 * 1. Weigeren is beperkend en mag altijd doorwerken — ook op oudere gegevens
 *    die alleen via het klik-id te vinden zijn. Een weigering kan nooit een
 *    betaalde conversie fabriceren.
 * 2. Toestemming teruggeven kan alleen op gegevens die aantoonbaar van deze
 *    bezoeker zijn: dezelfde vingerafdruk, of gegevens die deze bon zelf eerder
 *    heeft geblokkeerd. Gegevens zonder betrouwbare binding blijven staan als
 *    "onbewezen" en gaan niet naar Google.
 */

/** Klik-id's van Google zijn kort en alfanumeriek; al het andere weigeren we. */
export const AD_ID_PATTERN = /^[A-Za-z0-9._-]{6,200}$/
export const CLICK_REF_PATTERN = /^[23456789BCDFGHJKLMNPQRSTVWXZ]{6,10}$/
export const VISITOR_TOKEN_PATTERN = /^[A-Za-z0-9._-]{16,200}$/

/** Statussen die nog niet de deur uit zijn en dus nog te blokkeren zijn. */
export const OPEN_OUTBOX_STATUSES = [
  'pending',
  'failed_temporary',
  'export_disabled',
  'config_missing',
  'no_evidence',
  'blocked_consent',
  'destination_changed',
  'skipped_historical',
]

export type ConsentApplyInput = {
  token: string
  adUserData: 'granted' | 'denied'
  adStorage: 'granted' | 'denied' | null
  /** Volgnummer van de bezoeker: een ouder besluit mag een nieuwer nooit overschrijven. */
  seq: number
  origin?: string
  version?: number
}

export type ConsentApplyResult =
  | { ok: true; events: number; leads: number; blocked: number; unblocked: number }
  | { ok: false; reason: 'unknown_ticket' | 'stale' | 'busy' | 'conflict' }

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function sha256(prefix: string, value: string): Promise<string> {
  const data = new TextEncoder().encode(`${prefix}${value}`)
  return toHex(await crypto.subtle.digest('SHA-256', data))
}

/** De bon wordt nooit onversleuteld bewaard: alleen de vingerafdruk gaat de database in. */
export async function hashConsentToken(token: string): Promise<string> {
  return sha256('voltfix-consent:', token)
}

/** Idem voor het geheim van de browser zelf. */
export async function hashVisitorToken(token: string): Promise<string> {
  return sha256('voltfix-visitor:', token)
}

/** De vingerafdruk van deze bezoeker, of null als er geen bruikbaar geheim is. */
export async function visitorHashFrom(token: string | null | undefined): Promise<string | null> {
  const value = (token ?? '').trim()
  if (!value || !VISITOR_TOKEN_PATTERN.test(value)) return null
  return hashVisitorToken(value)
}

export function newConsentToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return toHex(bytes.buffer)
}

export type TicketIds = {
  gclid: string | null
  gbraid: string | null
  wbraid: string | null
  clickRef: string | null
}

export function sanitizeTicketIds(input: Partial<TicketIds>): TicketIds {
  const clean = (value: string | null | undefined, pattern: RegExp) =>
    typeof value === 'string' && pattern.test(value.trim()) ? value.trim() : null
  return {
    gclid: clean(input.gclid, AD_ID_PATTERN),
    gbraid: clean(input.gbraid, AD_ID_PATTERN),
    wbraid: clean(input.wbraid, AD_ID_PATTERN),
    clickRef: clean(input.clickRef ?? null, CLICK_REF_PATTERN),
  }
}

/**
 * Geeft een bon uit voor déze bezoeker.
 *
 * Hervatbaar: raakt het antwoord onderweg kwijt, dan vraagt dezelfde browser
 * het opnieuw met hetzelfde geheim. De server vindt dan de bestaande bon van
 * deze bezoeker, geeft daar een verse sleutel voor uit en vult de klik-id's
 * aan. Er ontstaat dus geen tweede, machteloze bon naast de eerste — de
 * bezoeker houdt zeggenschap over zijn eigen gegevens.
 */
export async function issueConsentTicket(
  input: Partial<TicketIds> & { visitorToken?: string | null },
): Promise<{ token: string; resumed: boolean } | null> {
  const ids = sanitizeTicketIds(input)
  if (!ids.gclid && !ids.gbraid && !ids.wbraid) return null
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const visitorHash = await visitorHashFrom(input.visitorToken ?? null)
  const token = newConsentToken()
  const tokenHash = await hashConsentToken(token)

  if (visitorHash) {
    const found = await supabaseAdmin
      .from('ad_consent_tickets')
      .select('id, gclid, gbraid, wbraid')
      .eq('visitor_hash', visitorHash)
      .order('created_at', { ascending: true })
      .limit(1)
    if (found.error) throw new Error(found.error.message)
    const existing = ((found.data ?? []) as { id: string; gclid: string | null; gbraid: string | null; wbraid: string | null }[])[0]
    if (existing) {
      // Dezelfde bezoeker: sleutel verversen en de klik-id's aanvullen. Een
      // eerder uitgegeven sleutel vervalt daarmee, wat precies de bedoeling is.
      const upd = await supabaseAdmin
        .from('ad_consent_tickets')
        .update({
          token_hash: tokenHash,
          gclid: ids.gclid ?? existing.gclid,
          gbraid: ids.gbraid ?? existing.gbraid,
          wbraid: ids.wbraid ?? existing.wbraid,
          ...(ids.clickRef ? { click_ref: ids.clickRef } : {}),
        } as never)
        .eq('id', existing.id)
        .select('id')
        .maybeSingle()
      if (upd.error) throw new Error(upd.error.message)
      if (!upd.data) throw new Error('Toestemmingsbon kon niet worden ververst')
      return { token, resumed: true }
    }
  }

  const { error } = await supabaseAdmin.from('ad_consent_tickets').insert({
    created_at: new Date().toISOString(),
    last_seq: 0,
    token_hash: tokenHash,
    visitor_hash: visitorHash,
    gclid: ids.gclid,
    gbraid: ids.gbraid,
    wbraid: ids.wbraid,
    click_ref: ids.clickRef,
  } as never)
  if (error) throw new Error(error.message)
  return { token, resumed: false }
}

type TicketRow = {
  id: string
  gclid: string | null
  gbraid: string | null
  wbraid: string | null
  last_seq: number | null
  created_at: string | null
  visitor_hash: string | null
}

const TICKET_FIELDS = 'id, gclid, gbraid, wbraid, last_seq, created_at, visitor_hash'

const ID_COLUMNS = ['gclid', 'gbraid', 'wbraid'] as const

/** Het hoogste besluitnummer dat voor deze bon al is aangemaakt. */
async function highestDecisionSeq(supabaseAdmin: any, ticketId: string): Promise<number> {
  const res = await supabaseAdmin
    .from('ad_consent_decisions')
    .select('seq')
    .eq('ticket_id', ticketId)
    .order('seq', { ascending: false })
    .limit(1)
  if (res.error) throw new Error(res.error.message)
  const rows = (res.data ?? []) as { seq: number }[]
  return rows[0]?.seq ?? 0
}

/** Hoe lang een vastgelopen verwerking een bon mag blokkeren. */
const LOCK_TTL_MS = 60_000

function lockName(ticketId: string) {
  return `consent_lock:${ticketId}`
}

/**
 * Serialiseert de verwerking per bon, mét eigen kenmerk.
 *
 * Alleen een grendel met tijdslimiet was niet genoeg: de verwerking die de
 * grendel kwijtraakte, bleef gewoon schrijven en kon zelfs de vervangende
 * grendel opheffen. Daarom draagt de grendel een uniek kenmerk. Elke schrijf-
 * en vrijgeefactie controleert dat kenmerk; wie de grendel is kwijtgeraakt,
 * schrijft niets meer.
 */
async function acquireTicketLock(supabaseAdmin: any, ticketId: string): Promise<string | null> {
  const name = lockName(ticketId)
  const stamp = newConsentToken().slice(0, 32)
  const now = new Date()
  const ins = await supabaseAdmin
    .from('ads_worker_checkpoint')
    .insert({ name, cursor_value: stamp, updated_at: now.toISOString() } as never)
  if (!ins.error) return stamp
  if ((ins.error as { code?: string }).code !== '23505') throw new Error(ins.error.message)
  // De grendel staat al. Alleen overnemen wanneer de vorige verwerking
  // aantoonbaar is blijven hangen.
  const stale = new Date(now.getTime() - LOCK_TTL_MS).toISOString()
  const taken = await supabaseAdmin
    .from('ads_worker_checkpoint')
    .update({ cursor_value: stamp, updated_at: now.toISOString() } as never)
    .eq('name', name)
    .lt('updated_at', stale)
    .select('name')
  if (taken.error) throw new Error(taken.error.message)
  return ((taken.data ?? []) as unknown[]).length > 0 ? stamp : null
}

/** Heeft deze verwerking de grendel nog? Zo niet, dan schrijft ze niets meer. */
async function holdsTicketLock(supabaseAdmin: any, ticketId: string, stamp: string): Promise<boolean> {
  const res = await supabaseAdmin
    .from('ads_worker_checkpoint')
    .select('cursor_value')
    .eq('name', lockName(ticketId))
    .maybeSingle()
  if (res.error) throw new Error(res.error.message)
  return (res.data as { cursor_value: string | null } | null)?.cursor_value === stamp
}

async function releaseTicketLock(supabaseAdmin: any, ticketId: string, stamp: string): Promise<void> {
  // Alleen de eigen grendel opheffen: een oude verwerking mag de vervangende
  // grendel van een nieuwere verwerking nooit weghalen.
  const res = await supabaseAdmin
    .from('ads_worker_checkpoint')
    .delete()
    .eq('name', lockName(ticketId))
    .eq('cursor_value', stamp)
  if (res?.error) console.error('Grendel vrijgeven mislukt', res.error.message)
}

/**
 * Legt de keuze van deze bezoeker vast en laat hem doorwerken in de eigen
 * metingen, dossiers en wachtende terugmeldingen.
 *
 * Volgorde binnen de grendel: besluit vastleggen, gegevens bijwerken, en pas
 * daarna het volgnummer opschuiven. Valt er iets uit, dan geldt het verzoek als
 * niet-voltooid en mag exact hetzelfde verzoek het werk afmaken. Raakt deze
 * verwerking onderweg haar grendel kwijt, dan stopt ze zonder te schrijven.
 *
 * Elke databasefout wordt gemeld (throw): een stille mislukking zou de bezoeker
 * laten geloven dat zijn intrekking is verwerkt.
 */
export async function applyConsentDecision(input: ConsentApplyInput): Promise<ConsentApplyResult> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const tokenHash = await hashConsentToken(input.token)

  const ticketRead = await supabaseAdmin
    .from('ad_consent_tickets')
    .select(TICKET_FIELDS)
    .eq('token_hash', tokenHash)
    .maybeSingle()
  if (ticketRead.error) throw new Error(ticketRead.error.message)
  const first = ticketRead.data as TicketRow | null
  if (!first) return { ok: false, reason: 'unknown_ticket' }

  const stamp = await acquireTicketLock(supabaseAdmin, first.id)
  if (!stamp) {
    // Er loopt een andere keuze van dezelfde bezoeker. Niet bevestigen: de
    // browser houdt hem klaar en probeert het opnieuw.
    return { ok: false, reason: 'busy' }
  }

  try {
    // Binnen de grendel opnieuw lezen: de stand kan net zijn opgeschoven.
    const fresh = await supabaseAdmin
      .from('ad_consent_tickets')
      .select(TICKET_FIELDS)
      .eq('id', first.id)
      .maybeSingle()
    if (fresh.error) throw new Error(fresh.error.message)
    const ticket = (fresh.data as TicketRow | null) ?? first

    // 1. Al volledig verwerkt: het volgnummer van de bon staat er al voorbij.
    if (input.seq <= (ticket.last_seq ?? 0)) {
      if (await conflictsWithStored(supabaseAdmin, ticket.id, input)) {
        return { ok: false, reason: 'conflict' }
      }
      return { ok: false, reason: 'stale' }
    }
    // 2. Er ligt al een nieuwer besluit: een ouder verzoek mag daar nooit
    //    overheen, ook niet gedeeltelijk.
    if ((await highestDecisionSeq(supabaseAdmin, ticket.id)) > input.seq) {
      return { ok: false, reason: 'stale' }
    }

    const decision = await supabaseAdmin.from('ad_consent_decisions').insert({
      ticket_id: ticket.id,
      ad_user_data: input.adUserData,
      ad_storage: input.adStorage,
      origin: input.origin ?? 'cookie_banner',
      consent_version: input.version ?? 2,
      seq: input.seq,
    } as never)
    if (decision.error) {
      if ((decision.error as { code?: string }).code !== '23505') throw new Error(decision.error.message)
      // Hetzelfde volgnummer stond er al. Alleen een identieke herhaling mag
      // het werk afmaken.
      if (await conflictsWithStored(supabaseAdmin, ticket.id, input)) {
        return { ok: false, reason: 'conflict' }
      }
    }

    // Vanaf hier wordt er geschreven. Eerst controleren of deze verwerking de
    // grendel nog heeft; anders is een nieuwere keuze aan zet en zou dit een
    // ingehaalde uitkomst terugschrijven.
    if (!(await holdsTicketLock(supabaseAdmin, ticket.id, stamp))) {
      return { ok: false, reason: 'busy' }
    }

    const applied = await applyToOwnRecords(supabaseAdmin, ticket, input)

    // Nog één keer: tussen bijwerken en afronden mag de grendel niet zijn
    // overgenomen, anders schuift een oude verwerking het volgnummer op.
    if (!(await holdsTicketLock(supabaseAdmin, ticket.id, stamp))) {
      return { ok: false, reason: 'busy' }
    }

    await finishDecision(supabaseAdmin, ticket.id, input.seq)
    return { ok: true, ...applied }
  } finally {
    await releaseTicketLock(supabaseAdmin, first.id, stamp)
  }
}

/** Staat er bij dit volgnummer al een ándere keuze? Dan is het geen herhaling. */
async function conflictsWithStored(
  supabaseAdmin: any,
  ticketId: string,
  input: { seq: number; adUserData: string; adStorage: string | null },
): Promise<boolean> {
  const existing = await supabaseAdmin
    .from('ad_consent_decisions')
    .select('ad_user_data, ad_storage')
    .eq('ticket_id', ticketId)
    .eq('seq', input.seq)
    .maybeSingle()
  if (existing.error) throw new Error(existing.error.message)
  const prev = existing.data as { ad_user_data: string; ad_storage: string | null } | null
  if (!prev) return false
  return prev.ad_user_data !== input.adUserData || (prev.ad_storage ?? null) !== input.adStorage
}

/** Schuift het volgnummer van de bon op; alleen vooruit. */
async function finishDecision(supabaseAdmin: any, ticketId: string, seq: number): Promise<void> {
  const res = await supabaseAdmin
    .from('ad_consent_tickets')
    .update({ last_seq: seq } as never)
    .eq('id', ticketId)
    .lt('last_seq', seq)
    .select('id')
  if (res.error) throw new Error(res.error.message)
}

/**
 * Zet de keuze door op de metingen, dossiers en wachtende terugmeldingen die
 * bij déze bezoeker horen. Idempotent: twee keer draaien geeft dezelfde
 * uitkomst, zodat een afgebroken verzoek gewoon kan worden afgemaakt.
 *
 * Weigeren mag ruim: op de vingerafdruk van deze bezoeker én op de klik-id's
 * van deze bon. Dat is beperkend en kan niets fabriceren.
 * Toestemming teruggeven mag alleen op gegevens met dezelfde vingerafdruk, of
 * op gegevens die deze bon zélf heeft geblokkeerd.
 */
async function applyToOwnRecords(
  supabaseAdmin: any,
  ticket: TicketRow,
  input: { adUserData: 'granted' | 'denied'; adStorage: 'granted' | 'denied' | null },
): Promise<{ events: number; leads: number; blocked: number; unblocked: number }> {
  const denied = input.adUserData === 'denied'
  let events = 0
  const leadIds: string[] = []

  const eventPatch: Record<string, unknown> = {
    consent_ad_user_data: input.adUserData,
    ...(input.adStorage ? { consent_ad_storage: input.adStorage } : {}),
    consent_ticket_id: denied ? ticket.id : null,
  }
  const leadPatch: Record<string, unknown> = {
    ad_consent_ad_user_data: input.adUserData,
    consent_ticket_id: denied ? ticket.id : null,
  }

  /** Eén doorloop over een tabel met een bepaalde afbakening. */
  const runScope = async (
    scope: (builder: any) => any,
  ): Promise<void> => {
    const eventRes = await scope(supabaseAdmin.from('conversion_events').update(eventPatch as never)).select('id')
    if (eventRes.error) throw new Error(eventRes.error.message)
    events += (eventRes.data ?? []).length

    const leadRes = await scope(supabaseAdmin.from('leads').update(leadPatch as never)).select('id')
    if (leadRes.error) throw new Error(leadRes.error.message)
    for (const row of (leadRes.data ?? []) as { id: string }[]) {
      if (!leadIds.includes(row.id)) leadIds.push(row.id)
    }
  }

  // 1. Alles met de vingerafdruk van deze bezoeker: dat is de betrouwbare
  //    binding, en die geldt voor weigeren én weer toestaan.
  if (ticket.visitor_hash) {
    await runScope((q) => q.eq('consent_visitor_hash', ticket.visitor_hash))
  }

  // 2. Weigeren werkt daarnaast door op de klik-id's van deze bon — ook op
  //    oudere gegevens zonder vingerafdruk. Beperkend mag altijd.
  if (denied) {
    for (const column of ID_COLUMNS) {
      const value = ticket[column]
      if (!value) continue
      await runScope((q) => q.eq(column, value))
    }
  } else {
    // 3. Weer toestaan raakt verder uitsluitend wat deze bon zelf heeft
    //    geblokkeerd. Nooit vreemde gegevens vrijgeven.
    await runScope((q) => q.eq('consent_ticket_id', ticket.id))
  }

  if (leadIds.length === 0) return { events, leads: 0, blocked: 0, unblocked: 0 }

  let blocked = 0
  let unblocked = 0
  if (denied) {
    const res = await supabaseAdmin
      .from('ads_conversion_outbox')
      .update({
        status: 'blocked_consent',
        consent_ad_user_data: 'denied',
        last_error: 'Toestemming ingetrokken door de bezoeker.',
      } as never)
      .in('lead_id', leadIds)
      .in('status', OPEN_OUTBOX_STATUSES)
      .select('id')
    if (res.error) throw new Error(res.error.message)
    blocked = (res.data ?? []).length
  } else {
    // Weer toegestaan: de wachtrij leest zelf opnieuw of alles klopt.
    const res = await supabaseAdmin
      .from('ads_conversion_outbox')
      .update({ consent_ad_user_data: 'granted' } as never)
      .in('lead_id', leadIds)
      .eq('status', 'blocked_consent')
      .select('id')
    if (res.error) throw new Error(res.error.message)
    unblocked = (res.data ?? []).length
  }

  return { events, leads: leadIds.length, blocked, unblocked }
}

/**
 * De gezaghebbende toestemming vlak vóór verzending.
 *
 * Het veld op het dossier is een kopie. Mislukt de dossierupdate van een
 * intrekking, dan staat daar nog "toegestaan" terwijl het besluit van de
 * bezoeker allang is vastgelegd. De verzending kijkt daarom naar het laatste
 * besluit zelf: dat is wat de bezoeker werkelijk heeft gekozen.
 *
 * Gooit bij een leesfout: een onleesbaar besluit mag nooit als toestemming
 * worden uitgelegd.
 */
export async function authoritativeConsent(
  supabaseAdmin: any,
  record: {
    consent_visitor_hash?: string | null
    gclid: string | null
    gbraid: string | null
    wbraid: string | null
  },
): Promise<'granted' | 'denied' | null> {
  const tickets: TicketRow[] = []
  const collect = async (column: string, value: string) => {
    const res = await supabaseAdmin.from('ad_consent_tickets').select(TICKET_FIELDS).eq(column, value)
    if (res.error) throw new Error(res.error.message)
    for (const row of (res.data ?? []) as TicketRow[]) {
      if (!tickets.some((t) => t.id === row.id)) tickets.push(row)
    }
  }
  if (record.consent_visitor_hash) await collect('visitor_hash', record.consent_visitor_hash)
  for (const column of ID_COLUMNS) {
    const value = record[column]
    if (value) await collect(column, value)
  }
  if (tickets.length === 0) return null

  let latest: { seq: number; value: 'granted' | 'denied' } | null = null
  for (const ticket of tickets) {
    const res = await supabaseAdmin
      .from('ad_consent_decisions')
      .select('seq, ad_user_data')
      .eq('ticket_id', ticket.id)
      .order('seq', { ascending: false })
      .limit(1)
    if (res.error) throw new Error(res.error.message)
    const row = ((res.data ?? []) as { seq: number; ad_user_data: string }[])[0]
    if (!row) continue
    const value = row.ad_user_data === 'granted' ? 'granted' : 'denied'
    // Een weigering weegt altijd het zwaarst: die is beperkend.
    if (value === 'denied') return 'denied'
    if (!latest || row.seq > latest.seq) latest = { seq: row.seq, value }
  }
  return latest?.value ?? null
}
