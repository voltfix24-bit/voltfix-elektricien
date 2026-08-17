import { useState } from "react";
import { ExternalLink, Star } from "lucide-react";

import { useLocale, useT } from "@/lib/i18n";
import { useTrackSocialClick } from "@/lib/analytics";

import {
  aggregateRating,
  localizedReviews,
  type ReviewCategory,
} from "@/data/reviews";
import { business } from "@/lib/business";

export type Testimonial = {
  name: string;
  text: string;
  date?: string;
  /** Taal van het originele citaat. */
  lang?: "nl" | "en";
  /** Engelse vertaling, alleen op EN-pagina's bij een NL origineel. */
  translation?: string;
};

function formatReviewDate(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

type Props = {
  title?: string;
  /**
   * Overschrijf de default set met eigen quotes. Leeg laten = echte
   * Google reviews uit `src/data/reviews.ts` (aanbevolen).
   */
  reviews?: Testimonial[];
  /** Subtle background variant for alternating sections. */
  muted?: boolean;
  /**
   * Filter reviews op klustype (bv. "spoed" op spoedpagina).
   * Toont automatisch de meest relevante klantverhalen.
   */
  category?: ReviewCategory;
  /**
   * Toon klikbare filter-chips waarmee bezoekers zelf per klustype kunnen
   * filteren. Standaard uit; aanzetten op hub-pagina's zoals de homepage.
   */
  showFilters?: boolean;
};

const CATEGORY_LABELS: Record<ReviewCategory, { nl: string; en: string }> = {
  spoed: { nl: "Spoed", en: "Emergency" },
  stroomstoring: { nl: "Stroomstoring", en: "Power outage" },
  groepenkast: { nl: "Groepenkast", en: "Fuse box" },
  perilex: { nl: "Perilex", en: "Perilex" },
  laadpaal: { nl: "Laadpaal", en: "EV charger" },
  keuring: { nl: "Keuring", en: "Inspection" },
  algemeen: { nl: "Alle", en: "All" },
};

const FILTER_ORDER: ReviewCategory[] = [
  "algemeen",
  "spoed",
  "stroomstoring",
  "groepenkast",
  "perilex",
  "laadpaal",
  "keuring",
];

export function Testimonials({ title, reviews, muted, category, showFilters }: Props) {
  const t = useT();
  const locale = useLocale();
  const trackSocial = useTrackSocialClick();

  const [active, setActive] = useState<ReviewCategory>(category ?? "algemeen");
  const effectiveCategory: ReviewCategory | undefined = reviews
    ? undefined
    : showFilters
      ? active === "algemeen"
        ? undefined
        : active
      : category;

  const items = reviews ?? localizedReviews(locale, effectiveCategory).slice(0, 6);



  const ratingLabel =
    locale === "en"
      ? `${aggregateRating.ratingValue} out of 5 — ${aggregateRating.reviewCount} reviews submitted by customers`
      : `${aggregateRating.ratingValue.toString().replace(".", ",")} van 5 — ${aggregateRating.reviewCount} door klanten ingezonden beoordelingen`;

  const sourceLabel =
    locale === "en"
      ? `${aggregateRating.reviewCount} reviews submitted via Google by VoltFix customers`
      : `${aggregateRating.reviewCount} beoordelingen ingezonden via Google door klanten van VoltFix`;


  return (
    <section className={muted ? "border-y border-border bg-surface" : ""}>
      {/* Geen eigen LocalBusiness JSON-LD hier: de canonieke #business-entiteit
          (incl. AggregateRating 4,9 / 57 en Review-nodes) staat al in __root.tsx.
          Een tweede node met hetzelfde @id laat Google de entiteit negeren. */}

      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">{title ?? t.reviewsTitle}</h2>
          {!reviews ? (
            <>
              <div className="mt-3 flex items-center justify-center gap-2 text-primary">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <span className="text-sm font-semibold text-foreground">{ratingLabel}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{sourceLabel}</p>
            </>
          ) : (
            <div className="mt-3 flex items-center justify-center gap-1 text-primary">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-current" />
              ))}
            </div>
          )}
        </div>

        {!reviews && showFilters && (
          <div
            className="mt-6 flex flex-wrap justify-center gap-2"
            role="group"
            aria-label={locale === "en" ? "Filter reviews by job type" : "Filter reviews op type klus"}
          >
            {FILTER_ORDER.map((cat) => {
              const isActive = active === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActive(cat)}
                  data-cta="reviews-filter"
                  data-cta-category={cat}
                  aria-pressed={isActive}
                  className={
                    "rounded-full border px-4 py-1.5 text-xs font-semibold transition " +
                    (isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:border-primary hover:text-primary")
                  }
                >
                  {CATEGORY_LABELS[cat][locale === "en" ? "en" : "nl"]}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {items.map((r) => (
            <figure key={r.name} className="flex flex-col rounded-xl border border-border bg-card p-6">
              <div className="flex gap-0.5 text-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote
                lang={r.lang}
                className="mt-3 text-sm text-muted-foreground"
              >
                “{r.text}”
              </blockquote>
              {r.translation && (
                <p lang="en" className="mt-2 text-sm italic text-muted-foreground/80">
                  <span className="not-italic font-medium">English: </span>
                  “{r.translation}”
                </p>
              )}
              <div className="flex-1" />
              <figcaption className="mt-4 text-sm font-semibold">{r.name}</figcaption>
              {r.date && (
                <p className="mt-1 text-xs text-muted-foreground">
                  <time dateTime={r.date}>{formatReviewDate(r.date, locale)}</time>
                </p>
              )}
              <a
                href={business.googleBusinessProfile}
                target="_blank"
                rel="noopener noreferrer nofollow"
                data-cta="google-review-source"
                data-cta-location="testimonial-card"
                onClick={() => trackSocial("google", "testimonial-card")}
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                {locale === "en" ? "View on Google" : "Bekijk op Google"}
                <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            </figure>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <a
            href={business.googleBusinessProfile}
            target="_blank"
            rel="noopener noreferrer"
            data-cta="google-reviews"
            data-cta-location="testimonials"
            data-gtm="cta-social"
            data-gtm-network="google"
            data-gtm-location="testimonials"
            onClick={() => trackSocial("google", "testimonials")}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold shadow-sm transition hover:border-primary hover:text-primary"
          >
            <Star className="h-4 w-4 fill-current text-primary" />
            {locale === "en"
              ? `Read the ${aggregateRating.reviewCount} submitted reviews`
              : `Lees de ${aggregateRating.reviewCount} ingezonden beoordelingen`}
            <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}
