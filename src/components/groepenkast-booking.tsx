import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Camera, CheckCircle2, Loader2, ShieldCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { groupBookingSchema, groupBookingMessage, groupDisclaimer, groupMomentIds, groupMoments, groupMoney, groupOptions, groupPackages, groupPhotoLater, groupSurveyNote, groupTotal, type GroupLocale, type OptionId, type PackageId } from '@/lib/groepenkast';
import { prices } from '@/lib/pricing';
import { mountInvisibleTurnstile, turnstileEnabled } from '@/lib/turnstile';
import { isBlockedPhoneRegion } from '@/lib/phone-region';
import { trackLeadSuccess } from '@/lib/analytics';

const inputClass = 'mt-2 h-12 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const choiceClass = 'flex min-h-20 cursor-pointer items-center gap-3 rounded-lg border border-border bg-background p-4 transition-colors has-[:checked]:border-primary has-[:checked]:bg-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring';
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
  const [options, setOptions] = useState<OptionId[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [survey, setSurvey] = useState(false);
  const [later, setLater] = useState(false);
  const [fields, setFields] = useState({ postalCode: '', houseNumber: '', city: '', name: '', phone: '', email: '', hp: '' });
  const [moment, setMoment] = useState<typeof groupMomentIds[number] | ''>('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [lookup, setLookup] = useState('');
  const totals = groupTotal(packageId || 'unknown', options);
  const selected = groupPackages.find(p => p.id === packageId);
  const steps = en ? ['Package', 'Options', 'Photo', 'Address & time', 'Your details', 'Summary'] : ['Pakket', 'Opties', 'Foto', 'Adres & moment', 'Gegevens', 'Overzicht'];
  const heading = useRef<HTMLHeadingElement>(null);
  const widget = useRef<HTMLDivElement>(null);
  const token = useRef<(() => Promise<string>) | null>(null);
  const submitting = useRef(false);
  const upload = useRef<HTMLInputElement>(null);
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
  useEffect(() => { if (surveyRequest > 0) setSurvey(true); }, [surveyRequest]);
  function move(next: number) { setStep(next); requestAnimationFrame(() => { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView({ block: 'start', behavior: 'instant' }); }); }
  const setField = (key: keyof typeof fields, value: string) => setFields(previous => ({ ...previous, [key]: value }));
  async function lookupCity() {
    if (!/^[1-9]\d{3}\s?[a-z]{2}$/i.test(fields.postalCode) || !/^\d+/.test(fields.houseNumber)) return;
    setLookup(en ? 'Looking up address…' : 'Adres opzoeken…');
    try {
      const pc = fields.postalCode.replace(/\s/g, '').toUpperCase();
      const res = await fetch(`https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?fq=type:adres&rows=1&q=${encodeURIComponent(`postcode:${pc} and huisnummer:${parseInt(fields.houseNumber, 10)}`)}`);
      if (!res.ok) throw new Error('lookup');
      const data = await res.json();
      const doc = data.response?.docs?.[0];
      if (!doc?.woonplaatsnaam) throw new Error('lookup');
      setFields(previous => previous.postalCode === fields.postalCode && previous.houseNumber === fields.houseNumber ? { ...previous, city: doc.woonplaatsnaam } : previous);
      setLookup(`${doc.straatnaam ?? ''} ${fields.houseNumber}, ${doc.woonplaatsnaam}`);
    } catch { setLookup(en ? 'Enter your city below.' : 'Vul hieronder je woonplaats in.'); }
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
    if (next.length) setSurvey(false);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    setError('');
    if (step === 1 && !packageId) { setError(en ? 'Choose a package or the photo-check option.' : 'Kies een pakket of de optie voor fotocontrole.'); return; }
    if (step === 3 && !photos.length && !survey) { setError(en ? 'Add a photo or choose a site inspection.' : 'Voeg een foto toe of kies een schouw.'); return; }
    if (step === 5 && (fields.name.trim().length < 2 || !/^[0-9+()\s-]{8,20}$/.test(fields.phone) || isBlockedPhoneRegion(fields.phone))) {
      setError(en ? 'Check your name and phone number.' : 'Controleer je naam en telefoonnummer.'); return;
    }
    if (step < 6) { move(step + 1); return; }
    const result = groupBookingSchema.safeParse({ packageId, optionIds: options, photoReview: survey ? 'survey' : 'photo', postalCode: fields.postalCode, houseNumber: fields.houseNumber, city: fields.city, preferredMoment: moment });
    if (!result.success || (!photos.length && !survey) || !fields.name.trim() || !fields.phone.trim() || !fields.email.trim() || !consent) {
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
  return <section id="installatiemoment" className="scroll-mt-24 border-y border-border bg-muted/40 py-12 sm:py-16" aria-label={en ? 'Fuse box price calculation' : 'Groepenkast prijsberekening'}>
    <div className="mx-auto max-w-3xl px-4">
      <div ref={widget} aria-hidden="true" />
      {done ? <div className="py-8" role="status"><CheckCircle2 className="mb-4 size-10 text-primary" /><h2 id="group-success" tabIndex={-1} className="text-2xl font-bold">{en ? 'Request received — price check to follow' : 'Aanvraag ontvangen — prijscontrole volgt'}</h2><p className="mt-4 text-muted-foreground">{en ? 'We will review your photo or arrange a site inspection and contact you to confirm the final fixed price and installation time. Your price is not confirmed yet.' : 'We bekijken je foto of plannen een schouw en nemen contact op om de definitieve vaste prijs en het installatiemoment te bevestigen. Je prijs staat nog niet definitief vast.'}</p></div> : <>
        <p className="text-sm font-semibold text-primary">{en ? `All-in packages from ${groupMoney(prices.groepenkastFrom, lang)}` : `All-in pakketten vanaf ${groupMoney(prices.groepenkastFrom, lang)}`}</p>
        <h2 className="mt-2 text-3xl font-bold">{en ? 'Calculate my fixed price' : 'Bereken mijn vaste prijs'}</h2>
        <ol className="mt-6 grid grid-cols-6 gap-2" aria-label={en ? 'Steps' : 'Stappen'}>{steps.map((name, index) => <li key={name} aria-current={step === index + 1 ? 'step' : undefined} className={`border-t-4 pt-2 text-xs ${index + 1 <= step ? 'border-primary text-primary' : 'border-border text-muted-foreground'}`}><span className="font-bold">{index + 1}</span><span className="ml-1 hidden sm:inline">{name}</span></li>)}</ol>
        <h3 ref={heading} tabIndex={-1} className="mt-8 scroll-mt-28 text-xl font-bold outline-none">{step}/6 · {steps[step - 1]}</h3>
        <form onSubmit={submit} className="mt-5" aria-busy={busy}>
          <fieldset disabled={busy} className="min-w-0 space-y-4">
            <legend className="sr-only">{steps[step - 1]}</legend>
            <input name="website" tabIndex={-1} autoComplete="off" value={fields.hp} onChange={e => setField('hp', e.target.value)} className="hidden" aria-hidden="true" />
            {step === 1 && <div className="grid gap-3">{groupPackages.map(p => <label key={p.id} className={choiceClass}>
              <input type="radio" name="package" value={p.id} checked={packageId === p.id} onChange={() => setPackageId(p.id)} className="size-5 shrink-0 accent-primary" />
              <span className="min-w-0 flex-1"><span className="block font-bold">{p[lang]}</span><span className="text-sm text-muted-foreground">{p.circuits} {en ? 'circuits' : 'groepen'}</span></span><span className="text-xl font-bold">{groupMoney(p.price, lang)}</span>
            </label>)}<label className={choiceClass}><input type="radio" name="package" checked={packageId === 'unknown'} onChange={() => setPackageId('unknown')} className="size-5 shrink-0 accent-primary" /><span className="font-semibold">{en ? 'I’m not sure, check my photo.' : 'Ik weet het niet, check mijn foto.'}</span><Camera className="ml-auto shrink-0 text-primary" /></label></div>}
            {step === 2 && <><p className="text-sm text-muted-foreground">{en ? 'Optional additions, including materials, installation and 21% VAT.' : 'Optionele uitbreidingen, inclusief materiaal, montage en 21% btw.'}</p><div className="grid gap-3 sm:grid-cols-2">{groupOptions.map(o => <label key={o.id} className={choiceClass}><input type="checkbox" checked={options.includes(o.id)} onChange={e => setOptions(previous => e.target.checked ? [...previous, o.id] : previous.filter(id => id !== o.id))} className="size-5 shrink-0 accent-primary" /><span className="min-w-0"><span className="block font-semibold">{o[lang]}</span><span className="text-sm font-bold text-primary">+{groupMoney(o.price, lang)} all-in</span></span></label>)}</div></>}
            {step === 3 && <>
              <p className="font-semibold">{en ? 'Upload a photo of your open fuse box for a fixed-price check.' : 'Upload een foto van je geopende groepenkast voor vaste prijscontrole.'}</p>
              <p className="text-sm text-muted-foreground">{en ? 'Only open the cupboard door. Do not unscrew protective covers or touch wiring.' : 'Open alleen de deur van de meterkast. Schroef geen beschermkappen los en raak geen bedrading aan.'}</p>
              <div className="rounded-lg border-2 border-dashed border-input bg-background p-5 text-center" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); addPhotos(Array.from(e.dataTransfer.files)); }}>
                <Camera className="mx-auto mb-3 size-7 text-primary" /><Button type="button" variant="outline" size="xl" onClick={() => upload.current?.click()}><Camera />{en ? 'Add photos' : 'Foto’s toevoegen'}</Button>
                <input ref={upload} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" tabIndex={-1} aria-label={en ? 'Fuse box photos' : 'Groepenkastfoto’s'} onChange={e => { addPhotos(Array.from(e.target.files ?? [])); e.target.value = ''; }} />
                <p className="mt-3 text-sm text-muted-foreground">{en ? 'Up to 3 photos · JPG, PNG, WebP · 5 MB each' : 'Max. 3 foto’s · JPG, PNG, WebP · 5 MB per foto'}</p>
              </div>
              {!!photos.length && <div className="grid grid-cols-3 gap-2">{photos.map((file, index) => <PhotoPreview key={`${file.name}-${file.lastModified}`} file={file} lang={lang} remove={() => setPhotos(previous => previous.filter((_, i) => i !== index))} />)}</div>}
              <label className="flex min-h-12 cursor-pointer items-start gap-3 text-sm"><input type="checkbox" checked={survey} onChange={e => setSurvey(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-primary" /><span>{en ? `Book a site inspection for ${groupMoney(prices.groepenkastSurvey, lang)}` : `Plan schouw van ${groupMoney(prices.groepenkastSurvey, lang)}`} — {groupSurveyNote[lang]}</span></label>
              <p className="text-sm text-primary">{en ? 'Photo review: usually within 1 hour during opening hours.' : 'Fotocontrole: meestal binnen 1 uur tijdens openingstijden.'}</p>
            </>}
            {step === 4 && <><div className="grid grid-cols-2 gap-3">
              <label className="min-w-0 text-sm font-semibold">{en ? 'Postcode' : 'Postcode'}<input required pattern="[1-9][0-9]{3}\s?[A-Za-z]{2}" maxLength={7} autoComplete="postal-code" value={fields.postalCode} onChange={e => { setField('postalCode', e.target.value.toUpperCase()); setLookup(''); }} onBlur={lookupCity} className={inputClass} /></label>
              <label className="min-w-0 text-sm font-semibold">{en ? 'House number' : 'Huisnummer'}<input required maxLength={18} pattern="[0-9]{1,5}.*" autoComplete="address-line1" value={fields.houseNumber} onChange={e => { setField('houseNumber', e.target.value); setLookup(''); }} onBlur={lookupCity} className={inputClass} /></label>
            </div>{lookup && <p className="text-sm text-muted-foreground" role="status">{lookup}</p>}
              <label className="block text-sm font-semibold">{en ? 'City' : 'Woonplaats'}<input required minLength={2} maxLength={80} autoComplete="address-level2" value={fields.city} onChange={e => setField('city', e.target.value)} className={inputClass} /></label>
              <p className="pt-2 font-semibold">{en ? 'Preferred time' : 'Voorkeursmoment'}</p><div className="grid gap-3 sm:grid-cols-2">{groupMomentIds.map((id, index) => <label key={id} className={choiceClass}><input type="radio" name="moment" required value={id} checked={moment === id} onChange={() => setMoment(id)} className="size-5 shrink-0 accent-primary" /><span className="text-sm font-semibold">{groupMoments[lang][index]}</span></label>)}</div>
              <p className="text-sm text-muted-foreground">{en ? 'This is a preference, not a confirmed appointment.' : 'Dit is een voorkeur, nog geen bevestigde afspraak.'}</p>
            </>}
            {step === 5 && <>{(['name', 'phone', 'email'] as const).map(key => <label key={key} className="block text-sm font-semibold">{{ name: en ? 'Name' : 'Naam', phone: en ? 'Phone' : 'Telefoon', email: 'E-mail' }[key]} *<input required minLength={key === 'name' ? 2 : key === 'phone' ? 8 : undefined} maxLength={key === 'name' ? 80 : key === 'phone' ? 20 : 120} type={key === 'phone' ? 'tel' : key === 'email' ? 'email' : 'text'} autoComplete={key === 'phone' ? 'tel' : key} value={fields[key]} onChange={e => setField(key, e.target.value)} className={inputClass} /></label>)}<p className="text-sm text-muted-foreground">{en ? 'We use these details for your price check and confirmation.' : 'We gebruiken deze gegevens voor je prijscontrole en bevestiging.'}</p></>}
            {step === 6 && <>
              <dl className="divide-y divide-border text-sm">
                <div className="flex justify-between gap-3 py-3"><dt>{en ? 'Package' : 'Pakket'}</dt><dd className="text-right font-semibold">{selected ? `${selected[lang]} · ${selected.circuits} ${en ? 'circuits' : 'groepen'}` : (en ? 'Package to be confirmed' : 'Pakket nog te bepalen')}</dd></div>
                {groupOptions.filter(o => options.includes(o.id)).map(o => <div key={o.id} className="flex justify-between gap-3 py-3"><dt>{o[lang]}</dt><dd className="shrink-0">+{groupMoney(o.price, lang)}</dd></div>)}
                {!options.length && <div className="py-3 text-muted-foreground">{en ? 'No additional options' : 'Geen extra opties'}</div>}
                <div className="py-3"><dt className="font-semibold">{en ? 'Photo / inspection' : 'Foto / schouw'}</dt><dd>{survey ? (en ? 'Site inspection requested' : 'Schouw aangevraagd') : `${photos.length} ${en ? 'photo(s)' : 'foto(’s)'}`}</dd></div>
                <div className="py-3"><dt className="font-semibold">{en ? 'Address & preference' : 'Adres & voorkeur'}</dt><dd>{fields.postalCode} · {fields.houseNumber} · {fields.city}<br />{moment ? groupMoments[lang][groupMomentIds.indexOf(moment)] : ''}</dd></div>
                <div className="break-words py-3"><dt className="font-semibold">{en ? 'Contact details' : 'Contactgegevens'}</dt><dd>{fields.name}<br />{fields.phone}<br />{fields.email}</dd></div>
              </dl>
              <div className="flex flex-wrap gap-2">{steps.slice(0, 5).map((name, index) => <Button type="button" key={name} variant="outline" className="min-h-11" onClick={() => move(index + 1)}>{en ? 'Edit' : 'Wijzig'} {name.toLowerCase()}</Button>)}</div>
              <label className="flex cursor-pointer items-start gap-3 py-3 text-sm"><input type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-1 size-5 shrink-0 accent-primary" /><span>{en ? 'I agree that VoltFix may contact me about this request. The final fixed price is subject to photo review or site inspection.' : 'Ik ga akkoord dat VoltFix contact opneemt over deze aanvraag. De definitieve vaste prijs volgt na foto- of schouwcontrole.'} <a href={en ? '/en-gb/privacy-policy' : '/privacybeleid'} className="text-primary underline">{en ? 'Privacy policy' : 'Privacybeleid'}</a></span></label>
            </>}
            <div className="mt-6 border-t border-border pt-5" aria-live="polite" aria-atomic="true">
              <div className="flex flex-wrap items-baseline justify-between gap-2"><span className="font-semibold">{en ? 'Total guide price' : 'Totale richtprijs'}</span><strong data-testid="group-total" className="text-3xl text-primary">{totals.total === null ? (en ? 'After review' : 'Na controle') : groupMoney(totals.total, lang)}</strong></div>
              {totals.total === null && <p className="mt-2 text-sm text-muted-foreground">{en ? `Packages from ${groupMoney(prices.groepenkastFrom, lang)} · selected options ${groupMoney(totals.extras, lang)}` : `Pakketten vanaf ${groupMoney(prices.groepenkastFrom, lang)} · gekozen opties ${groupMoney(totals.extras, lang)}`}</p>}
              <p className="mt-2 text-sm text-muted-foreground">{en ? 'Includes materials, installation and 21% VAT.' : 'Inclusief materiaal, montage en 21% btw.'}</p>
              <p className="mt-2 text-sm text-muted-foreground">{groupDisclaimer[lang]}</p>
            </div>
            {error && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              {step > 1 && <Button type="button" variant="outline" size="xl" onClick={() => move(step - 1)}><ArrowLeft />{en ? 'Back' : 'Terug'}</Button>}
              <Button type="submit" size="xl" disabled={busy} className="h-auto min-h-12 flex-1 whitespace-normal px-4 py-3 leading-snug">{busy ? <Loader2 className="animate-spin" /> : step === 6 ? <ShieldCheck /> : null}{busy ? (en ? 'Sending…' : 'Versturen…') : step === 6 ? (en ? 'Confirm request & lock in price' : 'Aanvraag bevestigen & prijs vastzetten.') : (en ? 'Continue' : 'Verder')}{step < 6 && <ArrowRight />}</Button>
            </div>
            <p className="text-center text-xs text-muted-foreground">{en ? 'No payment now · final price only after review' : 'Nu geen betaling · definitieve prijs pas na controle'}</p>
          </fieldset>
        </form>
      </>}
    </div>
  </section>;
}
