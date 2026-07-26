import { CalendarClock, Phone } from "lucide-react";

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
  /** Optional extra secondary link (e.g. #installatiemoment). */
  secondaryHref?: string;
  secondaryLabel?: string;
};

// Repeated conversion band placed after major sections.
export function CtaBand({
  title,
  text,
  message,
  compact,
  location = "cta-band",
  secondaryHref,
  secondaryLabel,
}: Props) {
  const t = useT();
  const track = useTrackConversion();

  if (compact) {
    return (
      <section className="border-y border-primary/15 bg-surface">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 px-4 py-6 sm:flex-row sm:justify-between sm:gap-6">
          <div className="flex items-center gap-3 text-left">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
              <Phone className="h-5 w-5" />
            </span>
            <p className="text-sm font-semibold leading-snug text-foreground sm:text-base">
              {title ?? t.bandCompactTitle}{" "}
              <a
                href={telHref}
                className="gtm-cta-call whitespace-nowrap text-primary underline-offset-2 hover:underline"
                data-gtm="cta-call"
                data-gtm-location={location}
                onClick={() => track("call", location)}
              >
                {t.bandCallPrefix} {business.phoneDisplay}
              </a>
            </p>
          </div>
          <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
            <CtaButtons
              message={message}
              size="default"
              location={location}
              className="w-full justify-center sm:w-auto"
            />
            {secondaryHref && secondaryLabel && (
              <a
                href={secondaryHref}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted"
                data-gtm="cta-schedule"
                data-gtm-location={location}
              >
                <CalendarClock className="h-4 w-4" />
                {secondaryLabel}
              </a>
            )}
          </div>
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
