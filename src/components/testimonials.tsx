import { Star } from "lucide-react";

export type Testimonial = { name: string; text: string };

// ⚠️ PLACEHOLDER REVIEWS — dit zijn GEEN echte klantbeoordelingen.
// Vervang deze array later door echte Google reviews voordat er publiek
// reclame mee wordt gemaakt. Toon geen gemiddelde score of aantallen
// ("4,9 gemiddeld", "op basis van X reviews") zolang dit placeholders zijn.
const placeholderReviews: Testimonial[] = [
  {
    name: "Sanne — Amsterdam-Zuid",
    text: "Op zondagavond stroomstoring, binnen een uur was VoltFix er en alles werkte weer. Top en eerlijk over de prijs.",
  },
  {
    name: "Bram — De Pijp",
    text: "Nieuwe groepenkast laten plaatsen. Netjes gewerkt, alles uitgelegd en keurig opgeruimd achtergelaten.",
  },
  {
    name: "Familie El Amrani — Oost",
    text: "Perilex voor de inductiekookplaat snel en vakkundig aangesloten. Aanrader voor Amsterdam.",
  },
];

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
// VOORBEELDEN getoond. Pas zodra `reviews` met echte Google reviews wordt
// meegegeven, mag een gemiddelde score worden toegevoegd.
export function Testimonials({ title = "Wat klanten zeggen", reviews, muted }: Props) {
  const items = reviews ?? placeholderReviews;
  const isPlaceholder = !reviews;

  return (
    <section className={muted ? "border-y border-border bg-surface" : ""}>
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
          {isPlaceholder ? (
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              Voorbeelden van het soort werk dat we doen in Amsterdam.
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
            Voorbeeldweergave — hier verschijnen straks echte Google reviews.
          </p>
        )}
      </div>
    </section>
  );
}
