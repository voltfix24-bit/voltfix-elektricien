import { useEffect, useRef } from 'react';
import { AlertTriangle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { telHref } from '@/lib/business';
import type { GroupLocale } from '@/lib/groepenkast';
import {
  derivePerilexBookingResult,
  perilexAvailabilityNote,
  perilexDeductibleNote,
  perilexMoney,
  perilexSafetyAdvice,
  type PerilexAnswers,
  type PerilexIntent,
  type PerilexIssueType,
  type PerilexPreparation,
  type PerilexReviewChoice,
  type PerilexUrgency,
} from '@/lib/booking/perilex-routing';
import { perilexCatalog } from '@/lib/booking/pricing-catalog';

/**
 * Perilex-intake: grote keuzekaarten in klanttaal. Geen technische termen
 * (geen 2N~, kabeldoorsnede of aansluitschema). "Weet ik niet" is overal een
 * volwaardige, neutrale keuze.
 *
 * Bedragen komen uit de catalogus via `perilexCatalog`; hier staat geen bedrag.
 */

const cardClass =
  'grid min-h-[3.5rem] cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-background p-4 text-left transition-colors has-[:checked]:border-primary has-[:checked]:bg-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring';

type Choice<T extends string> = { id: T; nl: string; en: string; nlNote?: string; enNote?: string; amountExVatCents?: number };

const intentChoices: Choice<PerilexIntent>[] = [
  { id: 'connect_existing', nl: 'Kookplaat of apparaat aansluiten op bestaande Perilex', en: 'Connect a hob or appliance to an existing Perilex socket' },
  { id: 'new_installation', nl: 'Nieuwe Perilex of kookgroep laten aanleggen', en: 'Have a new Perilex socket or cooker circuit installed' },
  { id: 'kitchen_renovation', nl: 'Nieuwe keuken of overstappen van gas', en: 'New kitchen or switching from gas' },
  { id: 'fault_or_issue', nl: 'Probleem met kookplaat of aansluiting', en: 'Problem with the hob or the connection' },
  { id: 'unsure', nl: 'Ik weet niet wat ik nodig heb', en: 'I am not sure what I need' },
];

const preparationChoices: Choice<PerilexPreparation>[] = [
  { id: 'yes', nl: 'Ja, Perilex-stopcontact en geschikte werkende groep zijn aanwezig', en: 'Yes, the Perilex socket and a suitable working circuit are in place' },
  { id: 'unsure', nl: 'Dat weet ik niet zeker', en: 'I am not sure' },
  { id: 'no', nl: 'Er moet waarschijnlijk iets worden aangelegd of aangepast', en: 'Something probably needs to be installed or changed' },
];

const urgencyChoices: Choice<PerilexUrgency>[] = [
  {
    id: 'standard',
    nl: 'Normale planning, meestal binnen dezelfde week',
    en: 'Standard planning, usually within the same week',
    amountExVatCents: perilexCatalog.rules.existing_connection_standard.amountExVatCents,
  },
  {
    id: 'priority_24h',
    nl: 'Bij voorkeur binnen 24 uur',
    en: 'Preferably within 24 hours',
    nlNote: perilexAvailabilityNote.nl,
    enNote: perilexAvailabilityNote.en,
    amountExVatCents: perilexCatalog.rules.existing_connection_priority_24h.amountExVatCents,
  },
];

const reviewChoices: Choice<PerilexReviewChoice>[] = [
  { id: 'photo_review', nl: 'Eerst mijn situatie laten beoordelen', en: 'Have my situation reviewed first', nlNote: 'Prijs na beoordeling.', enNote: 'Price after review.' },
  {
    id: 'site_survey',
    nl: 'Schouw op locatie aanvragen',
    en: 'Request an on-site survey',
    nlNote: perilexDeductibleNote.nl,
    enNote: perilexDeductibleNote.en,
    amountExVatCents: perilexCatalog.rules.site_survey.amountExVatCents,
  },
];

const issueChoices: Choice<PerilexIssueType>[] = [
  { id: 'circuit_trips_or_error', nl: 'Groep valt uit of kookplaat geeft een foutmelding', en: 'The circuit trips or the hob shows an error' },
  { id: 'connection_hot', nl: 'Aansluiting wordt warm', en: 'The connection gets hot' },
  { id: 'burning_smell_or_sparks', nl: 'Brandlucht of vonken', en: 'Burning smell or sparks' },
  { id: 'other', nl: 'Anders', en: 'Something else' },
];

function Question<T extends string>({
  lang, name, title, choices, value, onChange, testId,
}: {
  lang: GroupLocale;
  name: string;
  title: string;
  choices: Choice<T>[];
  value: T | null | undefined;
  onChange: (id: T) => void;
  testId: string;
}) {
  const en = lang === 'en';
  return <fieldset className="min-w-0" data-testid={testId}>
    <legend className="mb-3 text-base font-bold">{title}</legend>
    <div className="grid min-w-0 gap-3">
      {choices.map(choice => {
        const note = en ? choice.enNote : choice.nlNote;
        return <label key={choice.id} className={cardClass}>
          <input
            type="radio"
            name={name}
            value={choice.id}
            checked={value === choice.id}
            onChange={() => onChange(choice.id)}
            className="size-5 shrink-0 accent-primary"
          />
          <span className="min-w-0">
            <span className="block font-bold leading-snug">{en ? choice.en : choice.nl}</span>
            {note && <span className="mt-1 block text-sm leading-snug text-muted-foreground">{note}</span>}
          </span>
          {choice.amountExVatCents !== undefined && <span className="shrink-0 whitespace-nowrap text-sm font-bold tabular-nums text-primary sm:text-base">
            {perilexMoney(choice.amountExVatCents, lang)}
          </span>}
        </label>;
      })}
    </div>
  </fieldset>;
}

export function PerilexIntakeStep({
  lang, answers, setAnswers, callbackRequested, setCallbackRequested,
}: {
  lang: GroupLocale;
  answers: PerilexAnswers;
  setAnswers: (next: PerilexAnswers) => void;
  callbackRequested: boolean;
  setCallbackRequested: (next: boolean) => void;
}) {
  const en = lang === 'en';
  const result = derivePerilexBookingResult(answers);
  const followUp = useRef<HTMLDivElement>(null);
  const intent = answers.intent;

  // Soepel scrollen binnen de modal zodra een relevante vervolgvraag verschijnt.
  useEffect(() => {
    if (!intent) return;
    const node = followUp.current;
    if (!node) return;
    const timer = window.setTimeout(() => node.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
    return () => window.clearTimeout(timer);
  }, [intent, answers.preparation, answers.issueType]);

  const showReviewChoice =
    intent === 'new_installation' ||
    intent === 'kitchen_renovation' ||
    intent === 'unsure' ||
    (intent === 'connect_existing' && (answers.preparation === 'no' || answers.preparation === 'unsure'));

  return <div className="grid min-w-0 gap-6">
    <Question
      lang={lang}
      name="perilex-intent"
      testId="perilex-intent"
      title={en ? 'How can we help you?' : 'Waar kunnen we je mee helpen?'}
      choices={intentChoices}
      value={intent}
      onChange={id => setAnswers({ intent: id, preparation: null, urgency: null, reviewChoice: null, issueType: null })}
    />

    <div ref={followUp} className="grid min-w-0 gap-6 scroll-mt-4">
      {intent === 'connect_existing' && <Question
        lang={lang}
        name="perilex-preparation"
        testId="perilex-preparation"
        title={en ? 'Is everything already there and working?' : 'Is alles al aanwezig en werkend?'}
        choices={preparationChoices}
        value={answers.preparation}
        onChange={id => setAnswers({ ...answers, preparation: id, urgency: null, reviewChoice: null })}
      />}

      {intent === 'connect_existing' && answers.preparation === 'yes' && <div className="grid min-w-0 gap-3">
        <Question
          lang={lang}
          name="perilex-urgency"
          testId="perilex-urgency"
          title={en ? 'When would you like us to come?' : 'Wanneer wil je geholpen worden?'}
          choices={urgencyChoices}
          value={answers.urgency}
          onChange={id => setAnswers({ ...answers, urgency: id })}
        />
        <p className="text-sm text-muted-foreground">
          {en
            ? 'Your appointment stays a request until VoltFix confirms it.'
            : 'Je afspraak blijft een aanvraag totdat VoltFix deze bevestigt.'}
        </p>
      </div>}

      {showReviewChoice && <div className="grid min-w-0 gap-3">
        <Question
          lang={lang}
          name="perilex-review"
          testId="perilex-review"
          title={en ? 'How would you like to continue?' : 'Hoe wil je verder?'}
          choices={reviewChoices}
          value={answers.reviewChoice}
          onChange={id => setAnswers({ ...answers, reviewChoice: id })}
        />
        {answers.reviewChoice === 'photo_review' && <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm leading-snug text-muted-foreground">
          {en
            ? 'VoltFix reviews your situation and may ask for extra information or propose an on-site survey.'
            : 'VoltFix beoordeelt je situatie en vraagt eventueel aanvullende informatie of stelt een schouw voor.'}
        </p>}
      </div>}

      {intent === 'fault_or_issue' && <Question
        lang={lang}
        name="perilex-issue"
        testId="perilex-issue"
        title={en ? 'What exactly is happening?' : 'Wat is er precies aan de hand?'}
        choices={issueChoices}
        value={answers.issueType}
        onChange={id => setAnswers({ ...answers, issueType: id })}
      />}

      {result.safety && <div role="alert" data-testid="perilex-safety" className="grid min-w-0 gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
        <p className="flex items-start gap-2 font-bold text-destructive">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
          <span className="min-w-0">{en ? 'Safety first' : 'Veiligheid gaat voor'}</span>
        </p>
        <p className="text-sm leading-relaxed">{en ? perilexSafetyAdvice.en : perilexSafetyAdvice.nl}</p>
        <Button asChild size="xl" className="h-auto min-h-12 w-full whitespace-normal py-3">
          <a href={telHref}><Phone />{en ? 'Call VoltFix' : 'Bel VoltFix'}</a>
        </Button>
      </div>}

      {result.offerCallback && <label className="grid min-h-[3.5rem] cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-lg border border-border bg-background p-4">
        <input
          type="checkbox"
          checked={callbackRequested}
          onChange={event => setCallbackRequested(event.target.checked)}
          className="size-5 shrink-0 accent-primary"
        />
        <span className="min-w-0 text-sm font-semibold leading-snug">
          {en ? 'Please call me back' : 'Bel mij terug'}
        </span>
      </label>}

      {result.route === 'fault_review' && <p className="text-sm leading-snug text-muted-foreground">
        {en
          ? 'We review your fault first. You will not receive an installation price up front.'
          : 'We beoordelen je storing eerst. Je krijgt vooraf geen installatieprijs.'}
      </p>}
    </div>
  </div>;
}
