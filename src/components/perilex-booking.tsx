import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CheckCircle2, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookingShell } from '@/components/booking/booking-shell';
import { AddressFields, AddressStep } from '@/components/booking/steps/address-step';
import { PlanningPreferenceFields } from '@/components/booking/planning-preference';
import { ContactStep } from '@/components/booking/steps/contact-step';
import { PerilexAttachmentsStep } from '@/components/booking/steps/perilex-attachments';
import { attachmentRulesFor, normaliseDeclaredMime, type AttachmentCategory } from '@/lib/booking/attachments';
import { clientPreCheck, downscaleImage, uploadAttachment, type AttachmentItem } from '@/lib/booking/attachment-upload';
import { SummaryRow } from '@/components/booking/summary-row';
import { PerilexIntakeStep } from '@/components/booking/steps/perilex-intake';
import { getBookingService } from '@/lib/booking/registry';
import { postalArea, trackBooking } from '@/lib/booking/analytics';
import { priceCatalogVersionFor } from '@/lib/booking/pricing-catalog';
import {
  derivePerilexBookingResult,
  emptyPerilexAnswers,
  normalisePerilexAnswers,
  perilexAvailabilityNote,
  perilexDeductibleNote,
  perilexMoney,
  perilexStatusLabel,
  type PerilexAnswers,
} from '@/lib/booking/perilex-routing';
import {
  appointmentPurposeFor,
  emptyPlanning,
  normalisePlanning,
  planningError,
  planningPreferenceSchema,
  planningSummary,
  type PlanningPreference,
} from '@/lib/booking/planning';
import type { GroupLocale } from '@/lib/groepenkast';
import { isBlockedPhoneRegion } from '@/lib/phone-region';
import { telHref, whatsappHref } from '@/lib/business';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';

const service = getBookingService('perilex');
const DRAFT_KEY = 'voltfix-perilex-draft';

type EditorId = 'intake' | 'photo' | 'address' | 'planning' | 'contact';

/**
 * Perilex-instantie van de centrale booking-engine.
 *
 * De dienst staat op `enabled: false`: deze component is nog nergens op de site
 * gemount en de server weigert de aanvraag via de activatiecontrole. Route,
 * prijsstatus en prijsregel komen uitsluitend uit `derivePerilexBookingResult`.
 */
export function PerilexBooking({ lang, open, onClose, sourcePage }: {
  lang: GroupLocale;
  open: boolean;
  onClose: () => void;
  sourcePage?: string;
}) {
  const en = lang === 'en';
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<PerilexAnswers>(emptyPerilexAnswers);
  const [callbackRequested, setCallbackRequested] = useState(false);
  const [items, setItems] = useState<AttachmentItem[]>([]);
  const [uploadIssue, setUploadIssue] = useState('');
  const [later, setLater] = useState(false);
  const [customerNote, setCustomerNote] = useState('');
  const [fields, setFields] = useState({ postalCode: '', houseNumber: '', street: '', city: '', name: '', phone: '', email: '', hp: '' });
  const [planning, setPlanning] = useState<PlanningPreference>(emptyPlanning);
  const [planningIssue, setPlanningIssue] = useState('');
  const [confirmedAddress, setConfirmedAddress] = useState<{ key: string; street: string; city: string } | null>(null);
  const [lookup, setLookup] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [editing, setEditing] = useState<EditorId | null>(null);
  const [editError, setEditError] = useState('');

  const heading = useRef<HTMLHeadingElement>(null);
  const widget = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const submitting = useRef(false);
  const started = useRef(false);
  const submitted = useRef(false);
  const idempotencyKey = useRef('');
  const itemsRef = useRef<AttachmentItem[]>([]);
  const draftId = useRef('');
  const editRefs = {
    intake: useRef<HTMLButtonElement>(null),
    photo: useRef<HTMLButtonElement>(null),
    address: useRef<HTMLButtonElement>(null),
    planning: useRef<HTMLButtonElement>(null),
    contact: useRef<HTMLButtonElement>(null),
  } as const;

  const result = derivePerilexBookingResult(answers);
  const steps = service.stepLabels(lang);
  const ctaLabels = service.stepCta(lang);
  const status = perilexStatusLabel(result, lang);
  const purpose = appointmentPurposeFor(result.route === 'site_survey' ? 'survey' : 'photo');
  const photoRoute = items.length ? 'photo' : later ? 'later' : 'none';

  const eventBase = () => ({
    service: 'perilex' as const,
    sourcePage,
    estimatedPrice: result.amountExVatCents === null ? null : result.amountExVatCents / 100,
    status,
    route: result.route ?? 'incomplete',
    postalArea: postalArea(fields.postalCode),
    priceStatus: result.priceStatus,
    priceRuleId: result.priceRuleId,
    answers: {
      intent: answers.intent,
      preparation: answers.preparation ?? null,
      urgency: answers.urgency ?? null,
      review_choice: answers.reviewChoice ?? null,
      issue_type: answers.issueType ?? null,
    },
  });

  /* ---------------------------------------------------------------------- */
  /* Concept: alleen niet-persoonlijke keuzes                                */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (!stored) return;
      const draft = JSON.parse(stored) as { answers?: unknown; callbackRequested?: boolean; planning?: unknown };
      setAnswers(normalisePerilexAnswers(draft.answers as PerilexAnswers | undefined));
      if (typeof draft.callbackRequested === 'boolean') setCallbackRequested(draft.callbackRequested);
      const restored = planningPreferenceSchema.safeParse(draft.planning);
      if (restored.success) setPlanning(restored.data);
    } catch { /* concept negeren */ }
  }, []);
  useEffect(() => {
    if (done) { localStorage.removeItem(DRAFT_KEY); return; }
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ answers, callbackRequested, planning })); } catch { /* opslag vol */ }
  }, [answers, callbackRequested, planning, done]);

  useEffect(() => { setError(''); }, [step]);
  useEffect(() => {
    if (!open || started.current) return;
    started.current = true;
    submitted.current = false;
    trackBooking('booking_started', eventBase());
    trackBooking('service_selected', eventBase());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  useEffect(() => {
    if (open || !started.current) return;
    started.current = false;
    if (!submitted.current) trackBooking('booking_abandoned', { ...eventBase(), step, stepId: service.steps[step - 1] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  // Intentie- en routekeuzes als losse events, zonder persoonsgegevens.
  const lastIntent = useRef<string | null>(null);
  useEffect(() => {
    if (!answers.intent || lastIntent.current === answers.intent) return;
    lastIntent.current = answers.intent;
    trackBooking('intent_selected', eventBase());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers.intent]);

  function move(next: number) {
    setStep(next);
    requestAnimationFrame(() => {
      content.current?.scrollTo({ top: 0, behavior: 'instant' });
      heading.current?.focus({ preventScroll: true });
    });
  }
  function openEditor(id: EditorId) {
    if (editing === id) return;
    if (editing) { setEditError(en ? 'Save or cancel your current change first.' : 'Sla je huidige wijziging eerst op of annuleer die.'); return; }
    setEditError('');
    setEditing(id);
  }
  function closeEditor(id: EditorId) {
    const button = editRefs[id].current;
    setEditing(null);
    setEditError('');
    requestAnimationFrame(() => { button?.focus({ preventScroll: true }); });
  }
  function saveEditor(id: EditorId) {
    let issue = '';
    if (id === 'intake' && !result.complete) issue = en ? 'Answer the question that is shown.' : 'Beantwoord de zichtbare vraag.';
    if (id === 'planning') issue = planningError(planning, lang);
    if (id === 'address' && (!/^[1-9]\d{3}\s?[a-z]{2}$/i.test(fields.postalCode) || !fields.houseNumber.trim() || fields.street.trim().length < 2 || fields.city.trim().length < 2)) {
      issue = en ? 'Check your postcode, house number, street and city.' : 'Controleer je postcode, huisnummer, straat en woonplaats.';
    }
    if (id === 'contact' && (fields.name.trim().length < 2 || !/^[0-9+()\s-]{8,20}$/.test(fields.phone) || isBlockedPhoneRegion(fields.phone))) {
      issue = en ? 'Check your name and phone number.' : 'Controleer je naam en telefoonnummer.';
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
      setFields(previous => ({ ...previous, street: doc.straatnaam, city: doc.woonplaatsnaam }));
      setConfirmedAddress({ key: lookupKey, street: doc.straatnaam, city: doc.woonplaatsnaam });
      setLookup(en ? 'Address found.' : 'Adres gevonden.');
    } catch { setConfirmedAddress(null); setLookup(en ? 'Enter your street and city below.' : 'Vul hieronder je straat en woonplaats in.'); }
  }
  /* ---------------------------------------------------------------------- */
  /* Bijlagen (fase 4): categorie, verkleinen, uploaden, status per bestand   */
  /* ---------------------------------------------------------------------- */
  function applyItems(next: AttachmentItem[]) { itemsRef.current = next; setItems(next); }
  function patchItem(id: string, patch: Partial<AttachmentItem>) {
    applyItems(itemsRef.current.map(item => (item.id === id ? { ...item, ...patch } : item)));
  }
  async function startUpload(item: AttachmentItem) {
    if (!draftId.current) draftId.current = crypto.randomUUID();
    patchItem(item.id, { status: 'uploading', errorCode: undefined });
    const outcome = await uploadAttachment({ draftId: draftId.current, item });
    patchItem(item.id, outcome.ok
      ? { status: 'uploaded', errorCode: undefined }
      : { status: 'failed', errorCode: outcome.code });
  }
  function addFiles(input: File[]) {
    setUploadIssue('');
    void (async () => {
      for (const file of input) {
        const issue = clientPreCheck(file, itemsRef.current);
        if (issue) { setUploadIssue(issue); continue; }
        const prepared = await downscaleImage(file, attachmentRulesFor('perilex').imageTargetBytes);
        const item: AttachmentItem = {
          id: crypto.randomUUID(),
          file: prepared,
          category: (itemsRef.current.length === 0 && result.route === 'photo_review' ? 'consumer_unit' : 'other') as AttachmentCategory,
          name: prepared.name,
          size: prepared.size,
          mime: normaliseDeclaredMime(prepared.type) ?? prepared.type,
          status: 'queued',
        };
        applyItems([...itemsRef.current, item]);
        setLater(false);
        void startUpload(item);
      }
    })();
  }
  function removeItem(id: string) { applyItems(itemsRef.current.filter(item => item.id !== id)); }
  function retryItem(id: string) {
    const item = itemsRef.current.find(entry => entry.id === id);
    if (item) void startUpload(item);
  }
  function setItemCategory(id: string, category: AttachmentCategory) { patchItem(id, { category }); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    if (editing) { setError(en ? 'Save or cancel your open change first.' : 'Sla je open wijziging eerst op of annuleer die.'); return; }
    setError('');
    if (step === 1 && !result.complete) {
      setError(en ? 'Answer the question that is shown.' : 'Beantwoord de zichtbare vraag.');
      return;
    }
    if (step === 3) {
      const planningIssueText = planningError(planning, lang);
      if (planningIssueText) { setPlanningIssue(planningIssueText); return; }
    }
    if (step === 4 && (fields.name.trim().length < 2 || !/^[0-9+()\s-]{8,20}$/.test(fields.phone) || isBlockedPhoneRegion(fields.phone))) {
      setError(en ? 'Check your name and phone number.' : 'Controleer je naam en telefoonnummer.');
      return;
    }
    if (step < steps.length) {
      trackBooking('booking_step_completed', { ...eventBase(), step, stepId: service.steps[step - 1] });
      move(step + 1);
      return;
    }
    if (!consent) { setError(en ? 'Confirm your consent to continue.' : 'Bevestig je toestemming om verder te gaan.'); return; }

    submitting.current = true; setBusy(true);
    try {
      const booking = {
        answers: normalisePerilexAnswers(answers),
        postalCode: fields.postalCode.trim().toUpperCase(),
        houseNumber: fields.houseNumber.trim(),
        street: fields.street.trim(),
        city: fields.city.trim(),
        customerNote: customerNote.trim(),
        callbackRequested,
        photoCount: items.filter(item => item.status === 'uploaded').length,
        planning: normalisePlanning(planning),
      };
      const payload = service.payload(booking, lang);
      const body = new FormData();
      for (const key of ['name', 'phone', 'email', 'postalCode', 'hp'] as const) body.append(key, fields[key].trim());
      body.append('locale', lang);
      body.append('sourcePath', typeof window === 'undefined' ? '' : window.location.pathname);
      body.append('jobType', payload.jobType);
      body.append('bookingService', service.id);
      body.append('message', payload.message);
      if (payload.bookingField) body.append(payload.bookingField.name, JSON.stringify(payload.bookingField.value));
      if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID().replace(/-/g, '');
      body.append('idempotencyKey', idempotencyKey.current);
      body.append('catalogVersion', priceCatalogVersionFor('perilex'));
      // Bestanden zijn al opgeslagen via de gecontroleerde uploadroute; hier
      // gaat alleen het concept-id mee zodat de server ze kan koppelen.
      if (draftId.current) body.append('attachmentDraftId', draftId.current);
      const response = await fetch('/api/public/quote-request', { method: 'POST', body });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || (en ? 'Sending failed. Please try again.' : 'Versturen mislukt. Probeer opnieuw.'));
      submitted.current = true;
      trackBooking('lead_submitted', { ...eventBase(), step, stepId: 'summary' });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? 'Sending failed. Please try again.' : 'Versturen mislukt. Probeer opnieuw.'));
    } finally { submitting.current = false; setBusy(false); }
  }

  
  const intakeBlocked = step === 1 && !result.complete;

  return <BookingShell
    open={open}
    onOpenChange={next => { if (!next && !busy) onClose(); }}
    lang={lang}
    sectionId="perilex-aanvraag"
    sectionLabel={en ? 'Perilex request' : 'Perilex-aanvraag'}
    title={done ? (en ? 'Request received' : 'Aanvraag ontvangen') : (en ? 'Perilex / cooker connection' : 'Perilex / kookaansluiting')}
    subtitle={done ? (en ? 'We will contact you' : 'We nemen contact op') : `${step}/${steps.length} ${steps[step - 1]}`}
    steps={steps}
    step={step}
    done={done}
    busy={busy}
    status={status}
    ctaLabel={ctaLabels[step - 1]}
    blockedLabel={intakeBlocked ? (en ? 'Answer the question first' : 'Beantwoord eerst de vraag') : undefined}
    formId="perilex-booking-form"
    contentRef={content}
    headingRef={heading}
    widgetRef={widget}
    onBack={() => move(step - 1)}
    doneFooter={<Button type="button" size="xl" className="w-full" onClick={onClose}>{en ? 'Back to page' : 'Terug naar pagina'}</Button>}
  >
    {done ? <div className="mx-auto max-w-xl py-6 sm:py-12" role="status">
      <CheckCircle2 className="mb-5 size-12 text-primary" />
      <h2 tabIndex={-1} ref={heading} className="text-2xl font-bold outline-none">{en ? 'Request received' : 'Aanvraag ontvangen'}</h2>
      <p className="mt-4 leading-relaxed text-muted-foreground">{service.successCopy({ packageId: 'perilex', optionIds: [], photoRoute: 'photo', photoCount: items.filter(item => item.status === 'uploaded').length }, lang)}</p>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <Button asChild size="xl" variant="whatsapp" className="h-auto min-h-12 whitespace-normal py-3">
          <a href={whatsappHref(en ? 'Hi VoltFix, about my Perilex request.' : 'Hallo VoltFix, over mijn Perilex-aanvraag.')} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon className="size-5" ariaLabel="WhatsApp" />{en ? 'Open WhatsApp' : 'Open WhatsApp'}
          </a>
        </Button>
        <Button asChild size="xl" variant="outline" className="h-auto min-h-12 whitespace-normal py-3"><a href={telHref}><Phone />{en ? 'Call VoltFix' : 'Bel VoltFix'}</a></Button>
      </div>
    </div> : <form id="perilex-booking-form" onSubmit={submit} aria-busy={busy}>
      <fieldset disabled={busy} className="min-w-0 space-y-4">
        <legend className="sr-only">{steps[step - 1]}</legend>
        <h2 ref={heading} tabIndex={-1} className="text-xl font-bold outline-none">{step}/{steps.length} · {steps[step - 1]}</h2>
        <input name="website" tabIndex={-1} autoComplete="off" value={fields.hp} onChange={e => setField('hp', e.target.value)} className="hidden" aria-hidden="true" />

        {step === 1 && <PerilexIntakeStep
          lang={lang}
          answers={answers}
          setAnswers={setAnswers}
          callbackRequested={callbackRequested}
          setCallbackRequested={setCallbackRequested}
        />}

        {step === 2 && <PerilexAttachmentsStep
          lang={lang}
          route={result.route ?? null}
          intent={answers.intent ?? null}
          items={items}
          addFiles={addFiles}
          removeItem={removeItem}
          retryItem={retryItem}
          setCategory={setItemCategory}
          later={later}
          setLater={setLater}
          issue={uploadIssue}
        />}

        {step === 3 && <AddressStep
          lang={lang}
          fields={fields}
          setField={setField}
          onLookup={lookupCity}
          lookup={lookup}
          confirmed={confirmedAddress}
          planning={planning}
          setPlanning={next => { setPlanning(next); setPlanningIssue(''); }}
          purpose={purpose}
          planningIssue={planningIssue}
        />}

        {step === 4 && <ContactStep lang={lang} values={fields} setField={setField} note={customerNote} setNote={setCustomerNote} />}

        {step === 5 && <>
          <dl className="min-w-0 divide-y divide-border">
            <SummaryRow
              lang={lang}
              label={en ? 'Your situation' : 'Je situatie'}
              value={`${answers.intent ?? '—'}${answers.preparation ? ` · ${answers.preparation}` : ''}${answers.urgency ? ` · ${answers.urgency}` : ''}${answers.reviewChoice ? ` · ${answers.reviewChoice}` : ''}${answers.issueType ? ` · ${answers.issueType}` : ''}`}
              editLabel={en ? 'Change situation' : 'Situatie wijzigen'}
              open={editing === 'intake'}
              onEdit={() => openEditor('intake')}
              onSave={() => saveEditor('intake')}
              onCancel={() => closeEditor('intake')}
              buttonRef={editRefs.intake}
              error={editing === 'intake' ? editError : ''}
            >
              <PerilexIntakeStep lang={lang} answers={answers} setAnswers={setAnswers} callbackRequested={callbackRequested} setCallbackRequested={setCallbackRequested} />
            </SummaryRow>
            <SummaryRow
              lang={lang}
              label={en ? 'Photo' : 'Foto'}
              value={photoRoute === 'photo' ? `${items.filter(item => item.status === 'uploaded').length}/${items.length} ${en ? 'file(s) saved' : 'bestand(en) opgeslagen'}` : photoRoute === 'later' ? (en ? 'Files later' : 'Bestanden later') : (en ? 'No files' : 'Geen bestanden')}
              editLabel={en ? 'Change photo' : 'Foto wijzigen'}
              open={editing === 'photo'}
              onEdit={() => openEditor('photo')}
              onSave={() => saveEditor('photo')}
              onCancel={() => closeEditor('photo')}
              buttonRef={editRefs.photo}
              error={editing === 'photo' ? editError : ''}
            >
              <PerilexAttachmentsStep
                lang={lang}
                route={result.route ?? null}
                intent={answers.intent ?? null}
                items={items}
                addFiles={addFiles}
                removeItem={removeItem}
                retryItem={retryItem}
                setCategory={setItemCategory}
                later={later}
                setLater={setLater}
                issue={uploadIssue}
              />
            </SummaryRow>
            <SummaryRow
              lang={lang}
              label={en ? 'Address' : 'Adres'}
              value={`${fields.street} ${fields.houseNumber}, ${fields.postalCode} ${fields.city}`.trim()}
              editLabel={en ? 'Change address' : 'Adres wijzigen'}
              open={editing === 'address'}
              onEdit={() => openEditor('address')}
              onSave={() => saveEditor('address')}
              onCancel={() => closeEditor('address')}
              buttonRef={editRefs.address}
              error={editing === 'address' ? editError : ''}
            >
              <AddressFields lang={lang} fields={fields} setField={setField} onLookup={lookupCity} lookup={lookup} confirmed={confirmedAddress} />
            </SummaryRow>
            <SummaryRow
              lang={lang}
              label={en ? 'Preferred time' : 'Voorkeursmoment'}
              value={planningSummary(planning, purpose, lang)}
              editLabel={en ? 'Change preferred time' : 'Voorkeursmoment wijzigen'}
              open={editing === 'planning'}
              onEdit={() => openEditor('planning')}
              onSave={() => saveEditor('planning')}
              onCancel={() => closeEditor('planning')}
              buttonRef={editRefs.planning}
              error={editing === 'planning' ? editError : ''}
            >
              <PlanningPreferenceFields lang={lang} planning={planning} setPlanning={setPlanning} purpose={purpose} />
            </SummaryRow>
            <SummaryRow
              lang={lang}
              label={en ? 'Details' : 'Gegevens'}
              value={`${fields.name} · ${fields.phone}${fields.email ? ` · ${fields.email}` : ''}`}
              editLabel={en ? 'Change details' : 'Gegevens wijzigen'}
              open={editing === 'contact'}
              onEdit={() => openEditor('contact')}
              onSave={() => saveEditor('contact')}
              onCancel={() => closeEditor('contact')}
              buttonRef={editRefs.contact}
              error={editing === 'contact' ? editError : ''}
            >
              <ContactStep lang={lang} values={fields} setField={setField} note={customerNote} setNote={setCustomerNote} />
            </SummaryRow>
          </dl>

          <div data-testid="perilex-price-summary" className="rounded-lg border border-border bg-muted/40 p-4">
            <p className="text-sm font-semibold">{en ? 'Price' : 'Prijs'}</p>
            <p className="mt-1 text-lg font-bold text-primary">{status}</p>
            {result.subjectToAvailability && <p className="mt-1 text-sm text-muted-foreground">{en ? perilexAvailabilityNote.en : perilexAvailabilityNote.nl}</p>}
            {result.deductible && <p className="mt-1 text-sm text-muted-foreground">{en ? perilexDeductibleNote.en : perilexDeductibleNote.nl}</p>}
            {result.priceStatus === 'fixed' && result.amountExVatCents !== null && <p className="mt-1 text-sm text-muted-foreground">{perilexMoney(result.amountExVatCents, lang)}</p>}
          </div>

          <label className="mt-4 grid min-h-12 cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-3 text-sm">
            <input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} className="size-5 shrink-0 accent-primary" />
            <span className="min-w-0 leading-snug">{en ? 'VoltFix may contact me about this request.' : 'VoltFix mag contact met me opnemen over deze aanvraag.'}</span>
          </label>
        </>}

        {error && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
      </fieldset>
    </form>}
  </BookingShell>;
}
