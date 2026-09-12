import { describe, expect, it } from 'vitest';
import {
  derivePerilexBookingResult,
  emptyPerilexAnswers,
  normalisePerilexAnswers,
  perilexAvailabilityNote,
  perilexDeductibleNote,
  perilexMoney,
  perilexStatusLabel,
  recalculatePerilexPrice,
  type PerilexAnswers,
} from './perilex-routing';
import { perilexCatalog, perilexCatalogVersion, priceCatalogVersionFor } from './pricing-catalog';
import { bookingServices } from './registry';
import { isBookingServiceActive } from './activation';

const answers = (partial: Partial<PerilexAnswers>): PerilexAnswers => ({ ...emptyPerilexAnswers, ...partial });

describe('Perilex — activatie', () => {
  it('P01 blijft uitgeschakeld', () => {
    expect(bookingServices.perilex.enabled).toBe(false);
    expect(isBookingServiceActive('perilex')).toBe(false);
  });

  it('P02 is één keer geregistreerd met stappen intake → photo → address → contact → summary', () => {
    expect(bookingServices.perilex.id).toBe('perilex');
    expect(bookingServices.perilex.steps).toEqual(['intake', 'photo', 'address', 'contact', 'summary']);
  });
});

describe('Perilex — bestaande aansluiting', () => {
  it('P03 voorbereiding "ja" + standaard geeft exact €120 excl. btw', () => {
    const result = derivePerilexBookingResult(answers({ intent: 'connect_existing', preparation: 'yes', urgency: 'standard' }));
    expect(result.route).toBe('fixed_existing_standard');
    expect(result.priceStatus).toBe('fixed');
    expect(result.priceRuleId).toBe('existing_connection_standard');
    expect(result.amountExVatCents).toBe(12000);
    expect(result.subjectToAvailability).toBe(false);
  });

  it('P04 voorrang geeft exact €145 excl. btw op basis van beschikbaarheid', () => {
    const result = derivePerilexBookingResult(answers({ intent: 'connect_existing', preparation: 'yes', urgency: 'priority_24h' }));
    expect(result.route).toBe('fixed_existing_priority');
    expect(result.amountExVatCents).toBe(14500);
    expect(result.subjectToAvailability).toBe(true);
    expect(perilexAvailabilityNote.nl).toContain('beschikbaarheid');
    expect(perilexAvailabilityNote.en).toContain('availability');
  });

  it('P05 zonder urgentiekeuze is de route nog niet compleet', () => {
    const result = derivePerilexBookingResult(answers({ intent: 'connect_existing', preparation: 'yes' }));
    expect(result.complete).toBe(false);
    expect(result.pendingQuestion).toBe('urgency');
    expect(result.amountExVatCents).toBeNull();
  });

  it('P06 "weet ik niet" en "nee" krijgen nooit een vaste aansluitprijs', () => {
    for (const preparation of ['unsure', 'no'] as const) {
      const pendingResult = derivePerilexBookingResult(answers({ intent: 'connect_existing', preparation }));
      expect(pendingResult.pendingQuestion).toBe('review_choice');
      const review = derivePerilexBookingResult(answers({ intent: 'connect_existing', preparation, reviewChoice: 'photo_review' }));
      expect(review.route).toBe('photo_review');
      expect(review.priceStatus).toBe('review_needed');
      expect(review.amountExVatCents).toBeNull();
      const survey = derivePerilexBookingResult(answers({ intent: 'connect_existing', preparation, reviewChoice: 'site_survey' }));
      expect(survey.priceRuleId).toBe('site_survey');
      expect(survey.amountExVatCents).toBe(9000);
      expect(survey.priceRuleId).not.toBe('existing_connection_standard');
    }
  });
});

describe('Perilex — beoordeling en schouw', () => {
  it.each(['new_installation', 'kitchen_renovation', 'unsure'] as const)('P07 %s vraagt eerst hoe de klant verder wil', intent => {
    expect(derivePerilexBookingResult(answers({ intent })).pendingQuestion).toBe('review_choice');
  });

  it('P08 fotobeoordeling geeft review_needed zonder bedrag', () => {
    const result = derivePerilexBookingResult(answers({ intent: 'new_installation', reviewChoice: 'photo_review' }));
    expect(result).toMatchObject({ route: 'photo_review', priceStatus: 'review_needed', priceRuleId: null, amountExVatCents: null });
  });

  it('P09 schouw geeft exact €90 excl. btw en is verrekenbaar', () => {
    const result = derivePerilexBookingResult(answers({ intent: 'new_installation', reviewChoice: 'site_survey' }));
    expect(result.route).toBe('site_survey');
    expect(result.amountExVatCents).toBe(9000);
    expect(result.deductible).toBe(true);
    expect(perilexDeductibleNote.nl).toContain('verrekenbaar');
    expect(perilexDeductibleNote.en).toContain('deductible');
  });

  it('P10 keukenrenovatie toont de keukentekening-hint', () => {
    expect(derivePerilexBookingResult(answers({ intent: 'kitchen_renovation', reviewChoice: 'photo_review' })).showKitchenDrawingHint).toBe(true);
    expect(derivePerilexBookingResult(answers({ intent: 'new_installation', reviewChoice: 'photo_review' })).showKitchenDrawingHint).toBe(false);
  });
});

describe('Perilex — storing en veiligheid', () => {
  it('P11 storing vraagt eerst het type', () => {
    expect(derivePerilexBookingResult(answers({ intent: 'fault_or_issue' })).pendingQuestion).toBe('issue_type');
  });

  it.each(['circuit_trips_or_error', 'other'] as const)('P12 %s geeft fault_review zonder installatieprijs', issueType => {
    const result = derivePerilexBookingResult(answers({ intent: 'fault_or_issue', issueType }));
    expect(result.route).toBe('fault_review');
    expect(result.priceStatus).toBe('review_needed');
    expect(result.amountExVatCents).toBeNull();
    expect(result.offerCallback).toBe(true);
  });

  it.each(['connection_hot', 'burning_smell_or_sparks'] as const)('P13 %s geeft de veiligheidsroute zonder boekingsprijs', issueType => {
    const result = derivePerilexBookingResult(answers({ intent: 'fault_or_issue', issueType }));
    expect(result.route).toBe('safety_call');
    expect(result.safety).toBe(true);
    expect(result.priceStatus).toBe('none');
    expect(result.amountExVatCents).toBeNull();
    expect(perilexStatusLabel(result, 'nl')).toBe('Bel VoltFix');
    expect(perilexStatusLabel(result, 'en')).toBe('Call VoltFix');
  });

  it('P14 geen enkele storingsroute levert €120 of €145 op', () => {
    for (const issueType of ['circuit_trips_or_error', 'connection_hot', 'burning_smell_or_sparks', 'other'] as const) {
      const result = derivePerilexBookingResult(answers({ intent: 'fault_or_issue', issueType, preparation: 'yes', urgency: 'priority_24h' }));
      expect(result.amountExVatCents).toBeNull();
    }
  });
});

describe('Perilex — serverberekening', () => {
  it('P15 gebruikt uitsluitend catalogusbedragen', () => {
    const snapshot = recalculatePerilexPrice(answers({ intent: 'connect_existing', preparation: 'yes', urgency: 'standard' }));
    expect(snapshot.amountExVatCents).toBe(perilexCatalog.rules.existing_connection_standard.amountExVatCents);
    expect(snapshot.catalogVersion).toBe(perilexCatalogVersion);
    expect(snapshot.catalogVersion).toBe(priceCatalogVersionFor('perilex'));
  });

  it('P16 levert een volledige geldstructuur excl. btw', () => {
    const snapshot = recalculatePerilexPrice(answers({ intent: 'connect_existing', preparation: 'yes', urgency: 'priority_24h' }));
    expect(snapshot.money).toMatchObject({
      currency: 'EUR',
      display_tax_mode: 'ex_vat',
      vat_rate_bps: 2100,
      amount_ex_vat_cents: 14500,
      vat_amount_cents: 3045,
      amount_inc_vat_cents: 17545,
      price_rule_id: 'perilex:existing_connection_priority_24h',
    });
  });

  it('P17 geeft geen geldstructuur bij beoordeling of bellen', () => {
    expect(recalculatePerilexPrice(answers({ intent: 'unsure', reviewChoice: 'photo_review' })).money).toBeNull();
    expect(recalculatePerilexPrice(answers({ intent: 'fault_or_issue', issueType: 'burning_smell_or_sparks' })).money).toBeNull();
  });

  it('P18 bewaart uitsluitend stabiele codes', () => {
    const snapshot = recalculatePerilexPrice(answers({ intent: 'connect_existing', preparation: 'yes', urgency: 'standard' }));
    expect(snapshot.answers).toEqual({
      intent: 'connect_existing',
      preparation: 'yes',
      urgency: 'standard',
      reviewChoice: null,
      issueType: null,
    });
    expect(JSON.stringify(snapshot.answers)).not.toMatch(/Perilex-stopcontact|Normale planning|Subject to availability/);
  });

  it('P19 weigert onbekende of verzonnen codes', () => {
    const normalised = normalisePerilexAnswers({ intent: 'gratis_installatie', urgency: 'nu_meteen' } as never);
    expect(normalised.intent).toBeNull();
    expect(normalised.urgency).toBeNull();
    expect(derivePerilexBookingResult(normalised).pendingQuestion).toBe('intent');
  });
});

describe('Perilex — copy NL/EN', () => {
  it('P20 toont bedragen altijd exclusief btw', () => {
    expect(perilexMoney(12000, 'nl')).toBe('€120 excl. btw');
    expect(perilexMoney(14500, 'nl')).toBe('€145 excl. btw');
    expect(perilexMoney(9000, 'en')).toBe('€90 excl. VAT');
  });

  it('P21 heeft een statuslabel per route in beide talen', () => {
    const survey = derivePerilexBookingResult(answers({ intent: 'unsure', reviewChoice: 'site_survey' }));
    expect(perilexStatusLabel(survey, 'nl')).toBe('Schouw €90 excl. btw');
    expect(perilexStatusLabel(survey, 'en')).toBe('Survey €90 excl. VAT');
    const review = derivePerilexBookingResult(answers({ intent: 'unsure', reviewChoice: 'photo_review' }));
    expect(perilexStatusLabel(review, 'nl')).toBe('Prijs na beoordeling');
    expect(perilexStatusLabel(review, 'en')).toBe('Price after review');
  });

  it('P22 heeft voor iedere stap een label en CTA in NL en EN', () => {
    for (const lang of ['nl', 'en'] as const) {
      expect(bookingServices.perilex.stepLabels(lang)).toHaveLength(5);
      expect(bookingServices.perilex.stepCta(lang)).toHaveLength(5);
    }
  });
});

describe('Perilex — volledige antwoordmatrix', () => {
  const matrix: Array<[PerilexAnswers, string, string, string | null]> = [
    [answers({ intent: 'connect_existing', preparation: 'yes', urgency: 'standard' }), 'fixed_existing_standard', 'fixed', 'existing_connection_standard'],
    [answers({ intent: 'connect_existing', preparation: 'yes', urgency: 'priority_24h' }), 'fixed_existing_priority', 'fixed', 'existing_connection_priority_24h'],
    [answers({ intent: 'connect_existing', preparation: 'unsure', reviewChoice: 'photo_review' }), 'photo_review', 'review_needed', null],
    [answers({ intent: 'connect_existing', preparation: 'unsure', reviewChoice: 'site_survey' }), 'site_survey', 'fixed', 'site_survey'],
    [answers({ intent: 'connect_existing', preparation: 'no', reviewChoice: 'photo_review' }), 'photo_review', 'review_needed', null],
    [answers({ intent: 'connect_existing', preparation: 'no', reviewChoice: 'site_survey' }), 'site_survey', 'fixed', 'site_survey'],
    [answers({ intent: 'new_installation', reviewChoice: 'photo_review' }), 'photo_review', 'review_needed', null],
    [answers({ intent: 'new_installation', reviewChoice: 'site_survey' }), 'site_survey', 'fixed', 'site_survey'],
    [answers({ intent: 'kitchen_renovation', reviewChoice: 'photo_review' }), 'photo_review', 'review_needed', null],
    [answers({ intent: 'kitchen_renovation', reviewChoice: 'site_survey' }), 'site_survey', 'fixed', 'site_survey'],
    [answers({ intent: 'unsure', reviewChoice: 'photo_review' }), 'photo_review', 'review_needed', null],
    [answers({ intent: 'unsure', reviewChoice: 'site_survey' }), 'site_survey', 'fixed', 'site_survey'],
    [answers({ intent: 'fault_or_issue', issueType: 'circuit_trips_or_error' }), 'fault_review', 'review_needed', null],
    [answers({ intent: 'fault_or_issue', issueType: 'other' }), 'fault_review', 'review_needed', null],
    [answers({ intent: 'fault_or_issue', issueType: 'connection_hot' }), 'safety_call', 'none', null],
    [answers({ intent: 'fault_or_issue', issueType: 'burning_smell_or_sparks' }), 'safety_call', 'none', null],
  ];

  it.each(matrix)('P23 %#: route, prijsstatus en prijsregel liggen vast', (input, route, priceStatus, priceRuleId) => {
    const result = derivePerilexBookingResult(input);
    expect(result.route).toBe(route);
    expect(result.priceStatus).toBe(priceStatus);
    expect(result.priceRuleId).toBe(priceRuleId);
    expect(result.photoRequired).toBe(false);
  });
});
