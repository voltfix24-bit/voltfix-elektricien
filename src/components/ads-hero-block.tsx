// Prijs- en trustblok boven de vouw voor de Search-landingspagina's (SEA Batch 1).
// Alle bedragen komen uit pricing.ts en de reviewstand uit reviews.ts.
import { Check, FileText, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTrackConversion } from "@/lib/analytics";
import { business, telHref } from "@/lib/business";

import { aggregateRating } from "@/data/reviews";
import { eurEn, eurNl, prices } from "@/lib/pricing";

type Props = {
  locale?: "nl" | "en";
  /** Extra trust-punt, bijv. "Wij zoeken de oorzaak op". */
  extraTrust?: string;
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
            {money(prices.emergencyFirstHour)}{" "}
            <span className="text-sm font-semibold text-white/80">{en ? "first hour all-in" : "eerste uur all-in"}</span>
          </dd>
        </div>
        <div className="border-t border-white/25 p-4 sm:border-l sm:border-t-0">
          <dt className="text-sm font-semibold text-white/80">
            {en ? "Evening / night / weekend" : "Avond / nacht / weekend"}
          </dt>
          <dd className="mt-1 text-2xl font-bold text-white">
            {money(prices.offHoursFirstHour)}{" "}
            <span className="text-sm font-semibold text-white/80">{en ? "first hour all-in" : "eerste uur all-in"}</span>
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

/** Hero-knoppen voor de algemene pagina's: bellen (spoed) + offerte (gepland). */
export function CallQuoteActions({ locale = "nl" }: { locale?: "nl" | "en" }) {
  const en = locale === "en";
  const track = useTrackConversion();
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <Button asChild variant="call" size="lg" className="w-full sm:w-auto">
        <a href={telHref} className="gtm-cta-call" data-gtm="cta-call" data-gtm-location="service-hero" onClick={() => track("call", "service-hero")}>
          <Phone /> {en ? "Call now (emergency)" : "Bel direct (spoed)"} · {business.phoneDisplay}
        </a>
      </Button>
      <Button asChild variant="outlineBrand" size="lg" className="w-full sm:w-auto">
        <a href={en ? "/en-gb/contact#offerte" : "/contact#offerte"} className="gtm-cta-quote" data-gtm="cta-quote" data-gtm-location="service-hero" onClick={() => track("quote", "service-hero")}>
          <FileText /> {en ? "Request a quote" : "Offerte voor gepland werk"}
        </a>
      </Button>
    </div>
  );
}

/** Alleen de trust-punten (voor pagina's die al een prijsblok in de hero hebben). */
export function AdsTrustList({ locale = "nl" }: { locale?: "nl" | "en" }) {
  const en = locale === "en";
  const rating = en
    ? `${aggregateRating.ratingValue} from ${aggregateRating.reviewCount} reviews`
    : `${aggregateRating.ratingValue.toString().replace(".", ",")} uit ${aggregateRating.reviewCount} reviews`;
  const trust = en
    ? [rating, "Techniek Nederland member", "Works to NEN 1010", "English-speaking", "12-month warranty"]
    : [rating, "Lid van Techniek Nederland", "Werkt volgens NEN 1010", "VCA**", "12 mnd garantie", "Geen callcenter"];
  return (
    <ul className="mt-4 flex max-w-2xl flex-wrap gap-x-4 gap-y-2 text-sm font-medium text-white/90">
      {trust.map((item) => (
        <li key={item} className="inline-flex items-center gap-1.5">
          <Check className="h-4 w-4 shrink-0" aria-hidden /> {item}
        </li>
      ))}
    </ul>
  );
}
