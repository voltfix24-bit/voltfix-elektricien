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
  | { ok: false; reason: 'unknown_ticket' | 'stale' | 'busy' | 'conflict' }


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
    // Uitgiftemoment en volgnummer expliciet vastleggen: daarop rust zowel de
    // eigenaarschapsgrens als de replaybescherming.
    created_at: new Date().toISOString(),
    last_seq: 0,
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
 * Wie hoort er bij een klik-id?
 *
 * Een tijdstip beschermt geen eigenaarschap: wie een klik-id van een ander kent
 * kon eerder een verse bon halen en daarmee alsnog aan bestaande gegevens
 * komen. De regel is daarom: de éérst uitgegeven bon voor een klik-id is de
 * eigenaar van dat klik-id, en alleen die eigenaar mag toestemming teruggeven.
 * Dat is onafhankelijk van wanneer het dossier is ontstaan, dus een herstelbon
 * van de echte bezoeker bereikt ook zijn eigen oudere dossier.
 */
async function ownerTicketId(supabaseAdmin: any, column: string, value: string): Promise<string | null> {
  const res = await supabaseAdmin
    .from('ad_consent_tickets')
    .select('id, created_at')
    .eq(column, value)
    .order('created_at', { ascending: true })
    .limit(10)
  if (res.error) throw new Error(res.error.message)
  const rows = (res.data ?? []) as { id: string; created_at: string | null }[]
  if (rows.length === 0) return null
  // Gelijke tijdstippen: het rij-id beslist, zodat de uitkomst altijd dezelfde is.
  const sorted = [...rows].sort((a, b) => {
    const t = String(a.created_at ?? '').localeCompare(String(b.created_at ?? ''))
    return t !== 0 ? t : a.id.localeCompare(b.id)
  })
  return sorted[0]!.id
}

/** Hoe lang een vastgelopen verwerking een bon mag blokkeren. */
const LOCK_TTL_MS = 60_000

/**
 * Serialiseert de verwerking per bon. Zonder deze grendel konden twee
 * overlappende keuzes door elkaar heen lopen: een trage "weer toestaan" schreef
 * dan granted terug nádat een nieuwere weigering al was bevestigd. Achteraf
 * compenseren is daarvoor niet genoeg — tussen die twee momenten kan de worker
 * de gebeurtenis al hebben verzonden.
 */
async function acquireTicketLock(supabaseAdmin: any, ticketId: string, seq: number): Promise<boolean> {
  const name = `consent_lock:${ticketId}`
  const now = new Date()
  const ins = await supabaseAdmin
    .from('ads_worker_checkpoint')
    .insert({ name, cursor_value: String(seq), updated_at: now.toISOString() } as never)
  if (!ins.error) return true
  if ((ins.error as { code?: string }).code !== '23505') throw new Error(ins.error.message)
  // De grendel staat al. Alleen overnemen wanneer de vorige verwerking
  // aantoonbaar is blijven hangen.
  const stale = new Date(now.getTime() - LOCK_TTL_MS).toISOString()
  const taken = await supabaseAdmin
    .from('ads_worker_checkpoint')
    .update({ cursor_value: String(seq), updated_at: now.toISOString() } as never)
    .eq('name', name)
    .lt('updated_at', stale)
    .select('name')
  if (taken.error) throw new Error(taken.error.message)
  return ((taken.data ?? []) as unknown[]).length > 0
}

async function releaseTicketLock(supabaseAdmin: any, ticketId: string): Promise<void> {
  const res = await supabaseAdmin.from('ads_worker_checkpoint').delete().eq('name', `consent_lock:${ticketId}`)
  if (res?.error) console.error('Grendel vrijgeven mislukt', res.error.message)
}

/**
 * Legt de keuze van deze bezoeker vast en laat hem doorwerken in de eigen
 * gemeten klikken, de eigen dossiers en de wachtende terugmeldingen.
 *
 * De verwerking loopt binnen een grendel op de bon, zodat twee gelijktijdige
 * keuzes elkaar niet kunnen kruisen. Binnen die grendel geldt: besluit
 * vastleggen, dossiers bijwerken, en pas daarna het volgnummer opschuiven.
 * Valt er iets uit, dan geldt het verzoek als niet-voltooid en mag exact
 * hetzelfde verzoek het werk afmaken. Een herhaling met hetzelfde volgnummer
 * maar een andere keuze wordt geweigerd.
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
  const first = ticketRead.data as TicketRow | null
  if (!first) return { ok: false, reason: 'unknown_ticket' }

  if (!(await acquireTicketLock(supabaseAdmin, first.id, input.seq))) {
    // Er loopt een andere keuze van dezelfde bezoeker. Niet bevestigen: de
    // browser houdt hem klaar en probeert het opnieuw.
    return { ok: false, reason: 'busy' }
  }

  try {
    // Binnen de grendel opnieuw lezen: de stand kan net zijn opgeschoven.
    const fresh = await supabaseAdmin
      .from('ad_consent_tickets')
      .select('id, gclid, gbraid, wbraid, last_seq, created_at')
      .eq('id', first.id)
      .maybeSingle()
    if (fresh.error) throw new Error(fresh.error.message)
    const ticket = (fresh.data as TicketRow | null) ?? first

    // 1. Al volledig verwerkt: het volgnummer van de bon staat er al voorbij.
    if (input.seq <= (ticket.last_seq ?? 0)) return { ok: false, reason: 'stale' }
    // 2. Er ligt al een nieuwer besluit. Een ouder verzoek — bijvoorbeeld een
    //    trage "weer toestaan" na een nieuwere weigering — mag daar nooit
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
      // het werk afmaken; dezelfde teller met een andere keuze is geen
      // herhaling maar een tegenstrijdigheid.
      const existing = await supabaseAdmin
        .from('ad_consent_decisions')
        .select('ad_user_data, ad_storage')
        .eq('ticket_id', ticket.id)
        .eq('seq', input.seq)
        .maybeSingle()
      if (existing.error) throw new Error(existing.error.message)
      const prev = existing.data as { ad_user_data: string; ad_storage: string | null } | null
      if (prev && (prev.ad_user_data !== input.adUserData || (prev.ad_storage ?? null) !== input.adStorage)) {
        return { ok: false, reason: 'conflict' }
      }
    }

    const applied = await applyToOwnRecords(supabaseAdmin, ticket, input)

    // Pas nu het volgnummer opschuiven: alles wat bij dit besluit hoort is
    // verwerkt.
    await finishDecision(supabaseAdmin, ticket.id, input.seq)
    return { ok: true, ...applied }
  } finally {
    await releaseTicketLock(supabaseAdmin, first.id)
  }
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
 * Zet de keuze door op de klikken, dossiers en wachtende terugmeldingen die
 * bij déze bon horen. Idempotent: twee keer draaien geeft dezelfde uitkomst,
 * zodat een afgebroken verzoek gewoon kan worden afgemaakt.
 *
 * Eigenaarschap: weigeren is beperkend en mag altijd op de eigen klik-id's.
 * Toestemming teruggeven kan alleen de eigenaar van het klik-id, en dan nog
 * uitsluitend op regels die deze bon zélf heeft geblokkeerd. Zo kan een bon
 * nooit bestaande gegevens van een ander overnemen — ook niet door ze eerst te
 * blokkeren en daarna vrij te geven.
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

  for (const pair of ids) {
    const owner = await ownerTicketId(supabaseAdmin, pair.column, pair.value)
    // Eerste grens: alleen de éérst uitgegeven bon voor dit klik-id is de
    // eigenaar. Een later opgehaalde bon kan zo nooit zeggenschap krijgen over
    // klikken van iemand anders — ook niet door ze eerst te blokkeren.
    if (owner !== ticket.id) continue

    // Gestructureerde vergelijking per kolom: nooit bezoekersinvoer in een
    // filteruitdrukking plakken.
    const patch: Record<string, unknown> = {
      consent_ad_user_data: input.adUserData,
      ...(input.adStorage ? { consent_ad_storage: input.adStorage } : {}),
      consent_ticket_id: denied ? ticket.id : null,
    }
    let query = supabaseAdmin.from('conversion_events').update(patch as never).eq(pair.column, pair.value)
    // Tweede grens: gegevens die al bestonden vóór deze bon zijn niet met deze
    // bezoeker te verbinden, tenzij deze bon ze zelf heeft gemarkeerd. Zonder
    // die grens kon iemand met een bekend klik-id een ouder, vreemd dossier
    // eerst blokkeren en het daarna als "eigen" weer vrijgeven.
    if (ticket.created_at) query = query.gte('created_at', ticket.created_at)
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
    if (ticket.created_at) leadQuery = leadQuery.gte('created_at', ticket.created_at)
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

