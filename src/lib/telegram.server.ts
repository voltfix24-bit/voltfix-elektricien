// Server-only Telegram Bot API helpers.

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

export function answerCallbackQuery(opts: {
  callback_query_id: string
  text?: string
  show_alert?: boolean
}) {
  return call('answerCallbackQuery', opts)
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
}

export function groupTeaser(lead: LeadRow): string {
  const area = [lead.postal_code, lead.city].filter(Boolean).join(' ')
  return [
    `⚡ <b>Nieuwe klus beschikbaar</b>`,
    ``,
    `<b>Type:</b> ${escapeHtml(lead.job_type)}`,
    area ? `<b>Locatie:</b> ${escapeHtml(area)}` : `<b>Locatie:</b> Amsterdam e.o.`,
    lead.description ? `<b>Omschrijving:</b> ${escapeHtml(lead.description)}` : '',
    ``,
    `<b>Kosten lead:</b> ${euro(lead.price_cents)}`,
    `Klantgegevens ontvang je direct in privéchat na claim.`,
  ]
    .filter(Boolean)
    .join('\n')
}

export function leadKeyboard(leadId: string, priceCents: number) {
  return [
    [{ text: `⚡ Accepteer lead (${euro(priceCents)})`, callback_data: `claim:${leadId}` }],
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
    `✅ <b>Lead toegewezen — ${euro(lead.price_cents)} afgeboekt</b>`,
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

export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
