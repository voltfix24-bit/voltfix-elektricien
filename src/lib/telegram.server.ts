// Server-only Telegram Bot API helpers.

import { amsterdamNow } from '@/lib/schedule'
import { clockTime } from '@/lib/claim-priority'
import { publicPostalArea, redactLeadText } from '@/lib/lead-privacy'

const API = 'https://api.telegram.org'

function token(): string {
  const t = process.env['TELEGRAM_BOT_TOKEN']
  if (!t) throw new Error('TELEGRAM_BOT_TOKEN is not configured')
  return t
}

/** Aparte Telegram-groep voor tests; leeg = er is geen testkanaal ingesteld. */
export function testChatId(): string | null {
  return process.env['TELEGRAM_TEST_CHAT_ID']?.trim() || null
}

/**
 * Testmodus voor de hele omgeving. Staat die aan, dan gaat élk bericht naar de
 * testgroep — nooit naar de echte monteursgroep.
 */
export function isTestMode(): boolean {
  const flag = process.env['VOLTFIX_TEST_MODE']?.trim().toLowerCase()
  return flag === '1' || flag === 'true'
}

/** Testdossiers en testmodus praten alleen met de testgroep. */
export function usesTestChannel(target?: { is_test?: boolean | null } | boolean | null): boolean {
  if (isTestMode()) return true
  return typeof target === 'boolean' ? target : Boolean(target?.is_test)
}

export function groupChatId(target?: { is_test?: boolean | null } | boolean | null): string {
  if (usesTestChannel(target)) {
    const test = testChatId()
    if (!test) throw new Error('TELEGRAM_TEST_CHAT_ID is not configured — testbericht geweigerd om de echte groep te beschermen')
    return test
  }
  const id = process.env['TELEGRAM_CHAT_ID']
  if (!id) throw new Error('TELEGRAM_CHAT_ID is not configured')
  return id
}

async function call<T = any>(method: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API}/bot${token()}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let json: any
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`Telegram ${method} failed [${res.status}]: ${text}`)
  }
  if (!res.ok || json?.ok === false) {
    throw new Error(`Telegram ${method} failed [${res.status}]: ${text}`)
  }
  return json.result as T
}

export function getFile(fileId: string) {
  return call<{ file_path: string }>('getFile', { file_id: fileId })
}

export async function downloadFile(filePath: string): Promise<ArrayBuffer> {
  const res = await fetch(`${API}/file/bot${token()}/${filePath}`)
  if (!res.ok) throw new Error(`Telegram file download failed [${res.status}]`)
  return res.arrayBuffer()
}

export function sendMessage(opts: {
  chat_id: string | number
  text: string
  reply_markup?: unknown
}) {
  return call<{ message_id: number }>('sendMessage', {
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...opts,
  })
}

// Eén foto met het leadbericht als bijschrift + claimknop eronder.
export function sendPhoto(opts: {
  chat_id: string | number
  photo: string
  caption?: string
  reply_markup?: unknown
}) {
  return call<{ message_id: number }>('sendPhoto', { parse_mode: 'HTML', ...opts })
}

// Meerdere foto's als album; Telegram staat hier geen knoppen bij toe.
export function sendMediaGroup(opts: { chat_id: string | number; photos: string[] }) {
  return call<Array<{ message_id: number }>>('sendMediaGroup', {
    chat_id: opts.chat_id,
    media: opts.photos.slice(0, 10).map((url) => ({ type: 'photo', media: url })),
  })
}

/**
 * Album via directe upload (multipart) i.p.v. URL's. Telegram's eigen fetcher
 * weigert soms geldige signed URL's ("WEBPAGE_CURL_FAILED"); uploaden werkt altijd.
 */
export async function sendMediaGroupUpload(opts: {
  chat_id: string | number
  photos: Array<{ name: string; data: ArrayBuffer }>
}) {
  const files = opts.photos.slice(0, 10)
  const form = new FormData()
  form.set('chat_id', String(opts.chat_id))
  form.set(
    'media',
    JSON.stringify(files.map((f, i) => ({ type: 'photo', media: `attach://f${i}` }))),
  )
  files.forEach((f, i) => form.set(`f${i}`, new Blob([f.data]), f.name))
  const res = await fetch(`${API}/bot${token()}/sendMediaGroup`, { method: 'POST', body: form })
  const text = await res.text()
  const json = JSON.parse(text)
  if (!res.ok || json?.ok === false) throw new Error(`Telegram sendMediaGroup upload failed [${res.status}]: ${text}`)
  return json.result as Array<{ message_id: number }>
}

// Eén foto via directe upload (zelfde reden als sendMediaGroupUpload).
export async function sendPhotoUpload(opts: {
  chat_id: string | number
  name: string
  data: ArrayBuffer
  caption?: string
  reply_markup?: unknown
}) {
  const form = new FormData()
  form.set('chat_id', String(opts.chat_id))
  if (opts.caption) form.set('caption', opts.caption.slice(0, 1000))
  if (opts.reply_markup) form.set('reply_markup', JSON.stringify(opts.reply_markup))
  form.set('parse_mode', 'HTML')
  form.set('photo', new Blob([opts.data]), opts.name)
  const res = await fetch(`${API}/bot${token()}/sendPhoto`, { method: 'POST', body: form })
  const text = await res.text()
  const json = JSON.parse(text)
  if (!res.ok || json?.ok === false) throw new Error(`Telegram sendPhoto upload failed [${res.status}]: ${text}`)
  return json.result as { message_id: number }
}

/**
 * Bijlage als bestand versturen. Nodig voor iPhone-foto's (HEIC/HEIF):
 * Telegram toont die niet als foto, maar als bestand opent de monteur hem
 * gewoon. Zo valt een iPhone-foto nooit uit de keten.
 */
export async function sendDocumentUpload(opts: {
  chat_id: string | number
  name: string
  data: ArrayBuffer
  caption?: string
}) {
  const form = new FormData()
  form.set('chat_id', String(opts.chat_id))
  if (opts.caption) form.set('caption', opts.caption.slice(0, 1000))
  form.set('parse_mode', 'HTML')
  form.set('document', new Blob([opts.data]), opts.name)
  const res = await fetch(`${API}/bot${token()}/sendDocument`, { method: 'POST', body: form })
  const text = await res.text()
  const json = JSON.parse(text)
  if (!res.ok || json?.ok === false) throw new Error(`Telegram sendDocument upload failed [${res.status}]: ${text}`)
  return json.result as { message_id: number }
}



export function editMessageText(opts: {
  chat_id: string | number
  message_id: number
  text: string
  reply_markup?: unknown
}) {
  return call('editMessageText', {
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...opts,
  })
}

export function editMessageCaption(opts: {
  chat_id: string | number
  message_id: number
  caption: string
  reply_markup?: unknown
}) {
  return call('editMessageCaption', { parse_mode: 'HTML', ...opts })
}

export function editMessageReplyMarkup(opts: {
  chat_id: string | number
  message_id: number
  reply_markup: unknown
}) {
  return call('editMessageReplyMarkup', opts)
}

/**
 * Werkt het groepsbericht bij, ongeacht of het een tekst- of fotobericht is.
 * Bij een foto weigert Telegram editMessageText, dus valt hij terug op caption.
 */
export async function editLeadMessage(opts: {
  chat_id: string | number
  message_id: number
  text: string
  reply_markup?: unknown
}) {
  try {
    return await editMessageText(opts)
  } catch {
    // Fotobericht: captionlimiet is 1024 tekens. Kappen net als bij het
    // versturen (lead-dispatch), anders mislukt de update bij lange teksten.
    return await editMessageCaption({
      chat_id: opts.chat_id,
      message_id: opts.message_id,
      caption: opts.text.slice(0, 1000),
      reply_markup: opts.reply_markup,
    })
  }
}

/** Verwijdert de claimknoppen ook als Telegram de lange tekst/caption niet kan wijzigen. */
export function removeLeadKeyboard(opts: { chat_id: string | number; message_id: number }) {
  return editMessageReplyMarkup({
    ...opts,
    reply_markup: { inline_keyboard: [] },
  })
}


export function answerCallbackQuery(opts: {
  callback_query_id: string
  text?: string
  show_alert?: boolean
}) {
  return call('answerCallbackQuery', opts)
}

/** Bedrag met expliciete btw-vermelding (B2B, prijzen zijn exclusief 21% btw). */
export function euroExVat(cents: number): string {
  return `${euro(cents)} ex. btw`
}

export function euro(cents: number): string {
  return `€${(cents / 100).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export type LeadRow = {
  id: string
  ref_number?: number | null
  customer_name: string
  customer_phone: string
  customer_email: string | null
  postal_code: string | null
  address: string | null
  city: string | null
  job_type: string
  description: string | null
  price_cents: number
  price_status?: 'none' | 'hourly' | 'fixed' | string | null
  pricing_type?: 'standard' | 'hourly' | 'fixed' | string | null
  agreed_price_details?: string | null
  pricing_note?: string | null
  customer_language?: string | null
  is_urgent?: boolean | null
  /** Verzonnen testdossier: berichten gaan naar het testkanaal. */
  is_test?: boolean | null
  dispatched_at?: string | null
  created_at?: string | null
}

/** Taal van de klant, zodat de monteur weet hoe hij het gesprek moet voeren. */
export function languageLine(lead: LeadRow): string {
  return lead.customer_language === 'en' ? `🌐 <b>Taal:</b> 🇬🇧 Engels` : `🌐 <b>Taal:</b> 🇳🇱 Nederlands`
}

function priceAgreementLine(lead: LeadRow): string {
  // price_status is de bron; staat die op 'none' terwijl pricing_type wél een
  // afspraak kent, dan telt pricing_type — anders verdwijnt de prijsafspraak.
  const raw = lead.price_status && lead.price_status !== 'none' ? lead.price_status : lead.pricing_type
  const status = raw === 'standard' ? 'none' : (raw ?? 'none')
  const details = (lead.agreed_price_details ?? lead.pricing_note)?.trim()
  if (status === 'hourly') return `💶 <b>Prijsafspraak:</b> Uurtarief${details ? ` — ${escapeHtml(details)}` : ''}`
  if (status === 'fixed') return `💶 <b>Prijsafspraak:</b> Vaste prijs${details ? ` — ${escapeHtml(details)}` : ''}`
  return `💶 <b>Prijsafspraak:</b> Geen (klant wenst offerte/indicatie)`
}

// Interne form-tags ("global-schedule" enz.) -> nette leesbare labels.
function cleanJobType(raw: string): string {
  const t = raw.trim()
  if (/^afspraak\s*[·-]\s*global-schedule$/i.test(t)) return 'Online afspraak'
  return t
}

const NL_DAYS = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za']
const NL_MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

/**
 * "Voorkeur: Morgen 9 sep (2026-09-09) · 08:00 – 09:00" ->
 * "Morgen 9 sep (08:00 – 09:00 uur)". Herkent zowel de ISO-datum als het
 * tijdslot waar ze ook in de regel staan.
 */
function formatPreference(line: string): string | null {
  const body = line.replace(/^Voorkeur:\s*/i, '').trim()
  if (!body) return null
  const iso = body.match(/(\d{4})-(\d{2})-(\d{2})/)
  const slotM = body.match(/(\d{1,2}:\d{2})\s*[–—-]\s*(\d{1,2}:\d{2})/)
  let label: string
  if (iso) {
    const date = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
    const now = amsterdamNow()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const diff = Math.round((date.getTime() - today.getTime()) / 86_400_000)
    const rel = diff === 0 ? 'Vandaag' : diff === 1 ? 'Morgen' : diff === 2 ? 'Overmorgen' : NL_DAYS[date.getDay()]
    label = `${rel} ${date.getDate()} ${NL_MONTHS[date.getMonth()]}`
  } else {
    // Geen ISO-datum: behoud de leesbare datumtekst, strip slot/ISO-restanten.
    label = body.split(/[·(]/)[0].trim()
  }
  if (slotM) label += ` (${slotM[1]} – ${slotM[2]} uur)`
  return label
}


type ParsedDescription = { preference: string | null; rest: string[] }

/**
 * Splitst de ruwe omschrijving: haalt de "Voorkeur:"-regel eruit (wordt een
 * eigen 📅-regel) en filtert dubbele locatie-/fotoregels weg.
 */
function parseDescription(raw: string | null | undefined): ParsedDescription {
  if (!raw) return { preference: null, rest: [] }
  let preference: string | null = null
  const rest: string[] = []
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (/^Voorkeur:/i.test(trimmed)) {
      preference = preference ?? formatPreference(trimmed) ?? trimmed.replace(/^Voorkeur:\s*/i, '')
      continue
    }
    if (/^📍/.test(trimmed)) continue // dubbele locatieregel
    if (/^📅/.test(trimmed)) continue // dubbele planningsregel (📅 Voorkeur dekt dit)
    if (/^\d+\s+foto\('s\) meegestuurd$/i.test(trimmed)) continue // foto's zitten al in het bericht
    rest.push(trimmed)
  }
  return { preference, rest }
}

/**
 * De eerste twee regels van het groepsbericht: klussoort en wijk.
 * In de groep staan nooit klantgegevens — geen naam, geen telefoonnummer,
 * geen huisnummer. Alleen wijk, klussoort, urgentie en prijs.
 */
export function groupHead(lead: LeadRow): string {
  const job = redactLeadText(cleanJobType(lead.job_type), lead)
  const kind = lead.is_urgent ? 'STORING' : 'GEPLAND'
  const pc = publicPostalArea(lead.postal_code)
  const city = lead.city?.trim() ? redactLeadText(lead.city.trim(), lead) : null
  const location = [city, pc].filter(Boolean).join(' · ') || 'Amsterdam e.o.'
  return [`<b>${kind} · ${escapeHtml(job)}</b>`, escapeHtml(location)].join('\n')
}

/**
 * Korte werkomschrijving voor de groep: wat de klant zelf schreef, ontdaan van
 * adres- en contactgegevens (redactLeadText) en afgekapt zodat de teaser kort
 * blijft. Zonder deze regel weet een monteur bij gepland werk niet waar het
 * over gaat — bij een storing zegt de klussoort al genoeg, maar ook daar helpt
 * een zin extra.
 */
function workSummary(rest: string[], limit = 220): string | null {
  const text = rest
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    // Regels die alleen adres/locatie/contact bevatten vallen af: na redactie
    // blijft daar toch niets zinnigs van over.
    .filter((line) => !/^(adres|address|locatie|location|postcode|telefoon|phone|e-?mail)\s*:/i.test(line))
    .filter((line) => line && !/^\[afgeschermd\][\s.,]*$/i.test(line))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return null
  if (text.length <= limit) return text
  const cut = text.slice(0, limit)
  const stop = cut.lastIndexOf(' ')
  return `${(stop > 80 ? cut.slice(0, stop) : cut).trimEnd()}…`
}


export function groupTeaser(lead: LeadRow): string {
  const publicLead: LeadRow = {
    ...lead,
    job_type: redactLeadText(lead.job_type, lead),
    description: lead.description ? redactLeadText(lead.description, lead) : null,
    agreed_price_details: lead.agreed_price_details ? redactLeadText(lead.agreed_price_details, lead) : null,
  }
  const { preference, rest } = parseDescription(publicLead.description)
  const summary = workSummary(rest)
  const arrived = lead.dispatched_at ?? lead.created_at ?? null
  const agreement = priceAgreementLine(publicLead)
  return [
    groupHead(lead),
    [
      arrived ? `Binnengekomen ${clockTime(arrived)}` : null,
      `lead ${euroExVat(lead.price_cents)}`,
    ]
      .filter(Boolean)
      .join(' · '),
    !lead.is_urgent && preference ? `Gewenst: ${escapeHtml(preference)}` : null,
    agreement ? agreement : null,
    summary ? `🔧 <b>Werk:</b> ${escapeHtml(summary)}` : null,
    lead.customer_language === 'en' ? 'Klant spreekt Engels — omschrijving staat in het Engels' : null,
    ``,
    lead.is_urgent
      ? 'Zit je al op een storing, dan kan iemand die vrij is\ner 2 minuten eerder bij.'
      : null,
  ]
    .filter((l): l is string => l !== null)
    .join('\n')
    .trimEnd()
}


export function leadKeyboard(leadId: string, _priceCents: number) {
  return [[{ text: 'Aannemen', callback_data: `claim:${leadId}` }]]
}

/** Het groepsbericht wordt ter plekke bijgewerkt: de groep is een actuele lijst. */
export function claimedText(lead: LeadRow, contractorName: string, at: Date = new Date()): string {
  return `${groupHead(lead)}\nAangenomen door ${escapeHtml(contractorName)} om ${clockTime(at.toISOString())}`
}

export function spamFlaggedText(lead: LeadRow, reporterName: string): string {
  return `${groupHead(lead)}\nGemeld als spam door ${escapeHtml(reporterName)} — VoltFix controleert deze aanvraag.`
}

/**
 * Eén privébericht na het claimen, dat later wordt bijgewerkt (Onderweg,
 * afloop). Bellen kan via het nummer in de tekst; Telegram maakt daar zelf
 * een beltoets van. WhatsApp en Route zijn knoppen.
 */
export function privateDetails(lead: LeadRow, opts?: { balanceCents?: number | null; state?: string }): string {
  const header = opts?.state ?? 'Aangenomen'
  const kind = lead.is_urgent ? 'STORING' : 'GEPLAND'
  const address = [lead.address, lead.postal_code, lead.city].filter(Boolean).join(', ')
  return [
    `<b>${escapeHtml(header)} · ${kind} ${escapeHtml(cleanJobType(lead.job_type))}</b>`,
    lead.ref_number ? `Referentie: #${lead.ref_number}` : '',
    ``,
    `<b>Klantgegevens</b>`,
    `<b>Naam:</b> ${escapeHtml(lead.customer_name)}`,
    `<b>Telefoon:</b> ${escapeHtml(lead.customer_phone)}`,
    `<b>E-mail:</b> ${lead.customer_email ? escapeHtml(lead.customer_email) : 'niet ingevuld'}`,
    `<b>Adres:</b> ${address ? escapeHtml(address) : 'niet ingevuld'}`,
    lead.description ? `\n“${escapeHtml(lead.description.trim())}”` : '',
    ``,
    [
      `Taal ${lead.customer_language === 'en' ? 'EN' : 'NL'}`,
      `lead ${euroExVat(lead.price_cents)}`,
      typeof opts?.balanceCents === 'number' ? `saldo nu ${euro(opts.balanceCents)}` : null,
    ]
      .filter(Boolean)
      .join(' · '),
  ]
    .filter((l) => l !== '')
    .join('\n')
}

/** Kaartlink op postcode en huisnummer — scheelt kopiëren en plakken. */
export function routeUrl(lead: LeadRow): string | null {
  const query = [lead.address, lead.postal_code, lead.city].filter(Boolean).join(', ').trim()
  if (!query) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

/** WhatsApp en Route als link, Onderweg als eerste stap in de afloop. */
export function claimedLeadKeyboard(lead: LeadRow) {
  const links: Array<{ text: string; url: string }> = [
    { text: 'WhatsApp', url: `https://wa.me/${waNumber(lead.customer_phone)}` },
  ]
  const route = routeUrl(lead)
  if (route) links.push({ text: 'Route', url: route })
  return {
    inline_keyboard: [links, [{ text: 'Onderweg', callback_data: `otw:${lead.id}` }]],
  }
}

/** Na "Onderweg": één druk, klaar, geen vervolgvragen in Telegram. */
export function leadOutcomeKeyboard(leadId: string) {
  return {
    inline_keyboard: [
      [
        { text: 'Klus gedaan', callback_data: `done:${leadId}` },
        { text: 'Klant zag ervan af', callback_data: `out:declined:${leadId}` },
      ],
      [
        { text: 'Prijs niet akkoord', callback_data: `out:price:${leadId}` },
        { text: 'Klant onbereikbaar', callback_data: `out:noreach:${leadId}` },
      ],
    ],
  }
}

export function beforePhotoKeyboard(leadId: string) {
  return { inline_keyboard: [[{ text: 'Niet van toepassing', callback_data: `proofskip:${leadId}` }]] }
}

export function signatureKeyboard(url: string) {
  return { inline_keyboard: [[{ text: 'Laat klant tekenen', url }]] }
}


// ---------------------------------------------------------------------------
// Reviewverzoek: de monteur geeft de klus een duimpje, VoltFix krijgt privé de
// klantgegevens + een kant-en-klaar WhatsApp-bericht. Klanten krijgen NOOIT een
// Telegram-bericht; het contact loopt via WhatsApp vanuit het VoltFix-nummer.
// ---------------------------------------------------------------------------

/** Privé-chat van de beheerder (niet de monteursgroep). */
export function adminChatId(): string | null {
  if (usesTestChannel()) return testChatId()
  return process.env['TELEGRAM_ADMIN_CHAT_ID']?.trim() || null
}

export function leadDoneKeyboard(leadId: string) {
  return {
    inline_keyboard: [[{ text: '👍 Klus afgerond — vraag review aan', callback_data: `done:${leadId}` }]],
  }
}

/** +31-notatie voor wa.me (Nederlandse nummers, internationale blijven intact). */
export function waNumber(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) return digits.slice(1)
  if (digits.startsWith('00')) return digits.slice(2)
  if (digits.startsWith('31')) return digits
  if (digits.startsWith('0')) return `31${digits.slice(1)}`
  return digits
}

/** Kant-en-klaar WhatsApp-bericht voor de klant (review-verzoek). */
export function reviewWhatsappText(opts: {
  customerName: string
  jobType: string
  contractorName: string
  reviewLink: string
}): string {
  const first = opts.customerName.trim().split(/\s+/)[0] || 'daar'
  const contractorFirst = opts.contractorName.trim().split(/\s+/)[0] || 'onze monteur'
  return [
    `Hoi ${first}, met VoltFix ⚡`,
    ``,
    `Bedankt dat je voor ons hebt gekozen. ${contractorFirst} heeft de klus "${cleanJobType(opts.jobType)}" bij je uitgevoerd.`,
    ``,
    `Ben je tevreden? Een korte Google-review helpt ons enorm en kost je minder dan een minuut:`,
    opts.reviewLink,
    ``,
    `Is er toch iets niet goed gegaan? Laat het ons weten, dan lossen we het op.`,
  ].join('\n')
}

/** Bericht aan de beheerder met klantgegevens en directe WhatsApp-link. */
export function reviewHandoffMessage(lead: LeadRow, contractorName: string, reviewLink: string) {
  const text = reviewWhatsappText({
    customerName: lead.customer_name,
    jobType: lead.job_type,
    contractorName,
    reviewLink,
  })
  const waHref = `https://wa.me/${waNumber(lead.customer_phone)}?text=${encodeURIComponent(text)}`
  return {
    text: [
      `⭐ <b>Klus afgerond — reviewverzoek klaar</b>`,
      ``,
      `<b>Monteur:</b> ${escapeHtml(contractorName)}`,
      `<b>Klant:</b> ${escapeHtml(lead.customer_name)}`,
      `<b>Telefoon:</b> ${escapeHtml(lead.customer_phone)}`,
      `<b>Klus:</b> ${escapeHtml(cleanJobType(lead.job_type))}`,
      lead.city ? `<b>Plaats:</b> ${escapeHtml(lead.city)}` : '',
      ``,
      `<b>Voorbereide tekst:</b>`,
      `<pre>${escapeHtml(text)}</pre>`,
    ]
      .filter(Boolean)
      .join('\n'),
    reply_markup: {
      inline_keyboard: [[{ text: '💬 Open WhatsApp met klant', url: waHref }]],
    },
  }
}

// Vast menu onderin de privéchat.
export const accountReplyKeyboard = {
  keyboard: [[{ text: '💰 Mijn Saldo & Tegoed' }]],
  resize_keyboard: true,
  is_persistent: true,
}

export const TOPUP_AMOUNTS_EUR = [50, 100, 200] as const

export function topupKeyboard() {
  return {
    inline_keyboard: [
      TOPUP_AMOUNTS_EUR.map((amount) => ({
        text: `💳 €${amount} ex. btw`,
        callback_data: `topup:${amount}`,
      })),
    ],
  }
}

export function accountSummary(opts: {
  balanceCents: number
  leadsClaimed: number
  leadPriceCents: number
}): string {
  const remaining = opts.leadPriceCents > 0 ? Math.floor(opts.balanceCents / opts.leadPriceCents) : 0
  return [
    `📊 <b>Jouw VoltFix Account</b>`,
    ``,
    `💶 Huidig saldo: ${euroExVat(opts.balanceCents)}`,
    `⚡ Geclaimde leads: ${opts.leadsClaimed}`,
    `🎯 Resterende leads: ~${remaining} (bij tarief ${euroExVat(opts.leadPriceCents)})`,
    ``,
    `Alle bedragen zijn exclusief 21% btw.`,
    `Kies hieronder een bedrag om op te waarderen (btw wordt bij het afrekenen toegevoegd):`,
  ].join('\n')
}

export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/* ---------------- Plandatum van gepland werk ---------------- */

/** Korte aanduiding van de klus in de vraag: adres, anders plaats. */
export function scheduleJobLabel(lead: { address?: string | null; city?: string | null; job_type?: string }): string {
  const address = (lead.address ?? '').trim()
  if (address) return address
  const city = (lead.city ?? '').trim()
  return city || (lead.job_type ?? 'deze klus')
}

export function scheduleDayKeyboard(leadId: string, options: { value: string; label: string }[]) {
  const rows: { text: string; callback_data: string }[][] = []
  for (let i = 0; i < options.length; i += 2) {
    rows.push(
      options.slice(i, i + 2).map((option) => ({ text: option.label, callback_data: `sd:${leadId}:${option.value}` })),
    )
  }
  rows.push([{ text: 'Andere datum', callback_data: `sd:${leadId}:other` }])
  return { inline_keyboard: rows }
}

export function scheduleSlotKeyboard(leadId: string, day: string, slots: { value: string; label: string }[]) {
  const rows: { text: string; callback_data: string }[][] = []
  for (let i = 0; i < slots.length; i += 2) {
    rows.push(slots.slice(i, i + 2).map((slot) => ({ text: slot.label, callback_data: `st:${leadId}:${day}:${slot.value}` })))
  }
  rows.push([{ text: '⌨️ Tijd zelf invullen', callback_data: `sm:${leadId}:${day}` }])
  rows.push([{ text: 'Andere dag', callback_data: `sd:${leadId}:back` }])
  return { inline_keyboard: rows }
}

/** Herkenningstekst van de vraag om een zelf ingetypte tijd. */
export const SCHEDULE_TIME_PROMPT = 'Typ de tijd'

/**
 * Vraagt de monteur om zelf een tijd te typen. Zowel de dag als de klus staan
 * in de vraagtekst, zodat het antwoord altijd bij de juiste klus landt — ook
 * wanneer de monteur meerdere openstaande klussen heeft.
 */
export function scheduleTimePromptText(day: string, leadId: string): string {
  return `⌨️ ${SCHEDULE_TIME_PROMPT} als antwoord op dit bericht, bijvoorbeeld 14:15 of 9.30.\n[plan ${day} ${leadId}]`
}

/** Haalt de dag terug uit de vraag waarop de monteur antwoordde. */
export function scheduleDayFromPrompt(text: string): string | null {
  return schedulePromptTarget(text)?.day ?? null
}

/** Haalt dag én klus-id terug uit de vraag waarop de monteur antwoordde. */
export function schedulePromptTarget(text: string): { day: string; leadId: string } | null {
  const match = /\[plan (\d{4}-\d{2}-\d{2}) ([0-9a-fA-F-]{36})\]/.exec(text ?? '')
  return match ? { day: match[1]!, leadId: match[2]! } : null
}
