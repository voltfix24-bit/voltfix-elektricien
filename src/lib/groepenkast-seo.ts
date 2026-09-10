import heroImg from '@/assets/voltfix-groepenkast-abb-modern.webp.asset.json';
import { absoluteUrl, altLinks, breadcrumbSchema, faqSchema, ldScript, localBusinessSchema, pageMeta, serviceSchema, warrantySchema } from './seo';
import { groupDisclaimer, groupFaqs, groupMoney, groupPackages, type GroupLocale } from './groepenkast';
import { prices } from './pricing';

export function groepenkastHead(lang: GroupLocale) {
  const en = lang === 'en';
  const path = en ? '/en-gb/groepenkast-amsterdam' : '/groepenkast-amsterdam';
  const title = en ? `Fuse Box Replacement Amsterdam from ${groupMoney(prices.groepenkastFrom, lang)} | VoltFix` : `Groepenkast vervangen Amsterdam vanaf ${groupMoney(prices.groepenkastFrom, lang)} | VoltFix`;
  const description = en ? `All-in fuse box packages from ${groupMoney(prices.groepenkastFrom, lang)} incl. materials, installation and 21% VAT. Final fixed price after photo review or site inspection.` : `All-in groepenkastpakketten vanaf ${groupMoney(prices.groepenkastFrom, lang)} incl. materiaal, montage en 21% btw. Definitieve vaste prijs na foto- of schouwcontrole.`;
  const service = serviceSchema({ name: en ? 'Fuse box replacement in Amsterdam' : 'Groepenkast vervangen in Amsterdam', description, path, locale: lang });
  // This planned installation has no emergency arrival-time guarantee.
  const { processingTime: _processingTime, ...availableChannel } = service.availableChannel;
  return {
    meta: pageMeta({ title, description, path, locale: lang, ogTitle: title, ogDescription: description }),
    links: [{ rel: 'canonical', href: absoluteUrl(path) }, ...altLinks('/groepenkast-amsterdam'), { rel: 'preload', as: 'image', href: heroImg.url }],
    scripts: [
      ldScript({ ...service, availableChannel, termsOfService: groupDisclaimer[lang], offers: groupPackages.map(p => ({ '@type': 'Offer', name: `${p[lang]} · ${p.circuits} ${en ? 'circuits' : 'groepen'}`, price: p.price, priceCurrency: 'EUR', url: absoluteUrl(path), description: groupDisclaimer[lang], priceSpecification: { '@type': 'UnitPriceSpecification', price: p.price, priceCurrency: 'EUR', valueAddedTaxIncluded: true } })) }),
      ldScript(localBusinessSchema(lang)),
      ldScript(faqSchema(groupFaqs(lang), lang, path, false)),
      ldScript(warrantySchema(path, lang)),
      ldScript(breadcrumbSchema([{ name: 'Home', path: en ? '/en-gb' : '/' }, { name: en ? 'Fuse box replacement Amsterdam' : 'Groepenkast vervangen Amsterdam', path }])),
    ],
  };
}
