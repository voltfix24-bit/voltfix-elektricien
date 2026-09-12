/**
 * Expliciete geldstructuur voor de booking-engine.
 *
 * Waarom: `quote_requests.price_total_cents` betekende historisch "het bedrag
 * dat de klant op het scherm zag". Voor groepenkast is dat een bedrag INCL.
 * btw (consumentenprijzen), voor Perilex worden bedragen EXCL. btw getoond.
 * Om te voorkomen dat dezelfde kolom stilzwijgend twee dingen betekent, leggen
 * we vanaf nu de volledige uitsplitsing vast in `price_snapshot.money`.
 *
 * Betekenis van de velden:
 * - currency            : ISO-valuta, altijd 'EUR'.
 * - display_tax_mode    : hoe het bedrag aan de klant getoond wordt
 *                         ('inc_vat' = groepenkast, 'ex_vat' = Perilex).
 * - vat_rate_bps        : btw-tarief in basispunten (2100 = 21%).
 * - amount_ex_vat_cents : bedrag exclusief btw, integer eurocenten.
 * - vat_amount_cents    : btw-bedrag, integer eurocenten.
 * - amount_inc_vat_cents: bedrag inclusief btw, integer eurocenten.
 * - catalog_version     : dienstspecifieke prijscatalogusversie.
 * - price_rule_id       : stabiele identifier van de toegepaste prijsregel.
 *
 * `price_total_cents` blijft ongewijzigd van betekenis (het getoonde bedrag) en
 * historische rijen worden nooit opnieuw geïnterpreteerd.
 */
export type DisplayTaxMode = 'inc_vat' | 'ex_vat';

export const VAT_RATE_BPS_STANDARD = 2100;

export type MoneyBreakdown = {
  currency: 'EUR';
  display_tax_mode: DisplayTaxMode;
  vat_rate_bps: number;
  amount_ex_vat_cents: number;
  vat_amount_cents: number;
  amount_inc_vat_cents: number;
  catalog_version: string;
  price_rule_id: string;
};

/** Integer-rekenwerk: geen floating point, halve centen ronden naar boven. */
export function vatFromExVat(amountExVatCents: number, vatRateBps: number): number {
  return Math.round((amountExVatCents * vatRateBps) / 10000);
}

export function exVatFromIncVat(amountIncVatCents: number, vatRateBps: number): number {
  return Math.round((amountIncVatCents * 10000) / (10000 + vatRateBps));
}

/** Bouwt de uitsplitsing vanuit een bedrag EXCL. btw (Perilex-basis). */
export function breakdownFromExVat(input: {
  amountExVatCents: number;
  vatRateBps?: number;
  displayTaxMode?: DisplayTaxMode;
  catalogVersion: string;
  priceRuleId: string;
}): MoneyBreakdown {
  const vatRateBps = input.vatRateBps ?? VAT_RATE_BPS_STANDARD;
  const ex = Math.round(input.amountExVatCents);
  const vat = vatFromExVat(ex, vatRateBps);
  return {
    currency: 'EUR',
    display_tax_mode: input.displayTaxMode ?? 'ex_vat',
    vat_rate_bps: vatRateBps,
    amount_ex_vat_cents: ex,
    vat_amount_cents: vat,
    amount_inc_vat_cents: ex + vat,
    catalog_version: input.catalogVersion,
    price_rule_id: input.priceRuleId,
  };
}

/** Bouwt de uitsplitsing vanuit een bedrag INCL. btw (groepenkastbasis). */
export function breakdownFromIncVat(input: {
  amountIncVatCents: number;
  vatRateBps?: number;
  catalogVersion: string;
  priceRuleId: string;
}): MoneyBreakdown {
  const vatRateBps = input.vatRateBps ?? VAT_RATE_BPS_STANDARD;
  const inc = Math.round(input.amountIncVatCents);
  const ex = exVatFromIncVat(inc, vatRateBps);
  return {
    currency: 'EUR',
    display_tax_mode: 'inc_vat',
    vat_rate_bps: vatRateBps,
    amount_ex_vat_cents: ex,
    vat_amount_cents: inc - ex,
    amount_inc_vat_cents: inc,
    catalog_version: input.catalogVersion,
    price_rule_id: input.priceRuleId,
  };
}
