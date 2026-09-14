import { describe, expect, it } from 'vitest';
import { perilexCtas, perilexAmount, perilexAmountEur, perilexConnectionTerms, perilexFaqs, resolvedCtaPriceStatus } from './perilex-content';
import { perilexCatalog } from './booking/pricing-catalog';

describe('perilex CTA-matrix', () => {
  it('iedere CTA belooft precies de prijsstatus die de beslisfunctie geeft', () => {
    for (const cta of perilexCtas) {
      expect(resolvedCtaPriceStatus(cta.id), cta.id).toBe(cta.priceStatus);
    }
  });

  it('alleen de expliciete schouwknop draagt een vast bedrag', () => {
    const withRule = perilexCtas.filter(cta => cta.priceRuleId !== null);
    expect(withRule.map(cta => cta.id)).toEqual(['rate_survey']);
    expect(withRule[0].priceRuleId).toBe('site_survey');
  });

  it('geen enkele CTA verklaart zelf dat de aansluiting geschikt is', () => {
    for (const cta of perilexCtas) {
      expect(cta.answers.preparation, cta.id).toBeUndefined();
    }
  });

  it('voorrang opent connect_existing met priority_24h en nog geen bedrag', () => {
    const cta = perilexCtas.find(c => c.id === 'rate_priority')!;
    expect(cta.answers).toEqual({ intent: 'connect_existing', urgency: 'priority_24h' });
    expect(cta.priceStatus).toBe('pending');
  });
});

describe('perilexbedragen', () => {
  it('komen uit de catalogus en tonen excl. btw', () => {
    expect(perilexAmount('existing_connection_standard', 'nl')).toBe('€120 excl. btw');
    expect(perilexAmount('existing_connection_priority_24h', 'nl')).toBe('€145 excl. btw');
    expect(perilexAmount('site_survey', 'en')).toBe('€90 excl. VAT');
    expect(perilexAmountEur('existing_connection_standard') * 100).toBe(
      perilexCatalog.rules.existing_connection_standard.amountExVatCents,
    );
  });

  it('legt inbegrepen en uitgesloten onderdelen in beide talen vast', () => {
    expect(perilexConnectionTerms.nl).toContain('Inclusief voorrijkosten');
    expect(perilexConnectionTerms.nl).toContain('Exclusief Perilex-stekker en aansluitkabel');
    expect(perilexConnectionTerms.en).toContain('Travel costs included');
    expect(perilexConnectionTerms.en).toContain('plug and connection cable not included');
    expect(perilexFaqs('nl')[0]?.a).toContain('Voorrijkosten zijn inbegrepen');
    expect(perilexFaqs('en')[0]?.a).toContain('Travel costs are included');
  });
});
