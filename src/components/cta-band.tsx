import { Phone } from "lucide-react";

import { business, telHref } from "@/lib/business";
import { CtaButtons } from "@/components/cta-buttons";

type Props = {
  title?: string;
  text?: string;
  message?: string;
  /** Compact band for the "after every 2 sections" rhythm. */
  compact?: boolean;
  location?: string;
};

// Repeated conversion band placed after major sections.
export function CtaBand({ title, text, message, compact, location = "cta-band" }: Props) {
  if (compact) {
    return (
      <section className="border-y border-primary/20 bg-card">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 py-6 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Phone className="h-5 w-5" />
            </span>
            <p className="text-base font-semibold text-foreground">
              {title ?? "Direct hulp nodig?"}{" "}
              <a
                href={telHref}
                className="gtm-cta-call text-primary underline-offset-2 hover:underline"
                data-gtm="cta-call"
                data-gtm-location={location}
              >
                Bel {business.phoneDisplay}
              </a>
            </p>
          </div>
          <CtaButtons message={message} size="default" location={location} />
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden border-y border-primary/20 bg-card">
      <div className="absolute inset-0 bg-grid opacity-60" aria-hidden />
      <div className="relative mx-auto max-w-4xl px-4 py-14 text-center">
        <h2 className="text-2xl font-bold text-balance sm:text-3xl">
          {title ?? "Direct een elektricien nodig in Amsterdam?"}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          {text ??
            `Bel ${business.phoneDisplay} of stuur een WhatsApp. Vaak binnen 30–60 minuten ter plaatse bij spoed, met een vaste prijsafspraak vooraf.`}
        </p>
        <div className="mt-7 flex justify-center">
          <CtaButtons message={message} location={location} />
        </div>
      </div>
    </section>
  );
}
