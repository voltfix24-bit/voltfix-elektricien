import imageCompression from 'browser-image-compression'
import { supabase } from '@/integrations/supabase/client'

export type UploadTicket = { path: string; token: string }

/** iPhone-foto's komen als HEIC/HEIF binnen; opslag en Telegram willen JPEG. */
export function isHeicFile(file: File): boolean {
  const type = (file.type || '').toLowerCase()
  return type === 'image/heic' || type === 'image/heif' || /\.(heic|heif)$/i.test(file.name)
}

/** Zet HEIC om naar JPEG met een decoder die pas bij gebruik geladen wordt. */
export async function convertHeicToJpeg(file: File): Promise<File> {
  const { heicTo } = await import('heic-to')
  const blob = await heicTo({ blob: file, type: 'image/jpeg', quality: 0.85 })
  if (!blob || blob.size === 0) throw new Error('Deze iPhone-foto kon niet omgezet worden.')
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
}

/**
 * Verkleint een telefoonfoto in de browser: max 1600 px en onder 500 kB.
 * HEIC/HEIF komt er als JPEG uit, zodat opslag en Telegram het altijd aankunnen.
 * Dit is de enige route voor foto's — nieuw formulier, plakken én toevoegen aan
 * een bestaand dossier gebruiken exact deze stap.
 */
export async function compressLeadPhoto(input: File): Promise<File> {
  const file = isHeicFile(input) ? await convertHeicToJpeg(input) : input
  const wantsWebp = file.type === 'image/webp'
  const compressed = await imageCompression(file, {
    maxWidthOrHeight: 1600,
    maxSizeMB: 0.5,
    useWebWorker: true,
    fileType: wantsWebp ? 'image/webp' : 'image/jpeg',
    initialQuality: 0.82,
  })
  const type = wantsWebp ? 'image/webp' : 'image/jpeg'
  const name = file.name.replace(/\.[^.]+$/, '') + (wantsWebp ? '.webp' : '.jpg')
  return new File([compressed], name, { type })
}

/** Comprimeert en uploadt rechtstreeks naar de afgeschermde opslag; geeft de paden terug. */
export async function uploadLeadPhotosDirect(
  files: File[],
  requestTicket: (options: { data: { contentType: 'image/jpeg' | 'image/png' | 'image/webp' } }) => Promise<UploadTicket>,
): Promise<string[]> {
  const paths: string[] = []
  for (const file of files) {
    const small = await compressLeadPhoto(file)
    const contentType = small.type === 'image/webp' ? 'image/webp' : 'image/jpeg'
    const ticket = await requestTicket({ data: { contentType } })
    const { error } = await supabase.storage
      .from('lead-attachments')
      .uploadToSignedUrl(ticket.path, ticket.token, small, { contentType })
    if (error) throw new Error(`Foto uploaden mislukt: ${error.message}`)
    paths.push(ticket.path)
  }
  return paths
}
