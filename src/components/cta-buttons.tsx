import { CalendarClock, Clock, FileText, MessageCircle, Phone } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { responsePromiseEn, responsePromiseNl, telHref, whatsappHref } from "@/lib/business";
import { whatsappMessageFor } from "@/lib/whatsapp-messages";
import { useLocale, useT } from "@/lib/i18n";
import { useTrackConversion } from "@/lib/analytics";
import { contactQuoteHref } from "@/lib/job-prefill";

import { hasBookingFlow } from "@/lib/booking-paths";


type Props = {
  message?: string;
  className?: string;
  size?: "default" | "lg" | "xl";
  /** Where the CTA lives, used for GTM event context (e.g. "hero", "cta-band"). */
  location?: string;
  /** Use on blue brand surfaces (hero / CTA band) so the Offerte button stays legible. */
  onBrand?: boolean;
};

// The three primary conversion actions: Bel direct (red), WhatsApp (green), Offerte.
// Each action carries data-gtm + a gtm-* class so Google Tag Manager can
// track clicks without further code changes.
export function CtaButtons({ message, className, size = "lg", location = "page", onBrand }: Props) {
  const t = useT();
  const locale = useLocale();
  const track = useTrackConversion();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Fallback: route-specific message when no explicit prop is passed.
  const fallbackMessage = whatsappMessageFor(pathname, locale);
  const promise = locale === "en" ? responsePromiseEn : responsePromiseNl;
  const hasBooking = hasBookingFlow(pathname);
  const badgeClass = onBrand
    ? "mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white ring-1 ring-white/25 backdrop-blur"
    : "mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800 ring-1 ring-emerald-200";
  return (
    <div className={`flex flex-wrap gap-3 ${className ?? ""}`}>
      <div className="flex flex-col items-start">
        <Button asChild variant="call" size={size}>
          <a
            href={telHref}
            className="gtm-cta-call"
            data-gtm="cta-call"
            data-gtm-location={location}
            onClick={() => track("call", location)}
          >
            <Phone /> {t.callDirect}
          </a>
        </Button>
        <span className={badgeClass} aria-label={promise}>
          <Clock className="h-3 w-3" aria-hidden /> {promise}
        </span>
      </div>
      <div className="flex flex-col items-start">
        <Button asChild variant="whatsapp" size={size}>
          <a
            href={whatsappHref(message ?? fallbackMessage, { campaign: pathname, content: location, term: locale })}
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
        <span className={badgeClass} aria-label={promise}>
          <Clock className="h-3 w-3" aria-hidden /> {promise}
        </span>
      </div>
      <Button asChild variant={onBrand ? "outlineBrand" : "outlineLight"} size={size}>
        {hasBooking ? (
          <a
            href="#installatiemoment"
            className="gtm-cta-schedule"
            data-gtm="cta-schedule"
            data-gtm-location={location}
            onClick={() => track("schedule", location)}
          >
            <CalendarClock /> {locale === "en" ? "Book installation" : "Plan afspraak"}
          </a>
        ) : (
          <a
            href={contactQuoteHref(t.contactTo, pathname)}
            className="gtm-cta-quote"
            data-gtm="cta-quote"
            data-gtm-location={location}
            onClick={() => track("quote", location)}
          >
            <FileText /> {t.requestQuote}
          </a>
        )}
      </Button>
    </div>
  );
}

