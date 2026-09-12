import type { ServiceConfig } from '../types';
import {
  derivePerilexBookingResult,
  emptyPerilexAnswers,
  perilexDeductibleNote,
  perilexMoney,
  perilexStatusLabel,
  type PerilexAnswers,
} from '../perilex-routing';

/**
 * Perilex / kookgroep — volledige servicemodule (fase 3).
 *
 * BELANGRIJK: `enabled: false`. De dienst staat nergens op de site en de server
 * weigert een POST via dezelfde centrale activatiecontrole. Deze module legt
 * alleen stappen, teksten en payload vast.
 *
 * Bedragen staan hier niet: die komen via `perilex-routing.ts` uit de
 * dienstspecifieke catalogus.
 */

/** Antwoorden zoals de flow ze meegeeft aan de payload. */
export type PerilexBookingInput = {
  answers: PerilexAnswers;
  postalCode: string;
  houseNumber: string;
  street: string;
  city: string;
  customerNote?: string;
  callbackRequested?: boolean;
  photoCount?: number;
};

export const perilexService: ServiceConfig = {
  id: 'perilex',
  slug: { nl: '/perilex-amsterdam', en: '/en-gb/perilex-amsterdam' },
  name: { nl: 'Perilex / kookgroep', en: 'Perilex / cooker circuit' },
  flowType: 'fixed-price',
  // Blijft uit tot een expliciete opdracht om te activeren.
  enabled: false,
  steps: ['intake', 'photo', 'address', 'contact', 'summary'],
  stepLabels: lang => (lang === 'en'
    ? ['Situation', 'Photo', 'Address', 'Details', 'Summary']
    : ['Situatie', 'Foto', 'Adres', 'Gegevens', 'Overzicht']),
  stepCta: lang => (lang === 'en'
    ? ['Continue', 'Continue', 'Continue', 'Go to summary', 'Complete request']
    : ['Verder', 'Verder', 'Verder', 'Naar overzicht', 'Aanvraag afronden']),
  photo: {
    allowLater: true,
    allowSurvey: false,
    surveyFee: null,
    instructions: lang => (lang === 'en'
      ? {
          title: 'Add a photo or the model details of your hob (optional).',
          note: 'A photo of the socket, the cooker circuit or the appliance label helps us. You can continue without a photo.',
        }
      : {
          title: 'Voeg een foto of modelgegevens van je kookplaat toe (optioneel).',
          note: 'Een foto van het stopcontact, de kookgroep of het typeplaatje helpt ons. Doorgaan zonder foto kan gewoon.',
        }),
  },
  // De prijs volgt uit de routebeslissing, niet uit pakketten of opties.
  price: () => ({ base: null, extras: 0, total: null }),
  status: (_state, lang) => perilexStatusLabel(derivePerilexBookingResult(emptyPerilexAnswers), lang),
  successCopy: (_state, lang) => (lang === 'en'
    ? 'We have received your request. VoltFix checks your situation and confirms the price and the time slot.'
    : 'We hebben je aanvraag ontvangen. VoltFix controleert je situatie en bevestigt de prijs en het moment.'),
  payload: (input, lang) => {
    const booking = input as PerilexBookingInput;
    const result = derivePerilexBookingResult(booking.answers);
    const en = lang === 'en';
    const lines: string[] = [
      en ? 'Perilex / cooker connection request' : 'Aanvraag Perilex / kookaansluiting',
      `${en ? 'Route' : 'Route'}: ${result.route ?? 'incomplete'}`,
      `${en ? 'Price status' : 'Prijsstatus'}: ${result.priceStatus}${result.priceRuleId ? ` · ${result.priceRuleId}` : ''}`,
    ];
    if (result.priceStatus === 'fixed' && result.amountExVatCents !== null) {
      lines.push(`${en ? 'Amount' : 'Bedrag'}: ${perilexMoney(result.amountExVatCents, lang)}`);
      if (result.deductible) lines.push(perilexDeductibleNote[en ? 'en' : 'nl']);
    }
    if (booking.callbackRequested) lines.push(en ? 'Callback requested.' : 'Terugbelverzoek aangevraagd.');
    if (booking.customerNote?.trim()) lines.push(`${en ? 'Note' : 'Toelichting'}: ${booking.customerNote.trim()}`);
    return {
      jobType: en ? 'Perilex / cooker connection' : 'Perilex / kookaansluiting',
      message: lines.join('\n'),
      bookingField: { name: 'perilexBooking', value: booking },
    };
  },
};
