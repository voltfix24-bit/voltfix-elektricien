import { describe, expect, it, vi } from 'vitest';

import { breakdownFromExVat, breakdownFromIncVat, vatFromExVat } from './money';
import {
  canonicalVersion,
  groepenkastCatalogVersion,
  perilexCatalog,
  perilexCatalogVersion,
  priceCatalogVersionFor,
} from './pricing-catalog';
import { priceCatalogVersion, recalculateGroepenkastPrice } from './activation';
import { isBookingServiceActive } from './activation';

// Nulmeting: dit is de catalogusversie die lopende groepenkastaanvragen
// meedragen. Wijzigt deze string zonder prijswijziging, dan krijgen klanten
// onterecht "prijs gewijzigd" (409).
const GROEPENKAST_VERSION_BASELINE = '695-845-1095-149-129-120-39-49-169-35-90-0-45-85';

describe('dienstspecifieke catalogusversies', () => {
  it('groepenkastversie is ongewijzigd t.o.v. de nulmeting', () => {
    expect(groepenkastCatalogVersion).toBe(GROEPENKAST_VERSION_BASELINE);
    expect(priceCatalogVersion).toBe(GROEPENKAST_VERSION_BASELINE);
    expect(priceCatalogVersionFor('groepenkast')).toBe(GROEPENKAST_VERSION_BASELINE);
  });

  it('perilex heeft een eigen versie die verschilt van groepenkast', () => {
    expect(perilexCatalogVersion).not.toBe(groepenkastCatalogVersion);
    expect(priceCatalogVersionFor('perilex')).toBe(perilexCatalogVersion);
  });

  it('een perilexprijswijziging raakt de groepenkastversie niet', async () => {
    vi.resetModules();
    vi.doMock('@/lib/pricing', async () => {
      const actual = await vi.importActual<typeof import('@/lib/pricing')>('@/lib/pricing');
      return { ...actual, prices: { ...actual.prices, perilexFrom: 999 } };
    });
    const fresh = await import('./pricing-catalog');
    expect(fresh.groepenkastCatalogVersion).toBe(GROEPENKAST_VERSION_BASELINE);
    vi.doUnmock('@/lib/pricing');
    vi.resetModules();
  });

  it('een groepenkastprijswijziging raakt de perilexversie niet', async () => {
    vi.resetModules();
    vi.doMock('@/lib/pricing', async () => {
      const actual = await vi.importActual<typeof import('@/lib/pricing')>('@/lib/pricing');
      return { ...actual, prices: { ...actual.prices, groepenkast1Phase: 777 } };
    });
    const fresh = await import('./pricing-catalog');
    expect(fresh.groepenkastCatalogVersion).not.toBe(GROEPENKAST_VERSION_BASELINE);
    expect(fresh.perilexCatalogVersion).toBe(perilexCatalogVersion);
    vi.doUnmock('@/lib/pricing');
    vi.resetModules();
  });

  it('canonieke serialisatie is onafhankelijk van sleutelvolgorde', () => {
    expect(canonicalVersion({ b: 2, a: 1 })).toBe(canonicalVersion({ a: 1, b: 2 }));
  });
});

describe('409-gedrag op catalogusversie', () => {
  const changed = (submitted: string, service: string) =>
    Boolean(submitted) && submitted !== priceCatalogVersionFor(service);

  it('perilexwijziging geeft geen 409 voor een lopende groepenkastaanvraag', () => {
    expect(changed(GROEPENKAST_VERSION_BASELINE, 'groepenkast')).toBe(false);
    expect(changed(perilexCatalogVersion, 'groepenkast')).toBe(true);
  });

  it('een echte groepenkastprijswijziging geeft wel 409', () => {
    expect(changed('695-845-1095-149-129-120-39-49-169-35-90-0-45-84', 'groepenkast')).toBe(true);
  });
});

describe('perilexprijsregels', () => {
  it('legt de exacte bedragen en prijsbasis vast', () => {
    expect(perilexCatalog.currency).toBe('EUR');
    expect(perilexCatalog.displayTaxMode).toBe('ex_vat');
    expect(perilexCatalog.vatRateBps).toBe(2100);
    expect(perilexCatalog.rules.existing_connection_standard.amountExVatCents).toBe(12000);
    expect(perilexCatalog.rules.existing_connection_priority_24h.amountExVatCents).toBe(14500);
    expect(perilexCatalog.rules.existing_connection_priority_24h.subjectToAvailability).toBe(true);
    expect(perilexCatalog.rules.site_survey.amountExVatCents).toBe(9000);
    expect(perilexCatalog.rules.site_survey.deductible).toBe(true);
  });

  it('rekent 21% btw exact in centen', () => {
    expect(vatFromExVat(12000, 2100)).toBe(2520);
    expect(vatFromExVat(14500, 2100)).toBe(3045);
    expect(vatFromExVat(9000, 2100)).toBe(1890);
    const b = breakdownFromExVat({ amountExVatCents: 12000, catalogVersion: perilexCatalogVersion, priceRuleId: 'existing_connection_standard' });
    expect(b).toMatchObject({
      currency: 'EUR',
      display_tax_mode: 'ex_vat',
      vat_rate_bps: 2100,
      amount_ex_vat_cents: 12000,
      vat_amount_cents: 2520,
      amount_inc_vat_cents: 14520,
    });
  });

  it('blijft server-side uitgeschakeld', () => {
    expect(isBookingServiceActive('perilex')).toBe(false);
  });
});

describe('groepenkastbedragen blijven onveranderd geïnterpreteerd', () => {
  it('totaal blijft incl. btw en krijgt alleen een extra uitsplitsing', () => {
    const snap = recalculateGroepenkastPrice({ packageId: 'three', optionIds: ['induction'], photoReview: 'photo' });
    expect(snap.totalEur).toBe(994);
    expect(snap.money).toMatchObject({
      display_tax_mode: 'inc_vat',
      amount_inc_vat_cents: 99400,
      catalog_version: GROEPENKAST_VERSION_BASELINE,
    });
    const b = breakdownFromIncVat({ amountIncVatCents: 99400, catalogVersion: 'x', priceRuleId: 'y' });
    expect(b.amount_ex_vat_cents + b.vat_amount_cents).toBe(99400);
  });
});
