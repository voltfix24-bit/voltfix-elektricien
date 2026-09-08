// Server-only: stuurt een lead naar de Telegram-groep, met of zonder foto's.
// Foto's staan in de afgeschermde bucket `lead-attachments`; Telegram haalt ze
// op via een tijdelijke ondertekende link.

import * as tg from '@/lib/telegram.server'

const SIGNED_URL_TTL_SECONDS = 60 * 10

export type DispatchableLead = tg.LeadRow & { image_urls?: string[] | null }

export async function signedLeadImageUrls(paths: string[]): Promise<string[]> {
  if (paths.length === 0) return []
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const urls: string[] = []
  for (const path of paths.slice(0, 3)) {
    // Al opgeslagen als volledige URL (bv. externe bron): direct gebruiken.
    if (/^https?:\/\//.test(path)) {
      urls.push(path)
      continue
    }
    const { data, error } = await supabaseAdmin.storage
      .from('lead-attachments')
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)
    if (error || !data?.signedUrl) {
      console.error('Signed URL for lead attachment failed', error)
      continue
    }
    urls.push(data.signedUrl)
  }
  return urls
}

/**
 * Plaatst de lead in de groep en geeft het message_id terug van het bericht
 * met de claimknop (dat bericht wordt later bijgewerkt na claim/spam).
 */
export async function dispatchLeadToGroup(lead: DispatchableLead): Promise<number> {
  const chatId = tg.groupChatId()
  const text = tg.groupTeaser(lead)
  const keyboard = { inline_keyboard: tg.leadKeyboard(lead.id, lead.price_cents) }
  const photos = await signedLeadImageUrls(lead.image_urls ?? [])

  if (photos.length === 1) {
    // Eén foto: bericht en knop als bijschrift onder de foto.
    const msg = await tg.sendPhoto({
      chat_id: chatId,
      photo: photos[0],
      caption: text.slice(0, 1000),
      reply_markup: keyboard,
    })
    return msg.message_id
  }

  if (photos.length > 1) {
    // Album kan geen knoppen dragen: eerst de foto's, dan het leadbericht.
    try {
      await tg.sendMediaGroup({ chat_id: chatId, photos })
    } catch (err) {
      console.error('sendMediaGroup failed, falling back to text only', err)
    }
    const msg = await tg.sendMessage({ chat_id: chatId, text, reply_markup: keyboard })
    return msg.message_id
  }

  const msg = await tg.sendMessage({ chat_id: chatId, text, reply_markup: keyboard })
  return msg.message_id
}
