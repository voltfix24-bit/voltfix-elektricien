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
    { q: 'Can you prepare the board for an EV charger?', a: `Yes. An EV charger needs its own circuit; the extended three-phase package (10–12 circuits) from ${groupMoney(prices.groepenkast3PhaseExtended, 'en')} leaves room for it, so the board does not need opening twice.` },
    { q: 'What does a site inspection cost?', a: `A site inspection costs ${groupMoney(prices.groepenkastSurvey, 'en')} and is fully deducted once you accept the fixed price. A photo review is free and usually answered within 1 hour during opening hours.` },
    { q: 'What is the difference between a meter cupboard and a fuse box?', a: 'The meter cupboard is the space holding your meter and main supply, owned by the grid operator. The fuse box is the board with circuit breakers and RCD protection inside it — that is what we replace.' },
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

// ---------------------------------------------------------------------------
// Conversie- + SEO/AI-content voor /groepenkast-amsterdam (NL) en /en-gb/...
// ---------------------------------------------------------------------------

/** Schouwtarief — volledig verrekend bij akkoord op de offerte. */
export const groupSurveyFee = prices.groepenkastSurvey;

export const groupChips = {
  nl: ['4,9/5 uit 59 Google-reviews', 'Volgens NEN 1010', 'Eigen monteurs', 'Amsterdam en omgeving', 'Vaste prijs voor start'],
  en: ['4.9/5 from 59 Google reviews', 'Installed to NEN 1010', 'Our own engineers', 'Amsterdam and surrounding area', 'Fixed price before we start'],
};

/** Kort, citeerbaar antwoord direct onder de hero (AI-vindbaarheid). */
export const groupShortAnswer = {
  nl: `Kort antwoord: een groepenkast vervangen in Amsterdam kost bij VoltFix vanaf ${groupMoney(prices.groepenkast1Phase, 'nl')}. Een 3-fase basispakket start vanaf ${groupMoney(prices.groepenkast3Phase, 'nl')} en een uitgebreide 3-fase kast vanaf ${groupMoney(prices.groepenkast3PhaseExtended, 'nl')}. Dit zijn all-in richtprijzen incl. montage, materiaal en 21% btw. De definitieve vaste prijs bevestigen we na foto- of schouwcontrole.`,
  en: `Short answer: replacing a fuse box in Amsterdam costs from ${groupMoney(prices.groepenkast1Phase, 'en')} at VoltFix. A three-phase basic package starts from ${groupMoney(prices.groepenkast3Phase, 'en')} and an extended three-phase board from ${groupMoney(prices.groepenkast3PhaseExtended, 'en')}. These are all-in guide prices including installation, materials and 21% VAT. We confirm the final fixed price after a photo review or site inspection.`,
};

export const groupSurveyNote = {
  nl: `Liever zekerheid vooraf? Plan een schouw van ${groupMoney(groupSurveyFee, 'nl')} — volledig verrekend zodra je akkoord geeft op de vaste prijs.`,
  en: `Prefer certainty up front? Book a site inspection for ${groupMoney(groupSurveyFee, 'en')} — fully deducted once you accept the fixed price.`,
};

export type GroupSection = { id: string; q: string; short: string; body: string[]; links?: { href: string; label: string }[] };

/** Lange informatieve SEO-secties: vraagkop, kort antwoord, daarna uitleg. */
export function groupSections(lang: GroupLocale): GroupSection[] {
  return lang === 'en' ? [
    { id: 'stoppenkast', q: 'Replacing an old wire-fuse box (stoppenkast)?', short: 'Yes — an old wire-fuse board is replaced with a modern consumer unit from €695 all-in.', body: ['Homes in Amsterdam built before roughly 1975 often still have ceramic screw fuses, no RCD protection and too few circuits for today’s appliances. We replace the whole board, check the earthing and the existing wiring, and label every circuit.', 'If the wiring or earthing turns out to be unsafe, we tell you before we start and price that work separately — never as a surprise on the invoice.'] },
    { id: 'meterkast', q: 'Meter cupboard or fuse box — what is the difference?', short: 'The meter cupboard is the space; the fuse box is the board with your circuit protection inside it.', body: ['Your grid operator owns the meter and the main supply. VoltFix works on the fuse box: circuit breakers, RCDs or RCBOs, wiring inside the board, testing and labelling. Space in the cupboard determines how many circuits fit, which is why a photo of the open cupboard tells us so much.'] },
    { id: 'fase', q: 'Single-phase or three-phase — which do I need?', short: 'Single-phase suits most flats; three-phase is for homes with heavier loads or an existing three-phase supply.', body: ['A three-phase board only makes sense when your grid connection already supplies three phases, or when the grid operator upgrades it. Induction cooking, a heat pump, solar panels and an EV charger together often justify the extended three-phase package with 10–12 circuits.', 'Upgrading the grid connection itself is arranged and invoiced by your grid operator, separately from our package.'], links: [{ href: '/en-gb/ev-charger-installation-amsterdam', label: 'EV charger installation Amsterdam' }] },
    { id: 'inductie', q: 'Can induction cooking or a Perilex socket be included?', short: 'Yes — a cooker circuit for induction or Perilex is +€149 all-in.', body: ['Induction hobs need their own protected circuit. We fit it while the board is open, which is cheaper than a separate visit later.'], links: [{ href: '/en-gb/perilex-amsterdam', label: 'Perilex socket Amsterdam' }] },
    { id: 'zonnepanelen', q: 'Do solar panels need their own circuit?', short: 'Yes — a dedicated PV circuit for the inverter is +€129 all-in.', body: ['A separate circuit for the inverter keeps your solar installation compliant and makes fault-finding straightforward. We check the cable route and the available space during the photo review.'] },
    { id: 'laadpaal', q: 'Preparing for an EV charger?', short: 'An EV charger needs a dedicated circuit; the extended three-phase package from €1,095 leaves room for it.', body: ['If a charge point is planned, plan the board around it. We reserve capacity and circuits so the charger can be added without opening the board twice.'], links: [{ href: '/en-gb/ev-charger-installation-amsterdam', label: 'EV charger installation Amsterdam' }] },
    { id: 'extra-groepen', q: 'How many circuits do I need?', short: 'Most Amsterdam flats need 6–8 circuits; larger homes with heavy appliances need 10–12.', body: ['Kitchen, washing machine, bathroom, cooker and lighting each deserve their own protection. If you are unsure, choose “I’m not sure, check my photo” and we advise on the circuit count before quoting.'] },
    { id: 'werkwijze', q: 'How does the work go?', short: 'Photo or inspection, fixed price, appointment, replacement, testing and labelling — usually within a working day.', body: ['We agree in advance how long the power will be off. Afterwards you receive a tested, labelled board, the old one removed, an invoice and your warranty.'] },
    { id: 'garantie', q: 'What warranty and safety standards apply?', short: '12 months on our workmanship, 2 years manufacturer warranty on materials, all work to NEN 1010.', body: ['We use leading-brand components and test every circuit after installation.'] },
    { id: 'wijken', q: 'Which areas do you cover?', short: 'All Amsterdam districts plus Amstelveen, Diemen and the surrounding area.', body: ['Centrum, West, Zuid, Oost, Noord, De Pijp and IJburg included.'], links: [{ href: '/en-gb/electrician-amsterdam-centre', label: 'Electrician Amsterdam Centre' }, { href: '/en-gb/electrician-amsterdam-west', label: 'Electrician Amsterdam West' }, { href: '/en-gb/electrician-amsterdam-zuid', label: 'Electrician Amsterdam Zuid' }, { href: '/en-gb/electrician-amstelveen', label: 'Electrician Amstelveen' }] },
  ] : [
    { id: 'stoppenkast', q: 'Oude stoppenkast vervangen — kan dat?', short: `Ja — een oude stoppenkast vervangen we door een moderne groepenkast vanaf ${groupMoney(prices.groepenkast1Phase, 'nl')} all-in.`, body: ['Woningen in Amsterdam van vóór ongeveer 1975 hebben vaak nog keramische stoppen, geen aardlekbeveiliging en te weinig groepen voor het huidige gebruik. We vervangen de hele kast, controleren de aarding en de bestaande bedrading en labelen alle groepen.', 'Blijkt de bedrading of aarding onveilig? Dan hoor je dat vóór de start en prijzen we dat apart — nooit als verrassing op de factuur.'] },
    { id: 'meterkast', q: 'Meterkast of groepenkast — wat is het verschil?', short: 'De meterkast is de ruimte, de groepenkast is de kast met je groepen en beveiligingen daarin.', body: ['De meter en de hoofdaansluiting zijn van de netbeheerder. VoltFix werkt aan de groepenkast: installatieautomaten, aardlekschakelaars of aardlekautomaten, de bedrading in de kast, testen en labelen. De ruimte in de meterkast bepaalt hoeveel groepen erin passen — daarom zegt een foto van de geopende meterkast zoveel.'] },
    { id: 'fase', q: '1-fase of 3-fase — wat heb ik nodig?', short: '1-fase past bij de meeste appartementen; 3-fase bij woningen met krachtstroom of zware belasting.', body: ['Een 3-fase groepenkast heeft alleen zin als je aansluiting al drie fasen levert, of als de netbeheerder verzwaart. Inductie, warmtepomp, zonnepanelen en een laadpaal samen rechtvaardigen vaak het uitgebreide 3-fase pakket met 10–12 groepen.', 'De verzwaring van de netaansluiting zelf regelt en factureert de netbeheerder apart van ons pakket.'], links: [{ href: '/3-fase-aansluiting-amsterdam', label: '3-fase aansluiting Amsterdam' }] },
    { id: 'inductie', q: 'Kan een kookgroep voor inductie of perilex mee?', short: `Ja — een kookgroep voor inductie of perilex is +${groupMoney(prices.groepenkastInduction, 'nl')} all-in.`, body: ['Inductie vraagt een eigen beveiligde groep. Die leggen we aan terwijl de kast toch open is, wat goedkoper is dan een los bezoek later.'], links: [{ href: '/perilex-amsterdam', label: 'Perilex aansluiten Amsterdam' }] },
    { id: 'zonnepanelen', q: 'Hebben zonnepanelen een eigen groep nodig?', short: `Ja — een aparte PV-groep voor de omvormer is +${groupMoney(prices.groepenkastSolar, 'nl')} all-in.`, body: ['Een eigen groep voor de omvormer houdt je zonne-installatie conform en maakt storingzoeken eenvoudig. Bij de fotocontrole kijken we naar de kabelroute en de beschikbare ruimte.'] },
    { id: 'laadpaal', q: 'Groepenkast voorbereiden op een laadpaal?', short: `Een laadpaal vraagt een eigen groep; het uitgebreide 3-fase pakket vanaf ${groupMoney(prices.groepenkast3PhaseExtended, 'nl')} houdt daar ruimte voor.`, body: ['Staat een laadpaal op de planning, richt de kast daar dan meteen op in. We reserveren capaciteit en groepen zodat de laadpaal later kan worden aangesloten zonder de kast twee keer open te maken.'], links: [{ href: '/laadpaal-amsterdam', label: 'Laadpaal installeren Amsterdam' }] },
    { id: 'extra-groepen', q: 'Hoeveel groepen heb ik nodig?', short: 'De meeste Amsterdamse appartementen hebben 6–8 groepen nodig, grotere woningen met zware apparatuur 10–12.', body: ['Keuken, wasmachine, badkamer, kookgroep en verlichting verdienen elk een eigen beveiliging. Twijfel je? Kies “Ik weet het niet, check mijn foto” — dan adviseren we het aantal groepen vóór de prijs.'] },
    { id: 'werkwijze', q: 'Hoe verloopt het werk?', short: 'Foto of schouw, vaste prijs, afspraak, vervanging, testen en labelen — meestal binnen een werkdag.', body: ['We spreken vooraf af hoe lang de stroom uit is. Daarna heb je een geteste, gelabelde kast, is de oude afgevoerd en ontvang je factuur en garantie.'] },
    { id: 'garantie', q: 'Welke garantie en veiligheidsnormen gelden?', short: '12 maanden garantie op ons werk, 2 jaar fabrieksgarantie op materialen, alles volgens NEN 1010.', body: ['We werken met A-merk componenten en meten na installatie elke groep door.'] },
    { id: 'wijken', q: 'In welke wijken werken jullie?', short: 'Alle Amsterdamse stadsdelen plus Amstelveen, Diemen en omgeving.', body: ['Centrum, West, Zuid, Oost, Noord, De Pijp en IJburg inbegrepen.'], links: [{ href: '/elektricien-amsterdam-centrum', label: 'Elektricien Amsterdam Centrum' }, { href: '/elektricien-amsterdam-west', label: 'Elektricien Amsterdam West' }, { href: '/elektricien-amsterdam-zuid', label: 'Elektricien Amsterdam Zuid' }, { href: '/elektricien-amstelveen', label: 'Elektricien Amstelveen' }] },
  ];
}
