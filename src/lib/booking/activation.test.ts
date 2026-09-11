import { describe, expect, it } from 'vitest';

import {
  isBookingIntent,
  isBookingServiceActive,
  postalAreaOf,
  priceCatalogVersion,
  recalculateGroepenkastPrice,
} from './activation';

describe('activatiecontrole', () => {
  it('laat alleen groepenkast publiek boeken', () => {
    expect(isBookingServiceActive('groepenkast')).toBe(true);
    for (const id of ['laadpaal', 'perilex', 'spoed', 'stopcontact', 'algemeen', 'onbekend']) {
      expect(isBookingServiceActive(id)).toBe(false);
    }
  });

  it('accepteert alleen bekende intenties', () => {
    expect(isBookingIntent('price')).toBe(true);
    expect(isBookingIntent('survey')).toBe(true);
    expect(isBookingIntent('<script>')).toBe(false);
  });
});

describe('server-side prijsherberekening', () => {
  it('A06: 3-fase basis + inductie geeft een indicatie van 994', () => {
    const snapshot = recalculateGroepenkastPrice({ packageId: 'three', optionIds: ['induction'], photoReview: 'photo' });
    expect(snapshot.totalEur).toBe(994);
    expect(snapshot.status).toBe('indication');
    expect(snapshot.catalogVersion).toBe(priceCatalogVersion);
  });

  it('A08: uitgebreid + alle zes opties telt niet dubbel', () => {
    const snapshot = recalculateGroepenkastPrice({
      packageId: 'extended',
      optionIds: ['induction', 'solar', 'rcbo', 'socket', 'bell', 'surge', 'surge'] as never,
      photoReview: 'photo',
    });
    expect(snapshot.totalEur).toBe(1750);
    expect(snapshot.options).toHaveLength(6);
  });

  it('A09/A10: onbekend pakket levert geen bedrag, alleen prijs na controle', () => {
    const snapshot = recalculateGroepenkastPrice({ packageId: 'unknown', optionIds: ['induction'], photoReview: 'later' });
    expect(snapshot.totalEur).toBeNull();
    expect(snapshot.status).toBe('review_needed');
    expect(snapshot.packagePrice).toBeNull();
  });

  it('A11: schouw toont het tarief apart en geen totaalprijs', () => {
    const snapshot = recalculateGroepenkastPrice({ packageId: 'three', optionIds: [], photoReview: 'survey' });
    expect(snapshot.surveyFee).toBe(90);
    expect(snapshot.status).toBe('survey_requested');
    expect(snapshot.totalEur).toBeNull();
  });

  it('bewaart alleen het postcodegebied', () => {
    expect(postalAreaOf('1012 AB')).toBe('1012');
    expect(postalAreaOf(null)).toBeNull();
  });
});
