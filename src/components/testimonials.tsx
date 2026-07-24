import { ExternalLink, Star } from "lucide-react";

import { useLocale, useT } from "@/lib/i18n";

import { aggregateRating, localizedReviews, reviews as sourceReviews } from "@/data/reviews";
import { business } from "@/lib/business";

export type Testimonial = { name: string; text: string };

type Props = {
  title?: string;
  /**
   * Overschrijf de default set met eigen quotes. Leeg laten = echte
   * Google reviews uit `src/data/reviews.ts` (aanbevolen).
   */
  reviews?: Testimonial[];
  /** Subtle background variant for alternating sections. */
  muted?: boolean;
};

export function Testimonials({ title, reviews, muted }: Props) {
  const t = useT();
  const locale = useLocale();
  const items = reviews ?? localizedReviews(locale);

  // JSON-LD Review + AggregateRating — alleen op basis van geverifieerde bron.
  const jsonLd = !reviews
    ? {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: business.name,
        url: business.url,
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: aggregateRating.ratingValue,
          reviewCount: aggregateRating.reviewCount,
          bestRating: aggregateRating.bestRating,
          worstRating: aggregateRating.worstRating,
        },
        review: sourceReviews.map((r) => ({
          "@type": "Review",
          author: { "@type": "Person", name: r.name },
          datePublished: r.date,
          reviewRating: {
            "@type": "Rating",
            ratingValue: r.rating,
            bestRating: 5,
            worstRating: 1,
          },
          reviewBody: locale === "en" ? r.en : r.nl,
        })),
      }
    : null;

  const ratingLabel =
    locale === "en"
      ? `${aggregateRating.ratingValue} out of 5 — ${aggregateRating.reviewCount} Google reviews`
      : `${aggregateRating.ratingValue.toString().replace(".", ",")} van 5 — ${aggregateRating.reviewCount} Google reviews`;

  const sourceLabel = locale === "en" ? "Source: Google Business Profile" : "Bron: Google Bedrijfsprofiel";

  return (
    <section className={muted ? "border-y border-border bg-surface" : ""}>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
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
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {items.map((r) => (
            <figure key={r.name} className="rounded-xl border border-border bg-card p-6">
              <div className="flex gap-0.5 text-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-3 text-sm text-muted-foreground">“{r.text}”</blockquote>
              <figcaption className="mt-4 text-sm font-semibold">{r.name}</figcaption>
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
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold shadow-sm transition hover:border-primary hover:text-primary"
          >
            <Star className="h-4 w-4 fill-current text-primary" />
            {locale === "en"
              ? `Read all ${aggregateRating.reviewCount} Google reviews`
              : `Bekijk alle ${aggregateRating.reviewCount} Google reviews`}
            <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </div>

    </section>
  );
}
