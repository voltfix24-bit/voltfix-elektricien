/**
 * Server-side metadataverwijdering voor rasterafbeeldingen (fase 5A).
 *
 * Waarom hier en niet in de browser: een claim uit de browser ("ik heb al
 * verkleind") is niet controleerbaar. Deze module werkt op de echte bytes op
 * de server, vóór permanente opslag.
 *
 * Wat er gebeurt per formaat:
 * - JPEG : alle APPn-segmenten (EXIF incl. GPS, XMP, IPTC, Photoshop) en
 *          COM-commentaar worden verwijderd. De oriëntatie blijft behouden
 *          doordat een minimaal EXIF-blok met alleen `Orientation` wordt
 *          teruggeschreven. Pixels worden niet hercodeerd.
 * - PNG  : `eXIf`, `tEXt`, `zTXt`, `iTXt` en `tIME` worden verwijderd.
 * - WebP : `EXIF`- en `XMP `-chunks worden verwijderd; de vlag in `VP8X` gaat
 *          uit. Bij een simpele (niet-uitgebreide) WebP is er geen metadata.
 * - HEIC : NIET betrouwbaar te strippen zonder volledige ISO-BMFF-herschrijving
 *          in deze runtime. Het bestand gaat ongewijzigd door met status
 *          `metadata_retained`.
 * - PDF  : blijft altijd ongewijzigd (`not_applicable`).
 */

export const sanitizationStatuses = ['not_applicable', 'metadata_stripped', 'metadata_retained', 'failed'] as const;
export type SanitizationStatus = (typeof sanitizationStatuses)[number];

export type SanitizeResult = {
  bytes: Uint8Array;
  status: SanitizationStatus;
  /** Aangetroffen oriëntatie (1 als er geen EXIF-oriëntatie was). */
  orientation: number;
  /** Stabiele codes van wat er verwijderd is. */
  removed: string[];
};

const u16 = (b: Uint8Array, i: number, little: boolean) => (little ? b[i]! | (b[i + 1]! << 8) : (b[i]! << 8) | b[i + 1]!);
const u32 = (b: Uint8Array, i: number, little: boolean) =>
  little
    ? (b[i]! | (b[i + 1]! << 8) | (b[i + 2]! << 16) | (b[i + 3]! << 24)) >>> 0
    : ((b[i]! << 24) | (b[i + 1]! << 16) | (b[i + 2]! << 8) | b[i + 3]!) >>> 0;

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

/** Leest alleen de oriëntatie uit een EXIF-APP1-payload. */
export function readExifOrientation(app1: Uint8Array): number {
  // app1 begint met "Exif\0\0"
  if (app1.length < 14) return 1;
  const tiff = app1.subarray(6);
  const little = tiff[0] === 0x49 && tiff[1] === 0x49;
  if (!little && !(tiff[0] === 0x4d && tiff[1] === 0x4d)) return 1;
  if (u16(tiff, 2, little) !== 0x002a) return 1;
  const ifd0 = u32(tiff, 4, little);
  if (ifd0 + 2 > tiff.length) return 1;
  const count = u16(tiff, ifd0, little);
  for (let i = 0; i < count; i++) {
    const entry = ifd0 + 2 + i * 12;
    if (entry + 12 > tiff.length) break;
    if (u16(tiff, entry, little) === 0x0112) {
      const value = u16(tiff, entry + 8, little);
      return value >= 1 && value <= 8 ? value : 1;
    }
  }
  return 1;
}

/** Minimaal EXIF-APP1-segment met uitsluitend de oriëntatie. */
function minimalExifApp1(orientation: number): Uint8Array {
  const tiff = new Uint8Array(26);
  tiff.set([0x4d, 0x4d, 0x00, 0x2a], 0); // big endian, magic
  tiff.set([0x00, 0x00, 0x00, 0x08], 4); // offset IFD0
  tiff.set([0x00, 0x01], 8); // 1 entry
  tiff.set([0x01, 0x12], 10); // Orientation
  tiff.set([0x00, 0x03], 12); // SHORT
  tiff.set([0x00, 0x00, 0x00, 0x01], 14); // count 1
  tiff.set([(orientation >> 8) & 0xff, orientation & 0xff, 0x00, 0x00], 18);
  tiff.set([0x00, 0x00, 0x00, 0x00], 22); // geen volgende IFD
  const header = new TextEncoder().encode('Exif');
  const payload = concat([header, new Uint8Array([0, 0]), tiff]);
  const length = payload.length + 2;
  return concat([new Uint8Array([0xff, 0xe1, (length >> 8) & 0xff, length & 0xff]), payload]);
}

function sanitizeJpeg(bytes: Uint8Array): SanitizeResult {
  const out: Uint8Array[] = [new Uint8Array([0xff, 0xd8])];
  const removed: string[] = [];
  let orientation = 1;
  let i = 2;

  while (i + 3 < bytes.length) {
    if (bytes[i] !== 0xff) break;
    const marker = bytes[i + 1]!;
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9)) {
      i += 2;
      continue;
    }
    const length = (bytes[i + 2]! << 8) | bytes[i + 3]!;
    const segmentEnd = i + 2 + length;
    if (length < 2 || segmentEnd > bytes.length) return { bytes, status: 'failed', orientation, removed };

    const payload = bytes.subarray(i + 4, segmentEnd);
    const isApp = marker >= 0xe0 && marker <= 0xef;
    const isComment = marker === 0xfe;

    if (isApp && marker === 0xe1) {
      const tag = new TextDecoder().decode(payload.subarray(0, 4));
      if (tag === 'Exif') {
        orientation = readExifOrientation(payload);
        removed.push('jpeg_exif');
      } else {
        removed.push('jpeg_app1_xmp');
      }
    } else if (isApp) {
      removed.push(`jpeg_app${marker - 0xe0}`);
    } else if (isComment) {
      removed.push('jpeg_comment');
    } else {
      out.push(bytes.subarray(i, segmentEnd));
    }

    if (marker === 0xda) {
      // Start of scan: de rest is beeldinhoud.
      out.push(bytes.subarray(segmentEnd));
      i = bytes.length;
      break;
    }
    i = segmentEnd;
  }

  if (i < bytes.length && out.length === 1) return { bytes, status: 'failed', orientation, removed };

  const head = out.shift()!;
  const rebuilt = concat([head, minimalExifApp1(orientation), ...out]);
  return { bytes: rebuilt, status: 'metadata_stripped', orientation, removed };
}

const PNG_DROP = new Set(['eXIf', 'tEXt', 'zTXt', 'iTXt', 'tIME']);

function sanitizePng(bytes: Uint8Array): SanitizeResult {
  const removed: string[] = [];
  const out: Uint8Array[] = [bytes.subarray(0, 8)];
  let i = 8;
  while (i + 8 <= bytes.length) {
    const length = u32(bytes, i, false);
    const type = new TextDecoder().decode(bytes.subarray(i + 4, i + 8));
    const end = i + 12 + length;
    if (end > bytes.length) return { bytes, status: 'failed', orientation: 1, removed };
    if (PNG_DROP.has(type)) removed.push(`png_${type}`);
    else out.push(bytes.subarray(i, end));
    i = end;
    if (type === 'IEND') break;
  }
  return { bytes: concat(out), status: 'metadata_stripped', orientation: 1, removed };
}

function sanitizeWebp(bytes: Uint8Array): SanitizeResult {
  const removed: string[] = [];
  if (bytes.length < 12) return { bytes, status: 'failed', orientation: 1, removed };
  const chunks: Uint8Array[] = [];
  let i = 12;
  while (i + 8 <= bytes.length) {
    const type = new TextDecoder().decode(bytes.subarray(i, i + 4));
    const size = u32(bytes, i + 4, true);
    const padded = size + (size % 2);
    const end = i + 8 + padded;
    if (end > bytes.length) break;
    if (type === 'EXIF' || type === 'XMP ') {
      removed.push(`webp_${type.trim().toLowerCase()}`);
    } else if (type === 'VP8X') {
      const copy = bytes.slice(i, end);
      // Bit 3 = EXIF, bit 2 = XMP in de vlaggenbyte.
      copy[8] = copy[8]! & ~0b00001100;
      chunks.push(copy);
    } else {
      chunks.push(bytes.subarray(i, end));
    }
    i = end;
  }
  const body = concat(chunks);
  const header = new Uint8Array(12);
  header.set(bytes.subarray(0, 12));
  const riffSize = body.length + 4;
  header[4] = riffSize & 0xff;
  header[5] = (riffSize >> 8) & 0xff;
  header[6] = (riffSize >> 16) & 0xff;
  header[7] = (riffSize >> 24) & 0xff;
  return { bytes: concat([header, body]), status: 'metadata_stripped', orientation: 1, removed };
}

/**
 * Verwijdert metadata uit ondersteunde rasterafbeeldingen. Geeft altijd bruikbare
 * bytes terug: bij twijfel de originele bytes met een eerlijke status.
 */
export function sanitizeImageBytes(bytes: Uint8Array, mimeType: string): SanitizeResult {
  try {
    if (mimeType === 'image/jpeg') return sanitizeJpeg(bytes);
    if (mimeType === 'image/png') return sanitizePng(bytes);
    if (mimeType === 'image/webp') return sanitizeWebp(bytes);
    if (mimeType === 'image/heic' || mimeType === 'image/heif') {
      // Eerlijk: niet betrouwbaar te strippen in deze runtime.
      return { bytes, status: 'metadata_retained', orientation: 1, removed: [] };
    }
    return { bytes, status: 'not_applicable', orientation: 1, removed: [] };
  } catch {
    return { bytes, status: 'failed', orientation: 1, removed: [] };
  }
}

/** Bevat de JPEG/PNG/WebP nog een metadatablok met GPS of beschrijvingen? */
export function containsMetadataMarker(bytes: Uint8Array, mimeType: string): boolean {
  const text = new TextDecoder('latin1').decode(bytes.subarray(0, Math.min(bytes.length, 200_000)));
  if (mimeType === 'image/jpeg') return /GPSLatitude|http:\/\/ns\.adobe\.com\/xap|Photoshop 3\.0/.test(text);
  if (mimeType === 'image/png') return /eXIf|tEXt|iTXt|zTXt/.test(text);
  if (mimeType === 'image/webp') return /EXIF|XMP /.test(text.slice(12));
  return false;
}
