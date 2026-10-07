// Prijs- en trustblok boven de vouw voor de Search-landingspagina's (SEA Batch 1).
// Alle bedragen komen uit pricing.ts en de reviewstand uit reviews.ts.
import { Check } from "lucide-react";

import { aggregateRating } from "@/data/reviews";
import { eurEn, eurNl, prices } from "@/lib/pricing";

type Props = {
  locale?: "nl" | "en";
  /** Extra trust-punt, bijv. "Wij zoeken de oorzaak op". */
  extraTrust?: string;
  /** Toon VCA** en "geen callcenter" (NL) of "English-speaking" (EN). */
};

export function AdsHeroBlock({ locale = "nl", extraTrust }: Props) {
  const en = locale === "en";
  const money = en ? eurEn : eurNl;
  const rating = en
    ? `${aggregateRating.ratingValue} from ${aggregateRating.reviewCount} reviews`
    : `${aggregateRating.ratingValue.toString().replace(".", ",")} uit ${aggregateRating.reviewCount} reviews`;
  const trust = en
    ? [rating, "Techniek Nederland member", "Works to NEN 1010", "English-speaking", "12-month warranty"]
    : [rating, "Lid van Techniek Nederland", "Werkt volgens NEN 1010", "VCA**", "12 mnd garantie", "Geen callcenter"];
  if (extraTrust) trust.push(extraTrust);

  return (
    <div className="mt-6 max-w-2xl">
      <dl className="grid grid-cols-1 overflow-hidden rounded-lg border border-white/25 bg-white/10 sm:grid-cols-2">
        <div className="p-4">
          <dt className="text-sm font-semibold text-white/80">{en ? "Daytime" : "Overdag"}</dt>
          <dd className="mt-1 text-2xl font-bold text-white">
            {money(prices.emergencyFirstHour)} {en ? "first hour all-in" : "eerste uur all-in"}
          </dd>
        </div>
        <div className="border-t border-white/25 p-4 sm:border-l sm:border-t-0">
          <dt className="text-sm font-semibold text-white/80">
            {en ? "Evening / night / weekend" : "Avond / nacht / weekend"}
          </dt>
          <dd className="mt-1 text-2xl font-bold text-white">
            {money(prices.offHoursFirstHour)} {en ? "first hour all-in" : "eerste uur all-in"}
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-xs leading-relaxed text-white/75">
        {en
          ? "Call-out included · then per 15 min · incl. VAT"
          : "Voorrijden inbegrepen · daarna per 15 min · incl. btw"}
      </p>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium text-white/90">
        {trust.map((item) => (
          <li key={item} className="inline-flex items-center gap-1.5">
            <Check className="h-4 w-4 shrink-0" aria-hidden /> {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
