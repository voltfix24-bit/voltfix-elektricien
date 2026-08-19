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
    a: `Onze monteurs werken volgens de NEN 1010-norm en we geven 12 maanden garantie op uitgevoerd werk en 2 jaar garantie op geplaatste materialen. VoltFix is KvK-geregistreerd (${business.kvk}) en volledig verzekerd.`,
  },
  {
    q: `Kan ik ook een offerte online aanvragen voor ${name}?`,
    a: `Ja. Via onze offerte-pagina kunt u foto's van uw meterkast of situatie uploaden. U krijgt binnen 24 uur een indicatie voor uw klus in ${name}, meestal met vaste prijs.`,
  },
];

const baseLocations: Location[] = [
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
        "Aardlekschakelaars vervangen en groepen uitbreiden voor bedrijven",
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
      { q: "Is de Zuidas met bedrijfspanden ook uw werkgebied?", a: "Ja, we voeren op de Zuidas regelmatig verlichtings- en dimmerprojecten, groepenuitbreidingen en storingsoplossingen uit voor kantoren, restaurants en penthouses — altijd volgens NEN 1010." },
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
        "Extra groepen en veilige installaties voor bedrijfjes in de Bellamybuurt",
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
        "Storingen en extra groepen voor bedrijfjes rond het Javaplein",
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
        "Installatiewerk en storingsherstel voor horeca, hotels en winkels",
        "Storingen oplossen op de Wallen buiten kantoortijden",
      ]},
      { type: "h2", text: "Werken in monumenten: waar wij op letten" },
      { type: "p", text: "In een monumentaal grachtenpand mag u niet zomaar overal bekabeling in muren frezen. Wij werken zoveel mogelijk in bestaande sparingen en met opbouwmateriaal in monumentwaardige kleuren, zodat de installatie voldoet én het pand zijn karakter behoudt. Waar nodig stemmen we vooraf af met de Vereniging van Eigenaren of de monumentencommissie." },
    ],
    faqs: [
      { q: "Werken jullie in monumentale grachtenpanden?", a: "Ja, we werken dagelijks in monumentale panden in Amsterdam Centrum en houden rekening met beperkte meterkastruimte en behoud van bestaande structuur. We stemmen zo nodig af met de VvE." },
      { q: "Kunnen jullie na sluitingstijd komen bij een café op de Wallen?", a: "Ja. Voor horeca in het Centrum werken we vaak 's nachts of vroeg in de ochtend, zodat de zaak overdag open kan blijven." },
      { q: "Werken jullie ook voor hotels en horeca in het Centrum?", a: "Ja, we werken regelmatig voor horeca, winkels en hotels in het Centrum: krachtstroom, verlichting, extra groepen en storingsherstel volgens NEN 1010." },
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
        "Krachtstroom en verlichting voor cafés en restaurants",
      ]},
      { type: "h2", text: "Horeca in De Pijp: buiten uw drukste uren" },
      { type: "p", text: "Rond de Albert Cuyp en Gerard Douplein zijn cafés en restaurants het grootste deel van de dag open. We plannen werk in overleg — 's ochtends vroeg vóór openingstijd of 's nachts na sluitingstijd — zodat u geen omzet mist." },
    ],
    faqs: [
      { q: "Werken jullie ook voor horeca in De Pijp?", a: "Ja, we werken regelmatig voor cafés en restaurants rond de Albert Cuypmarkt en Ceintuurbaan — inclusief werk 's nachts of vroeg in de ochtend." },
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
        "Storingen en installatiewerk voor bedrijven",
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
];

/**
 * Extra, volledig unieke content per locatie. Staat los van `baseLocations`
 * zodat de verhouding unieke tekst t.o.v. gedeelde blokken (tarieven,
 * reviews, CTA's) per wijkpagina gunstig blijft voor lokale SEO.
 */
const localCases: Record<string, { sections: Location["sections"]; faq: LocationFaq }> = {
  "/elektricien-amsterdam-zuid": {
    sections: [
      { type: "h2", text: "Uit de praktijk in Amsterdam Zuid" },
      { type: "p", text: "Een gezin in de Apollobuurt belde ons nadat de keukengroep er elke avond uit klapte zodra de oven en de vaatwasser samen draaiden. In het pand uit 1932 lag alles nog op twee groepen. We hebben de kast uitgebreid met aardlekautomaten en een aparte kookgroep aangelegd via het bestaande leidingtracé achter het aanrecht, zonder open te hakken in de originele lambrisering." },
      { type: "p", text: "Op de Zuidas doen we vooral werk waar toegang en planning het lastigste deel zijn: schakelmateriaal en verlichting in kantoorunits waar alleen buiten kantooruren gewerkt mag worden, en storingen in gemeenschappelijke ruimtes waar de beheerder de meterruimte moet openen. We stemmen dat vooraf af, zodat de monteur niet voor een dichte deur staat." },
      { type: "p", text: "In de Rivierenbuurt en Stadionbuurt zien we opvallend vaak ontbrekende aarde in de badkamer — een erfenis van renovaties uit de jaren tachtig. Dat is meestal binnen een dagdeel op te lossen met een aparte badkamergroep en een aardlekschakelaar van 30 mA." },
    ],
    faq: { q: "Kunnen jullie op de Zuidas buiten kantooruren werken?", a: "Ja. Voor kantoren, restaurants en VvE's op de Zuidas plannen we werk regelmatig 's avonds of in het weekend in, zodat de bedrijfsvoering doorloopt. Daarvoor geldt het avond- en weekendtarief, dat we vooraf schriftelijk bevestigen." },
  },
  "/elektricien-amsterdam-west": {
    sections: [
      { type: "h2", text: "Uit de praktijk in Amsterdam West" },
      { type: "p", text: "In De Baarsjes werken we veel in bovenhuizen waar de meterkast in het trappenhuis of onder de trap zit, met weinig ruimte en soms nog keramische zekeringen. Bij een woning aan de Jan Evertsenstraat hebben we de oude stoppenkast vervangen door een moderne kast met twaalf groepen, waarbij de nieuwe leidingen via de bestaande kokers naar de keuken en badkamer liepen." },
      { type: "p", text: "In Bos en Lommer en de Kolenkitbuurt gaat het vaker om corporatiewoningen en VvE's uit de jaren vijftig en zestig: gedeelde meterruimtes, verouderde trappenhuisverlichting en installaties zonder aardlek. Dat pakken we bij voorkeur per woonlaag aan, zodat bewoners niet lang zonder stroom zitten." },
      { type: "p", text: "Houthavens en Westerpark zijn het tegenovergestelde: moderne nieuwbouw waar de vraag draait om uitbreiding. Extra groepen voor een warmtepomp, een laadpaal in de gemeenschappelijke garage of het aanpassen van de installatie na het samenvoegen van twee appartementen." },
    ],
    faq: { q: "Onze VvE in Bos en Lommer wil de trappenhuisinstallatie vervangen — kan dat gefaseerd?", a: "Ja. We inspecteren eerst de hele gemeenschappelijke installatie, brengen de risico's per woonlaag in kaart en voeren daarna gefaseerd uit. Zo kan de VvE de kosten spreiden en blijft het pand tijdens de werkzaamheden gewoon bewoonbaar." },
  },
  "/elektricien-amsterdam-oost": {
    sections: [
      { type: "h2", text: "Uit de praktijk in Amsterdam Oost" },
      { type: "p", text: "In de Indische Buurt en de Dapperbuurt zijn veel bovenwoningen de afgelopen jaren gesplitst en verhuurd. We komen daar regelmatig installaties tegen waar één oorspronkelijke meterkast twee woningen voedt. Dat is niet alleen onhandig bij een storing, het is ook een probleem bij verkoop en verzekering; wij splitsen dat netjes met een eigen groepenkast per woning." },
      { type: "p", text: "Op KNSM- en Java-eiland gaat het meestal om appartementen uit de jaren negentig met een gemeenschappelijke parkeergarage. De meest gestelde vraag daar is de laadpaal: hoeveel capaciteit is er nog en hoe wordt het verbruik per bewoner afgerekend. We meten de beschikbare capaciteit en leveren een aansluiting met eigen kWh-meter." },
      { type: "p", text: "In de Watergraafsmeer werken we veel in eengezinswoningen met een tuin: buitenverlichting, een groep voor de schuur of het aansluiten van een airco of warmtepomp op een eigen groep." },
    ],
    faq: { q: "Onze bovenwoning in de Indische Buurt deelt een meterkast met de buren — kunnen jullie dat splitsen?", a: "Ja, dat doen we regelmatig. We bekijken eerst of de hoofdaansluiting het toelaat, verzorgen zo nodig de aanvraag bij de netbeheerder en plaatsen daarna een eigen groepenkast per woning met eigen aardlekbeveiliging." },
  },
  "/elektricien-amsterdam-noord": {
    sections: [
      { type: "h2", text: "Uit de praktijk in Amsterdam Noord" },
      { type: "p", text: "Noord is technisch gezien twee werelden. In de tuindorpen rond Nieuwendam en Tuindorp Oostzaan staan kleine, laag gebouwde woningen met vaak nog een installatie uit de renovatiegolf van de jaren tachtig: te weinig groepen en één aardlekschakelaar voor het hele huis. Als daar iets uitvalt, ligt meteen de hele woning plat — precies wat we oplossen met aardlekautomaten per groep." },
      { type: "p", text: "In Overhoeks en Buiksloterham is de nieuwbouw juist zwaar uitgevoerd, maar zit de uitdaging in de gedeelde infrastructuur: laadpalen in de parkeerkelder, laadverdeling over meerdere bewoners en installaties die na oplevering nog worden uitgebreid voor een thuiswerkplek of extra keuken." },
      { type: "p", text: "Rond NDSM werken we daarnaast voor bedrijfsruimtes en horeca in de oude loodsen: krachtstroom, tijdelijke voorzieningen voor evenementen en onderhoud aan de installatie." },
    ],
    faq: { q: "Werken jullie ook voor bedrijfsruimtes en horeca op NDSM?", a: "Ja. In de loodsen rond NDSM verzorgen we krachtstroomaansluitingen, verlichting en tijdelijke voorzieningen voor evenementen. Voor terugkerend werk maken we een vaste afspraak met één contactpersoon." },
  },
  "/elektricien-amsterdam-centrum": {
    sections: [
      { type: "h2", text: "Uit de praktijk in Amsterdam Centrum" },
      { type: "p", text: "In de grachtengordel is bijna elk pand een puzzel. Bij een woning aan de Prinsengracht troffen we een installatie aan met drie generaties bedrading door elkaar: stoffen omwikkelde draad uit de jaren vijftig, buisbedrading uit een latere verbouwing en losse opbouwdozen op zolder. In zo'n pand vervangen we niet alles ineens, maar beginnen we bij de groepen die het meest onveilig zijn — meestal keuken, badkamer en zolder." },
      { type: "p", text: "In de Jordaan zijn de trappen smal en de meterkasten piepklein. We meten daarom vooraf op wat er past en nemen zo nodig een smallere kastopstelling mee. Bij monumenten overleggen we met de eigenaar of VvE over de route: bestaande tracés volgen, plintgoten gebruiken en niet hakken in origineel stucwerk." },
      { type: "p", text: "Rond de Wallen en Nieuwmarkt werken we veel voor horeca en winkels: krachtstroom voor keukenapparatuur, noodverlichting en installatiewerk dat aan de eisen van verzekeraar of gemeente voldoet." },
    ],
    faq: { q: "Mag u in een monumentaal grachtenpand zomaar leidingen aanleggen?", a: "Niet zomaar. In een rijks- of gemeentelijk monument werken we zo min mogelijk destructief: we volgen bestaande leidingtracés, gebruiken plintgoten of opbouw waar inhakken niet is toegestaan en stemmen de route vooraf af met de eigenaar of VvE. Bij grotere ingrepen is een vergunning van de gemeente nodig." },
  },
  "/elektricien-amsterdam-de-pijp": {
    sections: [
      { type: "h2", text: "Uit de praktijk in De Pijp" },
      { type: "p", text: "De Oude Pijp bestaat vrijwel volledig uit smalle bovenwoningen boven winkels en horeca. Dat betekent in de praktijk: kleine meterkasten, gedeelde schachten en soms een hoofdaansluiting die al aan zijn maximum zit. Bij een appartement bij het Sarphatipark bleek de gewenste kookgroep pas mogelijk nadat de hoofdaansluiting was verzwaard; die aanvraag bij de netbeheerder verzorgen wij." },
      { type: "p", text: "Rond de Albert Cuyp en de Ceintuurbaan werken we veel voor horeca. Daar draait het om krachtstroom voor keukenapparatuur, verlichting die de hele dag brandt en een installatie die aan de eisen van de verzekeraar voldoet. We plannen dat werk bij voorkeur 's ochtends vroeg, voordat de markt en de zaken opengaan." },
      { type: "p", text: "In de Nieuwe Pijp en de Diamantbuurt zien we vooral verbouwingen: een keuken die verplaatst wordt, een zolder die woonruimte wordt of een badkamer die een eigen groep nodig heeft." },
    ],
    faq: { q: "Kunnen jullie werken in een horecazaak aan de Albert Cuyp zonder dat ik dicht moet?", a: "Meestal wel. We plannen het werk vroeg in de ochtend of na sluitingstijd en bereiden zoveel mogelijk voor buiten de zaak. Alleen het daadwerkelijk omzetten van een groep vraagt korte stroomonderbreking; die spreken we op de minuut met u af." },
  },
  "/elektricien-amsterdam-ijburg": {
    sections: [
      { type: "h2", text: "Uit de praktijk op IJburg" },
      { type: "p", text: "IJburg is jong, dus de installaties zijn zelden het probleem — de vraag is bijna altijd uitbreiding. Op Haveneiland installeerden we een laadpaal in de gemeenschappelijke garage: eerst de beschikbare capaciteit gemeten, daarna afgestemd met de VvE en tot slot een aansluiting met eigen groep en kWh-meter, zodat het verbruik bij de juiste bewoner terechtkomt." },
      { type: "p", text: "Op Steigereiland staan veel zelfbouwwoningen. Daar komen we regelmatig installaties tegen die tijdens de bouw net iets anders zijn uitgevoerd dan op tekening. Voor eigenaren die willen uitbreiden of verkopen, meten we de installatie door en leggen we in een rapport vast wat waar zit." },
      { type: "p", text: "Op Centrumeiland en Zeeburgereiland gaat het vaak om splinternieuwe woningen waar bewoners na oplevering extra wensen hebben: buitenverlichting op het dakterras, een groep voor de warmtepomp of extra data- en stroompunten voor een thuiswerkplek." },
    ],
    faq: { q: "Kan ik op IJburg een laadpaal in de gemeenschappelijke garage laten plaatsen?", a: "Ja, dat doen we regelmatig op Haveneiland en Steigereiland. We meten eerst de beschikbare capaciteit, leveren de VvE een onderbouwd voorstel en plaatsen daarna een laadpunt met eigen groep en kWh-meter, zodat het verbruik per bewoner wordt afgerekend." },
  },
  "/elektricien-amstelveen": {
    sections: [
      { type: "h2", text: "Uit de praktijk in Amstelveen" },
      { type: "p", text: "Amstelveen heeft veel ruime eengezinswoningen met een eigen oprit, en dat zie je terug in het werk: laadpalen zijn hier onze meest gevraagde klus. In Westwijk en Bovenkerk installeren we vrijwel wekelijks een wallbox met eigen groep, inclusief aanmelding bij de netbeheerder." },
      { type: "p", text: "In Elsrijk en Randwijck staan woningen uit de jaren dertig en vijftig waar de meterkast nog origineel is. Daar combineren we de vervanging graag met een verzwaring, zodat er in één keer ruimte is voor inductie, een warmtepomp en later een laadpaal." },
      { type: "p", text: "Rond het Stadshart en Uilenstede werken we daarnaast voor VvE's en verhuurders van studentenwoningen: storingen in gemeenschappelijke ruimtes en het veilig maken van installaties bij wisseling van bewoners." },
    ],
    faq: { q: "Hoe lang duurt het plaatsen van een laadpaal op een eigen oprit in Amstelveen?", a: "Een standaard installatie op een eigen oprit is meestal binnen een halve dag klaar: een eigen groep in de meterkast, de kabel naar de gevel of oprit en de laadpaal zelf. De aanmelding bij de netbeheerder verzorgen wij en vraagt geen extra bezoek." },
  },
};

export const locations: Location[] = baseLocations.map((l) => {
  const extra = localCases[l.path];
  if (!extra) return l;
  return {
    ...l,
    sections: [...l.sections, ...extra.sections],
    faqs: [...l.faqs.slice(0, 3), extra.faq, ...l.faqs.slice(3)],
  };
});


export function getLocationByPath(path: string): Location | undefined {
  return locations.find((l) => l.path === path);
}

/** Andere locaties in dezelfde regio, voor interne linking */
export function siblingLocations(currentPath: string): Location[] {
  const current = getLocationByPath(currentPath);
  if (!current) return [];
  return locations.filter((l) => l.region === current.region && l.path !== currentPath);
}
