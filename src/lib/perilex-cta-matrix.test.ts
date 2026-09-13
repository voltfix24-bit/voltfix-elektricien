import { describe, expect, it } from 'vitest';

import { perilexCta, perilexCtas, resolvedCtaPriceStatus, type PerilexCtaId } from '@/lib/perilex-content';
import {
  applyPerilexCtaAnswers,
  derivePerilexBookingResult,
  emptyPerilexAnswers,
  perilexCtaChangesAnswers,
  perilexStatusLabel,
  recalculatePerilexPrice,
  type PerilexAnswers,
} from '@/lib/booking/perilex-routing';

const answers = (partial: Partial<PerilexAnswers>): PerilexAnswers => ({ ...emptyPerilexAnswers, ...partial });
const fromCta = (id: PerilexCtaId, previous: PerilexAnswers = emptyPerilexAnswers) =>
  applyPerilexCtaAnswers(previous, perilexCta(id).answers);

/* -------------------------------------------------------------------------- */
/* 1. Iedere ingang uit de CTA-matrix: beginselectie → vervolgvraag → overzicht */
/* -------------------------------------------------------------------------- */

describe('CTA-matrix — beginselectie en vervolgvraag', () => {
  const cases: Array<{
    id: PerilexCtaId;
    start: Partial<PerilexAnswers>;
    pending: string | null;
    priceStatus: string;
  }> = [
    { id: 'hero_primary', start: {}, pending: 'intent', priceStatus: 'review_needed' },
    { id: 'closing_primary', start: {}, pending: 'intent', priceStatus: 'review_needed' },
    { id: 'card_connect_existing', start: { intent: 'connect_existing' }, pending: 'preparation', priceStatus: 'review_needed' },
    { id: 'rate_standard', start: { intent: 'connect_existing', urgency: 'standard' }, pending: 'preparation', priceStatus: 'review_needed' },
    { id: 'rate_priority', start: { intent: 'connect_existing', urgency: 'priority_24h' }, pending: 'preparation', priceStatus: 'review_needed' },
    { id: 'hero_assess', start: { intent: 'unsure', reviewChoice: 'photo_review' }, pending: null, priceStatus: 'review_needed' },
    { id: 'card_unsure', start: { intent: 'unsure', reviewChoice: 'photo_review' }, pending: null, priceStatus: 'review_needed' },
    { id: 'card_new_installation', start: { intent: 'new_installation' }, pending: 'review_choice', priceStatus: 'review_needed' },
    { id: 'card_kitchen', start: { intent: 'kitchen_renovation' }, pending: 'review_choice', priceStatus: 'review_needed' },
    { id: 'rate_survey', start: { intent: 'unsure', reviewChoice: 'site_survey' }, pending: null, priceStatus: 'fixed' },
  ];

  it('C00 dekt alle knoppen uit de matrix', () => {
    expect(cases.map(entry => entry.id).sort()).toEqual(perilexCtas.map(cta => cta.id).sort());
  });

  for (const entry of cases) {
    it(`C-${entry.id} opent met precies de gekozen bedoeling`, () => {
      const selected = fromCta(entry.id);
      expect(selected).toEqual(answers(entry.start));
      const result = derivePerilexBookingResult(selected);
      expect(result.pendingQuestion).toBe(entry.pending);
      expect(result.priceStatus).toBe(entry.priceStatus);
      // De knop belooft nooit meer dan de beslisboom oplevert.
      expect(resolvedCtaPriceStatus(entry.id)).toBe(result.complete ? result.priceStatus : 'pending');
    });
  }
});

describe('CTA-matrix — eindoverzicht per ingang', () => {
  it('C01 tariefknop verklaart de aansluiting niet geschikt; pas na "ja" volgt €120', () => {
    const selected = fromCta('rate_standard');
    expect(selected.preparation).toBeNull();
    const complete = derivePerilexBookingResult({ ...selected, preparation: 'yes' });
    expect(complete.route).toBe('fixed_existing_standard');
    expect(complete.amountExVatCents).toBe(12000);
    expect(perilexStatusLabel(complete, 'nl')).toBe('€120 excl. btw');
  });

  it('C02 voorrang blijft onder voorbehoud van bevestigde beschikbaarheid', () => {
    const complete = derivePerilexBookingResult({ ...fromCta('rate_priority'), preparation: 'yes' });
    expect(complete.route).toBe('fixed_existing_priority');
    expect(complete.amountExVatCents).toBe(14500);
    expect(complete.subjectToAvailability).toBe(true);
  });

  it('C03 bestaande aansluiting met twijfel geeft geen vast bedrag', () => {
    const result = derivePerilexBookingResult({ ...fromCta('card_connect_existing'), preparation: 'unsure' });
    expect(result.pendingQuestion).toBe('review_choice');
    expect(result.amountExVatCents).toBeNull();
  });

  it('C04 twijfel wordt nooit automatisch een betaalde schouw', () => {
    const result = derivePerilexBookingResult(fromCta('card_unsure'));
    expect(result.route).toBe('photo_review');
    expect(result.priceStatus).toBe('review_needed');
    expect(result.priceRuleId).toBeNull();
  });

  it('C05 alleen de expliciete schouwknop levert €90, verrekenbaar', () => {
    const result = derivePerilexBookingResult(fromCta('rate_survey'));
    expect(result.route).toBe('site_survey');
    expect(result.amountExVatCents).toBe(9000);
    expect(result.deductible).toBe(true);
  });

  it('C06 nieuwe aansluiting en keukenrenovatie eindigen in beoordeling of schouw', () => {
    const nieuw = derivePerilexBookingResult({ ...fromCta('card_new_installation'), reviewChoice: 'photo_review' });
    expect(nieuw.route).toBe('photo_review');
    const keuken = derivePerilexBookingResult({ ...fromCta('card_kitchen'), reviewChoice: 'photo_review' });
    expect(keuken.route).toBe('photo_review');
    expect(keuken.showKitchenDrawingHint).toBe(true);
  });

  it('C07 serverherberekening volgt dezelfde uitkomst als het overzicht', () => {
    const selected = { ...fromCta('rate_priority'), preparation: 'yes' } as PerilexAnswers;
    const snapshot = recalculatePerilexPrice(selected);
    expect(snapshot.priceRuleId).toBe('existing_connection_priority_24h');
    expect(snapshot.amountExVatCents).toBe(14500);
    expect(snapshot.answers).toEqual(selected);
  });
});

/* -------------------------------------------------------------------------- */
/* 2. Behoud van de conceptaanvraag                                            */
/* -------------------------------------------------------------------------- */

describe('Concept blijft behouden bij een nieuwe knop', () => {
  const gevorderd = answers({ intent: 'connect_existing', preparation: 'yes', urgency: 'priority_24h' });

  it('D01 een algemene aanvraagknop overschrijft geen eerdere bewuste keuze', () => {
    expect(fromCta('hero_primary', gevorderd)).toEqual(gevorderd);
    expect(fromCta('closing_primary', gevorderd)).toEqual(gevorderd);
    expect(perilexCtaChangesAnswers(gevorderd, perilexCta('hero_primary').answers)).toBe(false);
  });

  it('D02 dezelfde knop opnieuw laat de voortgang staan', () => {
    expect(fromCta('rate_priority', gevorderd)).toEqual(gevorderd);
    expect(perilexCtaChangesAnswers(gevorderd, perilexCta('rate_priority').answers)).toBe(false);
  });

  it('D03 een andere route kiest de bedoelde route en laat niets ongeldigs staan', () => {
    const gewisseld = fromCta('card_unsure', gevorderd);
    expect(gewisseld).toEqual(answers({ intent: 'unsure', reviewChoice: 'photo_review' }));
    expect(gewisseld.preparation).toBeNull();
    expect(gewisseld.urgency).toBeNull();
  });

  it('D04 ongeldig geworden antwoorden tellen niet meer mee in prijs of verzending', () => {
    const snapshot = recalculatePerilexPrice(fromCta('card_unsure', gevorderd));
    expect(snapshot.status).toBe('review_needed');
    expect(snapshot.amountExVatCents).toBeNull();
    expect(snapshot.answers.urgency).toBeNull();
    expect(snapshot.answers.preparation).toBeNull();
  });

  it('D05 binnen dezelfde intentie blijft eerder gegeven informatie staan', () => {
    const bestaand = answers({ intent: 'connect_existing', preparation: 'yes' });
    expect(fromCta('rate_priority', bestaand)).toEqual(
      answers({ intent: 'connect_existing', preparation: 'yes', urgency: 'priority_24h' }),
    );
  });

  it('D06 terug naar een storing wist de antwoorden van de vorige route', () => {
    const storing = applyPerilexCtaAnswers(gevorderd, { intent: 'fault_or_issue' });
    expect(storing).toEqual(answers({ intent: 'fault_or_issue' }));
    expect(derivePerilexBookingResult(storing).pendingQuestion).toBe('issue_type');
  });
});
