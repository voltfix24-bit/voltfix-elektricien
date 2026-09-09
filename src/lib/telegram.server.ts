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
    return await editMessageCaption({
      chat_id: opts.chat_id,
      message_id: opts.message_id,
      caption: opts.text,
      reply_markup: opts.reply_markup,
    })
  }
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
    lead.description ? `<b>Omschrijving:</b> ${escapeHtml(lead.description)}` : '',
    ``,
    `Neem zo snel mogelijk contact op met de klant.`,
  ]
    .filter(Boolean)
    .join('\n')
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
