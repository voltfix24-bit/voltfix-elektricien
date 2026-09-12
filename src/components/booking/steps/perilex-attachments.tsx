import { useEffect, useRef, useState } from 'react';
import { Camera, FileText, Loader2, Paperclip, RefreshCw, Trash2, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  attachmentCategories,
  attachmentRulesFor,
  type AttachmentCategory,
} from '@/lib/booking/attachments';
import type { AttachmentItem } from '@/lib/booking/attachment-upload';
import type { GroupLocale } from '@/lib/groepenkast';

/* -------------------------------------------------------------------------- */
/* Teksten (NL + EN)                                                           */
/* -------------------------------------------------------------------------- */

export const attachmentCopy = {
  nl: {
    optional: 'Foto’s zijn nu optioneel. Voor een definitieve bevestiging kunnen we nog aanvullende informatie vragen.',
    kitchen: 'Heb je een installatietekening van de keuken? Voeg deze gerust toe.',
    addPhoto: 'Foto toevoegen',
    addFile: 'Bestand of PDF',
    hint: 'JPG, PNG, WebP, iPhone (HEIC) of PDF · max. 8 bestanden',
    later: 'Ik lever de gevraagde bestanden later aan',
    laterWithFiles: 'Ik lever eventuele ontbrekende bestanden later aan',
    laterKeep: 'Wat je al hebt geüpload blijft bewaard.',
    countSaved: 'opgeslagen',
    countFailed: 'mislukt',
    countMax: 'maximaal',
    category: 'Waar gaat dit bestand over?',
    remove: 'Verwijderen',
    retry: 'Opnieuw proberen',
    statuses: { queued: 'Klaar om te versturen', uploading: 'Bezig met uploaden…', uploaded: 'Opgeslagen', failed: 'Uploaden mislukt' },
    safety: 'Bij een warme aansluiting, brandlucht of vonken: bel ons eerst. Foto’s zijn dan niet belangrijk.',
    recommended: 'Aanbevolen: een foto van de groepenkast en van de plek van de aansluiting.',
    newInstall: 'Handig: een foto van de groepenkast, de plek van de aansluiting en — bij een keuken — de installatietekening.',
    noOpen: 'Maak de foto’s van buitenaf. Open of demonteer nooit zelf een stopcontact of groepenkast.',
    categories: {
      consumer_unit: 'Groepenkast',
      existing_outlet: 'Bestaande Perilex-aansluiting',
      installation_location: 'Plek van de aansluiting',
      appliance_label: 'Typeplaatje / model',
      kitchen_plan: 'Keukentekening',
      other: 'Overig',
    },
    errors: {
      mime_not_allowed: 'Dit bestandstype kunnen we niet gebruiken.',
      file_too_large: 'Dit bestand is te groot.',
      total_too_large: 'Samen zijn de bestanden te groot.',
      too_many_files: 'Je kunt maximaal 8 bestanden toevoegen.',
      unsafe_filename: 'Deze bestandsnaam kunnen we niet gebruiken.',
      signature_mismatch: 'Dit bestand lijkt niet op wat het zegt te zijn.',
      signature_unknown: 'Dit bestand kunnen we niet lezen.',
      empty_file: 'Dit bestand is leeg.',
      service_disabled: 'Bijlagen zijn nu nog niet beschikbaar.',
      network_error: 'Geen verbinding. Probeer het opnieuw.',
      upload_failed: 'Uploaden mislukt. Probeer het opnieuw.',
    } as Record<string, string>,
  },
  en: {
    optional: 'Photos are optional for now. We may ask for extra information before a final confirmation.',
    kitchen: 'Do you have a kitchen installation drawing? Feel free to add it.',
    addPhoto: 'Add photo',
    addFile: 'File or PDF',
    hint: 'JPG, PNG, WebP, iPhone (HEIC) or PDF · up to 8 files',
    later: 'I will send the requested files later',
    laterWithFiles: 'I will send any missing files later',
    laterKeep: 'Files you already uploaded are kept.',
    countSaved: 'saved',
    countFailed: 'failed',
    countMax: 'up to',
    category: 'What does this file show?',
    remove: 'Remove',
    retry: 'Try again',
    statuses: { queued: 'Ready to send', uploading: 'Uploading…', uploaded: 'Saved', failed: 'Upload failed' },
    safety: 'If the connection is hot, smells burnt or sparks: call us first. Photos are not important then.',
    recommended: 'Recommended: a photo of the consumer unit and of the spot for the connection.',
    newInstall: 'Helpful: a photo of the consumer unit, the spot for the connection and — for a kitchen — the drawing.',
    noOpen: 'Take photos from the outside. Never open or dismantle a socket or consumer unit yourself.',
    categories: {
      consumer_unit: 'Consumer unit',
      existing_outlet: 'Existing Perilex outlet',
      installation_location: 'Spot for the connection',
      appliance_label: 'Type plate / model',
      kitchen_plan: 'Kitchen drawing',
      other: 'Other',
    },
    errors: {
      mime_not_allowed: 'We cannot use this file type.',
      file_too_large: 'This file is too large.',
      total_too_large: 'Together these files are too large.',
      too_many_files: 'You can add up to 8 files.',
      unsafe_filename: 'We cannot use this file name.',
      signature_mismatch: 'This file does not match its type.',
      signature_unknown: 'We cannot read this file.',
      empty_file: 'This file is empty.',
      service_disabled: 'Attachments are not available yet.',
      network_error: 'No connection. Please try again.',
      upload_failed: 'Upload failed. Please try again.',
    } as Record<string, string>,
  },
} as const;

function formatSize(bytes: number, lang: GroupLocale) {
  const mb = bytes / (1024 * 1024);
  return mb >= 1
    ? `${mb.toFixed(1).replace('.', lang === 'en' ? '.' : ',')} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} kB`;
}

function Thumb({ item, alt }: { item: AttachmentItem; alt: string }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (item.mime === 'application/pdf') return;
    const next = URL.createObjectURL(item.file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [item.file, item.mime]);
  if (item.mime === 'application/pdf' || !url) {
    return <span className="flex size-14 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground"><FileText className="size-6" /></span>;
  }
  return <img src={url} alt={alt} className="size-14 shrink-0 rounded-md border border-border object-cover" />;
}

/* -------------------------------------------------------------------------- */
/* Stap                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Perilex-bijlagenstap: optionele foto's en PDF's met een duidelijke categorie
 * en een eerlijke uploadstatus per bestand. Er wordt nooit "ontvangen" getoond
 * zolang de server de opslag niet heeft bevestigd.
 */
export function PerilexAttachmentsStep({ lang, route, intent, items, addFiles, removeItem, retryItem, setCategory, later, setLater, issue }: {
  lang: GroupLocale;
  route: string | null;
  intent: string | null;
  items: readonly AttachmentItem[];
  addFiles: (files: File[]) => void;
  removeItem: (id: string) => void;
  retryItem: (id: string) => void;
  setCategory: (id: string, category: AttachmentCategory) => void;
  later: boolean;
  setLater: (value: boolean) => void;
  issue: string;
}) {
  const copy = attachmentCopy[lang];
  const rules = attachmentRulesFor('perilex');
  const photoInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const accept = 'image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf';
  // Alleen door de server bevestigde uploads tellen als opgeslagen. Een mislukt
  // bestand blijft een slot bezetten zolang het in de lijst staat: opnieuw
  // proberen gebruikt hetzelfde slot, verwijderen geeft het slot direct vrij.
  const saved = items.filter(item => item.status === 'uploaded').length;
  const failed = items.filter(item => item.status === 'failed').length;

  const guidance = route === 'safety_call'
    ? copy.safety
    : route === 'photo_review'
      ? copy.recommended
      : intent === 'new_installation' || intent === 'kitchen_renovation'
        ? copy.newInstall
        : null;

  return <div className="min-w-0 space-y-4" data-testid="perilex-attachments">
    <p className="text-sm leading-snug text-muted-foreground">{copy.optional}</p>
    {guidance && <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm leading-snug">{guidance}</p>}
    {intent === 'kitchen_renovation' && <p data-testid="perilex-kitchen-hint" className="rounded-lg border border-border bg-muted/40 p-3 text-sm leading-snug">{copy.kitchen}</p>}
    <p className="text-xs leading-snug text-muted-foreground">{copy.noOpen}</p>

    <div className="rounded-lg border-2 border-dashed border-primary/40 bg-accent/40 p-5 text-center"
      onDragOver={event => event.preventDefault()}
      onDrop={event => { event.preventDefault(); addFiles(Array.from(event.dataTransfer.files)); }}>
      <Camera className="mx-auto mb-3 size-9 text-primary" />
      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="button" size="xl" className="min-h-12 w-full" onClick={() => photoInput.current?.click()}><Camera />{copy.addPhoto}</Button>
        <Button type="button" size="xl" variant="outline" className="min-h-12 w-full" onClick={() => fileInput.current?.click()}><Paperclip />{copy.addFile}</Button>
      </div>
      <input ref={photoInput} type="file" accept={accept} capture="environment" multiple className="sr-only" tabIndex={-1}
        aria-label={copy.addPhoto} onChange={event => { addFiles(Array.from(event.target.files ?? [])); event.target.value = ''; }} />
      <input ref={fileInput} type="file" accept={accept} multiple className="sr-only" tabIndex={-1}
        aria-label={copy.addFile} onChange={event => { addFiles(Array.from(event.target.files ?? [])); event.target.value = ''; }} />
      <p className="mt-3 text-sm text-muted-foreground">{copy.hint}</p>
    </div>

    {issue && <p role="alert" className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" />{copy.errors[issue] ?? copy.errors['upload_failed']}
    </p>}

    {!!items.length && <ul className="min-w-0 space-y-3">
      {items.map(item => <li key={item.id} className="min-w-0 space-y-2 rounded-lg border border-border p-3">
        <div className="flex min-w-0 items-start gap-3">
          <Thumb item={item} alt={copy.categories[item.category]} />
          <p className="min-w-0 flex-1 break-words text-sm font-semibold">{item.name}</p>
          <div className="flex shrink-0 gap-2">
            {item.status === 'failed' && <Button type="button" size="icon" variant="outline" className="size-12" aria-label={`${copy.retry}: ${item.name}`} onClick={() => retryItem(item.id)}><RefreshCw /></Button>}
            <Button type="button" size="icon" variant="secondary" className="size-12" aria-label={`${copy.remove}: ${item.name}`} onClick={() => removeItem(item.id)}><Trash2 /></Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{formatSize(item.size, lang)}</p>
        <p className={`flex items-center gap-1 text-xs font-semibold ${item.status === 'failed' ? 'text-destructive' : item.status === 'uploaded' ? 'text-success' : 'text-muted-foreground'}`}
          data-testid={`attachment-status-${item.status}`}>
          {item.status === 'uploading' && <Loader2 className="size-3 animate-spin" />}
          {item.status === 'failed'
            ? (copy.errors[item.errorCode ?? ''] ?? copy.errors['upload_failed'])
            : copy.statuses[item.status]}
        </p>
        <div className="min-w-0">
          <label className="block text-xs text-muted-foreground" htmlFor={`category-${item.id}`}>{copy.category}</label>
          <select id={`category-${item.id}`} value={item.category}
            onChange={event => setCategory(item.id, event.target.value as AttachmentCategory)}
            className="mt-1 min-h-12 w-full rounded-md border border-border bg-background px-3 text-base">
            {attachmentCategories.map(category => <option key={category} value={category}>{copy.categories[category]}</option>)}
          </select>
        </div>
      </li>)}
    </ul>}

    <label className="grid min-h-12 cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-lg border border-border p-3 text-sm">
      <input type="checkbox" checked={later} onChange={event => setLater(event.target.checked)} className="size-5 shrink-0 accent-primary" />
      <span className="min-w-0 leading-snug">
        {saved ? copy.laterWithFiles : copy.later}
        {saved > 0 && <span className="block text-xs text-muted-foreground">{copy.laterKeep}</span>}
      </span>
    </label>
    <p className="text-xs text-muted-foreground" data-testid="attachment-counter">
      {`${saved} ${copy.countSaved}`}
      {failed > 0 ? ` · ${failed} ${copy.countFailed}` : ''}
      {` · ${copy.countMax} ${rules.maxFiles}`}
    </p>
  </div>;
}
