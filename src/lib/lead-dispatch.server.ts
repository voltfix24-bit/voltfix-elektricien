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
  for (const path of paths) {
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
    try {
      const msg = await tg.sendPhoto({
        chat_id: chatId,
        photo: photos[0],
        caption: text.slice(0, 1000),
        reply_markup: keyboard,
      })
      return msg.message_id
    } catch {
      console.error('Lead photo delivery failed; falling back to text', lead.id)
      const msg = await tg.sendMessage({ chat_id: chatId, text, reply_markup: keyboard })
      return msg.message_id
    }
  }

  if (photos.length > 1) {
    // Album kan geen knoppen dragen: eerst de foto's, dan het leadbericht.
    try {
      await sendPhotoBatches(chatId, photos)
    } catch (err) {
      console.error('sendMediaGroup failed, falling back to text only', err)
    }
    const msg = await tg.sendMessage({ chat_id: chatId, text, reply_markup: keyboard })
    return msg.message_id
  }

  const msg = await tg.sendMessage({ chat_id: chatId, text, reply_markup: keyboard })
  return msg.message_id
}

async function sendPhotoBatches(chatId: string | number, photos: string[]) {
  for (let i = 0; i < photos.length; i += 10) {
    const batch = photos.slice(i, i + 10)
    try {
      if (batch.length === 1) await tg.sendPhoto({ chat_id: chatId, photo: batch[0] })
      else await tg.sendMediaGroup({ chat_id: chatId, photos: batch })
    } catch (err) {
      // Telegram's fetcher weigert soms geldige signed URL's (WEBPAGE_CURL_FAILED).
      // Dan downloaden wij de bytes en uploaden we de foto's rechtstreeks.
      console.error('Photo URL delivery failed, uploading bytes instead', err)
      const files = await downloadPhotos(batch)
      if (files.length === 0) throw err
      if (files.length === 1) await tg.sendPhotoUpload({ chat_id: chatId, ...files[0] })
      else await tg.sendMediaGroupUpload({ chat_id: chatId, photos: files })
    }
  }
}

async function downloadPhotos(urls: string[]): Promise<Array<{ name: string; data: ArrayBuffer }>> {
  const files: Array<{ name: string; data: ArrayBuffer }> = []
  for (const [i, url] of urls.entries()) {
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      files.push({ name: `foto-${i + 1}.jpg`, data: await res.arrayBuffer() })
    } catch {
      console.error('Photo download failed for Telegram upload fallback', i)
    }
  }
  return files
}

export async function sendClaimedLeadPhotos(chatId: number, leadId: string) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { data: lead } = await supabaseAdmin.from('leads').select('image_urls, contractors:claimed_by(telegram_user_id)').eq('id', leadId).eq('status', 'claimed').single()
  if (!lead || lead.contractors?.telegram_user_id !== chatId) return
  await sendPhotoBatches(chatId, await signedLeadImageUrls(lead.image_urls ?? []))
}
