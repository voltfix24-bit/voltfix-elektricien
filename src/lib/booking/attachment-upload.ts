import {
  attachmentRulesFor,
  normaliseDeclaredMime,
  type AttachmentCategory,
  type AttachmentRules,
} from './attachments';

/**
 * Browserzijde van de bijlagen: verkleinen en uploaden.
 *
 * De server blijft de autoriteit. Verkleinen is alleen een vriendelijkheid
 * richting mobiel dataverbruik; een bestand dat hier doorheen komt wordt op de
 * server opnieuw volledig gecontroleerd (extensie, MIME én magic bytes).
 */

export type UploadStatus = 'queued' | 'uploading' | 'uploaded' | 'failed';

export type AttachmentItem = {
  /** UUID; bepaalt samen met het concept-id het opslagpad. */
  id: string;
  file: File;
  category: AttachmentCategory;
  name: string;
  size: number;
  mime: string;
  status: UploadStatus;
  /** Stabiele foutcode van de server, nooit een vertaalde tekst. */
  errorCode?: string;
};

/** Alleen echte afbeeldingen die een canvas betrouwbaar kan hertekenen. */
const downscalable = new Set(['image/jpeg', 'image/png', 'image/webp']);

/**
 * Verkleint een afbeelding tot ongeveer `targetBytes`. PDF's en HEIC worden
 * nooit aangeraakt: een PDF mag niet als afbeelding worden gecomprimeerd en
 * HEIC kan een browser doorgaans niet tekenen.
 *
 * EERLIJK: dit hertekent de pixels via een canvas. Dat verwijdert in de
 * praktijk EXIF (inclusief GPS) uit het resultaat, maar alleen wanneer het
 * verkleinen daadwerkelijk plaatsvindt. Een klein JPEG of een HEIC/PDF gaat
 * ongewijzigd — inclusief eventuele EXIF — naar de server.
 */
export async function downscaleImage(file: File, targetBytes: number, maxEdge = 2000): Promise<File> {
  const type = normaliseDeclaredMime(file.type);
  if (!type || !downscalable.has(type)) return file;
  if (file.size <= targetBytes) return file;
  if (typeof document === 'undefined' || typeof createImageBitmap !== 'function') return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    for (const quality of [0.82, 0.7, 0.6]) {
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
      if (blob && blob.size <= targetBytes) {
        return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
      }
    }
    return file;
  } catch {
    return file;
  }
}

export type UploadResult = { ok: true; duplicate?: boolean } | { ok: false; code: string };

/** Uploadt één bijlage via de gecontroleerde serverroute. */
export async function uploadAttachment(input: {
  draftId: string;
  item: AttachmentItem;
  signal?: AbortSignal;
}): Promise<UploadResult> {
  const body = new FormData();
  body.append('draftId', input.draftId);
  body.append('attachmentId', input.item.id);
  body.append('category', input.item.category);
  body.append('file', input.item.file, input.item.file.name);
  try {
    const response = await fetch('/api/public/perilex-attachment', { method: 'POST', body, signal: input.signal });
    const data = (await response.json().catch(() => null)) as { ok?: boolean; code?: string; duplicate?: boolean } | null;
    if (!response.ok || !data?.ok) return { ok: false, code: data?.code ?? 'upload_failed' };
    return { ok: true, duplicate: data.duplicate };
  } catch {
    return { ok: false, code: 'network_error' };
  }
}

/** Client-side voorselectie met exact dezelfde limieten als de server. */
export function clientPreCheck(file: File, current: readonly AttachmentItem[], rules: AttachmentRules = attachmentRulesFor('perilex')): string | null {
  const mime = normaliseDeclaredMime(file.type);
  if (!mime || !rules.allowedMimes.includes(mime)) return 'mime_not_allowed';
  if (current.length >= rules.maxFiles) return 'too_many_files';
  const limit = mime === 'application/pdf' ? rules.maxPdfBytes : rules.maxImageBytes;
  if (file.size > limit) return 'file_too_large';
  const total = current.reduce((sum, item) => sum + item.size, 0) + file.size;
  if (total > rules.maxTotalBytes) return 'total_too_large';
  return null;
}
