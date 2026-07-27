import { useRouterState } from "@tanstack/react-router";
import { CalendarClock, Check, MessageCircle, Phone, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  business,
  responsePromiseEn,
  responsePromiseNl,
  telHref,
  whatsappHref,
} from "@/lib/business";
import { useTrackConversion } from "@/lib/analytics";
import { whatsappMessageFor } from "@/lib/whatsapp-messages";

type Lang = "nl" | "en";

const COPY: Record<Lang, {
  title: string;
  sub: string;
  diyTitle: string;
  diySub: string;
  proTitle: string;
  proSub: string;
  recommended: string;
  diy: string[];
  pro: string[];
  callDirect: string;
  whatsapp: string;
  bookAppointment: string;
  compliance: string;
  ctaNote: string;
}> = {
  nl: {
    title: "Zelf aansluiten of laten doen?",
    sub: "Perilex aansluiten vraagt om de juiste metingen én het juiste apparaatschema. Bekijk wat bij jou past.",
    diyTitle: "Zelf aansluiten",
    diySub: "Voor mensen met voldoende elektrotechnische kennis",
    proTitle: "VoltFix laat het doen",
    proSub: "Snel geregeld door een vakbekwame elektricien",
    recommended: "Aanbevolen",
    diy: [
      "Zelf de Perilex-configuratie meten en controleren",
      "Zelf het fabrikantenschema correct interpreteren",
      "Zelf stekker, bruggen en aansluitblok controleren",
      "Geen garantie op zelf uitgevoerd werk",
      "Fout meten of aansluiten kan storing of schade veroorzaken",
    ],
    pro: [
      "Vakbekwame elektricien",
      "Aansluiting en metingen gecontroleerd",
      "Fabrikantschema meegenomen in de controle",
      "Garantie op uitgevoerd werk",
      "Bedrijfsmatig verzekerd",
      "Vooraf duidelijkheid over de kosten",
      "Vandaag of morgen mogelijk",
    ],
    callDirect: "Bel direct",
    whatsapp: "WhatsApp",
    bookAppointment: "Plan direct je afspraak",
    compliance: "Werkzaamheden volgens de geldende installatievoorschriften.",
    ctaNote: "Twijfel je? Plan een gratis schouw of stuur een WhatsApp.",
  },
  en: {
    title: "Do it yourself or have it done?",
    sub: "Connecting a perilex needs correct measurements and the right appliance diagram. See what fits you.",
    diyTitle: "Do it yourself",
    diySub: "For people with sufficient electrical knowledge",
    proTitle: "Have VoltFix do it",
    proSub: "Quickly sorted by a qualified electrician",
    recommended: "Recommended",
    diy: [
      "Measure and verify the Perilex configuration yourself",
      "Interpret the manufacturer's diagram correctly yourself",
      "Check plug, bridges and terminal block yourself",
      "No warranty on self-performed work",
      "A wrong measurement or connection can cause faults or damage",
    ],
    pro: [
      "Qualified electrician",
      "Connection and measurements verified",
      "Manufacturer diagram checked",
      "Warranty on work performed",
      "Business insured",
      "Costs clear up front",
      "Today or tomorrow possible",
    ],
    callDirect: "Call now",
    whatsapp: "WhatsApp",
    requestQuote: "Request a quote",
    contactHref: "/en-gb/contact#offerte",
    compliance: "Work carried out to applicable installation standards.",
    ctaNote: "Not sure? Request a free, no-obligation price indication.",
  },
};

export function DiyVsPro({ lang = "nl", message }: { lang?: Lang; message?: string }) {
  const t = COPY[lang];
  const track = useTrackConversion();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const fallbackMessage = whatsappMessageFor(pathname, lang);
  const promise = lang === "en" ? responsePromiseEn : responsePromiseNl;
  const location = "diy-vs-pro";

  return (
    <section className="border-t border-border bg-surface">
      <div className="mx-auto max-w-5xl px-4 py-14">
        <div className="text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">{t.title}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{t.sub}</p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 md:items-stretch">
          {/* DIY */}
          <div className="flex flex-col rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground">{t.diyTitle}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{t.diySub}</p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              {t.diy.map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <X
                    aria-hidden
                    className="mt-0.5 h-4 w-4 shrink-0 text-destructive/70"
                  />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro */}
          <div className="flex flex-col rounded-xl border-2 border-primary bg-card p-6 shadow-[var(--shadow-gold)]">
            <span className="mb-3 inline-block w-fit rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
              {t.recommended}
            </span>
            <h3 className="text-lg font-semibold text-foreground">{t.proTitle}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{t.proSub}</p>
            <ul className="mt-4 space-y-2.5 text-sm text-foreground">
              {t.pro.map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-col gap-2.5">
              {/* Primary: Bel direct */}
              <Button asChild variant="call" size="lg" className="w-full">
                <a
                  href={telHref}
                  className="gtm-cta-call"
                  data-gtm="cta-call"
                  data-gtm-location={location}
                  onClick={() => track("call", location)}
                  aria-label={`${t.callDirect} ${business.phoneDisplay}`}
                >
                  <Phone /> {t.callDirect}
                </a>
              </Button>
              <span className="mx-auto -mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                {promise}
              </span>

              {/* Secondary: WhatsApp */}
              <Button asChild variant="whatsapp" size="lg" className="w-full">
                <a
                  href={whatsappHref(message ?? fallbackMessage, {
                    campaign: pathname,
                    content: location,
                    term: lang,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gtm-cta-whatsapp"
                  data-gtm="cta-whatsapp"
                  data-gtm-location={location}
                  onClick={() => track("whatsapp", location)}
                >
                  <MessageCircle /> {t.whatsapp}
                </a>
              </Button>

              {/* Tertiary: Offerte */}
              <Button asChild variant="outlineLight" size="lg" className="w-full">
                <a
                  href={t.contactHref}
                  className="gtm-cta-quote"
                  data-gtm="cta-quote"
                  data-gtm-location={location}
                  onClick={() => track("quote", location)}
                >
                  <FileText /> {t.requestQuote}
                </a>
              </Button>
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
              {t.compliance}
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">{t.ctaNote}</p>
      </div>
    </section>
  );
}
