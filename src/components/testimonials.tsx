import { Star } from "lucide-react";

import { useT } from "@/lib/i18n";

export type Testimonial = { name: string; text: string };

type Props = {
  title?: string;
  /**
   * Echte reviews. Geef dit pas mee zodra er geverifieerde Google reviews zijn.
   * Zolang dit leeg blijft, tonen we duidelijk gelabelde voorbeelden.
   */
  reviews?: Testimonial[];
  /** Subtle background variant for alternating sections. */
  muted?: boolean;
};

// Review/testimonial sectie. Standaard worden duidelijk gelabelde
// VOORBEELDEN getoond (uit de i18n-dictionary). Pas zodra `reviews` met echte
// Google reviews wordt meegegeven, mag een gemiddelde score worden toegevoegd.
export function Testimonials({ title, reviews, muted }: Props) {
  const t = useT();
  const items = reviews ?? t.reviews;
  const isPlaceholder = !reviews;

  return (
    <section className={muted ? "border-y border-border bg-surface" : ""}>
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">{title ?? t.reviewsTitle}</h2>
          {isPlaceholder ? (
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              {t.reviewsPlaceholderIntro}
            </p>
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
              {!isPlaceholder && (
                <div className="flex gap-0.5 text-primary">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              )}
              <blockquote className="mt-3 text-sm text-muted-foreground">“{r.text}”</blockquote>
              <figcaption className="mt-4 text-sm font-semibold">{r.name}</figcaption>
            </figure>
          ))}
        </div>
        {isPlaceholder && (
          <p className="mt-6 text-center text-xs text-muted-foreground">
            {t.reviewsPlaceholderFootnote}
          </p>
        )}
      </div>
    </section>
  );
}
