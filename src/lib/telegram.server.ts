// Server-only Telegram Bot API helpers.

import { amsterdamNow } from '@/lib/schedule'
import { publicPostalArea, redactLeadText } from '@/lib/lead-privacy'

const API = 'https://api.telegram.org'

function token(): string {
  const t = process.env['TELEGRAM_BOT_TOKEN']
  if (!t) throw new Error('TELEGRAM_BOT_TOKEN is not configured')
  return t
}

export function groupChatId(): string {
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
  agreed_price_details?: string | null
  customer_language?: string | null
}

/** Taal van de klant, zodat de monteur weet hoe hij het gesprek moet voeren. */
export function languageLine(lead: LeadRow): string {
  return lead.customer_language === 'en' ? `🌐 <b>Taal:</b> 🇬🇧 Engels` : `🌐 <b>Taal:</b> 🇳🇱 Nederlands`
}

function priceAgreementLine(lead: LeadRow): string {
  const status = lead.price_status ?? 'none'
  const details = lead.agreed_price_details?.trim()
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

export function groupTeaser(lead: LeadRow): string {
  // Sanitize every free-text field used in the group, not the stored/private lead.
  const publicLead: LeadRow = {
    ...lead,
    job_type: redactLeadText(lead.job_type, lead),
    description: lead.description ? redactLeadText(lead.description, lead) : null,
    agreed_price_details: lead.agreed_price_details ? redactLeadText(lead.agreed_price_details, lead) : null,
  }
  const pc = publicPostalArea(lead.postal_code)
  const city = lead.city?.trim() ? redactLeadText(lead.city.trim(), lead) : null
  const location = city && pc ? `${city} (${pc})` : pc ?? city ?? 'Amsterdam e.o.'
  const { preference, rest } = parseDescription(publicLead.description)
  return [
    `⚡ <b>NIEUWE KLUS BESCHIKBAAR</b> ⚡`,
    ``,
    `📍 <b>Locatie:</b> ${escapeHtml(location)}`,
    `🛠️ <b>Type:</b> ${escapeHtml(cleanJobType(publicLead.job_type))}`,
    preference ? `📅 <b>Voorkeur:</b> ${escapeHtml(preference)}` : null,
    priceAgreementLine(publicLead),
    languageLine(lead),
    rest.length ? `📝 <b>Omschrijving:</b> ${escapeHtml(rest.join('\n'))}` : null,
    ``,
    `💰 <b>Kosten lead:</b> ${euroExVat(lead.price_cents)}`,
    ``,
    `Klantgegevens ontvang je direct in privéchat na claim.`,
  ]
    .filter((l): l is string => l !== null)
    .join('\n')
}

export function leadKeyboard(leadId: string, priceCents: number) {
  return [
    [{ text: `⚡ Accepteer lead (${euroExVat(priceCents)})`, callback_data: `claim:${leadId}` }],
    [{ text: '⚠️ Markeer als spam', callback_data: `spam:${leadId}` }],
  ]
}

export function claimedText(lead: LeadRow, contractorName: string): string {
  return `${groupTeaser(lead)}\n\n❌ <b>Geclaimd</b> door ${escapeHtml(contractorName)}`
}

export function spamFlaggedText(lead: LeadRow, reporterName: string): string {
  return `${groupTeaser(lead)}\n\n🚫 <b>Gemeld als spam</b> door ${escapeHtml(reporterName)} — VoltFix controleert deze aanvraag.`
}


export function privateDetails(lead: LeadRow): string {
  return [
    `✅ <b>Lead toegewezen — ${euroExVat(lead.price_cents)} afgeboekt</b>`,
    ``,
    `<b>Naam:</b> ${escapeHtml(lead.customer_name)}`,
    `<b>Telefoon:</b> ${escapeHtml(lead.customer_phone)}`,
    lead.customer_email ? `<b>E-mail:</b> ${escapeHtml(lead.customer_email)}` : '',
    lead.address ? `<b>Adres:</b> ${escapeHtml(lead.address)}` : '',
    lead.postal_code || lead.city
      ? `<b>Plaats:</b> ${escapeHtml([lead.postal_code, lead.city].filter(Boolean).join(' '))}`
      : '',
    `<b>Klus:</b> ${escapeHtml(lead.job_type)}`,
    languageLine(lead),
    lead.description ? `<b>Omschrijving:</b> ${escapeHtml(lead.description)}` : '',
    ``,
    `Neem zo snel mogelijk contact op met de klant.`,
  ]
    .filter(Boolean)
    .join('\n')
}

// ---------------------------------------------------------------------------
// Reviewverzoek: de monteur geeft de klus een duimpje, VoltFix krijgt privé de
// klantgegevens + een kant-en-klaar WhatsApp-bericht. Klanten krijgen NOOIT een
// Telegram-bericht; het contact loopt via WhatsApp vanuit het VoltFix-nummer.
// ---------------------------------------------------------------------------

/** Privé-chat van de beheerder (niet de monteursgroep). */
export function adminChatId(): string | null {
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
