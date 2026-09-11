import { useEffect, useRef, useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { groupMoney, groupPhotoLater, type GroupLocale } from '@/lib/groepenkast';

const choiceClass = 'grid min-h-20 cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-background p-4 transition-colors has-[:checked]:border-primary has-[:checked]:bg-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring';

function PhotoPreview({ file, remove, lang }: { file: File; remove: () => void; lang: GroupLocale }) {
  const [url, setUrl] = useState('');
  useEffect(() => { const next = URL.createObjectURL(file); setUrl(next); return () => URL.revokeObjectURL(next); }, [file]);
  return <div className="relative min-w-0 rounded-lg border border-border p-2">
    {url && <img src={url} alt={lang === 'en' ? 'Selected fuse box photo' : 'Geselecteerde groepenkastfoto'} className="aspect-square w-full rounded object-cover" />}
    <p className="mt-2 truncate text-xs text-muted-foreground">{file.name}</p>
    <Button type="button" size="icon" variant="secondary" onClick={remove} className="absolute right-2 top-2 h-11 w-11" aria-label={`${lang === 'en' ? 'Remove' : 'Verwijder'} ${file.name}`}><Trash2 /></Button>
  </div>;
}

/** Gedeelde fotostap: upload, fotogids, "foto later via WhatsApp" en schouwroute. */
export function PhotoStep({ lang, instructions, photos, addPhotos, removePhoto, later, survey, chooseLater, chooseSurvey, allowLater, allowSurvey, surveyFee }: {
  lang: GroupLocale;
  instructions: { title: string; note: string };
  photos: File[];
  addPhotos: (files: File[]) => void | Promise<void>;
  removePhoto: (index: number) => void;
  later: boolean;
  survey: boolean;
  chooseLater: () => void;
  chooseSurvey: () => void;
  allowLater: boolean;
  allowSurvey: boolean;
  surveyFee: number | null;
}) {
  const en = lang === 'en';
  const upload = useRef<HTMLInputElement>(null);
  return <>
    <div><p className="font-semibold">{instructions.title}</p><p className="mt-1 text-sm text-muted-foreground">{instructions.note}</p></div>
    <div className="rounded-lg border-2 border-dashed border-primary/40 bg-accent/40 p-6 text-center" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); addPhotos(Array.from(e.dataTransfer.files)); }}>
      <Camera className="mx-auto mb-3 size-9 text-primary" /><Button type="button" size="xl" onClick={() => upload.current?.click()}><Camera />{en ? 'Add photo' : 'Foto toevoegen'}</Button>
      <input ref={upload} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" capture="environment" multiple className="sr-only" tabIndex={-1} aria-label={en ? 'Fuse box photos' : 'Groepenkastfoto’s'} onChange={e => { addPhotos(Array.from(e.target.files ?? [])); e.target.value = ''; }} />
      <p className="mt-3 text-sm text-muted-foreground">{en ? 'Up to 3 · JPG, PNG, WebP or iPhone (HEIC) · large photos are resized automatically' : 'Max. 3 · JPG, PNG, WebP of iPhone (HEIC) · grote foto’s worden automatisch verkleind'}</p>
    </div>
    {!!photos.length && <div className="grid grid-cols-3 gap-2">{photos.map((file, index) => <PhotoPreview key={`${file.name}-${file.lastModified}`} file={file} lang={lang} remove={() => removePhoto(index)} />)}</div>}
    {allowLater && <label className={choiceClass}>
      <input type="radio" name="photo-route" checked={later} onChange={chooseLater} className="size-5 shrink-0 accent-primary" />
      <span className="min-w-0"><span className="block font-bold">{groupPhotoLater[lang].choice}</span><span className="mt-1 block text-sm text-muted-foreground">{groupPhotoLater[lang].summary}</span></span>
      <span className="shrink-0 text-xs font-bold text-primary">{en ? 'After photo' : 'Na foto'}</span>
    </label>}
    {allowSurvey && surveyFee !== null && <label className={choiceClass}>
      <input type="radio" name="photo-route" checked={survey} onChange={chooseSurvey} className="size-5 shrink-0 accent-primary" />
      <span className="min-w-0"><span className="block font-bold">{en ? 'Book a site inspection' : 'Plan een schouw'}</span><span className="mt-1 block text-sm text-muted-foreground">{en ? 'Fully deducted when you accept the fixed price.' : 'Volledig verrekend bij akkoord op de vaste prijs.'}</span></span>
      <span className="shrink-0 whitespace-nowrap font-bold text-primary tabular-nums">{groupMoney(surveyFee, lang)}</span>
    </label>}
    <p className="text-sm text-primary">{en ? 'Photo review: usually within 1 hour during opening hours.' : 'Fotocontrole: meestal binnen 1 uur tijdens openingstijden.'}</p>
  </>;
}
