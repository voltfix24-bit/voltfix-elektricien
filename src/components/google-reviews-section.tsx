import { BadgeCheck, ExternalLink, Star } from "lucide-react";

import { featuredReviews } from "@/data/featured-reviews";
import { aggregateRating } from "@/data/reviews";
import { business } from "@/lib/business";
import { useLocale, useT } from "@/lib/i18n";

export function GoogleReviewsSection() {
  const locale = useLocale();
  const t = useT();

  const isEn = locale === "en";
  const ratingValue = isEn
    ? aggregateRating.ratingValue.toString()
    : aggregateRating.ratingValue.toString().replace(".", ",");
  const ratingLabel = isEn
    ? `${ratingValue} / 5.0`
    : `${ratingValue} / 5,0`;
  const reviewCountLabel = isEn
    ? `from ${aggregateRating.reviewCount} Google reviews`
    : `uit ${aggregateRating.reviewCount} Google-reviews`;
  const ctaLabel = isEn ? "View on Google" : "Bekijk op Google";
  const badgeLabel = isEn ? "Google review" : "Google-review";

  return (
    <section
      id="reviews"
      className="scroll-mt-24 border-y border-border bg-surface"
      aria-labelledby="reviews-heading"
    >
      <div className="mx-auto max-w-6xl px-4 section-y">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="reviews-heading" className="t-h2">
              {t.reviewsTitle}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-0.5 text-amber-500" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <span className="t-body font-bold text-foreground">
                {ratingLabel}
              </span>
              <span className="t-meta text-muted-foreground">
                {reviewCountLabel}
              </span>
            </div>
          </div>

          <a
            href={business.googleBusinessProfile}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-4 py-2 t-meta font-semibold text-foreground transition hover:border-primary/50 hover:bg-card/80"
          >
            <ExternalLink className="h-4 w-4 text-primary" aria-hidden />
            {ctaLabel}
          </a>
        </div>

        <div
          className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-3 md:overflow-visible"
          role="list"
          aria-label={isEn ? "Customer reviews" : "Klantreviews"}
        >
          {featuredReviews.map((review, index) => {
            const text = isEn ? review.en : review.nl;
            const date = isEn ? review.dateEn : review.dateNl;
            return (
              <article
                key={index}
                className="snap-start min-w-[85vw] shrink-0 rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md md:min-w-0"
                role="listitem"
              >
                <div className="flex items-center gap-0.5 text-amber-500" aria-hidden>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>

                <blockquote className="mt-4 t-body leading-relaxed text-foreground">
                  “{text}”
                </blockquote>

                <footer className="mt-6 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate t-body font-semibold text-foreground">
                      {review.author}
                    </p>
                    <p className="t-meta text-muted-foreground">{date}</p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2.5 py-1 t-fine font-medium text-muted-foreground">
                    <BadgeCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
                    {badgeLabel}
                  </span>
                </footer>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
