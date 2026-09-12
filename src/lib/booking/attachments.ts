/**
 * Centrale bijlagenregels voor de booking-engine (fase 4).
 *
 * Pure module: geen storage, geen netwerk, geen React. Zowel de client
 * (voorselectie + verkleinen) als de server (definitieve controle) gebruiken
 * exact deze regels. De server is altijd de autoriteit; de client mag hooguit
 * eerder een nette melding tonen.
 *
 * Alles wat hier uitkomt zijn stabiele codes — nooit vertaalde teksten.
 */

/* -------------------------------------------------------------------------- */
/* Categorieën                                                                 */
/* -------------------------------------------------------------------------- */

export const attachmentCategories = [
  'consumer_unit',
  'existing_outlet',
  'installation_location',
  'appliance_label',
  'kitchen_plan',
  'other',
] as const;
export type AttachmentCategory = (typeof attachmentCategories)[number];

export function isAttachmentCategory(value: unknown): value is AttachmentCategory {
  return typeof value === 'string' && (attachmentCategories as readonly string[]).includes(value);
}

/* -------------------------------------------------------------------------- */
/* Toegestane bestandstypen                                                    */
/* -------------------------------------------------------------------------- */

export type AttachmentMime =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'image/heic'
  | 'application/pdf';

/** Wat een browser mag declareren, en waar we dat naartoe normaliseren. */
const declaredAliases: Record<string, AttachmentMime> = {
  'image/jpeg': 'image/jpeg',
  'image/jpg': 'image/jpeg',
  'image/png': 'image/png',
  'image/webp': 'image/webp',
  'image/heic': 'image/heic',
  'image/heif': 'image/heic',
  'image/heic-sequence': 'image/heic',
  'image/heif-sequence': 'image/heic',
  'application/pdf': 'application/pdf',
};

export function normaliseDeclaredMime(declared: string | null | undefined): AttachmentMime | null {
  if (!declared) return null;
  return declaredAliases[declared.trim().toLowerCase()] ?? null;
}

export function extForAttachmentMime(mime: AttachmentMime): string {
  switch (mime) {
    case 'image/jpeg': return 'jpg';
    case 'image/png': return 'png';
    case 'image/webp': return 'webp';
    case 'image/heic': return 'heic';
    case 'application/pdf': return 'pdf';
  }
}

/* -------------------------------------------------------------------------- */
/* Limieten per dienst                                                         */
/* -------------------------------------------------------------------------- */

export type AttachmentRules = {
  /** Maximaal aantal bestanden per aanvraag. */
  maxFiles: number;
  /** Maximale grootte van één afbeelding, vóór client-side verkleinen. */
  maxImageBytes: number;
  /** Maximale grootte van één PDF. PDF's worden nooit gecomprimeerd. */
  maxPdfBytes: number;
  /** Maximale som van alle bestanden in één aanvraag. */
  maxTotalBytes: number;
  /** Streefgrootte na client-side verkleinen (alleen afbeeldingen). */
  imageTargetBytes: number;
  allowedMimes: readonly AttachmentMime[];
};

const MB = 1024 * 1024;

/**
 * Groepenkast houdt exact de bestaande limieten (3 foto's, 20 MB, geen PDF).
 * Deze waarden zijn hier alleen vastgelegd, niet gewijzigd.
 */
export const attachmentRules = {
  groepenkast: {
    maxFiles: 3,
    maxImageBytes: 20 * MB,
    maxPdfBytes: 0,
    maxTotalBytes: 60 * MB,
    imageTargetBytes: 20 * MB,
    allowedMimes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  },
  perilex: {
    maxFiles: 8,
    maxImageBytes: 12 * MB,
    maxPdfBytes: 15 * MB,
    maxTotalBytes: 40 * MB,
    imageTargetBytes: Math.round(1.5 * MB),
    allowedMimes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'],
  },
} as const satisfies Record<string, AttachmentRules>;

export type AttachmentServiceId = keyof typeof attachmentRules;

export function attachmentRulesFor(service: string): AttachmentRules {
  return (attachmentRules as Record<string, AttachmentRules>)[service] ?? attachmentRules.groepenkast;
}

/* -------------------------------------------------------------------------- */
/* Signature / magic bytes                                                     */
/* -------------------------------------------------------------------------- */

const heifBrands = ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1', 'heif'];

/** Bepaalt het werkelijke type uit de eerste bytes. `null` = niet vertrouwd. */
export function detectAttachmentSignature(bytes: Uint8Array): AttachmentMime | null {
  if (bytes.length < 12) return null;
  // PDF: "%PDF-"
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d) {
    return 'application/pdf';
  }
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  // PNG
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) {
    return 'image/png';
  }
  // WebP: RIFF....WEBP
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
    && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return 'image/webp';
  }
  // HEIC/HEIF: ....ftyp<brand>
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    const brand = String.fromCharCode(bytes[8]!, bytes[9]!, bytes[10]!, bytes[11]!).toLowerCase();
    if (heifBrands.includes(brand)) return 'image/heic';
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Bestandsnamen                                                               */
/* -------------------------------------------------------------------------- */

const dangerousExtensions = [
  'svg', 'svgz', 'html', 'htm', 'xhtml', 'js', 'mjs', 'jsx', 'php', 'phtml', 'exe', 'dll', 'bat',
  'cmd', 'com', 'sh', 'bash', 'ps1', 'jar', 'msi', 'app', 'scr', 'vbs', 'wsf', 'apk', 'dmg', 'py',
  'rb', 'pl', 'cgi', 'htaccess', 'xml', 'xsl',
];

/**
 * Weigert path traversal, mapnamen, control characters en alles wat een
 * uitvoerbare of script-extensie bevat — ook als tweede extensie
 * (`foto.php.jpg`) of als enige extensie (`tekening.svg`).
 */
export function isUnsafeFilename(name: string): boolean {
  if (!name || name.length > 200) return true;
  if (name.includes('/') || name.includes('\\') || name.includes('..')) return true;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(name)) return true;
  if (name.startsWith('.')) return true;
  const parts = name.toLowerCase().split('.').slice(1);
  return parts.some(part => dangerousExtensions.includes(part.trim()));
}

/** Alleen voor weergave/metadata — nooit voor het opslagpad. */
export function displayFilename(name: string): string {
  return name
    .replace(/[^\p{L}\p{N}._ -]/gu, '_')
    // Meerdere punten achter elkaar (traversal-resten) worden één punt.
    .replace(/\.{2,}/g, '.')
    .replace(/^[._ -]+/, '')
    .slice(0, 120) || 'bestand';
}

/**
 * Opslagpad met uitsluitend UUID's: geen naam, telefoon, adres of originele
 * bestandsnaam. `draftId`/`attachmentId` moeten UUID's zijn.
 */
export function attachmentStoragePath(draftId: string, attachmentId: string, mime: AttachmentMime): string {
  return `perilex/${draftId}/${attachmentId}.${extForAttachmentMime(mime)}`;
}

export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/* -------------------------------------------------------------------------- */
/* Validatie                                                                   */
/* -------------------------------------------------------------------------- */

export type AttachmentIssue =
  | 'empty_file'
  | 'unsafe_filename'
  | 'invalid_category'
  | 'mime_not_allowed'
  | 'signature_unknown'
  | 'signature_mismatch'
  | 'file_too_large'
  | 'too_many_files'
  | 'total_too_large';

export type AttachmentCheck =
  | { ok: true; mime: AttachmentMime }
  | { ok: false; issue: AttachmentIssue };

export function validateAttachment(input: {
  filename: string;
  declaredType: string | null | undefined;
  size: number;
  bytes: Uint8Array;
  category: string;
  rules: AttachmentRules;
}): AttachmentCheck {
  const { filename, declaredType, size, bytes, category, rules } = input;
  if (!size || size <= 0 || bytes.length === 0) return { ok: false, issue: 'empty_file' };
  if (isUnsafeFilename(filename)) return { ok: false, issue: 'unsafe_filename' };
  if (!isAttachmentCategory(category)) return { ok: false, issue: 'invalid_category' };

  const declared = normaliseDeclaredMime(declaredType);
  if (!declared || !rules.allowedMimes.includes(declared)) return { ok: false, issue: 'mime_not_allowed' };

  // file.type wordt nooit vertrouwd: de inhoud beslist.
  const detected = detectAttachmentSignature(bytes);
  if (!detected) return { ok: false, issue: 'signature_unknown' };
  if (!rules.allowedMimes.includes(detected)) return { ok: false, issue: 'mime_not_allowed' };
  if (detected !== declared) return { ok: false, issue: 'signature_mismatch' };

  const limit = detected === 'application/pdf' ? rules.maxPdfBytes : rules.maxImageBytes;
  if (size > limit) return { ok: false, issue: 'file_too_large' };

  return { ok: true, mime: detected };
}

/** Aantals- en totaalcontrole over de hele aanvraag. */
export function validateAttachmentSet(sizes: readonly number[], rules: AttachmentRules): AttachmentCheck | { ok: true } {
  if (sizes.length > rules.maxFiles) return { ok: false, issue: 'too_many_files' };
  const total = sizes.reduce((sum, size) => sum + size, 0);
  if (total > rules.maxTotalBytes) return { ok: false, issue: 'total_too_large' };
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Ontbrekende informatie (machineleesbaar)                                    */
/* -------------------------------------------------------------------------- */

export const followUpItems = [
  'photo_consumer_unit',
  'photo_installation_location',
  'photo_existing_outlet',
  'kitchen_plan',
  'phone_contact_safety',
] as const;
export type FollowUpItem = (typeof followUpItems)[number];

/**
 * Wat er vóór een definitieve bevestiging nog nodig is. Een ontbrekend bestand
 * betekent nooit "situatie is geschikt": die conclusie komt alleen uit de
 * route-/prijsbeslissing.
 */
export function requiredFollowUpItems(input: {
  route: string | null;
  intent: string | null;
  categories: readonly string[];
}): FollowUpItem[] {
  const has = (category: AttachmentCategory) => input.categories.includes(category);
  const items: FollowUpItem[] = [];
  const wantConsumerUnit = () => { if (!has('consumer_unit')) items.push('photo_consumer_unit'); };
  const wantLocation = () => { if (!has('installation_location')) items.push('photo_installation_location'); };
  const wantOutlet = () => { if (!has('existing_outlet')) items.push('photo_existing_outlet'); };
  const wantKitchenPlan = () => { if (!has('kitchen_plan')) items.push('kitchen_plan'); };

  switch (input.route) {
    case 'photo_review':
      wantConsumerUnit();
      wantLocation();
      if (input.intent === 'kitchen_renovation') wantKitchenPlan();
      break;
    case 'fault_review':
      wantLocation();
      break;
    case 'safety_call':
      items.push('phone_contact_safety');
      break;
    case 'fixed_existing_standard':
    case 'fixed_existing_priority':
      // Vaste prijs geldt voor een bestaande, werkende aansluiting. Een foto
      // van die aansluiting is prettig, maar niet blokkerend.
      wantOutlet();
      break;
    case 'site_survey':
      // De schouw levert de ontbrekende informatie zelf op.
      if (input.intent === 'kitchen_renovation') wantKitchenPlan();
      break;
    default:
      break;
  }
  return items;
}

/** Status die per bijlage wordt bewaard. */
export const attachmentStatuses = ['pending', 'stored', 'failed', 'orphaned'] as const;
export type AttachmentStatus = (typeof attachmentStatuses)[number];

/**
 * Voorstel bewaartermijn (nog NIET automatisch actief). De server vult
 * `retention_expires_at`; verwijderen gebeurt pas na expliciete goedkeuring.
 */
export const attachmentRetentionDays = 365;

export function retentionExpiresAt(from: Date = new Date()): string {
  const date = new Date(from.getTime());
  date.setUTCDate(date.getUTCDate() + attachmentRetentionDays);
  return date.toISOString();
}
