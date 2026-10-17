import { groupExtraGroupPrice, groupExtraGroupsMax, groupOptions, groupPackages, groepenkastBrands } from '@/lib/groepenkast';
import { prices } from '@/lib/pricing';
import { groepenkastCatalogVersion } from '@/lib/booking/pricing-catalog';

/**
 * Generieke offerte-engine. Pure functies: geen database, geen browser.
 * Bedragen zijn integer eurocenten INCL. btw (zoals de website).
 */

export type CatalogKind = 'package' | 'option' | 'extra_unit' | 'survey' | 'brand' | 'component' | 'labour';

export type CatalogSeedItem = {
  item_key: string;
  kind: CatalogKind;
  label_nl: string;
  label_en: string;
  price_inc_vat_cents: number;
  unit: string;
  max_qty: number | null;
  sort: number;
  show_on_website: boolean;
  show_in_quotes: boolean;
  meta: Record<string, unknown>;
};

const cents = (euros: number) => Math.round(euros * 100);

/** Groepenkastcatalogus, rechtstreeks uit de bestaande code — nooit handmatig overgetypt. */
export function groepenkastSeedFromCode(): { versionKey: string; items: CatalogSeedItem[] } {
  let sort = 0;
  const items: CatalogSeedItem[] = [
    ...groupPackages.map(p => ({
      item_key: p.id, kind: 'package' as const, label_nl: p.nl, label_en: p.en,
      price_inc_vat_cents: cents(p.price), unit: 'stuk', max_qty: 1, sort: sort++,
      show_on_website: true, show_in_quotes: true, meta: { circuits: p.circuits },
    })),
    ...groupOptions.map(o => ({
      item_key: o.id, kind: 'option' as const, label_nl: o.nl, label_en: o.en,
      price_inc_vat_cents: cents(o.price), unit: 'stuk', max_qty: 1, sort: sort++,
      show_on_website: true, show_in_quotes: true, meta: {},
    })),
    {
      item_key: 'extra_group', kind: 'extra_unit', label_nl: 'Extra groep', label_en: 'Extra circuit',
      price_inc_vat_cents: cents(groupExtraGroupPrice), unit: 'groep', max_qty: groupExtraGroupsMax, sort: sort++,
      show_on_website: true, show_in_quotes: true, meta: {},
    },
    {
      item_key: 'survey', kind: 'survey', label_nl: 'Schouw ter plaatse', label_en: 'On-site survey',
      price_inc_vat_cents: cents(prices.groepenkastSurvey), unit: 'stuk', max_qty: 1, sort: sort++,
      show_on_website: true, show_in_quotes: true, meta: { deductible: true },
    },
    ...groepenkastBrands.map(b => ({
      item_key: `brand_${b.id}`, kind: 'brand' as const, label_nl: `Merktoeslag ${b.nl}`, label_en: `Brand surcharge ${b.en}`,
      price_inc_vat_cents: cents(b.surcharge), unit: 'stuk', max_qty: 1, sort: sort++,
      // Merkkeuze staat op de website nog uit.
      show_on_website: false, show_in_quotes: true, meta: {},
    })),
  ];
  return { versionKey: groepenkastCatalogVersion, items };
}

export type QuoteLine = {
  qty: number;
  unit_price_inc_vat_cents: number;
  vat_rate_bps: number;
  is_internal?: boolean;
  catalog_unit_price_cents?: number | null;
  override_reason?: string | null;
};

/** Zelfde rekenregel als de database (finalize_quote): ex btw per regel afgerond. */
export function quoteTotals(lines: readonly QuoteLine[]) {
  let inc = 0;
  let ex = 0;
  for (const l of lines) {
    if (l.is_internal) continue;
    const line = l.qty * l.unit_price_inc_vat_cents;
    inc += line;
    ex += Math.round((line * 10000) / (10000 + l.vat_rate_bps));
  }
  return { total_inc_vat_cents: inc, subtotal_ex_vat_cents: ex, vat_cents: inc - ex };
}

/** Een afwijking van de catalogusprijs vereist een interne reden. */
export function overrideMissingReason(line: QuoteLine): boolean {
  return line.catalog_unit_price_cents != null
    && line.unit_price_inc_vat_cents !== line.catalog_unit_price_cents
    && !(line.override_reason ?? '').trim();
}

export const QUOTE_VALID_DAYS = 14;

export const eur = (c: number, lang: 'nl' | 'en' = 'nl') =>
  new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : 'en-GB', { style: 'currency', currency: 'EUR' }).format(c / 100);

export function quoteWhatsAppText(q: {
  quote_number: string | null; language: string; total_inc_vat_cents: number; valid_until: string | null;
  customer_snapshot: { name?: string };
}, lines: { label: string; qty: number; line_total_inc_vat_cents: number; is_internal: boolean }[]) {
  const en = q.language === 'en';
  const visible = lines.filter(l => !l.is_internal);
  return [
    en ? `Hi ${q.customer_snapshot.name ?? ''}, here is your VoltFix quote ${q.quote_number ?? ''}:` : `Hoi ${q.customer_snapshot.name ?? ''}, hierbij je offerte ${q.quote_number ?? ''} van VoltFix:`,
    '',
    ...visible.map(l => `• ${l.qty > 1 ? `${l.qty}× ` : ''}${l.label}: ${eur(l.line_total_inc_vat_cents, en ? 'en' : 'nl')}`),
    '',
    `${en ? 'Total incl. 21% VAT' : 'Totaal incl. 21% btw'}: ${eur(q.total_inc_vat_cents, en ? 'en' : 'nl')}`,
    q.valid_until ? (en ? `Valid until ${q.valid_until}.` : `Geldig tot ${q.valid_until}.`) : '',
    en ? 'Reply "agreed" to confirm.' : 'Antwoord met "akkoord" om te bevestigen.',
  ].filter((l, i, a) => l !== '' || a[i - 1] !== '').join('\n').trim();
}
