import { Phone } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";

import { business, telHref, whatsappHref } from "@/lib/business";
import { whatsappMessageFor } from "@/lib/whatsapp-messages";
import { useLocale, useT } from "@/lib/i18n";
import { useTrackConversion } from "@/lib/analytics";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";

// Sticky bottom action bar — mobile only.
// Bellen is de dominante actie; WhatsApp staat er als compact icoon naast.
// CTAs carry data-gtm + gtm-* classes for Google Tag Manager tracking.
export function MobileCtaBar() {
  const t = useT();
  const locale = useLocale();
  const track = useTrackConversion();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const waMessage = whatsappMessageFor(pathname, locale);
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex items-stretch border-t border-border bg-white shadow-[0_-6px_20px_-10px_rgba(0,0,0,0.25)] lg:hidden">
      <a
        href={telHref}
        className="gtm-cta-call flex flex-1 items-center justify-center gap-2 bg-destructive py-3 text-sm font-bold text-destructive-foreground"
        data-gtm="cta-call"
        data-gtm-location="mobile-bar"
        onClick={() => track("call", "mobile-bar")}
      >
        <Phone className="h-5 w-5" />
        <span>
          {t.callDirect} · {business.phoneDisplay}
        </span>
      </a>
      <a
        href={whatsappHref(waMessage, { campaign: pathname, content: "mobile-bar", term: locale })}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t.whatsapp}
        className="gtm-cta-whatsapp flex w-16 shrink-0 items-center justify-center bg-whatsapp text-whatsapp-foreground"
        data-gtm="cta-whatsapp"
        data-gtm-location="mobile-bar"
        onClick={() => track("whatsapp", "mobile-bar")}
      >
        <WhatsAppIcon className="h-6 w-6" ariaLabel={t.whatsapp} />
      </a>
    </div>
  );
}
