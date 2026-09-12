import { prices } from '@/lib/pricing';
import type { BookingServiceId } from './types';

/**
 * Dienstspecifieke prijscatalogi en catalogusversies.
 *
 * Regel: een prijswijziging in de ene dienst mag de catalogusversie van een
 * andere dienst NOOIT veranderen. De versie hangt uitsluitend af van de
 * prijsgerelateerde bedragen van die dienst — niet van teksten, volgorde in een
 * object of overige configuratie.
 */

/* -------------------------------------------------------------------------- */
/* Canonieke serialisatie                                                      */
/* -------------------------------------------------------------------------- */

/** Sorteert op sleutel en serialiseert als `sleutel=bedrag`, join met `-`. */
export function canonicalVersion(entries: Record<string, number>): string {
  return Object.keys(entries)
    .sort()
    .map(key => `${key}=${entries[key]}`)
    .join('-');
}

/* -------------------------------------------------------------------------- */
/* Groepenkast                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * LET OP: bewust NIET canoniek geserialiseerd. Deze volgorde is de historisch
 * uitgegeven versie-string. Lopende aanvragen dragen deze waarde mee; wijzigen
 * zou elke openstaande aanvraag een onterechte 409 "prijs gewijzigd" geven.
 * Nieuwe bedragen achteraan toevoegen, nooit herordenen.
 */
export const groepenkastCatalogVersion: string = [
  prices.groepenkast1Phase,
  prices.groepenkast3Phase,
  prices.groepenkast3PhaseExtended,
  prices.groepenkastInduction,
  prices.groepenkastSolar,
  prices.groepenkastRcbo,
  prices.groepenkastSocket,
  prices.groepenkastBell,
  prices.groepenkastSurge,
  prices.groepenkastExtraGroup,
  prices.groepenkastSurvey,
  prices.groepenkastBrandVoltfix,
  prices.groepenkastBrandEaton,
  prices.groepenkastBrandAbbHaf,
].join('-');

/* -------------------------------------------------------------------------- */
/* Perilex (nog niet actief — alleen definities voor fase 3)                   */
/* -------------------------------------------------------------------------- */

export type PerilexPriceRuleId =
  | 'existing_connection_standard'
  | 'existing_connection_priority_24h'
  | 'site_survey';

export type PerilexPriceRule = {
  id: PerilexPriceRuleId;
  /** Bedrag EXCLUSIEF btw, integer eurocenten. */
  amountExVatCents: number;
  /** Alleen op basis van beschikbaarheid toekenbaar. */
  subjectToAvailability: boolean;
  /** Volledig verrekenbaar bij uitvoering van de geoffreerde werkzaamheden. */
  deductible: boolean;
  nl: string;
  en: string;
};

/** Perilex toont bedragen EXCLUSIEF btw; btw-tarief 21%. */
export const perilexCatalog = {
  currency: 'EUR',
  displayTaxMode: 'ex_vat',
  vatRateBps: 2100,
  rules: {
    existing_connection_standard: {
      id: 'existing_connection_standard',
      amountExVatCents: 12000,
      subjectToAvailability: false,
      deductible: false,
      nl: 'Bestaande, werkende perilexaansluiting op een geschikte groep',
      en: 'Existing, working perilex connection on a suitable circuit',
    },
    existing_connection_priority_24h: {
      id: 'existing_connection_priority_24h',
      amountExVatCents: 14500,
      subjectToAvailability: true,
      deductible: false,
      nl: 'Voorrang binnen 24 uur (op basis van beschikbaarheid)',
      en: 'Priority within 24 hours (subject to availability)',
    },
    site_survey: {
      id: 'site_survey',
      amountExVatCents: 9000,
      subjectToAvailability: false,
      deductible: true,
      nl: 'Schouw ter plaatse — volledig verrekend bij uitvoering',
      en: 'On-site survey — fully deducted when we carry out the work',
    },
  } satisfies Record<PerilexPriceRuleId, PerilexPriceRule>,
} as const;

/**
 * Werk zonder automatische prijs: nieuwe groep, kabel, wandcontactdoos,
 * groepenkastaanpassing of bouwkundig werk. Deze gevallen krijgen in fase 3
 * status `review_needed` en dus géén bedrag. `prices.perilexWithNewGroupFrom`
 * (€275) is bewust GEEN bookingprijs.
 */
export const perilexManualReviewReasons = [
  'new_circuit',
  'new_cable',
  'new_socket_outlet',
  'consumer_unit_change',
  'construction_work',
] as const;
export type PerilexManualReviewReason = (typeof perilexManualReviewReasons)[number];

export const perilexCatalogVersion: string = canonicalVersion({
  existing_connection_standard: perilexCatalog.rules.existing_connection_standard.amountExVatCents,
  existing_connection_priority_24h: perilexCatalog.rules.existing_connection_priority_24h.amountExVatCents,
  site_survey: perilexCatalog.rules.site_survey.amountExVatCents,
  vat_rate_bps: perilexCatalog.vatRateBps,
});

/* -------------------------------------------------------------------------- */
/* Lookup                                                                      */
/* -------------------------------------------------------------------------- */

const versions: Record<BookingServiceId, string> = {
  groepenkast: groepenkastCatalogVersion,
  perilex: perilexCatalogVersion,
  // Placeholderdiensten hebben nog geen eigen catalogus.
  laadpaal: '',
  spoed: '',
  stopcontact: '',
  algemeen: '',
};

/** Catalogusversie van één dienst. Onbekende dienst → lege string. */
export function priceCatalogVersionFor(serviceId: string): string {
  return versions[serviceId as BookingServiceId] ?? '';
}
