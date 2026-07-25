// Hyperlocal landing page data source.
// Voeg een nieuwe wijk of regio toe door één entry hieronder te plaatsen
// en een dun routebestand aan te maken dat `LocationPage` rendert.

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
    | { type: "ul"; items: string[] }
  >;
  /** FAQ, ook geëmitteerd als FAQPage schema */
  faqs: LocationFaq[];
  /** Buurt/wijk namen voor interne linking */
  neighborhoods?: string[];
};

const sharedFaqs = (name: string): LocationFaq[] => [
  {
    q: `Hoe snel is er een spoed elektricien in ${name}?`,
    a: `Bij spoed in ${name} zijn we vaak binnen 30 tot 60 minuten ter plaatse. Onze nood- en spoedservice is 24/7 bereikbaar op ${"06 45 19 35 89"}.`,
  },
  {
    q: `Wat kost een elektricien in ${name}?`,
    a: "U krijgt altijd een vaste prijsafspraak vooraf. Voorrijkosten en uurtarief bespreken we telefonisch of via WhatsApp, zodat u nooit voor verrassingen komt te staan.",
  },
  {
    q: "Zijn jullie gecertificeerd en geven jullie garantie?",
    a: "Onze monteurs werken volgens de NEN 1010-norm en we geven 12 maanden garantie op uitgevoerd werk en geplaatste materialen.",
  },
];

export const locations: Location[] = [
  {
    path: "/elektricien-amsterdam-zuid",
    name: "Amsterdam Zuid",
    region: "Amsterdam",
    metaTitle: "Elektricien Amsterdam Zuid | VoltFix",
    metaDescription:
      "Elektricien in Amsterdam Zuid nodig? VoltFix is lokaal, snel ter plaatse en 24/7 bereikbaar voor spoed, groepenkast en installaties. Vaste prijs vooraf.",
    ogDescription: "Lokale elektricien in Amsterdam Zuid. Snel, betrouwbaar en met vaste prijs vooraf.",
    eyebrow: "Lokale elektricien in Amsterdam Zuid",
    intro:
      "Van de Apollobuurt tot de Rivierenbuurt: als lokale elektricien in Amsterdam Zuid kennen we de karakteristieke jaren '30 woningen, moderne appartementen op de Zuidas én de vaak volle meterkasten die daarbij horen.",
    whatsappMessage: "Hallo VoltFix, ik zoek een elektricien in Amsterdam Zuid.",
    neighborhoods: ["Apollobuurt", "Rivierenbuurt", "Zuidas", "Oud-Zuid"],
    sections: [
      { type: "p", text: "Zoekt u een betrouwbare elektricien in Amsterdam Zuid? VoltFix is uw lokale specialist voor spoed, storingen en installaties. We werken met vaste prijsafspraken vooraf, volgens NEN 1010 en met garantie op uitgevoerd werk." },
      { type: "h2", text: "Elektricien in Apollobuurt, Rivierenbuurt en Zuidas" },
      { type: "p", text: "We kennen de straten, panden en meterkasten van Amsterdam Zuid en zijn daardoor snel bij u ter plaatse. Van klassieke bovenhuizen tot moderne nieuwbouw — we passen ons werk aan op uw specifieke situatie." },
      { type: "h2", text: "Veelvoorkomend werk in Amsterdam Zuid" },
      { type: "ul", items: [
        "Groepenkast vervangen in jaren '30 woningen",
        "Extra groepen voor inductie of warmtepomp op de Zuidas",
        "Kortsluiting door oude bedrading in monumentale panden",
        "Verlichting en dimmers in kantoorpanden Zuidas",
        "Aardlekschakelaars en NEN 3140-keuringen",
      ]},
      { type: "h2", text: "Spoed elektricien in Amsterdam Zuid" },
      { type: "p", text: "Zit u zonder stroom, heeft u kortsluiting of springt de aardlekschakelaar er steeds uit? Onze nood elektricien is 24/7 bereikbaar in Amsterdam Zuid. Bel direct en we komen zo snel mogelijk langs." },
    ],
    faqs: [
      { q: "Werken jullie in Amsterdam Zuid en op de Zuidas?", a: "Ja, VoltFix werkt dagelijks in Amsterdam Zuid — van de Apollobuurt en Rivierenbuurt tot kantoren op de Zuidas. Bij spoed staan we hier vaak binnen 30–45 minuten voor de deur." },
      { q: "Kunnen jullie een groepenkast in een jaren '30 woning in Zuid vervangen?", a: "Zeker. We hebben veel ervaring met de karakteristieke meterkasten in Amsterdam Zuid en passen alles aan volgens NEN 1010 met behoud van de bestaande structuur waar mogelijk." },
      ...sharedFaqs("Amsterdam Zuid"),
    ],
  },
  {
    path: "/elektricien-amsterdam-west",
    name: "Amsterdam West",
    region: "Amsterdam",
    metaTitle: "Elektricien Amsterdam West | VoltFix",
    metaDescription:
      "Elektricien in Amsterdam West nodig? VoltFix is lokaal, snel ter plaatse en 24/7 bereikbaar voor spoed, groepenkast en installaties. Vaste prijs vooraf.",
    ogDescription: "Lokale elektricien in Amsterdam West. Snel, betrouwbaar en met vaste prijs vooraf.",
    eyebrow: "Lokale elektricien in Amsterdam West",
    intro:
      "Van de Baarsjes en Bos en Lommer tot Westerpark en Oud-West: als lokale elektricien in Amsterdam West kennen we de smalle bovenhuizen, karakteristieke portieken en vaak volle meterkasten van de stad.",
    whatsappMessage: "Hallo VoltFix, ik zoek een elektricien in Amsterdam West.",
    neighborhoods: ["De Baarsjes", "Bos en Lommer", "Oud-West", "Westerpark"],
    sections: [
      { type: "p", text: "Zoekt u een betrouwbare elektricien in Amsterdam West? VoltFix is uw lokale specialist voor spoed, storingen en installaties, met vaste prijsafspraken vooraf en garantie op uitgevoerd werk." },
      { type: "h2", text: "Elektricien in De Baarsjes, Bos en Lommer en Westerpark" },
      { type: "p", text: "We kennen de bovenhuizen en portieken van Amsterdam West en zijn daardoor snel bij u ter plaatse. Van klassieke jaren '30 panden tot moderne nieuwbouw op Houthavens en Westerpark." },
      { type: "h2", text: "Veelvoorkomend werk in Amsterdam West" },
      { type: "ul", items: [
        "Groepenkast vervangen in bovenhuizen",
        "Perilex-aansluiting voor inductie of oven",
        "Kortsluiting en aardlekschakelaars die uitspringen",
        "Verlichting, dimmers en spots",
        "Extra groepen en NEN 3140-keuringen",
      ]},
    ],
    faqs: [
      { q: "Zijn jullie snel in Amsterdam West bij een storing?", a: "Ja. Onze spoedmonteurs zijn bij storingen in Amsterdam West vaak binnen 30–60 minuten ter plaatse — 24/7, ook in het weekend." },
      { q: "Kunnen jullie in een klein bovenhuis in West een nieuwe groepenkast plaatsen?", a: "Ja, we passen de kast aan op de beschikbare ruimte in de meterkast en zorgen dat alles voldoet aan NEN 1010." },
      ...sharedFaqs("Amsterdam West"),
    ],
  },
  {
    path: "/elektricien-amsterdam-oost",
    name: "Amsterdam Oost",
    region: "Amsterdam",
    metaTitle: "Elektricien Amsterdam Oost | VoltFix",
    metaDescription:
      "Elektricien in Amsterdam Oost nodig? VoltFix is lokaal, 24/7 bereikbaar voor spoed, groepenkast en installaties. Vaste prijs vooraf en NEN 1010.",
    ogDescription: "Lokale elektricien in Amsterdam Oost. Snel ter plaatse en met vaste prijs vooraf.",
    eyebrow: "Lokale elektricien in Amsterdam Oost",
    intro:
      "Van Indische Buurt en Oostelijk Havengebied tot Watergraafsmeer: als lokale elektricien in Amsterdam Oost werken we in oude portieken én moderne nieuwbouwappartementen.",
    whatsappMessage: "Hallo VoltFix, ik zoek een elektricien in Amsterdam Oost.",
    neighborhoods: ["Indische Buurt", "Oostelijk Havengebied", "Watergraafsmeer", "Dapperbuurt"],
    sections: [
      { type: "p", text: "VoltFix is de lokale elektricien in Amsterdam Oost — bereikbaar voor spoed, groepenkast, perilex, extra groepen en verlichting. Altijd met vaste prijsafspraak vooraf." },
      { type: "h2", text: "Elektricien in Indische Buurt, Watergraafsmeer en KNSM" },
      { type: "p", text: "Van monumentale panden in de Dapperbuurt tot moderne appartementen op KNSM-eiland: we passen elk werk aan op uw specifieke pand en meterkast." },
      { type: "h2", text: "Veelvoorkomend werk in Amsterdam Oost" },
      { type: "ul", items: [
        "Groepenkast vervangen",
        "Perilex-aansluiting voor inductie of droger",
        "Storingen en kortsluitingen oplossen",
        "Laadpaal en extra groepen",
        "Verlichting, spots en dimmers",
      ]},
    ],
    faqs: [
      { q: "Werken jullie in Amsterdam Oost en op de eilanden?", a: "Ja, we werken dagelijks in Amsterdam Oost — van de Indische Buurt tot KNSM en Java-eiland. Bij spoed vaak binnen 45 minuten ter plaatse." },
      ...sharedFaqs("Amsterdam Oost"),
    ],
  },
  {
    path: "/elektricien-amsterdam-noord",
    name: "Amsterdam Noord",
    region: "Amsterdam",
    metaTitle: "Elektricien Amsterdam Noord | VoltFix",
    metaDescription:
      "Elektricien in Amsterdam Noord nodig? VoltFix is lokaal, snel over de IJ-tunnel en 24/7 bereikbaar. Groepenkast, spoed, perilex — vaste prijs vooraf.",
    ogDescription: "Lokale elektricien in Amsterdam Noord. Snel ter plaatse en met vaste prijs vooraf.",
    eyebrow: "Lokale elektricien in Amsterdam Noord",
    intro:
      "Van NDSM en Overhoeks tot Nieuwendam en Buiksloterham: als lokale elektricien in Amsterdam Noord staan we snel bij u — nieuwbouw, tuindorpen en industriële lofts.",
    whatsappMessage: "Hallo VoltFix, ik zoek een elektricien in Amsterdam Noord.",
    neighborhoods: ["NDSM", "Overhoeks", "Nieuwendam", "Buiksloterham"],
    sections: [
      { type: "p", text: "VoltFix is de lokale elektricien in Amsterdam Noord — voor spoed, groepenkast, perilex en installaties. Altijd vaste prijsafspraak vooraf, volgens NEN 1010." },
      { type: "h2", text: "Elektricien in NDSM, Overhoeks en Nieuwendam" },
      { type: "p", text: "Van industriële lofts op NDSM tot tuindorpen in Nieuwendam: we werken in alle pandtypen in Amsterdam Noord met vaste prijs vooraf." },
      { type: "h2", text: "Veelvoorkomend werk in Amsterdam Noord" },
      { type: "ul", items: [
        "Groepenkast vervangen in nieuwbouw en tuindorp",
        "Perilex voor inductie of oven",
        "Spoed bij kortsluiting en stroomstoring",
        "Laadpaal, zonnepanelen aansluiten",
        "Verlichting en dimmers",
      ]},
    ],
    faqs: [
      { q: "Werken jullie in heel Amsterdam Noord, ook op NDSM?", a: "Ja, van NDSM en Overhoeks tot Nieuwendam en Tuindorp Oostzaan — VoltFix is dagelijks in Amsterdam Noord." },
      ...sharedFaqs("Amsterdam Noord"),
    ],
  },
  {
    path: "/elektricien-amsterdam-centrum",
    name: "Amsterdam Centrum",
    region: "Amsterdam",
    metaTitle: "Elektricien Amsterdam Centrum | VoltFix",
    metaDescription:
      "Elektricien in Amsterdam Centrum nodig? VoltFix werkt in grachtenpanden, monumenten en horeca. 24/7 spoed, NEN 1010 en vaste prijs vooraf.",
    ogDescription: "Lokale elektricien in Amsterdam Centrum. Ervaring met grachtenpanden en monumenten.",
    eyebrow: "Lokale elektricien in Amsterdam Centrum",
    intro:
      "Van grachtenpanden en monumenten in de Jordaan tot horeca op de Wallen: als lokale elektricien in Amsterdam Centrum kennen we de bijzondere eisen van historische panden.",
    whatsappMessage: "Hallo VoltFix, ik zoek een elektricien in Amsterdam Centrum.",
    neighborhoods: ["Jordaan", "Grachtengordel", "Nieuwmarkt", "Wallen"],
    sections: [
      { type: "p", text: "VoltFix is de lokale elektricien in Amsterdam Centrum — met ervaring in monumentale grachtenpanden, horeca en winkels. Altijd vaste prijs vooraf en volgens NEN 1010." },
      { type: "h2", text: "Elektricien in Jordaan, Grachtengordel en Nieuwmarkt" },
      { type: "p", text: "Grachtenpanden hebben vaak een compacte meterkast en oude bedrading. Wij zijn gespecialiseerd in nette, veilige installaties in monumentale panden." },
      { type: "h2", text: "Veelvoorkomend werk in Amsterdam Centrum" },
      { type: "ul", items: [
        "Groepenkast vervangen in grachtenpanden",
        "Extra groepen voor horeca en keukens",
        "Verlichting, dimmers en spots",
        "Aardlekschakelaars die uitspringen",
        "NEN 3140-keuring voor horeca en winkels",
      ]},
    ],
    faqs: [
      { q: "Werken jullie in monumentale grachtenpanden?", a: "Ja, we werken dagelijks in monumentale panden in Amsterdam Centrum en houden rekening met beperkte meterkastruimte en behoud van bestaande structuur." },
      ...sharedFaqs("Amsterdam Centrum"),
    ],
  },
  {
    path: "/elektricien-amsterdam-de-pijp",
    name: "De Pijp",
    region: "Amsterdam",
    metaTitle: "Elektricien De Pijp Amsterdam | VoltFix",
    metaDescription:
      "Elektricien in De Pijp nodig? VoltFix is lokaal, 24/7 bereikbaar voor spoed, groepenkast en perilex. Vaste prijs vooraf en NEN 1010.",
    ogDescription: "Lokale elektricien in De Pijp. Snel ter plaatse en met vaste prijs vooraf.",
    eyebrow: "Lokale elektricien in De Pijp",
    intro:
      "Van Albert Cuyp en Sarphatipark tot Ceintuurbaan: als lokale elektricien in De Pijp werken we dagelijks in de karakteristieke bovenhuizen en horeca van deze levendige wijk.",
    whatsappMessage: "Hallo VoltFix, ik zoek een elektricien in De Pijp Amsterdam.",
    neighborhoods: ["Albert Cuyp", "Sarphatipark", "Ceintuurbaan", "Oude Pijp"],
    sections: [
      { type: "p", text: "VoltFix is de lokale elektricien in De Pijp — voor spoed, groepenkast, perilex en horeca-installaties. Altijd vaste prijsafspraak vooraf." },
      { type: "h2", text: "Elektricien in Oude Pijp, Nieuwe Pijp en rondom Sarphatipark" },
      { type: "p", text: "De Pijp heeft veel bovenhuizen met compacte meterkasten en oude bedrading. Wij passen alles aan volgens NEN 1010 met minimale overlast." },
      { type: "h2", text: "Veelvoorkomend werk in De Pijp" },
      { type: "ul", items: [
        "Groepenkast vervangen in bovenhuizen",
        "Extra groepen voor inductie of warmtepomp",
        "Perilex-aansluiting voor keukens",
        "Verlichting voor horeca op de Albert Cuyp",
        "Kortsluiting en spoedstoringen oplossen",
      ]},
    ],
    faqs: [
      { q: "Werken jullie ook voor horeca in De Pijp?", a: "Ja, we werken regelmatig voor cafés en restaurants rond de Albert Cuypmarkt en Ceintuurbaan — inclusief NEN 3140-keuringen." },
      ...sharedFaqs("De Pijp"),
    ],
  },
  {
    path: "/elektricien-amsterdam-ijburg",
    name: "IJburg",
    region: "Amsterdam",
    metaTitle: "Elektricien IJburg Amsterdam | VoltFix",
    metaDescription:
      "Elektricien op IJburg nodig? VoltFix is lokaal, snel ter plaatse en 24/7 bereikbaar. Groepenkast, laadpaal, perilex — vaste prijs vooraf.",
    ogDescription: "Lokale elektricien op IJburg. Snel ter plaatse en met vaste prijs vooraf.",
    eyebrow: "Lokale elektricien op IJburg",
    intro:
      "Van Steigereiland tot Haveneiland en Rieteilanden: als lokale elektricien op IJburg werken we in de moderne nieuwbouw, waterwoningen en laadpaal-installaties van deze jonge wijk.",
    whatsappMessage: "Hallo VoltFix, ik zoek een elektricien op IJburg.",
    neighborhoods: ["Steigereiland", "Haveneiland", "Rieteilanden", "Centrumeiland"],
    sections: [
      { type: "p", text: "VoltFix is de lokale elektricien op IJburg — voor laadpalen, extra groepen, groepenkast en spoed. Altijd vaste prijs vooraf en volgens NEN 1010." },
      { type: "h2", text: "Elektricien op Steigereiland, Haveneiland en Rieteilanden" },
      { type: "p", text: "IJburg is een moderne wijk met veel nieuwbouw en steeds meer elektrisch rijden. Wij installeren laadpalen, extra groepen en zonnepanelen." },
      { type: "h2", text: "Veelvoorkomend werk op IJburg" },
      { type: "ul", items: [
        "Laadpaal aansluiten in eigen parkeervak",
        "Extra groepen voor warmtepomp of inductie",
        "Groepenkast uitbreiden bij nieuwbouw",
        "Zonnepanelen op omvormer aansluiten",
        "Spoed bij kortsluiting of aardlekschakelaar",
      ]},
    ],
    faqs: [
      { q: "Kunnen jullie een laadpaal aansluiten op IJburg?", a: "Ja, VoltFix installeert laadpalen op IJburg — vaak inclusief extra groep en aparte kWh-meter. We regelen ook de aanmelding bij de netbeheerder." },
      ...sharedFaqs("IJburg"),
    ],
  },
  // Regio Amsterdam — hyperlocal expansion
  {
    path: "/elektricien-amstelveen",
    name: "Amstelveen",
    region: "Regio Amsterdam",
    metaTitle: "Elektricien Amstelveen | VoltFix",
    metaDescription:
      "Elektricien in Amstelveen nodig? VoltFix werkt dagelijks in Amstelveen — spoed, groepenkast, perilex en laadpaal. Vaste prijs vooraf en NEN 1010.",
    ogDescription: "Lokale elektricien in Amstelveen. 24/7 bereikbaar, vaste prijs vooraf.",
    eyebrow: "Lokale elektricien in Amstelveen",
    intro:
      "Van Amstelveen-Oost tot Bovenkerk en Westwijk: als elektricien werken we dagelijks in Amstelveen — van jaren '60 rijtjeswoningen tot moderne appartementen en villa's.",
    whatsappMessage: "Hallo VoltFix, ik zoek een elektricien in Amstelveen.",
    neighborhoods: ["Amstelveen-Oost", "Bovenkerk", "Westwijk", "Elsrijk"],
    sections: [
      { type: "p", text: "VoltFix is de lokale elektricien in Amstelveen — voor spoed, groepenkast, perilex, laadpaal en installaties. Altijd vaste prijsafspraak vooraf, volgens NEN 1010, met 12 maanden garantie." },
      { type: "h2", text: "Elektricien in Bovenkerk, Westwijk en Elsrijk" },
      { type: "p", text: "Van jaren '60 rijtjeshuizen tot villa's in Elsrijk: we kennen de meterkasten en bedradingen van Amstelveense woningen en passen ons werk aan op uw pand." },
      { type: "h2", text: "Veelvoorkomend werk in Amstelveen" },
      { type: "ul", items: [
        "Groepenkast vervangen bij verouderde installaties",
        "Perilex-aansluiting voor inductie of oven",
        "Laadpaal op eigen oprit",
        "Extra groepen voor warmtepomp",
        "Storingen en NEN 3140-keuringen",
      ]},
    ],
    faqs: [
      { q: "Rijdt VoltFix ook naar Amstelveen?", a: "Ja, Amstelveen valt in ons dagelijkse werkgebied. Bij spoed zijn we vaak binnen 45–60 minuten ter plaatse, vanuit Amsterdam." },
      { q: "Wat kost een groepenkast vervangen in Amstelveen?", a: "Vanaf €455 voor een standaard vervanging, inclusief materiaal en NEN 1010-oplevering. U krijgt altijd een vaste prijs vooraf." },
      ...sharedFaqs("Amstelveen"),
    ],
  },
  {
    path: "/elektricien-haarlem",
    name: "Haarlem",
    region: "Regio Amsterdam",
    metaTitle: "Elektricien Haarlem | VoltFix",
    metaDescription:
      "Elektricien in Haarlem nodig? VoltFix werkt in Haarlem-Centrum, Noord en Schalkwijk — spoed, groepenkast, perilex. Vaste prijs vooraf en NEN 1010.",
    ogDescription: "Lokale elektricien in Haarlem. Snel ter plaatse en met vaste prijs vooraf.",
    eyebrow: "Lokale elektricien in Haarlem",
    intro:
      "Van monumentale panden in het centrum tot moderne nieuwbouw in Schalkwijk en Haarlem-Noord: als elektricien werken we dagelijks in Haarlem met vaste prijs vooraf.",
    whatsappMessage: "Hallo VoltFix, ik zoek een elektricien in Haarlem.",
    neighborhoods: ["Haarlem-Centrum", "Haarlem-Noord", "Schalkwijk", "Haarlem-Oost"],
    sections: [
      { type: "p", text: "VoltFix is uw lokale elektricien in Haarlem — voor spoed, groepenkast, perilex en installaties. Altijd vaste prijs vooraf, volgens NEN 1010, met 12 maanden garantie op uitgevoerd werk." },
      { type: "h2", text: "Elektricien in Haarlem-Centrum, Noord en Schalkwijk" },
      { type: "p", text: "Van monumentale panden in het centrum met compacte meterkasten tot rijtjeshuizen in Schalkwijk: we passen ons werk aan op uw specifieke pand." },
      { type: "h2", text: "Veelvoorkomend werk in Haarlem" },
      { type: "ul", items: [
        "Groepenkast vervangen bij verouderde installaties",
        "Perilex-aansluiting voor keukens",
        "Kortsluiting en spoedstoringen oplossen",
        "Laadpaal en extra groepen",
        "Verlichting, spots en dimmers",
      ]},
    ],
    faqs: [
      { q: "Rijdt VoltFix ook naar Haarlem?", a: "Ja, Haarlem valt in ons werkgebied. Voor spoed rekenen we op 45–75 minuten aanrijtijd vanuit Amsterdam, afhankelijk van verkeer." },
      { q: "Werken jullie in monumentale panden in Haarlem-Centrum?", a: "Ja, we hebben ervaring met de compacte meterkasten en oude bedrading van monumentale panden in Haarlem-Centrum." },
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
