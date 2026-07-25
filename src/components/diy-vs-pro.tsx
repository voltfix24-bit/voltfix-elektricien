import { Check, X } from "lucide-react";

import { CtaButtons } from "@/components/cta-buttons";

type Lang = "nl" | "en";

const COPY: Record<Lang, {
  title: string;
  sub: string;
  diyTitle: string;
  diySub: string;
  proTitle: string;
  proSub: string;
  diy: string[];
  pro: string[];
  ctaNote: string;
}> = {
  nl: {
    title: "Zelf doen of laten doen?",
    sub: "Een perilex zit onder spanning en valt onder NEN 1010. Vergelijk eerlijk wat beide opties opleveren.",
    diyTitle: "Zelf aansluiten",
    diySub: "Alleen als u weet wat u doet",
    proTitle: "VoltFix laat het doen",
    proSub: "Vaste prijs · vandaag mogelijk",
    diy: [
      "Werk onder spanning bij verkeerde meting",
      "Geen garantie op arbeid",
      "Verzekering keert bij schade vaak niet uit",
      "Zelf tijd en materiaal regelen",
      "Risico op doorslaande groep of kortsluiting",
    ],
    pro: [
      "Gecertificeerde elektricien, NEN 1010",
      "1 jaar garantie op arbeid",
      "Verzekerd via aansprakelijkheidspolis",
      "Vaste prijs vooraf — vanaf € 120",
      "Vandaag of morgen ingepland",
    ],
    ctaNote: "Twijfelt u? Vraag een gratis prijsindicatie — u zit nergens aan vast.",
  },
  en: {
    title: "DIY or have it done?",
    sub: "A perilex is live and falls under NEN 1010. Compare honestly what each option delivers.",
    diyTitle: "Do it yourself",
    diySub: "Only if you know what you're doing",
    proTitle: "Have VoltFix do it",
    proSub: "Fixed price · same-day possible",
    diy: [
      "Working live if measurement is wrong",
      "No warranty on labour",
      "Insurance often refuses to pay for damage",
      "You arrange time and materials yourself",
      "Risk of tripping circuits or short circuits",
    ],
    pro: [
      "Certified electrician, NEN 1010",
      "1-year warranty on labour",
      "Insured under liability policy",
      "Fixed price up front — from €120",
      "Scheduled today or tomorrow",
    ],
    ctaNote: "In doubt? Request a free price indication — no obligation.",
  },
};

export function DiyVsPro({ lang = "nl", message }: { lang?: Lang; message?: string }) {
  const t = COPY[lang];
  return (
    <section className="border-t border-border bg-surface">
      <div className="mx-auto max-w-5xl px-4 py-14">
        <div className="text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">{t.title}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{t.sub}</p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {/* DIY */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground">{t.diyTitle}</h3>
            <p className="text-xs text-muted-foreground">{t.diySub}</p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              {t.diy.map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro */}
          <div className="rounded-xl border-2 border-primary bg-card p-6 shadow-[var(--shadow-gold)]">
            <span className="mb-3 inline-block rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
              {lang === "nl" ? "Aanbevolen" : "Recommended"}
            </span>
            <h3 className="text-lg font-semibold text-foreground">{t.proTitle}</h3>
            <p className="text-xs text-muted-foreground">{t.proSub}</p>
            <ul className="mt-4 space-y-2.5 text-sm text-foreground">
              {t.pro.map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <CtaButtons message={message} location="diy-vs-pro" />
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">{t.ctaNote}</p>
      </div>
    </section>
  );
}
