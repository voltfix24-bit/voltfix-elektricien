/**
 * Toestemming als serverbesluit, met een door de server uitgegeven bon.
 *
 * Waarom een bon: een klik-id dat een bezoeker meestuurt bewijst niets. Wie een
 * klik-id van iemand anders kent, zou anders de toestemming van die ander
 * kunnen omzetten. De server geeft daarom bij het vastleggen van een
 * advertentieklik een geheime bon uit. Alleen met die bon kan de keuze van
 * díe bezoeker later worden gewijzigd.
 *
 * Twee harde regels:
 * 1. Een weigering werkt altijd door: die is beperkend en kan nooit een
 *    betaalde conversie fabriceren.
 * 2. "Weer toestaan" raakt uitsluitend regels die eerder door dezelfde bon op
 *    geweigerd zijn gezet. Niemand kan met een bon de toestemming van een
 *    ander dossier op toegestaan zetten.
 *
 * Wat hier nooit gebeurt: een al ingediende gebeurtenis terugdraaien, of een
 * klantaanvraag blokkeren.
 */

/** Klik-id's van Google zijn kort en alfanumeriek; al het andere weigeren we. */
export const AD_ID_PATTERN = /^[A-Za-z0-9._-]{6,200}$/
export const CLICK_REF_PATTERN = /^[23456789BCDFGHJKLMNPQRSTVWXZ]{6,10}$/

/** Statussen die nog niet de deur uit zijn en dus nog te blokkeren zijn. */
export const OPEN_OUTBOX_STATUSES = [
  'pending',
  'failed_temporary',
  'export_disabled',
  'config_missing',
  'no_evidence',
  'blocked_consent',
  'destination_changed',
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
  | { ok: false; reason: 'unknown_ticket' | 'stale' }

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** De bon wordt nooit onversleuteld bewaard: alleen de vingerafdruk gaat de database in. */
export async function hashConsentToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(`voltfix-consent:${token}`)
  return toHex(await crypto.subtle.digest('SHA-256', data))
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
 * Geeft een bon uit voor de klik-id's van déze bezoeker. Zonder geldig klik-id
 * is er niets te beheren en komt er ook geen bon.
 */
export async function issueConsentTicket(input: Partial<TicketIds>): Promise<{ token: string } | null> {
  const ids = sanitizeTicketIds(input)
  if (!ids.gclid && !ids.gbraid && !ids.wbraid) return null
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const token = newConsentToken()
  const tokenHash = await hashConsentToken(token)
  const { error } = await supabaseAdmin.from('ad_consent_tickets').insert({
    token_hash: tokenHash,
    gclid: ids.gclid,
    gbraid: ids.gbraid,
    wbraid: ids.wbraid,
    click_ref: ids.clickRef,
  } as never)
  if (error) throw new Error(error.message)
  return { token }
}

type TicketRow = {
  id: string
  gclid: string | null
  gbraid: string | null
  wbraid: string | null
  last_seq: number | null
  created_at: string | null
}

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

/**
 * Legt de keuze van deze bezoeker vast en laat hem doorwerken in de eigen
 * gemeten klikken, de eigen dossiers en de wachtende terugmeldingen.
 *
 * Volgorde is hier het hele punt. Het besluit wordt eerst vastgelegd (dat is
 * meteen de claim op dit volgnummer), dan volgen de dossierupdates, en pas
 * daarna schuift het volgnummer van de bon op. Valt er iets uit tussen die
 * stappen, dan geldt het verzoek als niet-voltooid: exact hetzelfde verzoek
 * mag opnieuw en maakt het werk alsnog af. Andersom — het volgnummer eerst
 * ophogen — zou een half verwerkte intrekking als voltooid bestempelen.
 *
 * Elke databasefout wordt gemeld (throw): een stille mislukking zou de bezoeker
 * laten geloven dat zijn intrekking is verwerkt.
 */
export async function applyConsentDecision(input: ConsentApplyInput): Promise<ConsentApplyResult> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const tokenHash = await hashConsentToken(input.token)

  const ticketRead = await supabaseAdmin
    .from('ad_consent_tickets')
    .select('id, gclid, gbraid, wbraid, last_seq, created_at')
    .eq('token_hash', tokenHash)
    .maybeSingle()
  if (ticketRead.error) throw new Error(ticketRead.error.message)
  const ticket = ticketRead.data as TicketRow | null
  if (!ticket) return { ok: false, reason: 'unknown_ticket' }

  // Replaybescherming, in twee delen.
  // 1. Al volledig verwerkt: het volgnummer van de bon staat er al voorbij.
  if (input.seq <= (ticket.last_seq ?? 0)) return { ok: false, reason: 'stale' }
  // 2. Er ligt al een nieuwer besluit klaar (mogelijk nog halverwege). Een
  //    ouder verzoek — bijvoorbeeld een trage "weer toestaan" die na een
  //    nieuwere weigering binnenkomt — mag daar nooit overheen.
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
    // Hetzelfde volgnummer stond er al. Omdat het volgnummer van de bon nog
    // niet is opgeschoven (dat gebeurt pas helemaal aan het eind), is het
    // vorige verzoek blijven steken. Niet als voltooid behandelen: gewoon
    // afmaken. De updates hieronder zijn idempotent.
    if ((decision.error as { code?: string }).code !== '23505') throw new Error(decision.error.message)
  }

  const applied = await applyToOwnRecords(supabaseAdmin, ticket, input)

  // Is er ondertussen een nieuwere keuze binnengekomen? Dan is dit besluit
  // achterhaald. Was dit een "weer toestaan" en is de nieuwere keuze een
  // weigering, dan zetten we die weigering meteen opnieuw door: de
  // beperkende keuze mag nooit blijven liggen omdat een trager verzoek er
  // overheen liep.
  const newest = await newestDecision(supabaseAdmin, ticket.id)
  if (newest && newest.seq > input.seq) {
    if (input.adUserData === 'granted' && newest.ad_user_data === 'denied') {
      await applyToOwnRecords(supabaseAdmin, ticket, {
        adUserData: 'denied',
        adStorage: newest.ad_storage === 'granted' ? 'granted' : 'denied',
      })
      await finishDecision(supabaseAdmin, ticket.id, newest.seq)
    }
    return { ok: false, reason: 'stale' }
  }

  // Pas nu het volgnummer opschuiven: alles wat bij dit besluit hoort is
  // verwerkt.
  await finishDecision(supabaseAdmin, ticket.id, input.seq)
  return { ok: true, ...applied }
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

/** Het meest recente besluit van deze bon. */
async function newestDecision(
  supabaseAdmin: any,
  ticketId: string,
): Promise<{ seq: number; ad_user_data: string; ad_storage: string | null } | null> {
  const res = await supabaseAdmin
    .from('ad_consent_decisions')
    .select('seq, ad_user_data, ad_storage')
    .eq('ticket_id', ticketId)
    .order('seq', { ascending: false })
    .limit(1)
  if (res.error) throw new Error(res.error.message)
  return ((res.data ?? [])[0] ?? null) as { seq: number; ad_user_data: string; ad_storage: string | null } | null
}

/**
 * Zet de keuze door op de klikken, dossiers en wachtende terugmeldingen die
 * bij déze bon horen. Idempotent: twee keer draaien geeft dezelfde uitkomst,
 * zodat een afgebroken verzoek gewoon kan worden afgemaakt.
 */
async function applyToOwnRecords(
  supabaseAdmin: any,
  ticket: TicketRow,
  input: { adUserData: 'granted' | 'denied'; adStorage: 'granted' | 'denied' | null },
): Promise<{ events: number; leads: number; blocked: number; unblocked: number }> {
  const ids = ID_COLUMNS.map((column) => ({ column, value: ticket[column] })).filter(
    (pair): pair is { column: (typeof ID_COLUMNS)[number]; value: string } => Boolean(pair.value),
  )

  const denied = input.adUserData === 'denied'
  let events = 0
  const leadIds: string[] = []

  // Eigenaarschap. Een bon zegt alleen iets over wat ná zijn uitgifte is
  // ontstaan. Wie een klik-id van een ander kent en daarmee een verse bon
  // haalt, krijgt dus geen enkele greep op bestaande dossiers — ook niet door
  // ze eerst te blokkeren en daarna weer vrij te geven.
  const ownedSince = ticket.created_at

  for (const pair of ids) {
    // Gestructureerde vergelijking per kolom: nooit bezoekersinvoer in een
    // filteruitdrukking plakken.
    const patch: Record<string, unknown> = {
      consent_ad_user_data: input.adUserData,
      ...(input.adStorage ? { consent_ad_storage: input.adStorage } : {}),
      consent_ticket_id: denied ? ticket.id : null,
    }
    let query = supabaseAdmin.from('conversion_events').update(patch as never).eq(pair.column, pair.value)
    if (ownedSince) query = query.gte('created_at', ownedSince)
    // Weer toestaan raakt uitsluitend wat deze bon zelf heeft geweigerd.
    if (!denied) query = query.eq('consent_ticket_id', ticket.id)
    const res = await query.select('id')
    if (res.error) throw new Error(res.error.message)
    events += (res.data ?? []).length

    const leadPatch: Record<string, unknown> = {
      ad_consent_ad_user_data: input.adUserData,
      consent_ticket_id: denied ? ticket.id : null,
    }
    let leadQuery = supabaseAdmin.from('leads').update(leadPatch as never).eq(pair.column, pair.value)
    if (ownedSince) leadQuery = leadQuery.gte('created_at', ownedSince)
    if (!denied) leadQuery = leadQuery.eq('consent_ticket_id', ticket.id)
    const leadRes = await leadQuery.select('id')
    if (leadRes.error) throw new Error(leadRes.error.message)
    for (const row of (leadRes.data ?? []) as { id: string }[]) {
      if (!leadIds.includes(row.id)) leadIds.push(row.id)
    }
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
