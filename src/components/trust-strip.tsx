import { BadgeCheck, CalendarCheck, ShieldCheck, Star, Zap } from "lucide-react";

import { aggregateRating } from "@/data/reviews";

type Lang = "nl" | "en";

const COPY: Record<Lang, { items: { label: string; sub: string }[] }> = {
  nl: {
    items: [
      {
        label: `${aggregateRating.ratingValue.toString().replace(".", ",")} ★`,
        sub: `${aggregateRating.reviewCount} Google reviews`,
      },
      { label: "KvK 95572589", sub: "geregistreerd" },
      { label: "NEN 1010", sub: "conform" },
      { label: "garantie", sub: "op arbeid" },
      { label: "≤ 60 min", sub: "bij spoed in Amsterdam" },
    ],
  },
  en: {
    items: [
      {
        label: `${aggregateRating.ratingValue} ★`,
        sub: `${aggregateRating.reviewCount} Google reviews`,
      },
      { label: "CoC 95572589", sub: "registered" },
      { label: "NEN 1010", sub: "compliant" },
      { label: "warranty", sub: "on labour" },
      { label: "≤ 60 min", sub: "for emergencies in Amsterdam" },
    ],
  },
};


const ICONS = [Star, BadgeCheck, ShieldCheck, Zap, CalendarCheck];

export function TrustStrip({ lang = "nl" }: { lang?: Lang }) {
  const { items } = COPY[lang];
  return (
    <section aria-label="Trust" className="border-y border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {items.map((it, i) => {
            const Icon = ICONS[i];
            return (
              <li
                key={it.label}
                className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2 text-left"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="leading-tight">
                  <span className="block text-sm font-bold text-foreground">{it.label}</span>
                  <span className="block text-xs text-muted-foreground">{it.sub}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
