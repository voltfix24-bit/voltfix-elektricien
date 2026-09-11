// Echte Google reviews van VoltFix (Amsterdam).
// Gemiddeld: 4,9 / 5 op basis van 65 reviews (bron: Google Bedrijfsprofiel).
// Privacy: achternamen worden afgekort tot de eerste letter (AVG).
// Engelse versies zijn vertalingen van de originele Nederlandse quotes.

import type { Locale } from "@/lib/i18n";

/** Type klus waarop een review betrekking heeft (voor filtering per pagina). */
export type ReviewCategory =
  | "spoed"
  | "stroomstoring"
  | "groepenkast"
  | "perilex"
  | "laadpaal"
  | "keuring"
  | "algemeen";

export type Review = {
  /** Voornaam + initiaal van de achternaam — nooit de volledige naam. */
  name: string;
  /** Wanneer de review is geplaatst — ISO datum, zo goed mogelijk benaderd. */
  date: string;
  rating: 5;
  /** Categorieën waar deze review over gaat. "algemeen" = altijd tonen. */
  categories: ReviewCategory[];
  /** Taal waarin de klant de review origineel schreef. */
  lang: "nl" | "en";
  nl: string;
  en: string;
};

export const aggregateRating = {
  ratingValue: 4.9,
  reviewCount: 65,
  bestRating: 5,
  worstRating: 1,
} as const;

export const reviews: Review[] = [
  {
    name: "Ilker C.",
    date: "2026-08-11",
    rating: 5,
    categories: ["keuring", "groepenkast", "algemeen"],
    lang: "en",
    nl: "Perfecte, snelle en voordelige oplossing door Hassan. Ik raad VoltFix van harte aan.",
    en: "Perfect, quick and cost effective solution by Nassar. I strongly suggest VoltFix.",
  },
  {
    name: "Sammie S.",
    date: "2026-08-10",
    rating: 5,
    categories: ["algemeen"],
    lang: "nl",
    nl: "Heel snel en vriendelijk geholpen. Top bedrijf!",
    en: "Helped very quickly and in a friendly way. Great company!",
  },
  {
    name: "B. B.",
    date: "2026-06-22",
    rating: 5,
    categories: ["spoed", "stroomstoring"],
    lang: "nl",
    nl: "Super aardige mensen, zowel de monteur als de gene die ik aan de lijn had, snel ter plaatse en de storing verholpen. Aanrader!",
    en: "Really nice people — both the technician and the person on the phone. On site quickly and the fault was fixed. Recommended!",
  },
  {
    name: "Weronika K.",
    date: "2026-04-06",
    rating: 5,
    categories: ["stroomstoring", "algemeen"],
    lang: "en",
    nl: "Fijne service, heel grondig en ons elektriciteitsprobleem opgelost.",
    en: "Nice service, very thorough and solved our electricity problem.",
  },
  {
    name: "Maarten van der V.",
    date: "2025-10-19",
    rating: 5,
    categories: ["spoed"],
    lang: "nl",
    nl: "Op zondag met spoed gekomen ons uit de brand geholpen. Aardig en professioneel! Ik raad ze aan!",
    en: "Came out on a Sunday as an emergency and got us out of trouble. Friendly and professional — I recommend them!",
  },
  {
    name: "Car de J.",
    date: "2024-10-10",
    rating: 5,
    categories: ["algemeen"],
    lang: "nl",
    nl: "Hassan heeft geweldig werk geleverd. Binnen een dag een afspraak gemaakt, en binnen een uur het klusje geklaard! Bovendien een goede prijs. Zeer aan te raden.",
    en: "Hassan did a great job. An appointment within a day and the work finished within an hour — at a good price. Highly recommended.",
  },
  {
    name: "Laura P.",
    date: "2024-07-26",
    rating: 5,
    categories: ["algemeen"],
    lang: "en",
    nl: "Zeker een aanrader. Mijn deurbel deed het niet meer en ik wilde een Ring-deurbel laten installeren. Hassan kwam de volgende dag al met de Ring-deurbel en transformator en installeerde beide. Hij was zorgvuldig om zeker te weten dat hij kreeg wat ik wilde en belde de dag erna na om te controleren of alles werkte. Betere service kon ik me niet wensen. Ik bel hem zeker weer. Dank je wel, Hassan!",
    en: "Definitely recommend. My doorbell stopped working and I wanted a ring doorbell installed. Hassan came the very next day with the ring door bell and transformer and installed both. He was contentious to be sure he got what I wanted and followed up the next day to be sure it was working. He also helped me find an Echo Show which no Amazon in EU would send here. I really couldn't ask for a better service. Will definitely call him again. Thank you, Hassan!",
  },
  {
    name: "Andrea G.",
    date: "2024-06-10",
    rating: 5,
    categories: ["stroomstoring", "algemeen"],
    lang: "en",
    nl: "Geweldige service van Hassan! Ik belde ze om een storing in mijn huis te verhelpen en hij kon het probleem oplossen — de hele tijd zeer professioneel, vriendelijk en duidelijk. Hij deed een stap extra om te controleren of alles goed werkte en kwam twee keer kosteloos terug voor extra controles en reparaties. Aanbevolen.",
    en: "Great service from Hassan! I called them to fix a fault issue in my house and he was able to solve the issue while being very professional, cordial and clear all the time. He went the extra mile to check that everything was working fine and he came back twice free of charge to make further checks/repairs. Reccomended",
  },
  {
    name: "Matt R.",
    date: "2024-03-07",
    rating: 5,
    categories: ["groepenkast", "algemeen"],
    lang: "en",
    nl: "Hassan zorgde ervoor dat onze elektrische aansluitingen geschikt waren voor een jacuzzi-installatie en heeft onze groepenkast vernieuwd. Hij was de hele tijd vriendelijk, nam de tijd om uit te leggen wat er nodig was en waarom, en liet het klusje er makkelijk uitzien. Een echte vakman! We maken in de toekomst zeker weer gebruik van zijn diensten.",
    en: "Hassan ensured our electrical connections were satisfactory for a hot tub installation and updated our electrical panel. He was friendly the whole time, took time to explain what was needed and why, and he made the job look easy. A real pro! We will use his services again in the future.",
  },
  {
    name: "Diogenes C.",
    date: "2024-02-11",
    rating: 5,
    categories: ["spoed", "stroomstoring"],
    lang: "nl",
    nl: "Wij hadden een storing in het weekend en werden snel geholpen. Het eerste goede: ik heb met een echte persoon aan de telefoon gesproken die uitlegde hoe het werkte en hoeveel het zou kosten. De meneer die ons hielp was professioneel, legde elke stap uit en hielp zelfs met een bijkomend probleem. Geweldige service, zeker een aanrader.",
    en: "We had a fault during the weekend and were helped quickly. The first good thing: I spoke to a real person on the phone who explained how it worked and what it would cost. The technician who helped us was professional, explained every step and even helped with an additional issue. Great service — definitely recommended.",
  },
  {
    name: "Linda M.",
    date: "2023-12-23",
    rating: 5,
    categories: ["spoed", "stroomstoring"],
    lang: "nl",
    nl: "Vandaag is Hassan bij ons geweest. Telefonisch gelijk te pakken gekregen. Snel op locatie gekomen om onze stroomstoring op te lossen. Het was zeker niet makkelijk maar ondanks dat had hij heel veel geduld en bleef 'zoeken' naar de oorzaak. Daarbij ook voor een mooie prijs. Dankjewel en dit bedrijf raad ik zeker aan!!",
    en: "Hassan came to us today. Reached him straight away by phone. He was on site quickly to fix our power outage. It certainly wasn't easy, but he was very patient and kept looking for the cause. And at a great price too. Thank you — I definitely recommend this company!!",
  },
  {
    name: "Oriol T.",
    date: "2023-11-17",
    rating: 5,
    categories: ["spoed"],
    lang: "en",
    nl: "Geweldige service! We hadden op vrijdagavond een noodgeval en ze stuurden binnen een uur een elektricien. Ze moesten terugkomen voor een vervolgprobleem en waren ook heel flexibel met de afspraaktijd. De elektricien (Garrat) was een echte professional en heel vriendelijk.",
    en: "Great service! Had an emergency on a Friday evening and they sent and electrician in 1 hour. They had to come back for a follow-up issue, and were very flexible with the time for the appointment as well. The electrician (Garrat) was a great professional and very friendly.",
  },
  {
    name: "Verhoeven-Chi B.V.",
    date: "2024-01-01",
    rating: 5,
    categories: ["algemeen"],
    lang: "nl",
    nl: "Binnen 24 uur stond er een elektricien voor de deur. Enorm vriendelijk, professioneel en behulpzaam — heeft nog hier en daar wat extra werk gedaan zonder kosten. TOP service!",
    en: "An electrician at our door within 24 hours. Extremely friendly, professional and helpful — even did some extra work at no charge. Top service!",
  },
  {
    name: "Antoinet van B.",
    date: "2024-02-01",
    rating: 5,
    categories: ["algemeen"],
    lang: "nl",
    nl: "Heel vriendelijk. Een onderdeel van mijn lamp miste en hij is zelf bij de bouwmarkt gaan zoeken en gelijk teruggekomen, zonder extra kosten!",
    en: "Very friendly. A part for my lamp was missing so he went to the hardware store himself and came right back — at no extra cost!",
  },
  {
    name: "Thomas S.",
    date: "2026-08-28",
    rating: 5,
    categories: ["spoed", "stroomstoring"],
    lang: "nl",
    nl: "Acuut probleem t.a.v. elektriciteit in huis. Hassan was snel ter plaatse en heeft door secuur uitzoekwerk het probleem kunnen traceren en opgelost. Professioneel, transparant, betrouwbaar, betrokken. Ik kan hem van harte aanbevelen.",
    en: "Acute electrical problem at home. Hassan was on site quickly and traced and fixed the problem through careful investigation. Professional, transparent, reliable, involved. I can highly recommend him.",
  },
  {
    name: "Berend de M.",
    date: "2026-08-28",
    rating: 5,
    categories: ["algemeen"],
    lang: "nl",
    nl: "Fijne, vakkundige service. Afspraak maken is erg makkelijk en elektricien is zeer aardig en behulpzaam!",
    en: "Pleasant, skilled service. Making an appointment is very easy and the electrician is very friendly and helpful!",
  },
  {
    name: "Paddy N.",
    date: "2026-08-21",
    rating: 5,
    categories: ["stroomstoring", "algemeen"],
    lang: "en",
    nl: "Nassar was heel behulpzaam en heeft mijn elektriciteitsprobleem opgelost.",
    en: "Nassar was very helpful and sorted out my electrical problem",
  },
  {
    name: "Wim",
    date: "2026-08-21",
    rating: 5,
    categories: ["algemeen"],
    lang: "nl",
    nl: "Erg behulpzaam, professioneel en probleem snel opgelost",
    en: "Very helpful, professional and the problem was solved quickly",
  },
  {
    name: "Octavio C.",
    date: "2026-08-21",
    rating: 5,
    categories: ["stroomstoring"],
    lang: "en",
    nl: "Hasan heeft het probleem van stroomuitval in huis uitstekend verholpen. Hij vond het probleem snel en kwam met een oplossing. Ik raad zijn diensten zeker aan. Bedankt!",
    en: "Hasan did an outstanding work fixing the issue of power shortage at home. He quickly spot the problem and provide a solution. I certainly recommend his services. Thank you",
  },
  {
    name: "Yasmin A.",
    date: "2026-08-21",
    rating: 5,
    categories: ["spoed"],
    lang: "nl",
    nl: "Beste en snelste service!",
    en: "Best and fastest service!",
  },
  {
    name: "Katja H.",
    date: "2026-08-21",
    rating: 5,
    categories: ["algemeen"],
    lang: "nl",
    nl: "Wat een top ervaring! Super klantvriendelijk, geduldig, netjes, enorm deskundig en aardig. Kan niet anders zeggen dan een aanrader!",
    en: "What a great experience! Super customer-friendly, patient, tidy, very knowledgeable and kind. All I can say is: highly recommended!",
  },
  {
    name: "Sander van der H.",
    date: "2026-08-21",
    rating: 5,
    categories: ["algemeen"],
    lang: "nl",
    nl: "Nasr heeft geweldig werk geleverd. Buitengewoon aardige en kundige elektricien. Het was een hele moeilijke klus, maar Nasr gaf niet op en heeft het gefixt. Supergoed.",
    en: "Nasr did a great job. Exceptionally friendly and skilled electrician. It was a very difficult job, but Nasr didn't give up and fixed it. Excellent.",
  },
  {
    name: "George de J.",
    date: "2026-08-07",
    rating: 5,
    categories: ["algemeen"],
    lang: "en",
    nl: "Echt professioneel, rekent niet te veel en een eerlijke vent — zeker een aanrader, 10/10.",
    en: "Really professional, doesn't over charge and honest guy, would recommend for sure 10/10",
  },
  {
    name: "AJB",
    date: "2026-08-07",
    rating: 5,
    categories: ["algemeen"],
    lang: "en",
    nl: "Snelle, slimme probleemoplossing. Precies wat je van een elektricien wilt.",
    en: "Quick, intelligent problem solving. Exactly what you want from an electrician.",
  },
  {
    name: "Derk P.",
    date: "2026-07-31",
    rating: 5,
    categories: ["algemeen"],
    lang: "nl",
    nl: "Echt een vakman weet waar hij mee bezig is. Niet gokken maar weten.",
    en: "A real professional who knows what he is doing. No guessing — knowing.",
  },
  {
    name: "Omer A.",
    date: "2026-07-31",
    rating: 5,
    categories: ["spoed"],
    lang: "nl",
    nl: "Snelle reactie gehad op mijn probleem, top service!",
    en: "Got a quick response to my problem, top service!",
  },
  {
    name: "Maarten K.",
    date: "2026-07-31",
    rating: 5,
    categories: ["stroomstoring"],
    lang: "nl",
    nl: "Super goeie service. Onze problemen waren snel gevonden en opgelost!",
    en: "Super good service. Our problems were found and solved quickly!",
  },
  {
    name: "Otto S.",
    date: "2026-07-24",
    rating: 5,
    categories: ["groepenkast", "algemeen"],
    lang: "en",
    nl: "Nassar heeft me geholpen met een upgrade naar een 3-fase aansluiting en het installeren van nieuwe stopcontacten. Hij deed er alles aan om het werkend te krijgen (inclusief boren in de muur en oplossingen vinden voor een ongebruikelijke muurconstructie). Hij was heel flexibel en reageerde snel bij het plannen. Zeker een aanrader!",
    en: "Nassar helped me upgrade to a 3-phase connection, and install new electricity sockets. He went above and beyond to make it work (including drilling in the wall, and finding solutions caused by an unusual wall construction). He was very flexible and responsive with scheduling. Highly recommended!",
  },
  {
    name: "Werner H.",
    date: "2026-07-03",
    rating: 5,
    categories: ["stroomstoring", "algemeen"],
    lang: "en",
    nl: "Ongelooflijk behulpzaam, heel vriendelijk en reageert snel. Loste het eerste probleem in no time op en hielp ook met een ander, langer bestaand elektriciteitsprobleem. De beste elektricien die ik tot nu toe in Amsterdam ben tegengekomen.",
    en: "Amazingly helpful, very friendly and responsive. Fixed the initial problem we had in no time and also provided support with another longer standing electricity issue we had. Best electrician I came across in Amsterdam so far.",
  },
  {
    name: "Mustapha K.",
    date: "2026-06-26",
    rating: 5,
    categories: ["algemeen"],
    lang: "nl",
    nl: "Top service en realistische prijzen!",
    en: "Top service and realistic prices!",
  },
  {
    name: "Achille",
    date: "2025-09-21",
    rating: 5,
    categories: ["algemeen"],
    lang: "en",
    nl: "Zeer professionele en enorm vriendelijke mensen.",
    en: "Very professional and extremely kind crew",
  },
  {
    name: "Naffer B.",
    date: "2025-04-27",
    rating: 5,
    categories: ["algemeen"],
    lang: "nl",
    nl: "Een snelle reactie gehad op mijn probleem, direct afspraak kunnen maken, en vakkundig verholpen, zeker aan te raden, en ook voor een goede prijs.",
    en: "Got a quick response to my problem, was able to make an appointment right away, and it was fixed professionally — definitely recommended, and at a good price too.",
  },
  {
    name: "Dorothy B.",
    date: "2025-01-03",
    rating: 5,
    categories: ["spoed", "algemeen"],
    lang: "en",
    nl: "Heel snelle reactie! Super aardig en ons probleem opgelost :)",
    en: "Very quick response! Super nice and solved our problem :)",
  },
  {
    name: "Yulia M.",
    date: "2024-12-14",
    rating: 5,
    categories: ["spoed"],
    lang: "en",
    nl: "Alles gewoon binnen 30 minuten opgelost.",
    en: "Just resolved everything within 30 minutes",
  },
  {
    name: "M.",
    date: "2024-11-30",
    rating: 5,
    categories: ["algemeen"],
    lang: "en",
    nl: "Hassan kwam ontzettend snel naar mijn huis toen ik hulp nodig had met mijn verlichting, en hij had alles in no time gerepareerd. Super!",
    en: "Hassan came to my house incredibly fast when I needed help with my lights, and he fixed everything in no time. Super!",
  },
  {
    name: "Ann B.",
    date: "2024-09-04",
    rating: 5,
    categories: ["algemeen"],
    lang: "en",
    nl: "Professioneel. Deskundig. Snel.",
    en: "Professional. Knowledgeable. Quick.",
  },
  {
    name: "L. M.",
    date: "2024-08-26",
    rating: 5,
    categories: ["algemeen"],
    lang: "en",
    nl: "Ik had een geweldige ervaring! Geweldige service voor het geld! Heel transparant, geen verrassingen. Ik raad het ten zeerste aan. Ik wilde 2 lampen laten installeren en het proces was snel en soepel. Ik ben heel blij met het resultaat!",
    en: "I had an amazing experience! Great service for the money! Very transparent, no surprises. I highly recommend. I needed 2 lamps installed and the process was quick and smooth. i am very happy with the results!",
  },
  {
    name: "Daniel R.",
    date: "2024-08-03",
    rating: 5,
    categories: ["algemeen"],
    lang: "en",
    nl: "Super aardige kerels, snel en echt goede kwaliteit van service.",
    en: "Súper nice guys, fast and really good quality of service",
  },
  {
    name: "Jackie J.",
    date: "2024-06-03",
    rating: 5,
    categories: ["algemeen"],
    lang: "en",
    nl: "Hassan was aardig, deskundig en flexibel. Super!",
    en: "Hassan was kind, knowledgeable, and flexible. Super!",
  },
];

/**
 * Filter reviews op categorie. "algemeen"-reviews tellen altijd mee.
 * Als er minder dan 3 matches zijn valt de lijst terug op alle reviews,
 * zodat de sectie visueel gevuld blijft.
 */
export function filterReviews(category?: ReviewCategory): Review[] {
  if (!category) return reviews;
  const matches = reviews.filter(
    (r) => r.categories.includes(category) || r.categories.includes("algemeen"),
  );
  return matches.length >= 3 ? matches : reviews;
}

export function localizedReviews(locale: Locale, category?: ReviewCategory) {
  // Nieuwste eerst, en reviews in de taal van de pagina bovenaan: op de NL-site
  // eerst de Nederlandse quotes, op /en-gb eerst de Engelse.
  const pageLang = locale === "en" ? "en" : "nl";
  const sorted = [...filterReviews(category)].sort((a, b) => {
    if (a.lang !== b.lang) return a.lang === pageLang ? -1 : 1;
    return b.date.localeCompare(a.date);
  });
  return sorted.map((r) => ({
    name: r.name,
    date: r.date,
    rating: r.rating,
    lang: r.lang,
    /** Originele tekst zoals de klant die schreef. */
    text: r.lang === "en" ? r.en : r.nl,
    /**
     * Engelse vertaling — alleen gevuld op EN-pagina's bij een Nederlandse
     * originele review. Op NL-pagina's tonen we altijd het origineel.
     */
    translation: locale === "en" && r.lang === "nl" ? r.en : undefined,
  }));
}
