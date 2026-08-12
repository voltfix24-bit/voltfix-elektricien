// Echte Google reviews van VoltFix (Amsterdam).
// Gemiddeld: 4,9 / 5 op basis van 56 reviews (bron: Google Bedrijfsprofiel).
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
  nl: string;
  en: string;
};

export const aggregateRating = {
  ratingValue: 4.9,
  reviewCount: 56,
  bestRating: 5,
  worstRating: 1,
} as const;

export const reviews: Review[] = [
  {
    name: "Ilker C.",
    date: "2026-08-11",
    rating: 5,
    categories: ["keuring", "groepenkast", "algemeen"],
    nl: "Perfecte, snelle en voordelige oplossing door Hassan. Ik raad VoltFix van harte aan.",
    en: "Perfect, quick and cost effective solution by Nassar. I strongly suggest VoltFix.",
  },
  {
    name: "Sammie S.",
    date: "2026-08-10",
    rating: 5,
    categories: ["algemeen"],
    nl: "Heel snel en vriendelijk geholpen. Top bedrijf!",
    en: "Helped very quickly and in a friendly way. Great company!",
  },
  {
    name: "B. B.",
    date: "2026-06-22",
    rating: 5,
    categories: ["spoed", "stroomstoring"],
    nl: "Super aardige mensen, zowel de monteur als de gene die ik aan de lijn had, snel ter plaatse en de storing verholpen. Aanrader!",
    en: "Really nice people — both the technician and the person on the phone. On site quickly and the fault was fixed. Recommended!",
  },
  {
    name: "Weronika K.",
    date: "2026-04-06",
    rating: 5,
    categories: ["stroomstoring", "algemeen"],
    nl: "Fijne service, heel grondig en ons elektriciteitsprobleem opgelost.",
    en: "Nice service, very thorough and solved our electricity problem.",
  },
  {
    name: "Maarten van der V.",
    date: "2025-10-19",
    rating: 5,
    categories: ["spoed"],
    nl: "Op zondag met spoed gekomen ons uit de brand geholpen. Aardig en professioneel! Ik raad ze aan!",
    en: "Came out on a Sunday as an emergency and got us out of trouble. Friendly and professional — I recommend them!",
  },
  {
    name: "Car de J.",
    date: "2024-10-10",
    rating: 5,
    categories: ["algemeen"],
    nl: "Hassan heeft geweldig werk geleverd. Binnen een dag een afspraak gemaakt, en binnen een uur het klusje geklaard! Bovendien een goede prijs. Zeer aan te raden.",
    en: "Hassan did a great job. An appointment within a day and the work finished within an hour — at a good price. Highly recommended.",
  },
  {
    name: "Laura P.",
    date: "2024-07-26",
    rating: 5,
    categories: ["algemeen"],
    nl: "Zeker een aanrader. Mijn deurbel deed het niet meer en ik wilde een Ring-deurbel laten installeren. Hassan kwam de volgende dag al met de Ring-deurbel en transformator en installeerde beide. Hij was zorgvuldig om zeker te weten dat hij kreeg wat ik wilde en belde de dag erna na om te controleren of alles werkte. Betere service kon ik me niet wensen. Ik bel hem zeker weer. Dank je wel, Hassan!",
    en: "Definitely recommend. My doorbell stopped working and I wanted a ring doorbell installed. Hassan came the very next day with the ring door bell and transformer and installed both. He was contentious to be sure he got what I wanted and followed up the next day to be sure it was working. He also helped me find an Echo Show which no Amazon in EU would send here. I really couldn't ask for a better service. Will definitely call him again. Thank you, Hassan!",
  },
  {
    name: "Andrea G.",
    date: "2024-06-10",
    rating: 5,
    categories: ["stroomstoring", "algemeen"],
    nl: "Geweldige service van Hassan! Ik belde ze om een storing in mijn huis te verhelpen en hij kon het probleem oplossen — de hele tijd zeer professioneel, vriendelijk en duidelijk. Hij deed een stap extra om te controleren of alles goed werkte en kwam twee keer kosteloos terug voor extra controles en reparaties. Aanbevolen.",
    en: "Great service from Hassan! I called them to fix a fault issue in my house and he was able to solve the issue while being very professional, cordial and clear all the time. He went the extra mile to check that everything was working fine and he came back twice free of charge to make further checks/repairs. Reccomended",
  },
  {
    name: "Matt R.",
    date: "2024-03-07",
    rating: 5,
    categories: ["groepenkast", "algemeen"],
    nl: "Hassan zorgde ervoor dat onze elektrische aansluitingen geschikt waren voor een jacuzzi-installatie en heeft onze groepenkast vernieuwd. Hij was de hele tijd vriendelijk, nam de tijd om uit te leggen wat er nodig was en waarom, en liet het klusje er makkelijk uitzien. Een echte vakman! We maken in de toekomst zeker weer gebruik van zijn diensten.",
    en: "Hassan ensured our electrical connections were satisfactory for a hot tub installation and updated our electrical panel. He was friendly the whole time, took time to explain what was needed and why, and he made the job look easy. A real pro! We will use his services again in the future.",
  },
  {
    name: "Diogenes C.",
    date: "2024-02-11",
    rating: 5,
    categories: ["spoed", "stroomstoring"],
    nl: "Wij hadden een storing in het weekend en werden snel geholpen. Het eerste goede: ik heb met een echte persoon aan de telefoon gesproken die uitlegde hoe het werkte en hoeveel het zou kosten. De meneer die ons hielp was professioneel, legde elke stap uit en hielp zelfs met een bijkomend probleem. Geweldige service, zeker een aanrader.",
    en: "We had a fault during the weekend and were helped quickly. The first good thing: I spoke to a real person on the phone who explained how it worked and what it would cost. The technician who helped us was professional, explained every step and even helped with an additional issue. Great service — definitely recommended.",
  },
  {
    name: "Linda M.",
    date: "2023-12-23",
    rating: 5,
    categories: ["spoed", "stroomstoring"],
    nl: "Vandaag is Hassan bij ons geweest. Telefonisch gelijk te pakken gekregen. Snel op locatie gekomen om onze stroomstoring op te lossen. Het was zeker niet makkelijk maar ondanks dat had hij heel veel geduld en bleef 'zoeken' naar de oorzaak. Daarbij ook voor een mooie prijs. Dankjewel en dit bedrijf raad ik zeker aan!!",
    en: "Hassan came to us today. Reached him straight away by phone. He was on site quickly to fix our power outage. It certainly wasn't easy, but he was very patient and kept looking for the cause. And at a great price too. Thank you — I definitely recommend this company!!",
  },
  {
    name: "Oriol T.",
    date: "2023-11-17",
    rating: 5,
    categories: ["spoed"],
    nl: "Geweldige service! We hadden op vrijdagavond een noodgeval en ze stuurden binnen een uur een elektricien. Ze moesten terugkomen voor een vervolgprobleem en waren ook heel flexibel met de afspraaktijd. De elektricien (Garrat) was een echte professional en heel vriendelijk.",
    en: "Great service! Had an emergency on a Friday evening and they sent and electrician in 1 hour. They had to come back for a follow-up issue, and were very flexible with the time for the appointment as well. The electrician (Garrat) was a great professional and very friendly.",
  },
  {
    name: "Verhoeven-Chi B.V.",
    date: "2024-01-01",
    rating: 5,
    categories: ["algemeen"],
    nl: "Binnen 24 uur stond er een elektricien voor de deur. Enorm vriendelijk, professioneel en behulpzaam — heeft nog hier en daar wat extra werk gedaan zonder kosten. TOP service!",
    en: "An electrician at our door within 24 hours. Extremely friendly, professional and helpful — even did some extra work at no charge. Top service!",
  },
  {
    name: "Antoinet van B.",
    date: "2024-02-01",
    rating: 5,
    categories: ["algemeen"],
    nl: "Heel vriendelijk. Een onderdeel van mijn lamp miste en hij is zelf bij de bouwmarkt gaan zoeken en gelijk teruggekomen, zonder extra kosten!",
    en: "Very friendly. A part for my lamp was missing so he went to the hardware store himself and came right back — at no extra cost!",
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
  return filterReviews(category).map((r) => ({
    name: r.name,
    date: r.date,
    rating: r.rating,
    text: locale === "en" ? r.en : r.nl,
  }));
}
