import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import { CheckCircle2, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { BookingShell } from '@/components/booking/booking-shell';
import { AddressFields, AddressStep } from '@/components/booking/steps/address-step';
import { PlanningPreferenceFields } from '@/components/booking/planning-preference';
import { SummaryRow } from '@/components/booking/summary-row';
import { ContactStep } from '@/components/booking/steps/contact-step';
import { PhotoStep } from '@/components/booking/steps/photo-step';
import { GroepenkastOptionsStep, GroepenkastPackageStep } from '@/components/booking/steps/groepenkast-package';
import { getBookingActive, getBookingActiveServer, getBookingContext, setBookingActive, subscribeBookingActive } from '@/lib/booking-active';
import { getBookingService } from '@/lib/booking/registry';
import { postalArea, trackBooking } from '@/lib/booking/analytics';
import type { BookingContext } from '@/lib/booking/types';
import { groupBookingSchema, groupDisclaimer, groupMoney, groupOptions, groupPackages, groupPhotoLater, groupTotal, type GroupLocale, type OptionId, type PackageId } from '@/lib/groepenkast';
import { appointmentPurposeFor, emptyPlanning, normalisePlanning, planningError, planningPreferenceSchema, planningSummary, type PlanningPreference } from '@/lib/booking/planning';
import { prices } from '@/lib/pricing';
import { priceCatalogVersion } from '@/lib/booking/activation';
import { mountInvisibleTurnstile, turnstileEnabled } from '@/lib/turnstile';
import { isBlockedPhoneRegion } from '@/lib/phone-region';
import { trackLeadSuccess } from '@/lib/analytics';
import { telHref, whatsappHref } from '@/lib/business';

const service = getBookingService('groepenkast');

/** Onderdelen die vanaf het overzicht inline bewerkt kunnen worden. */
type EditorId = 'package' | 'options' | 'photo' | 'address' | 'planning' | 'contact';
type EditorSnapshot = {
  packageId: PackageId | '';
  options: OptionId[];
  photos: File[];
  survey: boolean;
  later: boolean;
  fields: { postalCode: string; houseNumber: string; street: string; city: string; name: string; phone: string; email: string; hp: string };
  planning: PlanningPreference;
};

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
  const [planning, setPlanning] = useState<PlanningPreference>(emptyPlanning);
  const [planningIssue, setPlanningIssue] = useState('');
  const [routeNotice, setRouteNotice] = useState('');
  const [confirmedAddress, setConfirmedAddress] = useState<{ key: string; street: string; city: string } | null>(null);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [lookup, setLookup] = useState('');
  // Prijswijziging tijdens een openstaande aanvraag: nieuwe prijs tonen en om
  // een expliciete herbevestiging vragen. Alle invoer blijft staan.
  const [priceChange, setPriceChange] = useState<{ total: number | null } | null>(null);
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
  // Idempotentiesleutel per verzendpoging: dubbelklikken, een timeout of een
  // netwerkfout levert dezelfde aanvraag op in plaats van een duplicaat.
  const idempotencyKey = useRef('');
  // Inline bewerken vanaf het overzicht: maximaal één onderdeel tegelijk open,
  // met een momentopname zodat 'Annuleren' de vorige waarden herstelt.
  const [editing, setEditing] = useState<EditorId | null>(null);
  const [editError, setEditError] = useState('');
  const snapshot = useRef<EditorSnapshot | null>(null);
  const editRefs = {
    package: useRef<HTMLButtonElement>(null),
    options: useRef<HTMLButtonElement>(null),
    photo: useRef<HTMLButtonElement>(null),
    address: useRef<HTMLButtonElement>(null),
    planning: useRef<HTMLButtonElement>(null),
    contact: useRef<HTMLButtonElement>(null),
  } as const;



  const photoRoute = survey ? 'survey' : later ? 'later' : 'photo';
  // Het doel van de afspraak volgt uit de route: schouw of installatie.
  const purpose = appointmentPurposeFor(photoRoute);
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
  // Concept met alleen niet-persoonlijke keuzes (pakket, opties, route, planningsvoorkeur).
  useEffect(() => {
    try {
      const stored = localStorage.getItem('voltfix-groepenkast-draft');
      if (!stored) return;
      const draft = JSON.parse(stored) as { packageId?: PackageId; options?: OptionId[]; route?: string; planning?: unknown };
      if (draft.packageId && !packageId) setPackageId(draft.packageId);
      if (Array.isArray(draft.options)) setOptions(draft.options);
      if (draft.route === 'later') setLater(true);
      if (draft.route === 'survey') setSurvey(true);
      // Een verlopen datum uit een oud concept mag niet stil terugkomen.
      const restored = planningPreferenceSchema.safeParse(draft.planning);
      if (restored.success) setPlanning(restored.data);
    } catch { /* concept negeren */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (done) { localStorage.removeItem('voltfix-groepenkast-draft'); return; }
    try { localStorage.setItem('voltfix-groepenkast-draft', JSON.stringify({ packageId, options, route: photoRoute, planning })); } catch { /* opslag vol */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packageId, options, photoRoute, planning, done]);
  useEffect(() => { if (surveyRequest > 0) { setSurvey(true); setLater(false); } }, [surveyRequest]);
  // Routewissel installatie <-> schouw verandert de betekenis van de datum. Een
  // eerder gekozen installatiedatum gaat daarom niet stil mee als schouwdatum.
  const lastPurpose = useRef(purpose);
  useEffect(() => {
    if (lastPurpose.current === purpose) return;
    lastPurpose.current = purpose;
    setPlanning(previous => {
      if (previous.kind !== 'specific_date') return previous;
      setRouteNotice(purpose === 'survey'
        ? (en ? 'Your date was for the installation. Choose a new date for the site inspection, or leave it to be arranged.' : 'Je datum gold voor de installatie. Kies een nieuwe datum voor de schouw of laat de planning in overleg.')
        : (en ? 'Your date was for the site inspection. Choose a new date for the installation, or leave it to be arranged.' : 'Je datum gold voor de schouw. Kies een nieuwe datum voor de installatie of laat de planning in overleg.'));
      return { ...emptyPlanning };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purpose]);
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
  /** Opent één onderdeel inline; een tweede potlood wacht op opslaan of annuleren. */
  function openEditor(id: EditorId) {
    if (editing === id) return;
    if (editing) {
      setEditError(en ? 'Save or cancel your current change first.' : 'Sla je huidige wijziging eerst op of annuleer die.');
      return;
    }
    snapshot.current = { packageId, options: [...options], photos: [...photos], survey, later, fields: { ...fields }, planning: { ...planning } };
    setError('');
    setEditError('');
    setEditing(id);
  }
  function closeEditor(id: EditorId) {
    const button = editRefs[id].current;
    snapshot.current = null;
    setEditing(null);
    setEditError('');
    requestAnimationFrame(() => { button?.focus({ preventScroll: true }); button?.scrollIntoView({ block: 'nearest' }); });
  }
  function cancelEditor() {
    const previous = snapshot.current;
    const id = editing;
    if (previous) {
      if (previous.packageId && previous.packageId !== packageId) setPackageId(previous.packageId);
      setOptions(previous.options);
      setPhotos(previous.photos);
      setSurvey(previous.survey);
      setLater(previous.later);
      setFields(previous.fields);
      setPlanning(previous.planning);
    }
    setPlanningIssue('');
    setRouteNotice('');
    if (id) closeEditor(id);
  }
  /** Valideert alleen het geopende onderdeel; afhankelijke prijzen volgen uit de state. */
  function saveEditor(id: EditorId) {
    let issue = '';
    if (id === 'package' && !packageId) issue = en ? 'Choose a package or the photo-check option.' : 'Kies een pakket of de optie voor fotocontrole.';
    if (id === 'photo' && !photos.length && !survey && !later) issue = en ? 'Add a photo, send it later via WhatsApp, or choose a site inspection.' : 'Voeg een foto toe, stuur hem later via WhatsApp of kies een schouw.';
    if (id === 'address') {
      const address = groupBookingSchema.safeParse({ packageId: packageId || 'unknown', optionIds: options, photoReview: photoRoute, postalCode: fields.postalCode, houseNumber: fields.houseNumber, street: fields.street, city: fields.city, planning: emptyPlanning });
      if (!address.success) issue = en ? 'Check your postcode, house number, street and city.' : 'Controleer je postcode, huisnummer, straat en woonplaats.';
    }
    if (id === 'planning') issue = planningError(planning, lang);
    if (id === 'contact' && (fields.name.trim().length < 2 || !/^[0-9+()\s-]{8,20}$/.test(fields.phone) || isBlockedPhoneRegion(fields.phone) || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fields.email))) {
      issue = en ? 'Check your name, phone number and email address.' : 'Controleer je naam, telefoonnummer en e-mailadres.';
    }
    if (issue) { setEditError(issue); return; }
    closeEditor(id);
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
  /**
   * Grote telefoonfoto's worden in de browser verkleind naar maximaal 2000px.
   * Lukt dat niet (bijvoorbeeld HEIC uit iOS), dan gaat het origineel mee: de
   * server accepteert HEIC/HEIF tot 20 MB.
   */
  async function shrinkPhoto(file: File): Promise<File> {
    if (file.size <= 2 * 1024 * 1024) return file;
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const context = canvas.getContext('2d');
      if (!context) return file;
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.82));
      if (!blob || blob.size >= file.size) return file;
      return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg', lastModified: file.lastModified });
    } catch { return file; }
  }
  async function addPhotos(input: File[]) {
    setError('');
    const files = await Promise.all(input.map(shrinkPhoto));
    const next = [...photos];
    let added = 0;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    for (const file of files) {
      if (!allowed.includes(file.type.toLowerCase()) || file.size > 20 * 1024 * 1024 || file.size === 0) {
        setError(en ? 'Choose JPG, PNG, WebP or iPhone (HEIC) photos, up to 20 MB each.' : 'Kies JPG-, PNG-, WebP- of iPhone-foto’s (HEIC) van maximaal 20 MB per foto.'); continue;
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
    if (editing) { setError(en ? 'Save or cancel your open change first.' : 'Sla je open wijziging eerst op of annuleer die.'); return; }
    if (priceChange && step === steps.length) { setError(en ? 'Confirm the new price first.' : 'Bevestig eerst de nieuwe prijs.'); return; }
    setError('');
    if (step === 1 && !packageId) { setError(en ? 'Choose a package or the photo-check option.' : 'Kies een pakket of de optie voor fotocontrole.'); return; }
    if (step === 3 && !photos.length && !survey && !later) { setError(en ? 'Add a photo, send it later via WhatsApp, or choose a site inspection.' : 'Voeg een foto toe, stuur hem later via WhatsApp of kies een schouw.'); return; }
    if (step === 5 && (fields.name.trim().length < 2 || !/^[0-9+()\s-]{8,20}$/.test(fields.phone) || isBlockedPhoneRegion(fields.phone))) {
      setError(en ? 'Check your name and phone number.' : 'Controleer je naam en telefoonnummer.'); return;
    }
    // Planning is een voorkeur: 'In overleg' en 'Zo snel mogelijk' zijn geldig.
    // Alleen een gekozen datumroute moet volledig zijn.
    const planningIssueText = planningError(planning, lang);
    if (step === 4 && planningIssueText) {
      setPlanningIssue(planningIssueText);
      requestAnimationFrame(() => document.querySelector<HTMLElement>('input[type="date"]')?.focus());
      return;
    }
    if (step < steps.length) { trackBooking('booking_step_completed', { ...eventBase(), step, stepId: service.steps[step - 1] }); move(step + 1); return; }
    if (planningIssueText) { setError(planningIssueText); move(4); return; }
    const result = groupBookingSchema.safeParse({ packageId, optionIds: options, photoReview: photoRoute, postalCode: fields.postalCode, houseNumber: fields.houseNumber, street: fields.street, city: fields.city, planning: normalisePlanning(planning) });
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
      body.append('bookingService', service.id);
      if (context.initialIntent) body.append('bookingIntent', context.initialIntent);
      if (payload.bookingField) body.append(payload.bookingField.name, JSON.stringify(payload.bookingField.value));
      body.append('message', payload.message);
      body.append('turnstileToken', turnstileToken);
      if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID().replace(/-/g, '');
      body.append('idempotencyKey', idempotencyKey.current);
      body.append('catalogVersion', priceCatalogVersion);
      for (const photo of photos) body.append('attachments', photo);
      const response = await fetch('/api/public/quote-request', { method: 'POST', body });
      const data = await response.json();
      // 409: dezelfde sleutel met gewijzigde gegevens. Een nieuwe sleutel maakt
      // een gecontroleerde tweede poging mogelijk, zonder stille overschrijving.
      if (response.status === 409) idempotencyKey.current = '';
      if (response.status === 409 && data.code === 'price_changed') {
        setPriceChange({ total: data.price?.totalEur ?? null });
        setError(data.error);
        return;
      }
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
          planning={planning}
          setPlanning={next => { setPlanning(next); setPlanningIssue(''); setRouteNotice(''); }}
          purpose={purpose}
          planningIssue={planningIssue}
          routeNotice={routeNotice}
        />}
        {step === 5 && <ContactStep lang={lang} values={fields} setField={setField} />}
        {step === 6 && <>
          <dl className="min-w-0 divide-y divide-border">
            <SummaryRow
              lang={lang}
              label={en ? 'Package' : 'Pakket'}
              value={selected ? `${selected[lang]} · ${selected.circuits} ${en ? 'circuits' : 'groepen'} · ${groupMoney(selected.price, lang)}` : (en ? 'Package to be confirmed after photo review' : 'Pakket nog te bepalen na fotocontrole')}
              editLabel={en ? 'Change package' : 'Pakket wijzigen'}
              open={editing === 'package'}
              onEdit={() => openEditor('package')}
              onSave={() => saveEditor('package')}
              onCancel={cancelEditor}
              buttonRef={editRefs.package}
              error={editing === 'package' ? editError : ''}
            >
              <GroepenkastPackageStep lang={lang} packageId={packageId} setPackageId={setPackageId} />
            </SummaryRow>
            <SummaryRow
              lang={lang}
              label={en ? 'Options' : 'Opties'}
              value={options.length
                ? groupOptions.filter(o => options.includes(o.id)).map(o => `${o[lang]} +${groupMoney(o.price, lang)}`).join(' · ')
                : (en ? 'No additional options' : 'Geen extra opties')}
              editLabel={en ? 'Change options' : 'Opties wijzigen'}
              open={editing === 'options'}
              onEdit={() => openEditor('options')}
              onSave={() => saveEditor('options')}
              onCancel={cancelEditor}
              buttonRef={editRefs.options}
              error={editing === 'options' ? editError : ''}
            >
              <GroepenkastOptionsStep lang={lang} options={options} toggle={(id, checked) => setOptions(previous => checked ? [...previous, id] : previous.filter(current => current !== id))} />
            </SummaryRow>
            <SummaryRow
              lang={lang}
              label={en ? 'Photo / inspection' : 'Foto / schouw'}
              value={survey
                ? (en ? `Site inspection ${groupMoney(prices.groepenkastSurvey, lang)}, deducted from the final quote if you approve the work.` : `Schouw ${groupMoney(prices.groepenkastSurvey, lang)}, volledig verrekend bij akkoord`)
                : later ? `${groupPhotoLater[lang].choice} — ${groupPhotoLater[lang].summary}` : `${photos.length} ${en ? 'photo(s)' : 'foto(’s)'}`}
              editLabel={en ? 'Change photo or inspection' : 'Foto of schouw wijzigen'}
              open={editing === 'photo'}
              onEdit={() => openEditor('photo')}
              onSave={() => saveEditor('photo')}
              onCancel={cancelEditor}
              buttonRef={editRefs.photo}
              error={editing === 'photo' ? editError : ''}
            >
              <PhotoStep
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
              />
            </SummaryRow>
            <SummaryRow
              lang={lang}
              label={en ? 'Address' : 'Adres'}
              value={<>{fields.street} {fields.houseNumber}<br />{fields.postalCode} · {fields.city}</>}
              editLabel={en ? 'Change address' : 'Adres wijzigen'}
              open={editing === 'address'}
              onEdit={() => openEditor('address')}
              onSave={() => saveEditor('address')}
              onCancel={cancelEditor}
              buttonRef={editRefs.address}
              error={editing === 'address' ? editError : ''}
            >
              <AddressFields lang={lang} fields={fields} setField={setField} onLookup={lookupCity} lookup={lookup} confirmed={confirmedAddress} />
            </SummaryRow>
            <SummaryRow
              lang={lang}
              label={en ? 'Planning preference' : 'Planningsvoorkeur'}
              value={<>{planningSummary(normalisePlanning(planning), purpose, lang)}{routeNotice && <span className="mt-1 block text-foreground">{routeNotice}</span>}</>}
              editLabel={en ? 'Change planning preference' : 'Planningsvoorkeur wijzigen'}
              open={editing === 'planning'}
              onEdit={() => openEditor('planning')}
              onSave={() => saveEditor('planning')}
              onCancel={cancelEditor}
              buttonRef={editRefs.planning}
              error={editing === 'planning' ? editError : ''}
            >
              <PlanningPreferenceFields
                lang={lang}
                planning={planning}
                setPlanning={next => { setPlanning(next); setPlanningIssue(''); setRouteNotice(''); setEditError(''); }}
                purpose={purpose}
                routeNotice={routeNotice}
              />
            </SummaryRow>
            <SummaryRow
              lang={lang}
              label={en ? 'Contact details' : 'Contactgegevens'}
              value={<>{fields.name}<br />{fields.phone}<br />{fields.email}</>}
              editLabel={en ? 'Change contact details' : 'Contactgegevens wijzigen'}
              open={editing === 'contact'}
              onEdit={() => openEditor('contact')}
              onSave={() => saveEditor('contact')}
              onCancel={cancelEditor}
              buttonRef={editRefs.contact}
              error={editing === 'contact' ? editError : ''}
            >
              <ContactStep lang={lang} values={fields} setField={setField} />
            </SummaryRow>
          </dl>
          {editing && <p role="status" className="rounded-md border border-primary/40 bg-primary/5 p-3 text-sm">{en ? 'Save or cancel your change to complete the request.' : 'Sla je wijziging op of annuleer die om de aanvraag af te ronden.'}</p>}
          {!editing && editError && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{editError}</p>}
          <label className="flex cursor-pointer items-start gap-3 pt-1 text-sm"><input type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-primary" /><span className="min-w-0">{en ? 'I agree that VoltFix may contact me about this request. The final fixed price is subject to photo review or site inspection.' : 'Ik ga akkoord dat VoltFix contact opneemt over deze aanvraag. De definitieve vaste prijs volgt na foto- of schouwcontrole.'} <a href={en ? '/en-gb/privacy-policy' : '/privacybeleid'} className="text-primary underline">{en ? 'Privacy policy' : 'Privacybeleid'}</a></span></label>
        </>}
        {step !== 6 && <div className="rounded-md border border-border bg-muted/40 p-3"><p className="text-sm text-muted-foreground">{groupDisclaimer[lang]}</p></div>}

        {priceChange && <div role="alert" className="rounded-md border border-primary/40 bg-primary/5 p-3 text-sm">
          <p className="font-semibold">{en ? 'The price has changed' : 'De prijs is gewijzigd'}</p>
          <p className="mt-1">{priceChange.total === null ? (en ? 'Your new price follows after photo or site inspection.' : 'Je nieuwe prijs volgt na foto- of schouwcontrole.') : `${en ? 'New total' : 'Nieuw totaal'}: ${groupMoney(priceChange.total, lang)}`}</p>
          <Button type="button" variant="outline" className="mt-3 min-h-11" onClick={() => { setPriceChange(null); setError(''); }}>{en ? 'Confirm new price' : 'Bevestig nieuwe prijs'}</Button>
        </div>}
        {error && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
      </fieldset>
    </form>}
  </BookingShell>;
}
