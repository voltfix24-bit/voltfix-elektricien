import { Phone } from "lucide-react";

import { business, telHref } from "@/lib/business";
import { CtaButtons } from "@/components/cta-buttons";
import { useT } from "@/lib/i18n";
import { useTrackConversion } from "@/lib/analytics";

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
  const t = useT();

  if (compact) {
    return (
      <section className="border-y border-primary/15 bg-surface">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 py-6 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
              <Phone className="h-5 w-5" />
            </span>
            <p className="text-base font-semibold text-foreground">
              {title ?? t.bandCompactTitle}{" "}
              <a
                href={telHref}
                className="gtm-cta-call text-primary underline-offset-2 hover:underline"
                data-gtm="cta-call"
                data-gtm-location={location}
              >
                {t.bandCallPrefix} {business.phoneDisplay}
              </a>
            </p>
          </div>
          <CtaButtons message={message} size="default" location={location} />
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-primary text-primary-foreground">
      <div className="absolute inset-0 bg-grid-brand opacity-60" aria-hidden />
      <div className="relative mx-auto max-w-4xl px-4 py-14 text-center">
        <h2 className="text-2xl font-bold text-balance text-white sm:text-3xl">
          {title ?? t.bandBigTitle}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-white/85">{text ?? t.bandBigText}</p>
        <div className="mt-7 flex justify-center">
          <CtaButtons message={message} location={location} onBrand />
        </div>
      </div>
    </section>
  );
}
