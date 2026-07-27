import { CalendarClock, FileText, MessageCircle, Phone } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";

import { business, telHref, whatsappHref } from "@/lib/business";
import { whatsappMessageFor } from "@/lib/whatsapp-messages";
import { useLocale, useT } from "@/lib/i18n";
import { useTrackConversion } from "@/lib/analytics";
import { contactQuoteHref } from "@/lib/job-prefill";

/** Pages that expose the inline booking flow (#installatiemoment). */
const BOOKING_PATHS = new Set([
  "/perilex-amsterdam",
  "/en-gb/perilex-amsterdam",
]);

// Sticky bottom action bar — mobile only.
// CTAs carry data-gtm + gtm-* classes for Google Tag Manager tracking.
export function MobileCtaBar() {
  const t = useT();
  const locale = useLocale();
  const track = useTrackConversion();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const waMessage = whatsappMessageFor(pathname, locale);
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-[45%_27.5%_27.5%] border-t border-border bg-white shadow-[0_-6px_20px_-10px_rgba(0,0,0,0.25)] lg:hidden">
      <a
        href={telHref}
        className="gtm-cta-call flex flex-col items-center justify-center gap-1 bg-destructive py-2.5 text-xs font-bold text-destructive-foreground"
        data-gtm="cta-call"
        data-gtm-location="mobile-bar"
        onClick={() => track("call", "mobile-bar")}
      >
        <Phone className="h-5 w-5" />
        {business.phoneDisplay}
      </a>
      <a
        href={whatsappHref(waMessage, { campaign: pathname, content: "mobile-bar", term: locale })}
        target="_blank"
        rel="noopener noreferrer"
        className="gtm-cta-whatsapp flex flex-col items-center justify-center gap-1 bg-whatsapp py-2.5 text-xs font-bold text-whatsapp-foreground"
        data-gtm="cta-whatsapp"
        data-gtm-location="mobile-bar"
        onClick={() => track("whatsapp", "mobile-bar")}
      >
        <MessageCircle className="h-5 w-5" />
        {t.whatsapp}
      </a>
      <a
        href={contactQuoteHref(t.contactTo, pathname)}
        className="gtm-cta-quote flex flex-col items-center justify-center gap-1 bg-primary py-2.5 text-xs font-bold text-primary-foreground"
        data-gtm="cta-quote"
        data-gtm-location="mobile-bar"
        onClick={() => track("quote", "mobile-bar")}
      >
        <FileText className="h-5 w-5" />
        {t.mobileQuote}
      </a>
    </div>
  );
}
