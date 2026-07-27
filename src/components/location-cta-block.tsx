import { BadgeCheck, Clock3, Euro, ShieldCheck, Wrench, Zap } from "lucide-react";

import { CtaButtons } from "@/components/cta-buttons";
import { business } from "@/lib/business";
import { eurNl, prices } from "@/lib/pricing";

type Props = {
  /** Location name as used in H1 (e.g. "Amsterdam Zuid", "Amstelveen"). */
  name: string;
  /** Language for the copy. Defaults to nl. */
  lang?: "nl" | "en";
  /** Optional postcodes to reinforce local relevance for Google. */
  postcodes?: string[];
  /** GTM location tag. */
  gtmLocation?: string;
  /** WhatsApp default message for this location. */
  whatsappMessage?: string;
};

/**
 * Hyper-local conversion block for neighbourhood pages.
 * Combines: local urgency line + trust chips + price snapshot + primary CTAs.
 * Adds semantic value for visitors and reinforces local + service relevance for search.
 */
export function LocationCtaBlock({
  name,
  lang = "nl",
  postcodes,
  gtmLocation = "location-cta",
  whatsappMessage,
}: Props) {
  const isEn = lang === "en";
  const copy = isEn
    ? {
        eyebrow: `Fast response in ${name}`,
        title: `Need an electrician in ${name}?`,
        lead: `Call or WhatsApp for direct help — often on site within 30–60 minutes across ${name}${
          postcodes && postcodes.length ? ` (postcodes ${postcodes[0]}–${postcodes[postcodes.length - 1]})` : ""
        }. Fixed price agreed up front, NEN 1010 and warranty on labour.`,
        trust: [
          { icon: ShieldCheck, label: "NEN 1010" },
          { icon: BadgeCheck, label: `KvK ${business.kvk}` },
          { icon: Wrench, label: "VCA** certified" },
          { icon: ShieldCheck, label: "Warranty on labour" },
        ],
        priceHeading: `Transparent rates in ${name}`,
        prices: [
          { label: "Hourly rate", value: `€${prices.hourly}/h` },
          { label: "Emergency all-in first hour", value: `€${prices.emergencyFirstHour}` },
          { label: "New fuse box from", value: `€${prices.groepenkastFrom}` },
        ],
        note: "All prices incl. VAT for consumers. Call-out included.",
      }
    : {
        eyebrow: `Snelle hulp in ${name}`,
        title: `Elektricien nodig in ${name}?`,
        lead: `Bel of app direct — vaak binnen 30–60 minuten ter plaatse in ${name}${
          postcodes && postcodes.length ? ` (postcodes ${postcodes[0]}–${postcodes[postcodes.length - 1]})` : ""
        }. Vaste prijsafspraak vooraf, werk volgens NEN 1010 en garantie op arbeid.`,
        trust: [
          { icon: ShieldCheck, label: "NEN 1010" },
          { icon: BadgeCheck, label: `KvK ${business.kvk}` },
          { icon: Wrench, label: "VCA** gecertificeerd" },
          { icon: ShieldCheck, label: "Garantie op arbeid" },
        ],
        priceHeading: `Transparante tarieven in ${name}`,
        prices: [
          { label: "Uurtarief kantooruren", value: `${eurNl(prices.hourly)}/u` },
          { label: "Spoed all-in eerste uur", value: eurNl(prices.emergencyFirstHour) },
          { label: "Groepenkast vanaf", value: eurNl(prices.groepenkastFrom) },
        ],
        note: "Bedragen incl. btw voor consumenten. Voorrijkosten inbegrepen.",
      };

  return (
    <section
      aria-labelledby="location-cta-title"
      className="border-y border-border bg-gradient-to-b from-surface to-background"
    >
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-700 ring-1 ring-red-200">
              <Zap className="h-3.5 w-3.5" aria-hidden /> {copy.eyebrow}
            </span>
            <h2 id="location-cta-title" className="mt-3 text-3xl font-bold sm:text-4xl">
              {copy.title}
            </h2>
            <p className="mt-3 max-w-xl text-base text-muted-foreground">{copy.lead}</p>

            <ul className="mt-5 flex flex-wrap gap-2">
              {copy.trust.map((t) => (
                <li
                  key={t.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground"
                >
                  <t.icon className="h-3.5 w-3.5 text-primary" aria-hidden />
                  {t.label}
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <CtaButtons location={gtmLocation} message={whatsappMessage} />
            </div>
          </div>

          <aside
            aria-label={copy.priceHeading}
            className="rounded-2xl border border-border bg-background p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Euro className="h-4 w-4 text-primary" aria-hidden />
              {copy.priceHeading}
            </div>
            <dl className="mt-4 divide-y divide-border">
              {copy.prices.map((p) => (
                <div key={p.label} className="flex items-center justify-between py-2.5">
                  <dt className="text-sm text-muted-foreground">{p.label}</dt>
                  <dd className="text-base font-semibold tabular-nums">{p.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
              <Clock3 className="mt-[2px] h-3.5 w-3.5 shrink-0" aria-hidden />
              {copy.note}
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
