import { describe, expect, it } from 'vitest';
import { groepenkastSeedFromCode, overrideMissingReason, quoteTotals } from './engine';
import { prices } from '@/lib/pricing';
import { groepenkastCatalogVersion } from '@/lib/booking/pricing-catalog';

describe('groepenkast catalogus-seed', () => {
  const seed = groepenkastSeedFromCode();
  const price = (k: string) => seed.items.find(i => i.item_key === k)?.price_inc_vat_cents;

  it('neemt de huidige websiteprijzen over', () => {
    expect(price('single')).toBe(prices.groepenkast1Phase * 100);
    expect(price('three')).toBe(84500);
    expect(price('extended')).toBe(109500);
    expect(price('extra_group')).toBe(3500);
    expect(price('survey')).toBe(9000);
  });
  it('behoudt de bestaande catalogusversie zodat lopende aanvragen geldig blijven', () => {
    expect(seed.versionKey).toBe(groepenkastCatalogVersion);
  });
  it('merktoeslagen zijn niet zichtbaar op de website', () => {
    expect(seed.items.filter(i => i.kind === 'brand').every(i => !i.show_on_website)).toBe(true);
  });
});

describe('offertetotalen', () => {
  it('rekent btw 21% terug uit incl-prijzen en negeert interne regels', () => {
    const t = quoteTotals([
      { qty: 1, unit_price_inc_vat_cents: 84500, vat_rate_bps: 2100 },
      { qty: 2, unit_price_inc_vat_cents: 3500, vat_rate_bps: 2100 },
      { qty: 1, unit_price_inc_vat_cents: 10000, vat_rate_bps: 2100, is_internal: true },
    ]);
    expect(t.total_inc_vat_cents).toBe(91500);
    expect(t.subtotal_ex_vat_cents).toBe(75620);
    expect(t.vat_cents).toBe(15880);
  });
  it('prijsafwijking zonder reden wordt geweigerd, met reden toegestaan', () => {
    expect(overrideMissingReason({ qty: 1, unit_price_inc_vat_cents: 80000, vat_rate_bps: 2100, catalog_unit_price_cents: 84500 })).toBe(true);
    expect(overrideMissingReason({ qty: 1, unit_price_inc_vat_cents: 80000, vat_rate_bps: 2100, catalog_unit_price_cents: 84500, override_reason: 'Vaste klant' })).toBe(false);
  });
});
