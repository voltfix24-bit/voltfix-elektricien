// Echte Google reviews van VoltFix (Amsterdam).
// Gemiddeld: 4,9 / 5 op basis van 56 reviews (bron: Google Bedrijfsprofiel).
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
    name: "Car de Jong",
    date: "2024-09-01",
    rating: 5,
    categories: ["algemeen"],
    nl: "Hassan heeft geweldig werk geleverd. Binnen een dag een afspraak gemaakt en binnen een uur het klusje geklaard! Bovendien een goede prijs. Zeer aan te raden.",
    en: "Hassan did a great job. An appointment within a day and the work finished within an hour — at a fair price. Highly recommended.",
  },
  {
    name: "Maarten van der Vlist",
    date: "2025-11-01",
    rating: 5,
    categories: ["spoed"],
    nl: "Op zondag met spoed gekomen en ons uit de brand geholpen. Aardig en professioneel! Ik raad ze aan!",
    en: "Came out on a Sunday as an emergency and got us out of trouble. Friendly and professional — highly recommended!",
  },
  {
    name: "Linda Mehany",
    date: "2024-08-01",
    rating: 5,
    categories: ["spoed", "stroomstoring"],
    nl: "Vandaag is Hassan bij ons geweest. Telefonisch gelijk te pakken gekregen. Snel op locatie gekomen om onze stroomstoring op te lossen. Ondanks dat het niet makkelijk was bleef hij geduldig zoeken naar de oorzaak. Ook nog voor een mooie prijs. Zeker een aanrader!",
    en: "Hassan came out today. Reached him straight away by phone and he was on site quickly to fix our power outage. It wasn't easy, but he kept his patience and found the cause. Great price too — highly recommended!",
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
    name: "Antoinet van Berkel",
    date: "2024-02-01",
    rating: 5,
    categories: ["algemeen"],
    nl: "Heel vriendelijk. Een onderdeel van mijn lamp miste en hij is zelf bij de bouwmarkt gaan zoeken en gelijk teruggekomen, zonder extra kosten!",
    en: "Very friendly. A part for my lamp was missing so he went to the hardware store himself and came right back — at no extra cost!",
  },
  {
    name: "Diogenes Cruz",
    date: "2023-12-01",
    rating: 5,
    categories: ["spoed", "stroomstoring"],
    nl: "Wij hadden een storing in het weekend en werden snel geholpen. Ik sprak een echte persoon aan de telefoon die uitlegde hoe het werkte en wat het zou kosten. De monteur was professioneel, legde elke stap uit en hielp zelfs met een bijkomend probleem. Geweldige service, zeker een aanrader.",
    en: "We had a fault during the weekend and were helped quickly. I spoke to a real person on the phone who explained the process and the cost. The technician was professional, walked us through every step and even helped with an additional issue. Great service — highly recommended.",
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
    text: locale === "en" ? r.en : r.nl,
  }));
}

