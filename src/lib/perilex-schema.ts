import { business } from '@/lib/business';
import { perilexCatalog } from '@/lib/booking/pricing-catalog';
import type { GroupLocale } from '@/lib/groepenkast';

/**
 * Structured data voor de Perilexpagina's. Bedragen komen uit de catalogus en
 * zijn EXCL. btw — dat staat expliciet in `valueAddedTaxIncluded: false`.
 *
 * Alleen werk met een echt bedrag krijgt een Offer. Offertewerk staat er
 * bewust niet in: een €0-aanbod zou een prijs suggereren die er niet is.
 */
export function perilexServiceOffers(lang: GroupLocale, path: string) {
  const en = lang === 'en';
  const url = `${business.url}${path}`;
  const rules = perilexCatalog.rules;
  const offer = (
    id: keyof typeof rules,
    name: string,
    description: string,
  ) => ({
    '@type': 'Offer',
    name,
    description,
    url,
    priceSpecification: {
      '@type': 'PriceSpecification',
      price: rules[id].amountExVatCents / 100,
      priceCurrency: perilexCatalog.currency,
      valueAddedTaxIncluded: false,
    },
  });

  return {
    offers: [
      offer(
        'existing_connection_standard',
        en ? 'Connect the Perilex plug to your appliance' : 'Perilex-stekker op je apparaat aansluiten',
        en
          ? 'Applies with an existing, suitable Perilex socket and a working, suitable circuit.'
          : 'Geldt bij een bestaande geschikte Perilex-wandcontactdoos en een werkende geschikte groep.',
      ),
      offer(
        'existing_connection_priority_24h',
        en ? 'Same connection with priority within 24 hours' : 'Dezelfde aansluiting met voorrang binnen 24 uur',
        en
          ? 'Total rate for the same job with priority within 24 hours, subject to confirmed availability. Not a surcharge.'
          : 'Totaaltarief voor dezelfde klus met voorrang binnen 24 uur, na bevestigde beschikbaarheid. Geen toeslag.',
      ),
      offer(
        'site_survey',
        en ? 'Site visit and advice' : 'Schouw en advies op locatie',
        en
          ? 'Fully deducted from the final invoice when VoltFix carries out the quoted work.'
          : 'Volledig verrekend op de eindfactuur wanneer VoltFix de geoffreerde werkzaamheden uitvoert.',
      ),
    ],
  };
}
