import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ArrowLeft, ArrowRight, CalendarDays, Camera, Check, CheckCircle2, Loader2, Phone, ShieldCheck, Trash2, X, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { useIsMobile } from '@/hooks/use-mobile';
import { getBookingActive, getBookingActiveServer, setBookingActive, subscribeBookingActive } from '@/lib/booking-active';
import { groupBookingSchema, groupBookingMessage, groupDisclaimer, groupMomentIds, groupMoments, groupMoney, groupOptions, groupPackages, groupPhotoGuide, groupPhotoLater, groupStepCta, groupTotal, type GroupLocale, type OptionId, type PackageId } from '@/lib/groepenkast';
import { prices } from '@/lib/pricing';
import { mountInvisibleTurnstile, turnstileEnabled } from '@/lib/turnstile';
import { isBlockedPhoneRegion } from '@/lib/phone-region';
import { trackLeadSuccess } from '@/lib/analytics';
import { telHref, whatsappHref } from '@/lib/business';
import { cn } from '@/lib/utils';

const inputClass = 'mt-2 h-12 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const choiceClass = 'grid min-h-20 cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-background p-4 transition-colors has-[:checked]:border-primary has-[:checked]:bg-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring';

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dateFromKey(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function displayDate(value: string) {
  return value ? value.split('-').reverse().join('-') : '';
}

function PhotoPreview({ file, remove, lang }: { file: File; remove: () => void; lang: GroupLocale }) {
  const [url, setUrl] = useState('');
  useEffect(() => { const next = URL.createObjectURL(file); setUrl(next); return () => URL.revokeObjectURL(next); }, [file]);
  return <div className="relative min-w-0 rounded-lg border border-border p-2">
    {url && <img src={url} alt={lang === 'en' ? 'Selected fuse box photo' : 'Geselecteerde groepenkastfoto'} className="aspect-square w-full rounded object-cover" />}
    <p className="mt-2 truncate text-xs text-muted-foreground">{file.name}</p>
    <Button type="button" size="icon" variant="secondary" onClick={remove} className="absolute right-2 top-2 h-11 w-11" aria-label={`${lang === 'en' ? 'Remove' : 'Verwijder'} ${file.name}`}><Trash2 /></Button>
  </div>;
}

export function GroepenkastBooking({ lang, packageId, setPackageId, step, setStep, surveyRequest = 0 }: {
  lang: GroupLocale; packageId: PackageId | ''; setPackageId: (id: PackageId) => void; step: number; setStep: (step: number) => void; surveyRequest?: number;
}) {
  const en = lang === 'en';
  const open = useSyncExternalStore(subscribeBookingActive, getBookingActive, getBookingActiveServer);
  const [options, setOptions] = useState<OptionId[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [survey, setSurvey] = useState(false);
  const [later, setLater] = useState(false);
  const [fields, setFields] = useState({ postalCode: '', houseNumber: '', street: '', city: '', name: '', phone: '', email: '', hp: '' });
  const [preferredDate, setPreferredDate] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [confirmedAddress, setConfirmedAddress] = useState<{ key: string; street: string; city: string } | null>(null);
  const [moment, setMoment] = useState<typeof groupMomentIds[number] | ''>('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [lookup, setLookup] = useState('');
  const isMobile = useIsMobile();
  const totals = groupTotal(packageId || 'unknown', options);
  const selected = groupPackages.find(p => p.id === packageId);
  const steps = en ? ['Package', 'Options', 'Photo', 'Address', 'Details', 'Summary'] : ['Pakket', 'Opties', 'Foto', 'Adres', 'Gegevens', 'Overzicht'];
  const heading = useRef<HTMLHeadingElement>(null);
  const widget = useRef<HTMLDivElement>(null);
  const token = useRef<(() => Promise<string>) | null>(null);
  const submitting = useRef(false);
  const upload = useRef<HTMLInputElement>(null);
  const content = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!widget.current || !turnstileEnabled) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;
    mountInvisibleTurnstile(widget.current).then(mounted => {
      if (!mounted) return;
      if (disposed) { mounted.unmount(); return; }
      token.current = mounted.getToken; cleanup = mounted.unmount;
    }).catch(() => { token.current = null; });
    return () => { disposed = true; cleanup?.(); token.current = null; };
  }, []);
  useEffect(() => { setError(''); }, [step]);
  useEffect(() => { if (surveyRequest > 0) { setSurvey(true); setLater(false); } }, [surveyRequest]);

  function close() { if (!busy) setBookingActive(false); }
  function move(next: number) {
    setStep(next);
    requestAnimationFrame(() => {
      content.current?.scrollTo({ top: 0, behavior: 'instant' });
      heading.current?.focus({ preventScroll: true });
    });
  }
  const setField = (key: keyof typeof fields, value: string) => setFields(previous => ({ ...previous, [key]: value }));
  async function lookupCity() {
    if (!/^[1-9]\d{3}\s?[a-z]{2}$/i.test(fields.postalCode) || !/^\d+/.test(fields.houseNumber)) return;
    const lookupKey = `${fields.postalCode.replace(/\s/g, '').toUpperCase()}-${parseInt(fields.houseNumber, 10)}`;
    setLookup(en ? 'Looking up address…' : 'Adres opzoeken…');
    setConfirmedAddress(null);
    try {
      const pc = fields.postalCode.replace(/\s/g, '').toUpperCase();
      const res = await fetch(`https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?fq=type:adres&rows=1&q=${encodeURIComponent(`postcode:${pc} and huisnummer:${parseInt(fields.houseNumber, 10)}`)}`);
      if (!res.ok) throw new Error('lookup');
      const data = await res.json();
      const doc = data.response?.docs?.[0];
      if (!doc?.woonplaatsnaam || !doc?.straatnaam) throw new Error('lookup');
      setFields(previous => {
        const currentKey = `${previous.postalCode.replace(/\s/g, '').toUpperCase()}-${parseInt(previous.houseNumber, 10)}`;
        if (currentKey !== lookupKey) return previous;
        setConfirmedAddress({ key: lookupKey, street: doc.straatnaam, city: doc.woonplaatsnaam });
        return { ...previous, street: doc.straatnaam, city: doc.woonplaatsnaam };
      });
      setLookup(en ? 'Address found.' : 'Adres gevonden.');
    } catch { setConfirmedAddress(null); setLookup(en ? 'Enter your street and city below.' : 'Vul hieronder je straat en woonplaats in.'); }
  }
  function addPhotos(files: File[]) {
    setError('');
    const next = [...photos];
    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024 || file.size === 0) {
        setError(en ? 'Choose JPG, PNG or WebP photos, up to 5 MB each.' : 'Kies JPG-, PNG- of WebP-foto’s van maximaal 5 MB per foto.'); continue;
      }
      if (next.some(p => p.name === file.name && p.size === file.size && p.lastModified === file.lastModified)) continue;
      if (next.length >= 3) { setError(en ? 'You can add up to 3 photos.' : 'Je kunt maximaal 3 foto’s toevoegen.'); break; }
      next.push(file);
    }
    setPhotos(next);
    if (next.length) { setSurvey(false); setLater(false); }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    setError('');
    if (step === 1 && !packageId) { setError(en ? 'Choose a package or the photo-check option.' : 'Kies een pakket of de optie voor fotocontrole.'); return; }
    if (step === 3 && !photos.length && !survey && !later) { setError(en ? 'Add a photo, send it later via WhatsApp, or choose a site inspection.' : 'Voeg een foto toe, stuur hem later via WhatsApp of kies een schouw.'); return; }
    if (step === 5 && (fields.name.trim().length < 2 || !/^[0-9+()\s-]{8,20}$/.test(fields.phone) || isBlockedPhoneRegion(fields.phone))) {
      setError(en ? 'Check your name and phone number.' : 'Controleer je naam en telefoonnummer.'); return;
    }
    if (step < 6) { move(step + 1); return; }
    const result = groupBookingSchema.safeParse({ packageId, optionIds: options, photoReview: survey ? 'survey' : later ? 'later' : 'photo', postalCode: fields.postalCode, houseNumber: fields.houseNumber, street: fields.street, city: fields.city, preferredDate, preferredMoment: moment });
    if (!result.success || (!photos.length && !survey && !later) || !fields.name.trim() || !fields.phone.trim() || !fields.email.trim() || !consent) {
      setError(en ? 'Complete all steps and confirm your consent.' : 'Vul alle stappen in en bevestig je toestemming.'); return;
    }
    submitting.current = true; setBusy(true);
    try {
      let turnstileToken = '';
      if (turnstileEnabled) {
        if (!token.current) throw new Error(en ? 'The security check is not ready. Refresh the page or try again shortly.' : 'De beveiligingscontrole is nog niet klaar. Ververs de pagina of probeer het zo opnieuw.');
        let timeout: ReturnType<typeof setTimeout> | undefined;
        try { turnstileToken = await Promise.race([token.current(), new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error(en ? 'Security check timed out. Please try again.' : 'Beveiligingscontrole duurde te lang. Probeer opnieuw.')), 20000); })]); }
        finally { if (timeout) clearTimeout(timeout); }
      }
      const body = new FormData();
      for (const key of ['name', 'phone', 'email', 'postalCode', 'hp'] as const) body.append(key, fields[key].trim());
      body.append('locale', lang);
      body.append('sourcePath', window.location.pathname);
      body.append('jobType', en ? 'Fuse box replacement — price check' : 'Groepenkast vervangen — prijscontrole');
      body.append('groupBooking', JSON.stringify(result.data));
      body.append('message', groupBookingMessage(result.data, lang));
      body.append('turnstileToken', turnstileToken);
      for (const photo of photos) body.append('attachments', photo);
      const response = await fetch('/api/public/quote-request', { method: 'POST', body });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || (en ? 'Sending failed. Please try again.' : 'Versturen mislukt. Probeer opnieuw.'));
      if (data.id) trackLeadSuccess({ type: 'schedule', leadId: String(data.id), language: lang, pagePath: window.location.pathname, location: 'groepenkast-booking' });
      setDone(true);
      requestAnimationFrame(() => document.getElementById('group-success')?.focus());
    } catch (err) { setError(err instanceof Error ? err.message : (en ? 'Sending failed. Your details have been kept; please try again.' : 'Versturen mislukt. Je gegevens zijn bewaard; probeer opnieuw.')); }
    finally { submitting.current = false; setBusy(false); }
  }

  const status = survey
    ? (en ? `Survey ${groupMoney(prices.groepenkastSurvey, lang)}` : `Schouw ${groupMoney(prices.groepenkastSurvey, lang)}`)
    : later
      ? (en ? 'After photo' : 'Na foto')
      : totals.total === null
        ? (en ? 'After review' : 'Na controle')
        : groupMoney(totals.total, lang);
  const successCopy = survey
    ? (en
        ? `We will contact you to schedule the ${groupMoney(prices.groepenkastSurvey, lang)} survey. This amount will be deducted when you approve the work.`
        : `We nemen contact op om de schouw van ${groupMoney(prices.groepenkastSurvey, lang)} in te plannen. Dit bedrag wordt verrekend bij akkoord.`)
    : later
      ? (en
          ? 'Send your photo via WhatsApp. Your fixed price will follow as soon as we have received your photo.'
          : 'Stuur je foto via WhatsApp. Je vaste prijs volgt zodra we je foto hebben ontvangen.')
      : photos.length > 0
        ? (en
            ? 'We will review your photo and contact you with the final fixed price.'
            : 'We controleren je foto en nemen contact op met de definitieve vaste prijs.')
        : (en
            ? 'We will review your request and contact you with the final fixed price.'
            : 'We controleren je aanvraag en nemen contact op met de definitieve vaste prijs.');
  const whatsappMessage = en ? 'Hi VoltFix, I would like to send my fuse box photo for my price check.' : 'Hallo VoltFix, ik wil mijn groepenkastfoto sturen voor mijn prijscontrole.';
  const selectedDate = dateFromKey(preferredDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const addressKey = `${fields.postalCode.replace(/\s/g, '').toUpperCase()}-${parseInt(fields.houseNumber, 10)}`;
  const streetConfirmed = confirmedAddress?.key === addressKey && confirmedAddress.street === fields.street;
  const cityConfirmed = confirmedAddress?.key === addressKey && confirmedAddress.city === fields.city;
  const calendar = <Calendar
    mode="single"
    selected={selectedDate}
    onSelect={date => {
      if (!date) return;
      setPreferredDate(dateKey(date));
      setCalendarOpen(false);
    }}
    disabled={{ before: today }}
    weekStartsOn={1}
    initialFocus
    className="pointer-events-auto p-3"
  />;

  return <section id="installatiemoment" className="scroll-mt-28" aria-label={en ? 'Fuse box price calculation' : 'Groepenkast prijsberekening'}>
    <div ref={widget} aria-hidden="true" />
    <DialogPrimitive.Root open={open} onOpenChange={next => { if (!next) close(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="groepenkast-flow fixed inset-0 z-[100] bg-foreground/45 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby="group-dialog-description"
          onOpenAutoFocus={event => { event.preventDefault(); requestAnimationFrame(() => heading.current?.focus()); }}
          className="groepenkast-flow fixed inset-0 z-[101] grid h-[100dvh] w-full grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-background outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:left-1/2 sm:top-1/2 sm:h-[min(860px,calc(100dvh-3rem))] sm:max-w-3xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:border sm:border-border sm:shadow-2xl sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95"
        >
          <header className="border-b border-border bg-background px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:pt-5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <DialogPrimitive.Title className="truncate text-lg font-bold sm:text-xl">{done ? (en ? 'Request received' : 'Aanvraag ontvangen') : (en ? 'Calculate my fixed price' : 'Bereken mijn vaste prijs')}</DialogPrimitive.Title>
                <DialogPrimitive.Description id="group-dialog-description" className="mt-1 text-sm text-muted-foreground">
                  {done ? (en ? 'Price check to follow' : 'Prijscontrole volgt') : `${step}/6 ${steps[step - 1]}`}
                </DialogPrimitive.Description>
              </div>
              <DialogPrimitive.Close asChild><Button type="button" variant="ghost" size="icon" disabled={busy} aria-label={en ? 'Close price calculation' : 'Sluit prijsberekening'} className="h-11 w-11 shrink-0"><X /></Button></DialogPrimitive.Close>
            </div>
            {!done && <div className="mt-3" aria-label={en ? `Step ${step} of 6: ${steps[step - 1]}` : `Stap ${step} van 6: ${steps[step - 1]}`}>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${step / 6 * 100}%` }} /></div>
              <ol className="mt-2 hidden grid-cols-6 gap-2 text-xs sm:grid">{steps.map((name, index) => <li key={name} className={index + 1 <= step ? 'font-semibold text-primary' : 'text-muted-foreground'}>{index + 1}. {name}</li>)}</ol>
            </div>}
          </header>

          <div ref={content} className="min-h-0 overflow-y-auto overscroll-contain px-4 py-5 pb-[calc(120px_+_env(safe-area-inset-bottom))] sm:px-6 sm:py-6 sm:pb-[calc(140px_+_env(safe-area-inset-bottom))]">
            {done ? <div className="mx-auto max-w-xl py-6 sm:py-12" role="status">
              <CheckCircle2 className="mb-5 size-12 text-primary" />
              <h2 id="group-success" ref={heading} tabIndex={-1} className="text-2xl font-bold outline-none">{en ? 'Request received — we’ll confirm your price' : 'Aanvraag ontvangen — prijscontrole volgt'}</h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">{successCopy}</p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <Button asChild size="xl" variant="whatsapp" className="h-auto min-h-12 whitespace-normal py-3"><a href={whatsappHref(whatsappMessage)} target="_blank" rel="noopener noreferrer"><WhatsAppIcon className="size-5" ariaLabel="WhatsApp" />{later ? (en ? 'Send photo via WhatsApp' : 'Foto via WhatsApp sturen') : (en ? 'Open WhatsApp' : 'Open WhatsApp')}</a></Button>
                <Button asChild size="xl" variant="outline" className="h-auto min-h-12 whitespace-normal py-3"><a href={telHref}><Phone />{en ? 'Call VoltFix' : 'Bel VoltFix'}</a></Button>
              </div>
            </div> : <form id="group-booking-form" onSubmit={submit} aria-busy={busy}>
              <fieldset disabled={busy} className="min-w-0 space-y-4">
                <legend className="sr-only">{steps[step - 1]}</legend>
                <h2 ref={heading} tabIndex={-1} className="text-xl font-bold outline-none">{step}/6 · {steps[step - 1]}</h2>
                <input name="website" tabIndex={-1} autoComplete="off" value={fields.hp} onChange={e => setField('hp', e.target.value)} className="hidden" aria-hidden="true" />
                {step === 1 && <div className="grid gap-3">{groupPackages.map(p => <label key={p.id} className={choiceClass}>
                  <input type="radio" name="package" value={p.id} checked={packageId === p.id} onChange={() => setPackageId(p.id)} className="size-5 shrink-0 accent-primary" />
                  <span className="min-w-0"><span className="block font-bold">{p[lang]}</span><span className="text-sm text-muted-foreground">{p.circuits} {en ? 'circuits' : 'groepen'}</span></span><span className="shrink-0 whitespace-nowrap text-lg font-bold tabular-nums">{groupMoney(p.price, lang)}</span>
                </label>)}<label className={choiceClass}><input type="radio" name="package" checked={packageId === 'unknown'} onChange={() => setPackageId('unknown')} className="size-5 shrink-0 accent-primary" /><span className="min-w-0 font-semibold">{en ? 'I’m not sure, check my photo.' : 'Ik weet het niet, check mijn foto.'}</span><Camera className="shrink-0 text-primary" /></label></div>}
                {step === 2 && <><p className="text-sm text-muted-foreground">{en ? 'Optional additions, including materials, installation and 21% VAT.' : 'Optionele uitbreidingen, inclusief materiaal, montage en 21% btw.'}</p><div className="grid gap-3 sm:grid-cols-2">{groupOptions.map(o => <label key={o.id} className={choiceClass}><input type="checkbox" checked={options.includes(o.id)} onChange={e => setOptions(previous => e.target.checked ? [...previous, o.id] : previous.filter(id => id !== o.id))} className="size-5 shrink-0 accent-primary" /><span className="min-w-0 font-semibold">{o[lang]}</span><span className="shrink-0 whitespace-nowrap text-sm font-bold text-primary tabular-nums">+{groupMoney(o.price, lang)}</span></label>)}</div></>}
                {step === 3 && <>
                  <div><p className="font-semibold">{en ? 'Upload a photo of your open fuse box for a fixed-price check.' : 'Upload een foto van je geopende groepenkast voor vaste prijscontrole.'}</p><p className="mt-1 text-sm text-muted-foreground">{en ? 'Only open the cupboard door. Never unscrew covers or touch wiring.' : 'Open alleen de deur. Schroef nooit beschermkappen los en raak geen bedrading aan.'}</p></div>
                  <div className="rounded-lg border-2 border-dashed border-primary/40 bg-accent/40 p-6 text-center" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); addPhotos(Array.from(e.dataTransfer.files)); }}>
                    <Camera className="mx-auto mb-3 size-9 text-primary" /><Button type="button" size="xl" onClick={() => upload.current?.click()}><Camera />{en ? 'Add photo' : 'Foto toevoegen'}</Button>
                    <input ref={upload} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" multiple className="sr-only" tabIndex={-1} aria-label={en ? 'Fuse box photos' : 'Groepenkastfoto’s'} onChange={e => { addPhotos(Array.from(e.target.files ?? [])); e.target.value = ''; }} />
                    <p className="mt-3 text-sm text-muted-foreground">{en ? 'Up to 3 · JPG, PNG or WebP · 5 MB each' : 'Max. 3 · JPG, PNG of WebP · 5 MB per foto'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-primary/40 bg-background p-3"><p className="flex items-center gap-2 text-sm font-bold text-primary"><CheckCircle2 className="size-4 shrink-0" />{groupPhotoGuide[lang].goodTitle}</p><ul className="mt-2 space-y-1 text-xs leading-relaxed text-muted-foreground">{groupPhotoGuide[lang].good.map(item => <li key={item}>• {item}</li>)}</ul></div>
                    <div className="rounded-lg border border-border bg-background p-3"><p className="flex items-center gap-2 text-sm font-bold"><XCircle className="size-4 shrink-0" />{groupPhotoGuide[lang].badTitle}</p><ul className="mt-2 space-y-1 text-xs leading-relaxed text-muted-foreground">{groupPhotoGuide[lang].bad.map(item => <li key={item}>• {item}</li>)}</ul></div>
                  </div>
                  {!!photos.length && <div className="grid grid-cols-3 gap-2">{photos.map((file, index) => <PhotoPreview key={`${file.name}-${file.lastModified}`} file={file} lang={lang} remove={() => setPhotos(previous => previous.filter((_, i) => i !== index))} />)}</div>}
                  <label className={choiceClass}><input type="radio" name="photo-route" checked={later} onChange={() => { setLater(true); setSurvey(false); setPhotos([]); }} className="size-5 shrink-0 accent-primary" /><span className="min-w-0"><span className="block font-bold">{groupPhotoLater[lang].choice}</span><span className="mt-1 block text-sm text-muted-foreground">{groupPhotoLater[lang].summary}</span></span><span className="shrink-0 text-xs font-bold text-primary">{en ? 'After photo' : 'Na foto'}</span></label>
                  <label className={choiceClass}><input type="radio" name="photo-route" checked={survey} onChange={() => { setSurvey(true); setLater(false); setPhotos([]); }} className="size-5 shrink-0 accent-primary" /><span className="min-w-0"><span className="block font-bold">{en ? 'Book a site inspection' : 'Plan een schouw'}</span><span className="mt-1 block text-sm text-muted-foreground">{en ? 'Fully deducted when you accept the fixed price.' : 'Volledig verrekend bij akkoord op de vaste prijs.'}</span></span><span className="shrink-0 whitespace-nowrap font-bold text-primary tabular-nums">{groupMoney(prices.groepenkastSurvey, lang)}</span></label>
                  <p className="text-sm text-primary">{en ? 'Photo review: usually within 1 hour during opening hours.' : 'Fotocontrole: meestal binnen 1 uur tijdens openingstijden.'}</p>
                </>}
                {step === 4 && <div className="grid gap-3">
                  <label className="block text-sm font-semibold">{en ? 'Preferred date' : 'Voorkeursdatum'}
                    {isMobile ? <>
                      <div className="relative mt-2">
                        <input required readOnly aria-haspopup="dialog" aria-expanded={calendarOpen} placeholder={en ? 'dd-mm-yyyy' : 'dd-mm-jjjj'} value={displayDate(preferredDate)} onClick={() => setCalendarOpen(true)} className="h-12 w-full cursor-pointer rounded-md border border-input bg-background px-3 pr-11 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                        <CalendarDays className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                      </div>
                      <Drawer open={calendarOpen} onOpenChange={setCalendarOpen} shouldScaleBackground={false}>
                        <DrawerContent className="z-[120] max-h-[90dvh] pb-[env(safe-area-inset-bottom)]">
                          <DrawerHeader className="pb-1 text-left"><DrawerTitle>{en ? 'Choose a date' : 'Kies een datum'}</DrawerTitle><DrawerDescription>{en ? 'Your preferred installation date' : 'Je gewenste installatiedatum'}</DrawerDescription></DrawerHeader>
                          <div className="mx-auto overflow-auto px-2 pb-4">{calendar}</div>
                        </DrawerContent>
                      </Drawer>
                    </> : <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <div className="relative mt-2">
                          <input required readOnly aria-haspopup="dialog" aria-expanded={calendarOpen} placeholder={en ? 'dd-mm-yyyy' : 'dd-mm-jjjj'} value={displayDate(preferredDate)} className="h-12 w-full cursor-pointer rounded-md border border-input bg-background px-3 pr-11 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                          <CalendarDays className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                        </div>
                      </PopoverTrigger>
                      <PopoverContent side="bottom" align="start" sideOffset={6} className="z-[120] w-auto p-0">{calendar}</PopoverContent>
                    </Popover>}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="min-w-0 text-sm font-semibold">Postcode<input required pattern="[1-9][0-9]{3}\s?[A-Za-z]{2}" maxLength={7} autoComplete="postal-code" value={fields.postalCode} onChange={e => { setField('postalCode', e.target.value.toUpperCase()); setLookup(''); setConfirmedAddress(null); }} onBlur={lookupCity} className={inputClass} /></label>
                    <label className="min-w-0 text-sm font-semibold">{en ? 'House number' : 'Huisnummer'}<input required maxLength={18} pattern="[0-9]{1,5}.*" autoComplete="address-line1" value={fields.houseNumber} onChange={e => { setField('houseNumber', e.target.value); setLookup(''); setConfirmedAddress(null); }} onBlur={lookupCity} className={inputClass} /></label>
                  </div>
                  {lookup && <p className={cn('text-sm', confirmedAddress ? 'text-success' : 'text-muted-foreground')} role="status">{lookup}</p>}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm font-semibold">{en ? 'Street' : 'Straat'}<span className="relative block"><input required minLength={2} maxLength={120} autoComplete="address-line1" value={fields.street} onChange={e => setField('street', e.target.value)} className={cn(inputClass, 'pr-10', streetConfirmed && 'border-success focus-visible:ring-success')} />{streetConfirmed && <Check className="absolute right-3 top-[calc(50%+0.25rem)] size-5 -translate-y-1/2 text-success" aria-hidden />}</span></label>
                    <label className="block text-sm font-semibold">{en ? 'City' : 'Woonplaats'}<span className="relative block"><input required minLength={2} maxLength={80} autoComplete="address-level2" value={fields.city} onChange={e => setField('city', e.target.value)} className={cn(inputClass, 'pr-10', cityConfirmed && 'border-success focus-visible:ring-success')} />{cityConfirmed && <Check className="absolute right-3 top-[calc(50%+0.25rem)] size-5 -translate-y-1/2 text-success" aria-hidden />}</span></label>
                  </div>
                  <p className="font-semibold">{en ? 'Preferred time' : 'Voorkeursmoment'}</p>
                  <div className="grid grid-cols-2 gap-2">{groupMomentIds.map((id, index) => <label key={id} className="flex min-h-12 cursor-pointer items-center gap-2 rounded-md border border-border bg-background p-3 has-[:checked]:border-primary has-[:checked]:bg-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"><input type="radio" name="moment" required value={id} checked={moment === id} onChange={() => setMoment(id)} className="size-5 shrink-0 accent-primary" /><span className="min-w-0 text-sm font-semibold leading-snug">{groupMoments[lang][index]}</span></label>)}</div>
                  <p className="text-sm text-muted-foreground">{en ? 'This is a preference, not a confirmed appointment.' : 'Dit is een voorkeur, nog geen bevestigde afspraak.'}</p>
                </div>}
                {step === 5 && <>{(['name', 'phone', 'email'] as const).map(key => <label key={key} className="block text-sm font-semibold">{{ name: en ? 'Name' : 'Naam', phone: en ? 'Phone' : 'Telefoon', email: 'E-mail' }[key]} *<input required minLength={key === 'name' ? 2 : key === 'phone' ? 8 : undefined} maxLength={key === 'name' ? 80 : key === 'phone' ? 20 : 120} type={key === 'phone' ? 'tel' : key === 'email' ? 'email' : 'text'} autoComplete={key === 'phone' ? 'tel' : key} value={fields[key]} onChange={e => setField(key, e.target.value)} className={inputClass} /></label>)}<p className="text-sm text-muted-foreground">{en ? 'We use these details for your price check and confirmation.' : 'We gebruiken deze gegevens voor je prijscontrole en bevestiging.'}</p></>}
                 {step === 6 && <><dl className="divide-y divide-border text-sm"><div className="flex justify-between gap-3 py-3"><dt>{en ? 'Package' : 'Pakket'}</dt><dd className="text-right font-semibold">{selected ? `${selected[lang]} · ${selected.circuits} ${en ? 'circuits' : 'groepen'}` : (en ? 'Package to be confirmed' : 'Pakket nog te bepalen')}</dd></div>{groupOptions.filter(o => options.includes(o.id)).map(o => <div key={o.id} className="flex justify-between gap-3 py-3"><dt>{o[lang]}</dt><dd className="shrink-0 tabular-nums">+{groupMoney(o.price, lang)}</dd></div>)}{!options.length && <div className="py-3 text-muted-foreground">{en ? 'No additional options' : 'Geen extra opties'}</div>}<div className="py-3"><dt className="font-semibold">{en ? 'Photo / inspection' : 'Foto / schouw'}</dt><dd>{survey ? (en ? `Site inspection ${groupMoney(prices.groepenkastSurvey, lang)}, deducted from the final quote if you approve the work.` : `Schouw ${groupMoney(prices.groepenkastSurvey, lang)}, volledig verrekend bij akkoord`) : later ? `${groupPhotoLater[lang].choice} — ${groupPhotoLater[lang].summary}` : `${photos.length} ${en ? 'photo(s)' : 'foto(’s)'}`}</dd></div><div className="py-3"><dt className="font-semibold">{en ? 'Address & preference' : 'Adres & voorkeur'}</dt><dd>{fields.street} {fields.houseNumber}<br />{fields.postalCode} · {fields.city}<br />{displayDate(preferredDate)} · {moment ? groupMoments[lang][groupMomentIds.indexOf(moment)] : ''}</dd></div><div className="break-words py-3"><dt className="font-semibold">{en ? 'Contact details' : 'Contactgegevens'}</dt><dd>{fields.name}<br />{fields.phone}<br />{fields.email}</dd></div></dl><div className="flex flex-wrap gap-2">{steps.slice(0, 5).map((name, index) => <Button type="button" key={name} variant="outline" className="min-h-11" onClick={() => move(index + 1)}>{en ? 'Edit' : 'Wijzig'} {name.toLowerCase()}</Button>)}</div><label className="flex cursor-pointer items-start gap-3 py-3 text-sm"><input type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-1 size-5 shrink-0 accent-primary" /><span>{en ? 'I agree that VoltFix may contact me about this request. The final fixed price is subject to photo review or site inspection.' : 'Ik ga akkoord dat VoltFix contact opneemt over deze aanvraag. De definitieve vaste prijs volgt na foto- of schouwcontrole.'} <a href={en ? '/en-gb/privacy-policy' : '/privacybeleid'} className="text-primary underline">{en ? 'Privacy policy' : 'Privacybeleid'}</a></span></label></>}
                <div className="rounded-md border border-border bg-muted/40 p-3"><p className="text-sm text-muted-foreground">{groupDisclaimer[lang]}</p></div>
                {error && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
              </fieldset>
            </form>}
          </div>

          <footer className="border-t border-border bg-background px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_-20px_color-mix(in_oklab,var(--foreground)_45%,transparent)] sm:px-6 sm:pb-4">
            {done ? <Button type="button" size="xl" className="w-full" onClick={close}>{en ? 'Back to page' : 'Terug naar pagina'}</Button> : <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="min-w-fit"><span className="hidden text-xs font-semibold text-muted-foreground sm:block">{en ? 'Current status' : 'Actuele status'}</span><strong data-testid="group-total" className="block whitespace-nowrap text-sm font-bold text-primary tabular-nums sm:text-xl">{status}</strong></div>
              <div className="flex shrink-0 items-center gap-2">{step > 1 && <Button type="button" variant="outline" size="icon" className="h-12 w-12" onClick={() => move(step - 1)} aria-label={en ? 'Back' : 'Terug'}><ArrowLeft /></Button>}{(() => { const needsPackage = step === 1 && !packageId; return <Button type="submit" form="group-booking-form" size="xl" disabled={busy || needsPackage} className="h-auto min-h-12 max-w-[13rem] whitespace-normal px-4 py-3 leading-snug sm:max-w-none">{busy ? <Loader2 className="animate-spin" /> : step === 6 ? <ShieldCheck /> : null}{busy ? (en ? 'Sending…' : 'Versturen…') : needsPackage ? (en ? 'Choose a package first' : 'Kies eerst een pakket') : groupStepCta[lang][step - 1]}{step < 6 && !needsPackage && <ArrowRight />}</Button>; })()}</div>
            </div>}
          </footer>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  </section>;
}