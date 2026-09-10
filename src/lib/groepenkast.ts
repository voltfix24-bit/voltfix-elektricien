import { z } from 'zod';
import { prices } from './pricing';

export type GroupLocale = 'nl' | 'en';
export const groupPackages = [
  { id: 'single', price: prices.groepenkast1Phase, nl: '1-fase basis', en: 'Single-phase basic', circuits: '6–8' },
  { id: 'three', price: prices.groepenkast3Phase, nl: '3-fase basis', en: 'Three-phase basic', circuits: '6–8' },
  { id: 'extended', price: prices.groepenkast3PhaseExtended, nl: '3-fase uitgebreid', en: 'Three-phase extended', circuits: '10–12' },
] as const;
export const groupOptions = [
  { id: 'induction', price: prices.groepenkastInduction, nl: 'Kookgroep / inductie', en: 'Cooker circuit / induction' },
  { id: 'solar', price: prices.groepenkastSolar, nl: 'PV / zonnepanelen', en: 'PV / solar panels' },
  { id: 'rcbo', price: prices.groepenkastRcbo, nl: 'Aardlekautomaten / alamats', en: 'RCBOs (combined protection)' },
  { id: 'socket', price: prices.groepenkastSocket, nl: 'DIN-rail stopcontact', en: 'DIN-rail socket' },
  { id: 'bell', price: prices.groepenkastBell, nl: 'Beltrafo', en: 'Doorbell transformer' },
  { id: 'surge', price: prices.groepenkastSurge, nl: 'Overspanningsbeveiliging', en: 'Surge protection' },
] as const;
export type PackageId = typeof groupPackages[number]['id'] | 'unknown';
export type OptionId = typeof groupOptions[number]['id'];
export const groupMoney = (value: number, lang: GroupLocale) => `€${value.toLocaleString(lang === 'nl' ? 'nl-NL' : 'en-GB')}`;
export const groupDisclaimer = {
  nl: 'Dit zijn all-in richtprijzen. De definitieve vaste prijs bevestigen we na foto- of schouwcontrole, vóór de start van het werk.',
  en: 'These are all-in guide prices. We confirm your final fixed price after a photo review or site inspection, before work starts.',
};
export const groupTrust = {
  nl: ['Inclusief montage en materiaal', 'Inclusief 21% btw', 'Oude kast netjes afgevoerd', 'Testen en labelen inbegrepen', 'A-merk componenten', 'Geen verrassingen: prijs akkoord voor start'],
  en: ['Installation and materials included', '21% VAT included', 'Old fuse box removed responsibly', 'Testing and labelling included', 'Leading-brand components', 'No surprises: price agreed before work starts'],
};
export function groupTotal(packageId: PackageId, optionIds: readonly OptionId[]) {
  const base = groupPackages.find(p => p.id === packageId)?.price ?? null;
  const extras = groupOptions.filter(o => optionIds.includes(o.id)).reduce((sum, o) => sum + o.price, 0);
  return { base, extras, total: base === null ? null : base + extras };
}
export const groupBookingSchema = z.object({
  packageId: z.enum(['single', 'three', 'extended', 'unknown']),
  optionIds: z.array(z.enum(['induction', 'solar', 'rcbo', 'socket', 'bell', 'surge'])).max(6).transform(ids => [...new Set(ids)]),
  photoReview: z.enum(['photo', 'survey']),
  postalCode: z.string().trim().regex(/^[1-9][0-9]{3}\s?[A-Za-z]{2}$/),
  houseNumber: z.string().trim().regex(/^\d{1,5}[\p{L}\d\s/-]{0,12}$/u),
  city: z.string().trim().min(2).max(80),
  preferredMoment: z.enum(['weekday-morning', 'weekday-afternoon', 'saturday', 'discuss']),
});
export type GroupBooking = z.infer<typeof groupBookingSchema>;
export const groupMoments = {
  nl: ['Doordeweeks · ochtend', 'Doordeweeks · middag', 'Zaterdag', 'In overleg'],
  en: ['Weekday · morning', 'Weekday · afternoon', 'Saturday', 'To be arranged'],
};
export const groupMomentIds = ['weekday-morning', 'weekday-afternoon', 'saturday', 'discuss'] as const;
export function groupBookingMessage(booking: GroupBooking, lang: GroupLocale) {
  const selected = groupPackages.find(p => p.id === booking.packageId);
  const totals = groupTotal(booking.packageId, booking.optionIds);
  const en = lang === 'en';
  return [
    `${en ? 'Package' : 'Pakket'}: ${selected ? `${selected[lang]}, ${selected.circuits} ${en ? 'circuits' : 'groepen'} — ${groupMoney(selected.price, lang)}` : (en ? 'Not sure — please check my photo / installation' : 'Ik weet het niet — check mijn foto / installatie')}`,
    ...groupOptions.filter(o => booking.optionIds.includes(o.id)).map(o => `${o[lang]}: +${groupMoney(o.price, lang)} all-in`),
    `${en ? 'Total guide price' : 'Totale richtprijs'}: ${totals.total === null ? (en ? `package to be confirmed; selected options ${groupMoney(totals.extras, lang)}` : `pakket nog te bepalen; gekozen opties ${groupMoney(totals.extras, lang)}`) : groupMoney(totals.total, lang)} (${en ? 'incl. 21% VAT' : 'incl. 21% btw'})`,
    `${en ? 'Price check' : 'Prijscontrole'}: ${booking.photoReview === 'photo' ? (en ? 'photo review' : 'fotocontrole') : (en ? 'site inspection requested' : 'schouw aangevraagd')}`,
    groupDisclaimer[lang],
    `${en ? 'Address' : 'Adres'}: ${booking.postalCode.toUpperCase()}, ${en ? 'house number' : 'huisnummer'} ${booking.houseNumber}, ${booking.city}`,
    `${en ? 'Preferred time' : 'Voorkeursmoment'}: ${groupMoments[lang][groupMomentIds.indexOf(booking.preferredMoment)]}`,
  ].join('\n');
}
export function groupFaqs(lang: GroupLocale) {
  const en = lang === 'en';
  return en ? [
    { q: 'What does fuse box replacement in Amsterdam cost?', a: `All-in packages from ${groupMoney(prices.groepenkastFrom, lang)}: single-phase basic, 6–8 circuits ${groupMoney(prices.groepenkast1Phase, lang)}; three-phase basic, 6–8 circuits ${groupMoney(prices.groepenkast3Phase, lang)}; three-phase extended, 10–12 circuits ${groupMoney(prices.groepenkast3PhaseExtended, lang)}. Materials, installation and 21% VAT included. ${groupDisclaimer.en}` },
    { q: 'What is included in each package?', a: `${groupTrust.en.join('. ')}. We install to NEN 1010. You receive 12 months’ workmanship warranty and 2 years’ manufacturer warranty on materials.` },
    { q: 'Which package is right for my home?', a: 'The right package depends on your existing supply, circuit count and planned appliances. Not sure? Choose “I’m not sure, check my photo.” We review your installation before confirming the package and price.' },
    { q: 'Can you include induction cooking and solar panels?', a: 'Yes. Select the options in your price calculation. We check compatibility, circuit protection and any additional wiring during the photo review or site inspection. Any work outside the package is quoted and agreed before we start.' },
    { q: 'Is upgrading the grid connection included?', a: 'No. A three-phase fuse box is not the same as a three-phase grid connection. If your supply needs upgrading, your grid operator handles that separately and charges its own fees.' },
    { q: 'How do I take a photo safely?', a: 'Upload a photo of your fuse box with the cupboard door open. Do not unscrew the protective cover, remove seals or touch wiring. If a photo is not possible, request a site inspection.' },
    { q: 'How quickly do you check my photo?', a: 'Usually within 1 hour during opening hours. This is an indication, not a guarantee; the final price and installation time are confirmed personally.' },
    { q: 'How long does replacement take?', a: 'A standard replacement usually takes half to a full working day. We agree the power-off period with you, remove the old box, install the new one and test and label all circuits.' },
    { q: 'Do you replace old wire-fuse boxes in Amsterdam?', a: 'Yes, including homes in Centrum, West, Zuid, Oost, Noord, De Pijp and IJburg, and the surrounding area. We check the wiring, earthing and available space before confirming the fixed price.' },
  ] : [
    { q: 'Wat kost een groepenkast vervangen in Amsterdam?', a: `All-in pakketten vanaf ${groupMoney(prices.groepenkastFrom, lang)}: 1-fase basis, 6–8 groepen ${groupMoney(prices.groepenkast1Phase, lang)}; 3-fase basis, 6–8 groepen ${groupMoney(prices.groepenkast3Phase, lang)}; 3-fase uitgebreid, 10–12 groepen ${groupMoney(prices.groepenkast3PhaseExtended, lang)}. Inclusief materiaal, montage en 21% btw. ${groupDisclaimer.nl}` },
    { q: 'Wat zit er in ieder pakket?', a: `${groupTrust.nl.join('. ')}. We installeren volgens NEN 1010. Je krijgt 12 maanden garantie op het werk en 2 jaar fabrieksgarantie op materialen.` },
    { q: 'Welk pakket past bij mijn woning?', a: 'Dat hangt af van je huidige aansluiting, het aantal groepen en de apparaten die je wilt aansluiten. Twijfel je? Kies “Ik weet het niet, check mijn foto.” We beoordelen je installatie voordat we het pakket en de prijs bevestigen.' },
    { q: 'Kunnen inductie en zonnepanelen direct mee?', a: 'Ja. Kies de opties in je prijsberekening. Bij de foto- of schouwcontrole controleren we de combinatie, beveiliging en eventueel benodigde bekabeling. Werk buiten het pakket bespreken en prijzen we vóór de start.' },
    { q: 'Is verzwaring van de netaansluiting inbegrepen?', a: 'Nee. Een 3-fase groepenkast is niet hetzelfde als een 3-fase netaansluiting. Een eventuele verzwaring van je hoofdaansluiting regelt de netbeheerder apart, met eigen kosten.' },
    { q: 'Hoe maak ik veilig een foto?', a: 'Maak een foto met de deur van de meterkast open. Schroef de beschermkap niet los, verwijder geen zegels en raak geen bedrading aan. Lukt een foto niet? Vraag dan een schouw aan.' },
    { q: 'Hoe snel controleren jullie mijn foto?', a: 'Meestal binnen 1 uur tijdens openingstijden. Dit is een indicatie, geen garantie; de definitieve prijs en het installatiemoment bevestigen we persoonlijk.' },
    { q: 'Hoe lang duurt het vervangen?', a: 'Een standaard vervanging duurt meestal een halve tot hele werkdag. We stemmen af wanneer de stroom uitgaat, voeren de oude kast af, plaatsen de nieuwe kast en testen en labelen alle groepen.' },
    { q: 'Vervangen jullie ook oude stoppenkasten in Amsterdam?', a: 'Ja, onder meer in Centrum, West, Zuid, Oost, Noord, De Pijp en IJburg en in de omgeving. We controleren bedrading, aarding en beschikbare ruimte voordat we je vaste prijs bevestigen.' },
  ];
}
