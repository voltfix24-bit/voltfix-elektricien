import { describe, expect, it } from 'vitest';
import { bookingServices, enabledBookingServices, getBookingService } from './registry';
import { prices } from '@/lib/pricing';

describe('booking registry', () => {
  it('registreert alle diensten en toont alleen groepenkast live', () => {
    expect(Object.keys(bookingServices).sort()).toEqual(['algemeen', 'groepenkast', 'laadpaal', 'perilex', 'spoed', 'stopcontact']);
    expect(enabledBookingServices().map(s => s.id)).toEqual(['groepenkast']);
  });

  it('groepenkast houdt exact zes stappen in de bestaande volgorde', () => {
    const service = getBookingService('groepenkast');
    expect(service.steps).toEqual(['package', 'options', 'photo', 'address', 'contact', 'summary']);
    expect(service.stepLabels('nl')).toHaveLength(6);
    expect(service.stepCta('en')).toHaveLength(6);
  });

  it('gebruikt de centrale prijsbron voor pakketten, opties en schouw', () => {
    const service = getBookingService('groepenkast');
    expect(service.packages?.map(p => p.price)).toEqual([prices.groepenkast1Phase, prices.groepenkast3Phase, prices.groepenkast3PhaseExtended]);
    expect(service.photo?.surveyFee).toBe(prices.groepenkastSurvey);
    expect(service.price?.({ packageId: 'three', optionIds: ['induction'] }).total)
      .toBe(prices.groepenkast3Phase + prices.groepenkastInduction);
    expect(service.price?.({ packageId: 'unknown', optionIds: [] }).total).toBeNull();
  });

  it('spoed blijft een korte belroute zonder pakket- of fotostap', () => {
    const spoed = getBookingService('spoed');
    expect(spoed.flowType).toBe('emergency');
    expect(spoed.steps).toEqual(['fault', 'contact']);
    expect(spoed.photo).toBeUndefined();
    expect(spoed.status({ packageId: '', optionIds: [], photoRoute: 'photo', photoCount: 0 }, 'nl')).toContain(String(prices.emergencyFirstHour));
  });

  it('mapt de groepenkastaanvraag naar de bestaande payload', () => {
    const service = getBookingService('groepenkast');
    const payload = service.payload({
      packageId: 'single', optionIds: [], photoReview: 'photo', postalCode: '1017AB', houseNumber: '12',
      street: 'Teststraat', city: 'Amsterdam',
      planning: { schemaVersion: 1, mode: 'preference', kind: 'flexible', date: null, daypart: null },
    }, 'nl');
    expect(payload.jobType).toBe('Groepenkast vervangen — prijscontrole');
    expect(payload.bookingField?.name).toBe('groupBooking');
    expect(payload.message).toContain('Teststraat 12');
  });
});
