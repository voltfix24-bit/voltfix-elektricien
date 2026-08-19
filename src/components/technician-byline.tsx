import { BadgeCheck, ShieldCheck, Wrench } from "lucide-react";

import { business } from "@/lib/business";
import { useLocale } from "@/lib/i18n";
import { warranties } from "@/lib/pricing";

/**
 * Zichtbaar E-E-A-T-blok: wie voert het werk uit + welke garantie geldt.
 * De machine-leesbare tegenhanger staat in het sitewide Person-schema
 * (zie personSchema in src/lib/seo.ts).
 */
export function TechnicianByline() {
  const locale = useLocale();
  const team = business.team;
  const w = locale === "en" ? warranties.en : warranties.nl;

  const label = locale === "en" ? "Work carried out by our electricians" : "Uitgevoerd door onze monteurs";
  const warrantyTitle = locale === "en" ? "Our warranty" : "Onze garantie";

  return (
    <section className="border-t border-border bg-surface" aria-labelledby="monteur-heading">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <h2 id="monteur-heading" className="mt-1 text-lg font-bold text-foreground">
            {team.map((m) => m.name).join(" & ")}
          </h2>
          <ul className="mt-3 space-y-4">
            {team.map((m) => (
              <li key={m.id}>
                <p className="text-sm font-semibold text-foreground">
                  {m.name} — {locale === "en" ? m.jobTitleEn : m.jobTitle}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {locale === "en" ? m.bioEn : m.bioNl}
                </p>
                {m.careerStartYear ? (
                  <p className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-primary">
                    <BadgeCheck className="h-4 w-4" aria-hidden />
                    {locale === "en"
                      ? `VCA-certified • electrician since ${m.careerStartYear}`
                      : `VCA-gecertificeerd • elektricien sinds ${m.careerStartYear}`}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>


        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
            {warrantyTitle}
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {[w.materials, w.workmanship, w.standard].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">{w.startNote}</p>
        </div>
      </div>
    </section>
  );
}
