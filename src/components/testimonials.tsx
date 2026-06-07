import { Star } from "lucide-react";

export type Testimonial = { name: string; text: string };

const defaultReviews: Testimonial[] = [
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
  reviews?: Testimonial[];
  /** Subtle background variant for alternating sections. */
  muted?: boolean;
};

// Review/testimonial section. The reviews below are placeholders —
// vervang ze later eenvoudig door echte Google reviews.
export function Testimonials({ title = "Wat klanten zeggen", reviews = defaultReviews, muted }: Props) {
  return (
    <section className={muted ? "border-y border-border bg-surface" : ""}>
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
          <div className="mt-3 flex items-center justify-center gap-1 text-primary">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-current" />
            ))}
            <span className="ml-2 text-sm text-muted-foreground">
              Gemiddeld 4,9 op basis van lokale reviews
            </span>
          </div>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {reviews.map((r) => (
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
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Plaatsingsvoorbeelden. Echte Google reviews worden hier weergegeven.
        </p>
      </div>
    </section>
  );
}
