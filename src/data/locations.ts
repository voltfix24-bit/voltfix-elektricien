// Hyperlocal landing page data source.
// Voeg een nieuwe wijk of regio toe door één entry hieronder te plaatsen
// en een dun routebestand aan te maken dat `LocationPage` rendert.

import { business, responsePromiseNl } from "@/lib/business";
import { eurNl, prices } from "@/lib/pricing";

export type LocationFaq = { q: string; a: string };

export type Location = {
  /** URL-pad, bv. "/elektricien-amsterdam-zuid" */
  path: string;
  /** Locatienaam zoals gebruikt in H1: bv. "Amsterdam Zuid", "Amstelveen" */
  name: string;
  /** Regio label voor breadcrumbs / cross-links */
  region: "Amsterdam" | "Regio Amsterdam";
  /** Meta title (max ~60 chars) */
  metaTitle: string;
  /** Meta description (max ~155 chars) */
  metaDescription: string;
  /** OG description (korter) */
  ogDescription: string;
  /** Eyebrow boven H1 */
  eyebrow: string;
  /** Intro paragraaf onder H1 */
  intro: string;
  /** WhatsApp default bericht voor deze locatie */
  whatsappMessage: string;
  /** Body content — kopjes + paragrafen, gebruikt in <Prose> */
  sections: Array<
    | { type: "p"; text: string }
    | { type: "h2"; text: string }
    | { type: "h3"; text: string }
    | { type: "ul"; items: string[] }
  >;
  /** FAQ, ook geëmitteerd als FAQPage schema */
  faqs: LocationFaq[];
  /** Buurt/wijk namen voor interne linking */
  neighborhoods?: string[];
  /** Postcodes die onder deze locatie vallen — helpt lokale relevantie */
  postcodes?: string[];
};

const sharedFaqs = (name: string): LocationFaq[] => [
  {
    q: `Hoe snel is er een spoed elektricien in ${name}?`,
    a: `${responsePromiseNl}, dus ook in ${name}. De verwachte aankomsttijd spreken we bij het telefoongesprek direct met je af. Onze spoedservice is 24/7 bereikbaar op ${business.phoneDisplay}.`,
  },
  {
    q: `Wat kost een elektricien in ${name}?`,
    a: "U krijgt altijd een vaste prijsafspraak vooraf. Voorrijkosten en uurtarief bespreken we telefonisch of via WhatsApp, zodat u nooit voor verrassingen komt te staan.",
  },
  {
    q: "Zijn jullie gecertificeerd en geven jullie garantie?",
    a: "Onze monteurs werken volgens de NEN 1010-norm en we geven 12 maanden garantie op uitgevoerd werk en geplaatste materialen. VoltFix is KvK-geregistreerd (95572589) en volledig verzekerd.",
  },
  {
    q: `Kan ik ook een offerte online aanvragen voor ${name}?`,
    a: `Ja. Via onze offerte-pagina kunt u foto's van uw meterkast of situatie uploaden. U krijgt binnen 24 uur een indicatie voor uw klus in ${name}, meestal met vaste prijs.`,
  },
];

export const locations: Location[] = [
  {
    path: "/elektricien-amsterdam-zuid",
    name: "Amsterdam Zuid",
    region: "Amsterdam",
    metaTitle: "Elektricien Amsterdam Zuid | Spoed 24/7 | VoltFix",
    metaDescription:
      "Elektricien Amsterdam Zuid: 24/7 spoed, groepenkast en perilex in Apollobuurt, Rivierenbuurt en Zuidas. Vaste prijs vooraf.",
    ogDescription: "Lokale elektricien in Amsterdam Zuid — Apollobuurt, Rivierenbuurt en Zuidas. Vaste prijs vooraf.",
    eyebrow: "Lokale elektricien in Amsterdam Zuid",
    intro:
      "Van de Apollobuurt tot de Rivierenbuurt en de Zuidas: als lokale elektricien in Amsterdam Zuid kennen we de karakteristieke jaren '30 woningen, moderne torens op de Zuidas én de vaak volle meterkasten die daarbij horen.",
    whatsappMessage: "Hallo VoltFix, ik zoek een elektricien in Amsterdam Zuid.",
    neighborhoods: ["Apollobuurt", "Rivierenbuurt", "Zuidas", "Oud-Zuid", "Stadionbuurt", "Willemspark"],
    postcodes: ["1071", "1072", "1073", "1074", "1075", "1076", "1077", "1078", "1079", "1082", "1083"],
    sections: [
      { type: "p", text: "Zoekt u een betrouwbare elektricien in Amsterdam Zuid? VoltFix is uw lokale specialist voor spoed, storingen en installaties in de postcodes 1071 t/m 1083. We werken met vaste prijsafspraken vooraf, volgens NEN 1010 en met 12 maanden garantie op uitgevoerd werk." },
      { type: "h2", text: "Elektricien in Apollobuurt, Rivierenbuurt en Zuidas" },
      { type: "p", text: "De Apollobuurt en Willemspark staan vol met karakteristieke jaren '30 woningen met vaak een compacte, verouderde meterkast. In de Rivierenbuurt en Oud-Zuid zien we regelmatig etagewoningen waar de bewoners meer stroom nodig hebben voor inductie, warmtepomp of thuiswerkplek. Op de Zuidas werken we voor kantoren en penthouses met moderne installaties waar juist de aansturing (dimmers, KNX, smart home) om aandacht vraagt." },
      { type: "h2", text: "Veelvoorkomend werk in Amsterdam Zuid" },
      { type: "ul", items: [
        "Groepenkast vervangen in jaren '30 woningen aan de Beethovenstraat en Van Baerlestraat",
        "Extra groepen voor inductie of warmtepomp op de Zuidas en in Buitenveldert",
        "Kortsluiting door oude bedrading in monumentale panden in Oud-Zuid",
        "Verlichting, dimmers en spots in kantoorpanden aan de Zuidas",
        "Aardlekschakelaars vervangen en NEN 3140-keuringen voor bedrijven",
        "Laadpaal aansluiten op eigen parkeerplek in Buitenveldert en Rivierenbuurt",
      ]},
      { type: "h2", text: "Waarom een lokale elektricien in Zuid?" },
      { type: "p", text: "Amsterdam Zuid is druk, met veel eenrichtingsverkeer, laad- en losplekken en beperkte parkeerruimte rond de Zuidas. Een lokale monteur bespaart u aanrijtijd en frustratie: wij weten waar we snel kunnen parkeren rond de Cornelis Trooststraat, Beethovenplein of Gustav Mahlerlaan, zodat het uurtarief niet oploopt door zoektijd." },
      { type: "h2", text: "Spoed elektricien in Amsterdam Zuid" },
      { type: "p", text: "Zit u zonder stroom, heeft u kortsluiting of springt de aardlekschakelaar er steeds uit? Onze nood elektricien is 24/7 bereikbaar in Amsterdam Zuid. Bij spoed staan we vaak binnen 30–45 minuten voor de deur in Apollobuurt, Rivierenbuurt en op de Zuidas." },
    ],
    faqs: [
      { q: "Werken jullie in Amsterdam Zuid en op de Zuidas?", a: "Ja, VoltFix werkt dagelijks in Amsterdam Zuid — van de Apollobuurt en Rivierenbuurt tot kantoren op de Zuidas. Bij spoed staan we hier vaak binnen 30–45 minuten voor de deur." },
      { q: "Kunnen jullie een groepenkast in een jaren '30 woning in Zuid vervangen?", a: `Zeker. We hebben veel ervaring met de karakteristieke meterkasten in Amsterdam Zuid en passen alles aan volgens NEN 1010 met behoud van de bestaande structuur waar mogelijk. Standaard vervanging vanaf ${eurNl(prices.groepenkastFrom)}.` },
      { q: "Is de Zuidas met bedrijfspanden ook uw werkgebied?", a: "Ja, we voeren op de Zuidas regelmatig NEN 3140-keuringen, verlichtings- en dimmerprojecten en storingsoplossingen uit voor kantoren, restaurants en penthouses." },
      ...sharedFaqs("Amsterdam Zuid"),
    ],
  },
  {
    path: "/elektricien-amsterdam-west",
    name: "Amsterdam West",
    region: "Amsterdam",
    metaTitle: "Elektricien Amsterdam West | Spoed & Groepenkast | VoltFix",
    metaDescription:
      "Elektricien Amsterdam West: 24/7 spoed, groepenkast en perilex in De Baarsjes, Oud-West en Westerpark. Vaste prijs vooraf.",
    ogDescription: "Lokale elektricien in Amsterdam West — De Baarsjes, Oud-West, Bos en Lommer, Westerpark.",
    eyebrow: "Lokale elektricien in Amsterdam West",
    intro:
      "Van De Baarsjes en Bos en Lommer tot Westerpark, Oud-West en Houthavens: als lokale elektricien in Amsterdam West kennen we de smalle bovenhuizen, karakteristieke portieken en vaak volle meterkasten van de stad.",
    whatsappMessage: "Hallo VoltFix, ik zoek een elektricien in Amsterdam West.",
    neighborhoods: ["De Baarsjes", "Bos en Lommer", "Oud-West", "Westerpark", "Houthavens", "Kolenkit"],
    postcodes: ["1051", "1052", "1053", "1054", "1055", "1056", "1057", "1058"],
    sections: [
      { type: "p", text: "Zoekt u een betrouwbare elektricien in Amsterdam West? VoltFix is uw lokale specialist voor spoed, storingen en installaties in postcodes 1051 t/m 1058. Vaste prijsafspraak vooraf en 12 maanden garantie op uitgevoerd werk." },
      { type: "h2", text: "Elektricien in De Baarsjes, Bos en Lommer en Westerpark" },
      { type: "p", text: "De Baarsjes en Oud-West bestaan grotendeels uit bovenhuizen met compacte, verouderde meterkasten — vaak nog met keramische zekeringen. In Bos en Lommer en de Kolenkitbuurt zien we veel jaren '50/'60 woningen waar de installatie inmiddels aan vervanging toe is. In Westerpark en Houthavens draait het om moderne nieuwbouw, laadpalen en extra groepen voor warmtepompen." },
      { type: "h2", text: "Veelvoorkomend werk in Amsterdam West" },
      { type: "ul", items: [
        "Groepenkast vervangen in bovenhuizen in De Baarsjes en Oud-West",
        "Perilex-aansluiting voor inductie of oven aan de Kinkerstraat en Jan Evertsenstraat",
        "Kortsluiting en aardlekschakelaars die uitspringen in jaren '30 panden",
        "Verlichting, dimmers en spots plaatsen",
        "Extra groepen en NEN 3140-keuringen voor bedrijfjes in de Bellamybuurt",
        "Laadpaal aansluiten in Westerpark, Houthavens en Bos en Lommer",
      ]},
      { type: "h2", text: "Snel bij u in West: geen zoektocht naar een parkeerplek" },
      { type: "p", text: "De Kinkerbuurt, Bellamybuurt en Da Costabuurt zijn druk en parkeren is schaars. Wij kennen de straten van Amsterdam West en plannen bezoeken zo dat we snel binnen zijn — dat scheelt u uurtarief. Bij spoed rijden we via de S102 (Jan van Galenstraat) of A10 (Bos en Lommerplein) voor de snelste aanrijtijd." },
    ],
    faqs: [
      { q: "Zijn jullie snel in Amsterdam West bij een storing?", a: "Ja. Onze spoedmonteurs zijn bij storingen in Amsterdam West vaak binnen 30–60 minuten ter plaatse — 24/7, ook in het weekend." },
      { q: "Kunnen jullie in een klein bovenhuis in West een nieuwe groepenkast plaatsen?", a: `Ja, we passen de kast aan op de beschikbare ruimte in de meterkast en zorgen dat alles voldoet aan NEN 1010. Vanaf ${eurNl(prices.groepenkastFrom)} inclusief materiaal.` },
      { q: "Doen jullie ook perilex-aansluitingen voor huurwoningen in West?", a: "Ja. We leveren een gecertificeerd installatierapport, zodat u dit kunt indienen bij uw verhuurder of VvE." },
      ...sharedFaqs("Amsterdam West"),
    ],
  },
  {
    path: "/elektricien-amsterdam-oost",
    name: "Amsterdam Oost",
    region: "Amsterdam",
    metaTitle: "Elektricien Amsterdam Oost | 24/7 Spoed | VoltFix",
    metaDescription:
      "Elektricien Amsterdam Oost: 24/7 spoed, groepenkast en perilex in Indische Buurt, Watergraafsmeer en Dapperbuurt. Vaste prijs vooraf.",
    ogDescription: "Lokale elektricien in Amsterdam Oost — Indische Buurt, KNSM en Watergraafsmeer.",
    eyebrow: "Lokale elektricien in Amsterdam Oost",
    intro:
      "Van Indische Buurt en Oostelijk Havengebied tot Watergraafsmeer en Dapperbuurt: als lokale elektricien in Amsterdam Oost werken we in oude portieken én moderne nieuwbouwappartementen op KNSM- en Java-eiland.",
    whatsappMessage: "Hallo VoltFix, ik zoek een elektricien in Amsterdam Oost.",
    neighborhoods: ["Indische Buurt", "Oostelijk Havengebied", "Watergraafsmeer", "Dapperbuurt", "Transvaalbuurt", "KNSM-eiland", "Java-eiland"],
    postcodes: ["1091", "1092", "1093", "1094", "1095", "1096", "1097", "1098"],
    sections: [
      { type: "p", text: "VoltFix is de lokale elektricien in Amsterdam Oost — bereikbaar voor spoed, groepenkast, perilex, extra groepen en verlichting in postcodes 1091 t/m 1098. Altijd met vaste prijsafspraak vooraf en 12 maanden garantie." },
      { type: "h2", text: "Elektricien in Indische Buurt, Watergraafsmeer en KNSM" },
      { type: "p", text: "De Indische Buurt en Dapperbuurt kenmerken zich door bovenhuizen met vaak verouderde bedrading uit de jaren '20 en '30. In Watergraafsmeer zien we veel eengezinswoningen waar de groepenkast toe is aan uitbreiding voor inductie of warmtepomp. Op KNSM- en Java-eiland en Sporenburg draait het juist om moderne appartementen met KNX, laadpalen en extra groepen." },
      { type: "h2", text: "Veelvoorkomend werk in Amsterdam Oost" },
      { type: "ul", items: [
        "Groepenkast vervangen in de Indische Buurt en Transvaalbuurt",
        "Perilex-aansluiting voor inductie of droger in Watergraafsmeer",
        "Storingen en kortsluitingen oplossen in oude portieken",
        "Laadpaal en extra groepen op KNSM en Java-eiland",
        "Verlichting, spots en dimmers plaatsen",
        "NEN 3140-keuring voor bedrijfjes rond het Javaplein",
      ]},
      { type: "h2", text: "Snel op locatie in Oost — ook via de tunnels" },
      { type: "p", text: "Rond de Piet Heintunnel en Zeeburgertunnel is verkeer wisselend. We rijden vroeg of via Ringweg Oost (A10) voor snelle aanrijtijden op KNSM, Java-eiland en IJburg." },
    ],
    faqs: [
      { q: "Werken jullie in Amsterdam Oost en op de eilanden?", a: "Ja, we werken dagelijks in Amsterdam Oost — van de Indische Buurt tot KNSM en Java-eiland. Bij spoed vaak binnen 45 minuten ter plaatse." },
      { q: "Kunnen jullie een laadpaal aansluiten op Sporenburg of KNSM?", a: `Ja. Bij VvE-parkeerplaatsen regelen we ook overleg met de VvE en aparte kWh-meter. Vanaf ${eurNl(prices.laadpaalLocationFrom)} exclusief laadpaal.` },
      { q: "Hebben jullie ervaring met oude bedrading in de Indische Buurt?", a: "Zeker. In bovenhuizen aan de Molukkenstraat en Javastraat vervangen we regelmatig verouderde stoffen mantelkabels door een moderne, veilige installatie volgens NEN 1010." },
      ...sharedFaqs("Amsterdam Oost"),
    ],
  },
  {
    path: "/elektricien-amsterdam-noord",
    name: "Amsterdam Noord",
    region: "Amsterdam",
    metaTitle: "Elektricien Amsterdam Noord | Spoed & Laadpaal | VoltFix",
    metaDescription:
      "Elektricien Amsterdam Noord: 24/7 spoed, groepenkast, perilex en laadpaal in NDSM, Overhoeks en Nieuwendam. Snel over het IJ.",
    ogDescription: "Lokale elektricien in Amsterdam Noord — NDSM, Overhoeks en tuindorpen. Vaste prijs vooraf.",
    eyebrow: "Lokale elektricien in Amsterdam Noord",
    intro:
      "Van NDSM en Overhoeks tot Nieuwendam, Tuindorp Oostzaan en Buiksloterham: als lokale elektricien in Amsterdam Noord staan we snel bij u — in nieuwbouw, tuindorpen én industriële lofts.",
    whatsappMessage: "Hallo VoltFix, ik zoek een elektricien in Amsterdam Noord.",
    neighborhoods: ["NDSM", "Overhoeks", "Nieuwendam", "Buiksloterham", "Tuindorp Oostzaan", "Molenwijk", "Van der Pekbuurt"],
    postcodes: ["1021", "1022", "1023", "1024", "1025", "1031", "1032", "1033", "1034", "1035", "1036"],
    sections: [
      { type: "p", text: "VoltFix is de lokale elektricien in Amsterdam Noord — voor spoed, groepenkast, perilex en installaties in postcodes 1021 t/m 1036. Altijd vaste prijsafspraak vooraf, volgens NEN 1010, met 12 maanden garantie." },
      { type: "h2", text: "Elektricien in NDSM, Overhoeks en Nieuwendam" },
      { type: "p", text: "Amsterdam Noord groeit snel. In Overhoeks en NDSM werken we in moderne torens en lofts met warmtepomp, inductie en laadpaal-installaties. In Nieuwendam, Tuindorp Oostzaan en de Van der Pekbuurt zien we juist de klassieke tuindorpen waarin de oorspronkelijke installatie uit de jaren '20/'30 vaak nog aanwezig is — en aan vervanging toe." },
      { type: "h2", text: "Veelvoorkomend werk in Amsterdam Noord" },
      { type: "ul", items: [
        "Groepenkast vervangen in tuindorpen (Oostzaan, Nieuwendam, Van der Pekbuurt)",
        "Perilex voor inductie of oven in nieuwbouw op Overhoeks",
        "Spoed bij kortsluiting en stroomstoring in Buiksloterham",
        "Laadpaal en zonnepanelen aansluiten in eengezinswoningen",
        "Extra groepen voor warmtepomp bij verduurzaming",
        "Verlichting en dimmers in loft-verbouwingen op NDSM",
      ]},
      { type: "h2", text: "Snel over het IJ" },
      { type: "p", text: "Vanuit Amsterdam Centrum rijden we via de IJ-tunnel, Coentunnel of Schellingwouderbrug — bij spoed nemen we de snelste route en zijn we vaak binnen 30–45 minuten op locatie in heel Amsterdam Noord." },
    ],
    faqs: [
      { q: "Werken jullie in heel Amsterdam Noord, ook op NDSM?", a: "Ja, van NDSM en Overhoeks tot Nieuwendam en Tuindorp Oostzaan — VoltFix is dagelijks in Amsterdam Noord." },
      { q: "Kunnen jullie een laadpaal plaatsen bij een woning in Nieuwendam?", a: `Ja. We installeren laadpalen in eigen oprit of gedeelde VvE-parkeerplaats. Standaard vanaf ${eurNl(prices.laadpaalLocationFrom)} inclusief extra groep.` },
      { q: "Is de meterkast in mijn tuindorpwoning geschikt voor moderne installaties?", a: "Meestal moet de kast worden vervangen om verantwoord een warmtepomp of inductie te voeden. We geven u een eerlijk advies en vaste prijs vooraf." },
      ...sharedFaqs("Amsterdam Noord"),
    ],
  },
  {
    path: "/elektricien-amsterdam-centrum",
    name: "Amsterdam Centrum",
    region: "Amsterdam",
    metaTitle: "Elektricien Amsterdam Centrum | Grachtenpanden | VoltFix",
    metaDescription:
      "Elektricien Amsterdam Centrum: 24/7 spoed in grachtenpanden en horeca, Jordaan tot Nieuwmarkt. NEN 1010, vaste prijs vooraf.",
    ogDescription: "Lokale elektricien in Amsterdam Centrum — Jordaan, Grachtengordel en horeca.",
    eyebrow: "Lokale elektricien in Amsterdam Centrum",
    intro:
      "Van grachtenpanden en monumenten in de Jordaan tot horeca op de Wallen en winkels op de Nieuwmarkt: als lokale elektricien in Amsterdam Centrum kennen we de bijzondere eisen van historische panden en drukke horeca.",
    whatsappMessage: "Hallo VoltFix, ik zoek een elektricien in Amsterdam Centrum.",
    neighborhoods: ["Jordaan", "Grachtengordel", "Nieuwmarkt", "Wallen", "Haarlemmerbuurt", "Plantage"],
    postcodes: ["1011", "1012", "1013", "1015", "1016", "1017", "1018"],
    sections: [
      { type: "p", text: "VoltFix is de lokale elektricien in Amsterdam Centrum — met ervaring in monumentale grachtenpanden, horeca en winkels in postcodes 1011 t/m 1018. Altijd vaste prijs vooraf en volgens NEN 1010, met 12 maanden garantie." },
      { type: "h2", text: "Elektricien in Jordaan, Grachtengordel en Nieuwmarkt" },
      { type: "p", text: "Grachtenpanden hebben vaak een compacte meterkast in de kelder of onder de trap, oude bedrading en beperkte ruimte voor uitbreiding. Wij zijn gespecialiseerd in nette, veilige installaties in monumentale panden — met respect voor de originele afwerking en volgens de eisen die de gemeente Amsterdam stelt aan werkzaamheden in beschermde stadsgezichten." },
      { type: "h2", text: "Veelvoorkomend werk in Amsterdam Centrum" },
      { type: "ul", items: [
        "Groepenkast vervangen in grachtenpanden in de Jordaan en op de Herengracht",
        "Extra groepen voor horeca en keukens rond de Nieuwmarkt en Wallen",
        "Verlichting, dimmers en spots plaatsen in winkels op de Haarlemmerstraat",
        "Aardlekschakelaars die uitspringen in etagewoningen boven horeca",
        "NEN 3140-keuring voor horeca, hotels en winkels",
        "Storingen oplossen op de Wallen buiten kantoortijden",
      ]},
      { type: "h2", text: "Werken in monumenten: waar wij op letten" },
      { type: "p", text: "In een monumentaal grachtenpand mag u niet zomaar overal bekabeling in muren frezen. Wij werken zoveel mogelijk in bestaande sparingen en met opbouwmateriaal in monumentwaardige kleuren, zodat de installatie voldoet én het pand zijn karakter behoudt. Waar nodig stemmen we vooraf af met de Vereniging van Eigenaren of de monumentencommissie." },
    ],
    faqs: [
      { q: "Werken jullie in monumentale grachtenpanden?", a: "Ja, we werken dagelijks in monumentale panden in Amsterdam Centrum en houden rekening met beperkte meterkastruimte en behoud van bestaande structuur. We stemmen zo nodig af met de VvE." },
      { q: "Kunnen jullie na sluitingstijd komen bij een café op de Wallen?", a: "Ja. Voor horeca in het Centrum werken we vaak 's nachts of vroeg in de ochtend, zodat de zaak overdag open kan blijven." },
      { q: "Doen jullie ook periodieke NEN 3140-keuring voor hotels en horeca?", a: "Ja, we voeren NEN 3140-keuringen uit voor horeca, winkels en hotels in het Centrum en leveren u een compleet rapport voor uw verzekering." },
      ...sharedFaqs("Amsterdam Centrum"),
    ],
  },
  {
    path: "/elektricien-amsterdam-de-pijp",
    name: "De Pijp",
    region: "Amsterdam",
    metaTitle: "Elektricien De Pijp Amsterdam | Spoed & Horeca | VoltFix",
    metaDescription:
      "Elektricien De Pijp Amsterdam: 24/7 spoed, groepenkast en perilex rond Albert Cuyp, Sarphatipark en Ceintuurbaan. Ook horeca. Vaste prijs vooraf.",
    ogDescription: "Lokale elektricien in De Pijp — Albert Cuyp, Sarphatipark en horeca.",
    eyebrow: "Lokale elektricien in De Pijp",
    intro:
      "Van Albert Cuyp en Sarphatipark tot Ceintuurbaan en Ferdinand Bolstraat: als lokale elektricien in De Pijp werken we dagelijks in karakteristieke bovenhuizen én in de bruisende horeca van deze wijk.",
    whatsappMessage: "Hallo VoltFix, ik zoek een elektricien in De Pijp Amsterdam.",
    neighborhoods: ["Albert Cuyp", "Sarphatipark", "Ceintuurbaan", "Oude Pijp", "Nieuwe Pijp", "Diamantbuurt"],
    postcodes: ["1072", "1073", "1074"],
    sections: [
      { type: "p", text: "VoltFix is de lokale elektricien in De Pijp — voor spoed, groepenkast, perilex en horeca-installaties in postcodes 1072, 1073 en 1074. Altijd vaste prijsafspraak vooraf, met 12 maanden garantie." },
      { type: "h2", text: "Elektricien in Oude Pijp, Nieuwe Pijp en rondom Sarphatipark" },
      { type: "p", text: "De Pijp heeft veel karakteristieke bovenhuizen met compacte meterkasten en oude bedrading. Wij passen alles aan volgens NEN 1010 met minimale overlast — vaak zonder frezen, zodat het schilder- en behangwerk in de huurwoning of koopetage netjes blijft. In de Diamantbuurt en Nieuwe Pijp zien we regelmatig etagewoningen waar de originele installatie uit de jaren '20/'30 nog aanwezig is." },
      { type: "h2", text: "Veelvoorkomend werk in De Pijp" },
      { type: "ul", items: [
        "Groepenkast vervangen in bovenhuizen aan de Van Woustraat en Ferdinand Bolstraat",
        "Extra groepen voor inductie of warmtepomp",
        "Perilex-aansluiting voor keukens",
        "Verlichting en spots voor horeca op de Albert Cuypmarkt",
        "Kortsluiting en spoedstoringen oplossen — vaak 's avonds",
        "NEN 3140-keuring voor cafés en restaurants",
      ]},
      { type: "h2", text: "Horeca in De Pijp: buiten uw drukste uren" },
      { type: "p", text: "Rond de Albert Cuyp en Gerard Douplein zijn cafés en restaurants het grootste deel van de dag open. We plannen werk in overleg — 's ochtends vroeg vóór openingstijd of 's nachts na sluitingstijd — zodat u geen omzet mist." },
    ],
    faqs: [
      { q: "Werken jullie ook voor horeca in De Pijp?", a: "Ja, we werken regelmatig voor cafés en restaurants rond de Albert Cuypmarkt en Ceintuurbaan — inclusief NEN 3140-keuringen en werk 's nachts of vroeg in de ochtend." },
      { q: "Kunnen jullie een groepenkast plaatsen zonder frezen in mijn huurwoning?", a: "Vaak wel. In veel bovenhuizen in De Pijp lukt vervanging in de bestaande sparingen, zodat behangwerk niet beschadigd raakt." },
      { q: "Doen jullie ook perilex voor een huurwoning in De Pijp?", a: "Ja. We regelen op verzoek een installatierapport voor uw verhuurder en werken volgens de eisen van de VvE." },
      ...sharedFaqs("De Pijp"),
    ],
  },
  {
    path: "/elektricien-amsterdam-ijburg",
    name: "IJburg",
    region: "Amsterdam",
    metaTitle: "Elektricien IJburg Amsterdam | Laadpaal & Spoed | VoltFix",
    metaDescription:
      "Elektricien IJburg Amsterdam: laadpaal, extra groepen en spoed op Steigereiland, Haveneiland en Rieteilanden. 24/7 bereikbaar, vaste prijs vooraf.",
    ogDescription: "Lokale elektricien op IJburg — laadpalen, warmtepomp en spoed.",
    eyebrow: "Lokale elektricien op IJburg",
    intro:
      "Van Steigereiland en Haveneiland tot Rieteilanden en Centrumeiland: als lokale elektricien op IJburg werken we in de moderne nieuwbouw, waterwoningen én laadpaal-installaties van deze jonge wijk.",
    whatsappMessage: "Hallo VoltFix, ik zoek een elektricien op IJburg.",
    neighborhoods: ["Steigereiland", "Haveneiland", "Rieteilanden", "Centrumeiland", "Zeeburgereiland"],
    postcodes: ["1086", "1087", "1088"],
    sections: [
      { type: "p", text: "VoltFix is de lokale elektricien op IJburg — voor laadpalen, extra groepen, groepenkast en spoed in postcodes 1086 t/m 1088. Altijd vaste prijs vooraf en volgens NEN 1010, met 12 maanden garantie." },
      { type: "h2", text: "Elektricien op Steigereiland, Haveneiland en Rieteilanden" },
      { type: "p", text: "IJburg is een moderne wijk met veel nieuwbouw, elektrisch rijden en zonnepanelen. Wij installeren laadpalen — inclusief overleg met de VvE bij gedeelde parkeergarages op Haveneiland — extra groepen voor warmtepomp of inductie, en zonnepaneel-installaties tot aan de omvormer en groepenkast toe." },
      { type: "h2", text: "Veelvoorkomend werk op IJburg" },
      { type: "ul", items: [
        "Laadpaal aansluiten in eigen parkeervak of VvE-garage",
        "Extra groepen voor warmtepomp of inductie",
        "Groepenkast uitbreiden bij nieuwbouw op Steigereiland",
        "Zonnepanelen op omvormer aansluiten in waterwoningen",
        "Spoed bij kortsluiting of aardlekschakelaar",
        "Smart home en KNX-installaties in nieuwbouw",
      ]},
      { type: "h2", text: "Laadpalen op IJburg — vaak binnen 1 dag" },
      { type: "p", text: "Op IJburg installeren we laadpalen meestal binnen 1 werkdag: nieuwe kabel vanaf de groepenkast, extra groep met eigen kWh-meter en aansluiting van uw laadpaal. Bij gedeelde parkeergarages regelen we ook de aanmelding bij de VvE en netbeheerder Liander." },
    ],
    faqs: [
      { q: "Kunnen jullie een laadpaal aansluiten op IJburg?", a: "Ja, VoltFix installeert laadpalen op IJburg — vaak inclusief extra groep en aparte kWh-meter. We regelen ook de aanmelding bij de netbeheerder en, waar nodig, bij de VvE." },
      { q: "Wat kost een laadpaal installeren op IJburg?", a: `Vanaf ${eurNl(prices.laadpaalLocationFrom)} exclusief laadpaal, voor een standaard aansluiting in eigen parkeervak binnen ~10 meter van de groepenkast. Bij langere kabels of VvE-installaties geven we een vaste prijs vooraf.` },
      { q: "Werken jullie ook op Zeeburgereiland?", a: "Ja, Zeeburgereiland valt in ons dagelijkse werkgebied — voor spoed vaak binnen 30 minuten ter plaatse." },
      ...sharedFaqs("IJburg"),
    ],
  },
  // Regio Amsterdam — hyperlocal expansion
  {
    path: "/elektricien-amstelveen",
    name: "Amstelveen",
    region: "Regio Amsterdam",
    metaTitle: "Elektricien Amstelveen | Spoed & Groepenkast | VoltFix",
    metaDescription:
      "Elektricien Amstelveen: 24/7 spoed, groepenkast, perilex en laadpaal in Bovenkerk, Westwijk en Elsrijk. Vaste prijs vooraf en 12 maanden garantie.",
    ogDescription: "Lokale elektricien in Amstelveen. 24/7 bereikbaar, vaste prijs vooraf.",
    eyebrow: "Lokale elektricien in Amstelveen",
    intro:
      "Van Amstelveen-Oost tot Bovenkerk, Westwijk en Elsrijk: als elektricien werken we dagelijks in Amstelveen — van jaren '60 rijtjeswoningen tot moderne appartementen en villa's aan de Amstel.",
    whatsappMessage: "Hallo VoltFix, ik zoek een elektricien in Amstelveen.",
    neighborhoods: ["Amstelveen-Oost", "Bovenkerk", "Westwijk", "Elsrijk", "Randwijck", "Groenelaan"],
    postcodes: ["1181", "1182", "1183", "1184", "1185", "1186", "1187", "1188"],
    sections: [
      { type: "p", text: "VoltFix is de lokale elektricien in Amstelveen — voor spoed, groepenkast, perilex, laadpaal en installaties in postcodes 1181 t/m 1188. Altijd vaste prijsafspraak vooraf, volgens NEN 1010, met 12 maanden garantie." },
      { type: "h2", text: "Elektricien in Bovenkerk, Westwijk en Elsrijk" },
      { type: "p", text: "Amstelveen heeft veel jaren '60 en '70 rijtjeshuizen in Westwijk, Groenelaan en Bankras, waar we regelmatig de originele groepenkast vervangen door een moderne installatie. In Elsrijk en Randwijck werken we in ruimere villa's — met vaak een aparte technische ruimte voor warmtepomp, zonnepanelen en laadpaal." },
      { type: "h2", text: "Veelvoorkomend werk in Amstelveen" },
      { type: "ul", items: [
        "Groepenkast vervangen bij verouderde installaties in Westwijk en Groenelaan",
        "Perilex-aansluiting voor inductie of oven",
        "Laadpaal op eigen oprit in Elsrijk, Randwijck en Bovenkerk",
        "Extra groepen voor warmtepomp bij verduurzaming",
        "Storingen en NEN 3140-keuringen voor bedrijven",
        "Verlichting, spots en dimmers in tuinen en villa's",
      ]},
      { type: "h2", text: "Snel naar Amstelveen via de A9 en Amstelveenseweg" },
      { type: "p", text: "Vanuit Amsterdam Zuid en Buitenveldert zijn we via de Amstelveenseweg of de A9 vaak binnen 30 minuten op locatie in Amstelveen — ook bij spoed 's avonds of in het weekend." },
    ],
    faqs: [
      { q: "Rijdt VoltFix ook naar Amstelveen?", a: "Ja, Amstelveen valt in ons dagelijkse werkgebied. Bij spoed zijn we vaak binnen 30–45 minuten ter plaatse, vanuit Amsterdam Zuid." },
      { q: "Wat kost een groepenkast vervangen in Amstelveen?", a: `Vanaf ${eurNl(prices.groepenkastFrom)} voor een standaard vervanging, inclusief materiaal en NEN 1010-oplevering. U krijgt altijd een vaste prijs vooraf.` },
      { q: "Kunnen jullie een laadpaal plaatsen op mijn oprit in Elsrijk?", a: `Ja. Voor een standaard installatie op eigen oprit rekent u op vanaf ${eurNl(prices.laadpaalLocationFrom)} exclusief laadpaal. We regelen ook de netbeheerder-aanmelding.` },
      ...sharedFaqs("Amstelveen"),
    ],
  },
  {
    path: "/elektricien-haarlem",
    name: "Haarlem",
    region: "Regio Amsterdam",
    metaTitle: "Elektricien Haarlem | Spoed 24/7 & Groepenkast | VoltFix",
    metaDescription:
      "Elektricien Haarlem: 24/7 spoed, groepenkast en perilex in Centrum, Noord, Oost en Schalkwijk. Vaste prijs vooraf, NEN 1010.",
    ogDescription: "Lokale elektricien in Haarlem. Snel ter plaatse en met vaste prijs vooraf.",
    eyebrow: "Lokale elektricien in Haarlem",
    intro:
      "Van monumentale panden in het centrum tot moderne nieuwbouw in Schalkwijk en Haarlem-Noord: als elektricien werken we dagelijks in Haarlem met vaste prijs vooraf en 12 maanden garantie.",
    whatsappMessage: "Hallo VoltFix, ik zoek een elektricien in Haarlem.",
    neighborhoods: ["Haarlem-Centrum", "Haarlem-Noord", "Schalkwijk", "Haarlem-Oost", "Vondelkwartier", "Ramplaankwartier"],
    postcodes: ["2011", "2012", "2013", "2014", "2015", "2021", "2022", "2023", "2024", "2025", "2031", "2032", "2033", "2034", "2035"],
    sections: [
      { type: "p", text: "VoltFix is uw lokale elektricien in Haarlem — voor spoed, groepenkast, perilex en installaties in postcodes 2011 t/m 2035. Altijd vaste prijs vooraf, volgens NEN 1010, met 12 maanden garantie op uitgevoerd werk." },
      { type: "h2", text: "Elektricien in Haarlem-Centrum, Noord en Schalkwijk" },
      { type: "p", text: "Haarlem-Centrum staat vol met monumentale panden rond de Grote Markt en Nieuwe Gracht — met compacte meterkasten en beperkte ruimte voor uitbreiding. In Haarlem-Noord en Schalkwijk werken we juist in rijtjeshuizen en nieuwbouw waar warmtepomp, laadpaal en extra groepen belangrijk zijn. In het Vondelkwartier en Ramplaankwartier zien we vaak jaren '30 woningen die klaar zijn voor een nieuwe groepenkast." },
      { type: "h2", text: "Veelvoorkomend werk in Haarlem" },
      { type: "ul", items: [
        "Groepenkast vervangen bij verouderde installaties in Vondelkwartier en Haarlem-Oost",
        "Perilex-aansluiting voor keukens en drogers",
        "Kortsluiting en spoedstoringen oplossen in monumentale panden",
        "Laadpaal en extra groepen op oprit of parkeerplaats",
        "Verlichting, spots en dimmers plaatsen",
        "NEN 3140-keuring voor winkels en horeca in Haarlem-Centrum",
      ]},
      { type: "h2", text: "Snel in Haarlem via de A9 of A200" },
      { type: "p", text: "Vanuit Amsterdam rijden we naar Haarlem via A9 of A200, meestal binnen 30–45 minuten ter plaatse — bij spoed ook 's avonds en in het weekend." },
    ],
    faqs: [
      { q: "Rijdt VoltFix ook naar Haarlem?", a: "Ja, Haarlem valt in ons werkgebied. Voor spoed rekenen we op 30–60 minuten aanrijtijd vanuit Amsterdam, afhankelijk van verkeer." },
      { q: "Werken jullie in monumentale panden in Haarlem-Centrum?", a: "Ja, we hebben ervaring met de compacte meterkasten en oude bedrading van monumentale panden in Haarlem-Centrum. We werken zoveel mogelijk in bestaande sparingen." },
      { q: "Kunnen jullie een laadpaal aansluiten in Schalkwijk of Haarlem-Noord?", a: `Ja. Vanaf ${eurNl(prices.laadpaalLocationFrom)} exclusief laadpaal voor een standaard aansluiting op eigen oprit, inclusief extra groep en netbeheerder-aanmelding.` },
      ...sharedFaqs("Haarlem"),
    ],
  },
];

export function getLocationByPath(path: string): Location | undefined {
  return locations.find((l) => l.path === path);
}

/** Andere locaties in dezelfde regio, voor interne linking */
export function siblingLocations(currentPath: string): Location[] {
  const current = getLocationByPath(currentPath);
  if (!current) return [];
  return locations.filter((l) => l.region === current.region && l.path !== currentPath);
}
