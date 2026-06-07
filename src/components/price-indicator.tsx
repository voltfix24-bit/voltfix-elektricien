import { Check } from "lucide-react";

import { CtaButtons } from "@/components/cta-buttons";

export type PriceRow = {
  title: string;
  price: string;
  unit: string;
  points: string[];
  featured?: boolean;
};

type Props = {
  title?: string;
  intro?: string;
  rows: PriceRow[];
  message?: string;
  location?: string;
};

// Prijsindicatieblok voor dienstpagina's (o.a. groepenkast en perilex).
export function PriceIndicator({
  title = "Prijsindicatie",
  intro,
  rows,
  message,
  location = "price-indicator",
}: Props) {
  return (
    <section className="border-t border-border bg-surface">
      <div className="mx-auto max-w-5xl px-4 py-14">
        <div className="text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
          {intro && (
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{intro}</p>
          )}
        </div>
        <div
          className={`mt-10 grid gap-6 ${rows.length > 1 ? "md:grid-cols-2 lg:grid-cols-3" : "max-w-md mx-auto"}`}
        >
          {rows.map((p) => (
            <div
              key={p.title}
              className={`rounded-xl border p-6 ${
                p.featured
                  ? "border-primary bg-card shadow-[var(--shadow-gold)]"
                  : "border-border bg-card"
              }`}
            >
              {p.featured && (
                <span className="mb-3 inline-block rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
                  Meest gekozen
                </span>
              )}
              <h3 className="text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 text-3xl font-bold text-primary">{p.price}</p>
              <p className="text-xs text-muted-foreground">{p.unit}</p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {p.points.map((pt) => (
                  <li key={pt} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" /> {pt}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Indicatieve prijzen incl. btw. U krijgt altijd een vaste prijs vooraf,
          afgestemd op uw situatie.
        </p>
        <div className="mt-8 flex justify-center">
          <CtaButtons message={message} location={location} />
        </div>
      </div>
    </section>
  );
}
