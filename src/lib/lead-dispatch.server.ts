// Server-only: stuurt een lead naar de Telegram-groep, met of zonder foto's.
// Foto's staan in de afgeschermde bucket `lead-attachments`; Telegram haalt ze
// op via een tijdelijke ondertekende link.

import * as tg from '@/lib/telegram.server'
import { documentFileName, splitPhotoKinds } from '@/lib/photo-kind'

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

type LeadFile = { path: string; url: string }

async function signedLeadFiles(paths: string[]): Promise<LeadFile[]> {
  const files: LeadFile[] = []
  for (const path of paths) {
    const [url] = await signedLeadImageUrls([path])
    // Zonder link kan de bucket-download het nog steeds redden.
    files.push({ path, url: url ?? '' })
  }
  return files
}

/** Bytes ophalen: eerst rechtstreeks uit de bucket, anders via de ondertekende link. */
async function readFileBytes(file: LeadFile): Promise<ArrayBuffer | null> {
  if (file.path && !/^https?:\/\//.test(file.path)) {
    try {
      const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
      const { data, error } = await supabaseAdmin.storage.from('lead-attachments').download(file.path)
      if (!error && data) return await data.arrayBuffer()
    } catch {
      // Bucket-download niet beschikbaar: val terug op de link hieronder.
    }
  }
  try {
    const res = await fetch(file.url)
    if (!res.ok) return null
    return await res.arrayBuffer()
  } catch {
    return null
  }
}

/**
 * Plaatst de lead in de groep en geeft het message_id terug van het bericht
 * met de claimknop (dat bericht wordt later bijgewerkt na claim/spam).
 */
export async function dispatchLeadToGroup(lead: DispatchableLead): Promise<number> {
  const chatId = tg.groupChatId()
  const text = tg.groupTeaser(lead)
  const keyboard = { inline_keyboard: tg.leadKeyboard(lead.id, lead.price_cents) }

  // iPhone-foto's (HEIC/HEIF) kunnen niet als foto; die gaan als bestand mee.
  const { photos: photoPaths, documents: documentPaths } = splitPhotoKinds(lead.image_urls ?? [])
  const photos = await signedLeadFiles(photoPaths)
  if (documentPaths.length > 0) {
    await sendDocumentBatch(chatId, await signedLeadFiles(documentPaths))
  }

  if (photos.length === 1) {
    // Eén foto: bericht en knop als bijschrift onder de foto.
    const only = photos[0]!
    try {
      const msg = await tg.sendPhoto({
        chat_id: chatId,
        photo: only.url,
        caption: text.slice(0, 1000),
        reply_markup: keyboard,
      })
      return msg.message_id
    } catch (err) {
      // Telegram kan de link soms niet ophalen (WEBPAGE_CURL_FAILED): upload de bytes.
      console.error('Photo URL delivery failed, uploading bytes instead', err)
      const data = await readFileBytes(only)
      if (data) {
        try {
          const msg = await tg.sendPhotoUpload({
            chat_id: chatId,
            name: 'foto-1.jpg',
            data,
            caption: text.slice(0, 1000),
            reply_markup: keyboard,
          } as any)
          return msg.message_id
        } catch (uploadErr) {
          console.error('Photo upload delivery failed', uploadErr)
        }
      }
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

async function sendPhotoBatches(chatId: string | number, photos: LeadFile[]) {
  for (let i = 0; i < photos.length; i += 10) {
    const batch = photos.slice(i, i + 10)
    try {
      if (batch.length === 1) await tg.sendPhoto({ chat_id: chatId, photo: batch[0]!.url })
      else await tg.sendMediaGroup({ chat_id: chatId, photos: batch.map((f) => f.url) })
    } catch (err) {
      // Telegram's fetcher weigert soms geldige signed URL's (WEBPAGE_CURL_FAILED).
      // Dan halen wij de bytes uit de bucket en uploaden we de foto's rechtstreeks.
      console.error('Photo URL delivery failed, uploading bytes instead', err)
      const files = await downloadPhotos(batch)
      if (files.length === 0) throw err
      if (files.length === 1) await tg.sendPhotoUpload({ chat_id: chatId, ...files[0]! })
      else await tg.sendMediaGroupUpload({ chat_id: chatId, photos: files })
    }
  }
}

/** HEIC/HEIF als bestand versturen, zodat de monteur hem alsnog kan openen. */
async function sendDocumentBatch(chatId: string | number, files: LeadFile[]) {
  for (const [i, file] of files.entries()) {
    try {
      const data = await readFileBytes(file)
      if (!data) throw new Error('download failed')
      await tg.sendDocumentUpload({
        chat_id: chatId,
        name: documentFileName(file.path ?? '', i),
        data,
        caption: '📎 iPhone-foto (HEIC) — open het bestand om de foto te bekijken.',
      })
    } catch (err) {
      console.error('HEIC document delivery failed', err)
    }
  }
}

async function downloadPhotos(files: LeadFile[]): Promise<Array<{ name: string; data: ArrayBuffer }>> {
  const out: Array<{ name: string; data: ArrayBuffer }> = []
  for (const [i, file] of files.entries()) {
    const data = await readFileBytes(file)
    if (!data) {
      console.error('Photo download failed for Telegram upload fallback', i)
      continue
    }
    out.push({ name: `foto-${i + 1}.jpg`, data })
  }
  return out
}

export async function sendClaimedLeadPhotos(chatId: number, leadId: string) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { data: lead } = await supabaseAdmin.from('leads').select('image_urls, contractors:claimed_by(telegram_user_id)').eq('id', leadId).eq('status', 'claimed').single()
  if (!lead || lead.contractors?.telegram_user_id !== chatId) return
  const { photos, documents } = splitPhotoKinds(lead.image_urls ?? [])
  await sendPhotoBatches(chatId, await signedLeadFiles(photos))
  if (documents.length > 0) {
    await sendDocumentBatch(chatId, await signedLeadFiles(documents))
  }
}
