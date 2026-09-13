import type { GroupLocale } from '@/lib/groepenkast';
import {
  derivePerilexBookingResult,
  perilexMoney,
  type PerilexAnswers,
  type PerilexPriceStatus,
} from '@/lib/booking/perilex-routing';
import { perilexCatalog, type PerilexPriceRuleId } from '@/lib/booking/pricing-catalog';

/**
 * Inhoud en CTA-matrix van de publieke Perilexpagina (fase 6).
 *
 * Regel: deze module bevat GEEN bedragen. Alle prijzen komen uit
 * `perilexCatalog` en worden geformatteerd met `perilexMoney` (excl. btw).
 * De routebeslissing blijft `derivePerilexBookingResult` — hier staat alleen
 * met welke antwoorden een knop de flow opent.
 */

export type PerilexCtaId =
  | 'hero_primary'
  | 'hero_assess'
  | 'card_connect_existing'
  | 'card_unsure'
  | 'card_new_installation'
  | 'card_kitchen'
  | 'rate_standard'
  | 'rate_priority'
  | 'rate_survey'
  | 'closing_primary';

/** `pending` = de klant kiest nog; er wordt geen bedrag beloofd. */
export type PerilexCtaPriceStatus = PerilexPriceStatus | 'pending';

export type PerilexCta = {
  id: PerilexCtaId;
  /** Positie op de pagina; gaat mee als bronpositie in analytics. */
  position: string;
  /** Uitsluitend de werkelijk gekozen intentie — nooit meer dan de klant zei. */
  answers: Partial<PerilexAnswers>;
  priceStatus: PerilexCtaPriceStatus;
  priceRuleId: PerilexPriceRuleId | null;
  nl: string;
  en: string;
};

export const perilexCtas: readonly PerilexCta[] = [
  {
    id: 'hero_primary',
    position: 'hero',
    answers: {},
    priceStatus: 'pending',
    priceRuleId: null,
    nl: 'Vraag aansluiting aan',
    en: 'Request a connection',
  },
  {
    id: 'hero_assess',
    position: 'hero',
    answers: { intent: 'unsure', reviewChoice: 'photo_review' },
    priceStatus: 'review_needed',
    priceRuleId: null,
    nl: 'Laat mijn aansluiting beoordelen',
    en: 'Have my connection assessed',
  },
  {
    id: 'card_connect_existing',
    position: 'situations',
    answers: { intent: 'connect_existing' },
    priceStatus: 'pending',
    priceRuleId: null,
    nl: 'Apparaat aansluiten',
    en: 'Connect my appliance',
  },
  {
    id: 'card_unsure',
    position: 'situations',
    answers: { intent: 'unsure', reviewChoice: 'photo_review' },
    priceStatus: 'review_needed',
    priceRuleId: null,
    nl: 'Laat mijn aansluiting beoordelen',
    en: 'Have my connection assessed',
  },
  {
    id: 'card_new_installation',
    position: 'situations',
    answers: { intent: 'new_installation' },
    priceStatus: 'pending',
    priceRuleId: null,
    nl: 'Nieuw aansluitpunt aanvragen',
    en: 'Request a new connection point',
  },
  {
    id: 'card_kitchen',
    position: 'situations',
    answers: { intent: 'kitchen_renovation' },
    priceStatus: 'pending',
    priceRuleId: null,
    nl: 'Keukenplan laten bekijken',
    en: 'Have my kitchen plan reviewed',
  },
  {
    id: 'rate_standard',
    position: 'rates',
    answers: { intent: 'connect_existing', urgency: 'standard' },
    priceStatus: 'pending',
    priceRuleId: null,
    nl: 'Vraag aansluiting aan',
    en: 'Request a connection',
  },
  {
    id: 'rate_priority',
    position: 'rates',
    answers: { intent: 'connect_existing', urgency: 'priority_24h' },
    priceStatus: 'pending',
    priceRuleId: null,
    nl: 'Vraag voorrang aan',
    en: 'Request priority',
  },
  {
    id: 'rate_survey',
    position: 'rates',
    answers: { intent: 'unsure', reviewChoice: 'site_survey' },
    priceStatus: 'fixed',
    priceRuleId: 'site_survey',
    nl: 'Plan een schouw',
    en: 'Book a site visit',
  },
  {
    id: 'closing_primary',
    position: 'closing',
    answers: {},
    priceStatus: 'pending',
    priceRuleId: null,
    nl: 'Vraag aansluiting aan',
    en: 'Request a connection',
  },
] as const;

export function perilexCta(id: PerilexCtaId): PerilexCta {
  const found = perilexCtas.find(cta => cta.id === id);
  if (!found) throw new Error(`onbekende perilex-CTA: ${id}`);
  return found;
}

export const ctaLabel = (id: PerilexCtaId, lang: GroupLocale): string => perilexCta(id)[lang === 'en' ? 'en' : 'nl'];

/**
 * Prijsstatus die de knop werkelijk oplevert, berekend met dezelfde
 * beslisfunctie als de flow. `pending` wanneer de klant nog moet kiezen.
 */
export function resolvedCtaPriceStatus(id: PerilexCtaId): PerilexCtaPriceStatus {
  const result = derivePerilexBookingResult({
    intent: null,
    ...perilexCta(id).answers,
  } as PerilexAnswers);
  return result.complete ? result.priceStatus : 'pending';
}

/* -------------------------------------------------------------------------- */
/* Bedragen (altijd uit de catalogus, altijd excl. btw)                        */
/* -------------------------------------------------------------------------- */

export const perilexAmount = (ruleId: PerilexPriceRuleId, lang: GroupLocale): string =>
  perilexMoney(perilexCatalog.rules[ruleId].amountExVatCents, lang);

/** Bedragen in hele euro's — voor structured data. */
export const perilexAmountEur = (ruleId: PerilexPriceRuleId): number =>
  perilexCatalog.rules[ruleId].amountExVatCents / 100;

export const perilexAvailabilityLine = {
  nl: 'We bevestigen het beschikbare moment nadat we je situatie hebben beoordeeld.',
  en: 'We confirm the available time after assessing your situation.',
} as const;

export const perilexHeroConditionLine = {
  nl: 'Bij een bestaande geschikte Perilex-aansluiting en werkende groep.',
  en: 'With an existing, suitable Perilex socket and a working circuit.',
} as const;

/* -------------------------------------------------------------------------- */
/* Herkenbare situaties                                                        */
/* -------------------------------------------------------------------------- */

export type PerilexSituation = {
  ctaId: PerilexCtaId;
  nl: { title: string; body: string; step: string };
  en: { title: string; body: string; step: string };
};

export const perilexSituations: readonly PerilexSituation[] = [
  {
    ctaId: 'card_connect_existing',
    nl: {
      title: 'Nieuwe kookplaat, oven of fornuis op een voorbereide aansluiting',
      body: 'Er zit al een Perilex-wandcontactdoos of vaste aansluiting achter je apparaat. Wij controleren de aansluiting, monteren de stekker of aansluitkabel volgens het schema van de fabrikant en testen het geheel.',
      step: 'Vraag de aansluiting aan; je hoeft zelf niets op te meten.',
    },
    en: {
      title: 'New hob, oven or cooker on a prepared connection',
      body: 'There is already a Perilex socket or fixed connection point behind your appliance. We check the connection, fit the plug or connection cable to the manufacturer\u2019s diagram and test everything.',
      step: 'Request the connection \u2014 you do not need to measure anything yourself.',
    },
  },
  {
    ctaId: 'card_unsure',
    nl: {
      title: 'Twijfel of je nieuwe apparaat past bij de huidige aansluiting',
      body: 'De vorm van een stopcontact zegt niets over hoe het is aangesloten. Wij beoordelen je situatie aan de hand van wat je hebt: een foto van het aansluitpunt, het typeplaatje of alleen het model van je apparaat.',
      step: 'Laat je aansluiting beoordelen. Geen bedrag vooraf, geen betaalde schouw.',
    },
    en: {
      title: 'Not sure whether your new appliance fits the existing connection',
      body: 'The shape of a socket says nothing about how it is wired. We assess your situation from whatever you have: a photo of the connection point, the rating plate, or just the model of your appliance.',
      step: 'Have your connection assessed. No price up front, no paid site visit.',
    },
  },
  {
    ctaId: 'card_new_installation',
    nl: {
      title: 'Van gas naar inductie of een nieuw aansluitpunt',
      body: 'Er is nog geen kookaansluiting. Wij bekijken de meterkast, de kabelroute en het benodigde aansluitpunt en maken daarna een offerte voor het complete werk: kabel, groep, wandcontactdoos en aansluiting.',
      step: 'Vraag een nieuw aansluitpunt aan; je krijgt een offerte, geen vast bedrag vooraf.',
    },
    en: {
      title: 'From gas to induction, or a new connection point',
      body: 'There is no cooking connection yet. We look at the consumer unit, the cable route and the connection point needed, and then quote for the complete job: cable, circuit, socket and connection.',
      step: 'Request a new connection point \u2014 you receive a quote, not a fixed price up front.',
    },
  },
  {
    ctaId: 'card_kitchen',
    nl: {
      title: 'Nieuwe keuken met een installatietekening',
      body: 'Stuur de tekening of het installatieplan van je keukenleverancier mee. Wij lopen de kookaansluiting, de groepen en de posities na, zodat de elektra klaar is voordat de keuken geplaatst wordt.',
      step: 'Laat je keukenplan bekijken; een tekening (PDF of foto) mag mee.',
    },
    en: {
      title: 'A new kitchen with an installation drawing',
      body: 'Send the drawing or installation plan from your kitchen supplier. We check the cooking connection, the circuits and the positions, so the electrics are ready before the kitchen is fitted.',
      step: 'Have your kitchen plan reviewed \u2014 a drawing (PDF or photo) can be added.',
    },
  },
] as const;

/* -------------------------------------------------------------------------- */
/* Werkwijze                                                                   */
/* -------------------------------------------------------------------------- */

export const perilexSteps = {
  nl: [
    ['01', 'Je situatie doorgeven', 'Je kiest wat er speelt en laat je gegevens achter. Foto\u2019s en modelgegevens mogen \u2014 ze zijn niet verplicht en kunnen later of op locatie.'],
    ['02', 'Beoordeling door een elektricien', 'Wij kijken naar de aansluiting, de groep en het fabrikantschema van je apparaat. Je hoort wat er nodig is en wat het kost voordat we langskomen.'],
    ['03', 'Aansluiten en testen', 'We sluiten je apparaat aan, controleren de beveiliging en testen de werking. Wijkt de situatie af, dan hoor je dat eerst \u2014 niet achteraf op de factuur.'],
  ],
  en: [
    ['01', 'Tell us your situation', 'You choose what applies and leave your details. Photos and model details are welcome \u2014 they are optional and can follow later or on site.'],
    ['02', 'Assessment by an electrician', 'We look at the connection, the circuit and your appliance\u2019s manufacturer diagram. You hear what is needed and what it costs before we come out.'],
    ['03', 'Connect and test', 'We connect your appliance, check the protective device and test it. If the situation differs, you hear it first \u2014 not afterwards on the invoice.'],
  ],
} as const;

/* -------------------------------------------------------------------------- */
/* Veelgestelde vragen                                                         */
/* -------------------------------------------------------------------------- */

export function perilexFaqs(lang: GroupLocale): { q: string; a: string }[] {
  const standard = perilexAmount('existing_connection_standard', lang);
  const priority = perilexAmount('existing_connection_priority_24h', lang);
  const survey = perilexAmount('site_survey', lang);
  if (lang === 'en') {
    return [
      { q: 'What does connecting a Perilex plug cost?', a: `Connecting your appliance to an existing, suitable Perilex socket costs ${standard}. That rate applies when the socket and the cooking circuit are already there and working. If a new cable, circuit, socket or building work is needed, we assess the job and quote for it.` },
      { q: 'What is the difference with installing a new socket?', a: 'Connecting is fitting the plug or connection cable to an existing connection point. A new socket means new cabling from the consumer unit, a protective device and mounting work. That is quoted separately and is not covered by the connection rate.' },
      { q: 'Should I have the connection checked for a new hob?', a: 'Yes, when you do not know how the existing point is wired. The shape of a Perilex socket does not prove how many phases are connected or which appliance it suits. We check the wiring, the circuit and the manufacturer diagram.' },
      { q: 'We are moving from gas to induction. What is needed?', a: 'A cooking connection has to be created: a cable from the consumer unit, a suitable circuit with its own protective device and a connection point in the kitchen. We assess the situation and quote for the whole job.' },
      { q: 'We have a new kitchen and a drawing. Can you use it?', a: 'Yes. Send the installation drawing or plan (PDF or photo) with your request. We check the cooking connection and the positions against your actual installation before the kitchen is fitted.' },
      { q: 'Single phase, cooking circuit, three phase \u2014 what is the difference?', a: 'Single phase means one live conductor comes into your home; three phase means three. A cooking circuit is a separate, heavier circuit for the kitchen and can also exist on a single-phase installation. How many phases a Perilex point actually uses depends on the wiring, not on the shape of the socket.' },
      { q: 'When is a new circuit needed?', a: 'When there is no separate cooking circuit, when the existing circuit is too light for the appliance, or when the consumer unit has no free space. This follows from the manufacturer diagram and the installation on site, not from the wattage alone.' },
      { q: 'Do I need to send photos now?', a: 'No. Photos and model details are optional with your first request. They help us assess faster, and we can also check everything during the follow-up call or on site.' },
      { q: 'What does the site visit cost and is it deducted?', a: `A site visit with advice costs ${survey}. It is deducted in full from the final invoice when VoltFix carries out the quoted work. You only book it when you explicitly choose it.` },
      { q: 'How quickly can you come out?', a: `We confirm availability after assessing your situation. ${priority} is the total rate for the same straightforward job with priority within 24 hours, and only after we have confirmed availability. It is not a surcharge on top of the standard rate.` },
      { q: 'Do you also connect ovens and cookers?', a: 'Yes. Built-in ovens, freestanding cookers and hobs are connected to the correct connection point and circuit, following the manufacturer diagram.' },
      { q: 'Do you work for businesses as well as households?', a: 'Yes. We connect cooking appliances for households and for business premises in Amsterdam and the surrounding area.' },
    ];
  }
  return [
    { q: 'Wat kost het aansluiten van een Perilex-stekker?', a: `Het aansluiten van je apparaat op een bestaande, geschikte Perilex-wandcontactdoos kost ${standard}. Dat tarief geldt als de wandcontactdoos en de kookgroep er al zijn en werken. Is er een nieuwe kabel, groep, wandcontactdoos of bouwkundig werk nodig, dan beoordelen we de klus en offreren we die.` },
    { q: 'Wat is het verschil met een nieuw stopcontact aanleggen?', a: 'Aansluiten is het monteren van de stekker of aansluitkabel op een bestaand aansluitpunt. Een nieuw stopcontact betekent nieuwe bekabeling vanuit de groepenkast, een beveiliging en montagewerk. Dat wordt apart geoffreerd en valt niet onder het aansluittarief.' },
    { q: 'Moet ik de aansluiting laten controleren bij een nieuwe kookplaat?', a: 'Ja, als je niet weet hoe het bestaande punt is aangesloten. De vorm van een Perilex-stopcontact bewijst niet hoeveel fasen er zijn aangesloten of welk apparaat erop past. Wij controleren de bedrading, de groep en het fabrikantschema.' },
    { q: 'We gaan van gas naar inductie. Wat is er nodig?', a: 'Er moet een kookaansluiting worden gemaakt: een kabel vanuit de groepenkast, een geschikte groep met eigen beveiliging en een aansluitpunt in de keuken. Wij beoordelen de situatie en offreren het complete werk.' },
    { q: 'We hebben een nieuwe keuken en een tekening. Kunnen jullie daarmee werken?', a: 'Ja. Stuur de installatietekening of het plan (PDF of foto) mee met je aanvraag. Wij lopen de kookaansluiting en de posities na tegen je werkelijke installatie, vóórdat de keuken geplaatst wordt.' },
    { q: '1-fase, kookgroep en 3-fase \u2014 wat is het verschil?', a: 'Bij 1-fase komt er \u00e9\u00e9n spanningvoerende ader je woning binnen, bij 3-fase drie. Een kookgroep is een aparte, zwaardere groep voor de keuken en kan ook op een eenfase-installatie voorkomen. Hoeveel fasen een Perilexpunt werkelijk gebruikt, hangt af van de bedrading \u2014 niet van de vorm van het stopcontact.' },
    { q: 'Wanneer is een nieuwe groep nodig?', a: 'Als er geen aparte kookgroep is, als de bestaande groep te licht is voor het apparaat, of als er geen ruimte vrij is in de groepenkast. Dat volgt uit het fabrikantschema en de installatie ter plaatse, niet uit het wattage alleen.' },
    { q: 'Moet ik nu al foto\u2019s sturen?', a: 'Nee. Foto\u2019s en modelgegevens zijn optioneel bij je eerste aanvraag. Ze helpen ons sneller beoordelen, maar we kunnen alles ook in de opvolging of op locatie controleren.' },
    { q: 'Wat kost een schouw en wordt die verrekend?', a: `Een schouw met advies op locatie kost ${survey}. Dat bedrag wordt volledig verrekend op de eindfactuur wanneer VoltFix de geoffreerde werkzaamheden uitvoert. Je boekt de schouw alleen als je daar zelf expliciet voor kiest.` },
    { q: 'Hoe snel kunnen jullie komen?', a: `We bevestigen de beschikbaarheid nadat we je situatie hebben beoordeeld. ${priority} is het totale tarief voor dezelfde eenvoudige klus met voorrang binnen 24 uur, en alleen na bevestigde beschikbaarheid. Het is dus geen toeslag bovenop het standaardtarief.` },
    { q: 'Sluiten jullie ook ovens en fornuizen aan?', a: 'Ja. Inbouwovens, vrijstaande fornuizen en kookplaten sluiten we aan op het juiste aansluitpunt en de juiste groep, volgens het schema van de fabrikant.' },
    { q: 'Werken jullie ook voor bedrijven?', a: 'Ja. We sluiten kookapparatuur aan voor particulieren en voor bedrijfsruimtes in Amsterdam en omgeving.' },
  ];
}
