import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import { CheckCircle2, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { BookingShell } from '@/components/booking/booking-shell';
import { AddressStep, displayDate } from '@/components/booking/steps/address-step';
import { ContactStep } from '@/components/booking/steps/contact-step';
import { PhotoStep } from '@/components/booking/steps/photo-step';
import { GroepenkastOptionsStep, GroepenkastPackageStep } from '@/components/booking/steps/groepenkast-package';
import { getBookingActive, getBookingActiveServer, getBookingContext, setBookingActive, subscribeBookingActive } from '@/lib/booking-active';
import { getBookingService } from '@/lib/booking/registry';
import { postalArea, trackBooking } from '@/lib/booking/analytics';
import type { BookingContext } from '@/lib/booking/types';
import { groupBookingSchema, groupDisclaimer, groupMomentIds, groupMoments, groupMoney, groupOptions, groupPackages, groupPhotoLater, groupTotal, type GroupLocale, type OptionId, type PackageId } from '@/lib/groepenkast';
import { prices } from '@/lib/pricing';
import { mountInvisibleTurnstile, turnstileEnabled } from '@/lib/turnstile';
import { isBlockedPhoneRegion } from '@/lib/phone-region';
import { trackLeadSuccess } from '@/lib/analytics';
import { telHref, whatsappHref } from '@/lib/business';

const service = getBookingService('groepenkast');

/**
 * Groepenkast-instantie van de centrale booking-engine: deze component
 * bewaart de flowstate en zet gedeelde stappen (foto, adres, contact,
 * overzicht) samen met de dienstspecifieke stappen (pakket, opties) in de
 * gedeelde `BookingShell`.
 */
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
  const totals = groupTotal(packageId || 'unknown', options);
  const selected = groupPackages.find(p => p.id === packageId);
  const steps = service.stepLabels(lang);
  const ctaLabels = service.stepCta(lang);
  const heading = useRef<HTMLHeadingElement>(null);
  const widget = useRef<HTMLDivElement>(null);
  const token = useRef<(() => Promise<string>) | null>(null);
  const submitting = useRef(false);
  const content = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const submitted = useRef(false);

  const photoRoute = survey ? 'survey' : later ? 'later' : 'photo';
  const bookingState = { packageId: packageId || 'unknown', optionIds: options, photoRoute, photoCount: photos.length } as const;
  const status = service.status(bookingState, lang);
  const successCopy = service.successCopy(bookingState, lang);
  const context: BookingContext = getBookingContext() ?? {
    initialService: 'groepenkast',
    initialIntent: 'price',
    sourcePage: typeof window === 'undefined' ? undefined : window.location.pathname,
  };
  const eventBase = () => ({
    service: 'groepenkast' as const,
    intent: context.initialIntent,
    sourcePage: context.sourcePage,
    estimatedPrice: totals.total,
    status,
    route: photoRoute,
    postalArea: postalArea(fields.postalCode),
  });

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
  useEffect(() => {
    if (!open) return;
    if (started.current) return;
    started.current = true;
    submitted.current = false;
    trackBooking('booking_started', eventBase());
    trackBooking('service_selected', eventBase());
    if (context.initialIntent) trackBooking('intent_selected', eventBase());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  useEffect(() => {
    if (open || !started.current) return;
    started.current = false;
    if (!submitted.current) trackBooking('booking_abandoned', { ...eventBase(), step, stepId: service.steps[step - 1] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() { if (!busy) setBookingActive(false); }
  function move(next: number) {
    setStep(next);
    requestAnimationFrame(() => {
      content.current?.scrollTo({ top: 0, behavior: 'instant' });
      heading.current?.focus({ preventScroll: true });
    });
  }
  const setField = (key: keyof typeof fields, value: string) => {
    if (key === 'postalCode' || key === 'houseNumber') { setLookup(''); setConfirmedAddress(null); }
    setFields(previous => ({ ...previous, [key]: value }));
  };
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
        return { ...previous, street: doc.straatnaam, city: doc.woonplaatsnaam };
      });
      setConfirmedAddress({ key: lookupKey, street: doc.straatnaam, city: doc.woonplaatsnaam });
      setLookup(en ? 'Address found.' : 'Adres gevonden.');
    } catch { setConfirmedAddress(null); setLookup(en ? 'Enter your street and city below.' : 'Vul hieronder je straat en woonplaats in.'); }
  }
  function addPhotos(files: File[]) {
    setError('');
    const next = [...photos];
    let added = 0;
    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024 || file.size === 0) {
        setError(en ? 'Choose JPG, PNG or WebP photos, up to 5 MB each.' : 'Kies JPG-, PNG- of WebP-foto’s van maximaal 5 MB per foto.'); continue;
      }
      if (next.some(p => p.name === file.name && p.size === file.size && p.lastModified === file.lastModified)) continue;
      if (next.length >= 3) { setError(en ? 'You can add up to 3 photos.' : 'Je kunt maximaal 3 foto’s toevoegen.'); break; }
      next.push(file); added += 1;
    }
    setPhotos(next);
    if (next.length) { setSurvey(false); setLater(false); }
    if (added > 0) trackBooking('photo_added', { ...eventBase(), step, stepId: 'photo' });
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
    if (step < steps.length) { trackBooking('booking_step_completed', { ...eventBase(), step, stepId: service.steps[step - 1] }); move(step + 1); return; }
    const result = groupBookingSchema.safeParse({ packageId, optionIds: options, photoReview: photoRoute, postalCode: fields.postalCode, houseNumber: fields.houseNumber, street: fields.street, city: fields.city, preferredDate, preferredMoment: moment });
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
      const payload = service.payload(result.data, lang);
      const body = new FormData();
      for (const key of ['name', 'phone', 'email', 'postalCode', 'hp'] as const) body.append(key, fields[key].trim());
      body.append('locale', lang);
      body.append('sourcePath', window.location.pathname);
      body.append('jobType', payload.jobType);
      if (payload.bookingField) body.append(payload.bookingField.name, JSON.stringify(payload.bookingField.value));
      body.append('message', payload.message);
      body.append('turnstileToken', turnstileToken);
      for (const photo of photos) body.append('attachments', photo);
      const response = await fetch('/api/public/quote-request', { method: 'POST', body });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || (en ? 'Sending failed. Please try again.' : 'Versturen mislukt. Probeer opnieuw.'));
      submitted.current = true;
      trackBooking('lead_submitted', { ...eventBase(), step, stepId: 'summary' });
      if (data.id) trackLeadSuccess({ type: 'schedule', leadId: String(data.id), language: lang, pagePath: window.location.pathname, location: 'groepenkast-booking' });
      setDone(true);
      requestAnimationFrame(() => document.getElementById('group-success')?.focus());
    } catch (err) { setError(err instanceof Error ? err.message : (en ? 'Sending failed. Your details have been kept; please try again.' : 'Versturen mislukt. Je gegevens zijn bewaard; probeer opnieuw.')); }
    finally { submitting.current = false; setBusy(false); }
  }

  const whatsappMessage = en ? 'Hi VoltFix, I would like to send my fuse box photo for my price check.' : 'Hallo VoltFix, ik wil mijn groepenkastfoto sturen voor mijn prijscontrole.';
  const needsPackage = step === 1 && !packageId;

  return <BookingShell
    open={open}
    onOpenChange={next => { if (!next) close(); }}
    lang={lang}
    sectionId="installatiemoment"
    sectionLabel={en ? 'Fuse box price calculation' : 'Groepenkast prijsberekening'}
    title={done ? (en ? 'Request received' : 'Aanvraag ontvangen') : (en ? 'Calculate my fixed price' : 'Bereken mijn vaste prijs')}
    subtitle={done ? (en ? 'Price check to follow' : 'Prijscontrole volgt') : `${step}/${steps.length} ${steps[step - 1]}`}
    steps={steps}
    step={step}
    done={done}
    busy={busy}
    status={status}
    ctaLabel={ctaLabels[step - 1]}
    blockedLabel={needsPackage ? (en ? 'Choose a package first' : 'Kies eerst een pakket') : undefined}
    formId="group-booking-form"
    contentRef={content}
    headingRef={heading}
    widgetRef={widget}
    onBack={() => move(step - 1)}
    doneFooter={<Button type="button" size="xl" className="w-full" onClick={close}>{en ? 'Back to page' : 'Terug naar pagina'}</Button>}
  >
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
        <h2 ref={heading} tabIndex={-1} className="text-xl font-bold outline-none">{step}/{steps.length} · {steps[step - 1]}</h2>
        <input name="website" tabIndex={-1} autoComplete="off" value={fields.hp} onChange={e => setField('hp', e.target.value)} className="hidden" aria-hidden="true" />
        {step === 1 && <GroepenkastPackageStep lang={lang} packageId={packageId} setPackageId={setPackageId} />}
        {step === 2 && <GroepenkastOptionsStep lang={lang} options={options} toggle={(id, checked) => setOptions(previous => checked ? [...previous, id] : previous.filter(current => current !== id))} />}
        {step === 3 && <PhotoStep
          lang={lang}
          instructions={service.photo!.instructions(lang)}
          photos={photos}
          addPhotos={addPhotos}
          removePhoto={index => setPhotos(previous => previous.filter((_, i) => i !== index))}
          later={later}
          survey={survey}
          chooseLater={() => { setLater(true); setSurvey(false); setPhotos([]); }}
          chooseSurvey={() => { setSurvey(true); setLater(false); setPhotos([]); }}
          allowLater={service.photo!.allowLater}
          allowSurvey={service.photo!.allowSurvey}
          surveyFee={service.photo!.surveyFee}
        />}
        {step === 4 && <AddressStep
          lang={lang}
          fields={fields}
          setField={setField}
          onLookup={lookupCity}
          lookup={lookup}
          confirmed={confirmedAddress}
          preferredDate={preferredDate}
          setPreferredDate={setPreferredDate}
          calendarOpen={calendarOpen}
          setCalendarOpen={setCalendarOpen}
          moment={moment}
          setMoment={setMoment}
        />}
        {step === 5 && <ContactStep lang={lang} values={fields} setField={setField} />}
        {step === 6 && <>
          <dl className="divide-y divide-border text-sm">
            <div className="flex justify-between gap-3 py-3"><dt>{en ? 'Package' : 'Pakket'}</dt><dd className="text-right font-semibold">{selected ? `${selected[lang]} · ${selected.circuits} ${en ? 'circuits' : 'groepen'}` : (en ? 'Package to be confirmed' : 'Pakket nog te bepalen')}</dd></div>
            {groupOptions.filter(o => options.includes(o.id)).map(o => <div key={o.id} className="flex justify-between gap-3 py-3"><dt>{o[lang]}</dt><dd className="shrink-0 tabular-nums">+{groupMoney(o.price, lang)}</dd></div>)}
            {!options.length && <div className="py-3 text-muted-foreground">{en ? 'No additional options' : 'Geen extra opties'}</div>}
            <div className="py-3"><dt className="font-semibold">{en ? 'Photo / inspection' : 'Foto / schouw'}</dt><dd>{survey ? (en ? `Site inspection ${groupMoney(prices.groepenkastSurvey, lang)}, deducted from the final quote if you approve the work.` : `Schouw ${groupMoney(prices.groepenkastSurvey, lang)}, volledig verrekend bij akkoord`) : later ? `${groupPhotoLater[lang].choice} — ${groupPhotoLater[lang].summary}` : `${photos.length} ${en ? 'photo(s)' : 'foto(’s)'}`}</dd></div>
            <div className="py-3"><dt className="font-semibold">{en ? 'Address & preference' : 'Adres & voorkeur'}</dt><dd>{fields.street} {fields.houseNumber}<br />{fields.postalCode} · {fields.city}<br />{displayDate(preferredDate)} · {moment ? groupMoments[lang][groupMomentIds.indexOf(moment)] : ''}</dd></div>
            <div className="break-words py-3"><dt className="font-semibold">{en ? 'Contact details' : 'Contactgegevens'}</dt><dd>{fields.name}<br />{fields.phone}<br />{fields.email}</dd></div>
          </dl>
          <div className="flex flex-wrap gap-2">{steps.slice(0, 5).map((name, index) => <Button type="button" key={name} variant="outline" className="min-h-11" onClick={() => move(index + 1)}>{en ? 'Edit' : 'Wijzig'} {name.toLowerCase()}</Button>)}</div>
          <label className="flex cursor-pointer items-start gap-3 py-3 text-sm"><input type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-1 size-5 shrink-0 accent-primary" /><span>{en ? 'I agree that VoltFix may contact me about this request. The final fixed price is subject to photo review or site inspection.' : 'Ik ga akkoord dat VoltFix contact opneemt over deze aanvraag. De definitieve vaste prijs volgt na foto- of schouwcontrole.'} <a href={en ? '/en-gb/privacy-policy' : '/privacybeleid'} className="text-primary underline">{en ? 'Privacy policy' : 'Privacybeleid'}</a></span></label>
        </>}
        <div className="rounded-md border border-border bg-muted/40 p-3"><p className="text-sm text-muted-foreground">{groupDisclaimer[lang]}</p></div>
        {error && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
      </fieldset>
    </form>}
  </BookingShell>;
}
