import { useRouterState } from "@tanstack/react-router";

import { whatsappHref } from "@/lib/business";
import { whatsappMessageFor } from "@/lib/whatsapp-messages";
import { useLocale } from "@/lib/i18n";
import { useTrackConversion } from "@/lib/analytics";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";


// Floating WhatsApp CTA — desktop only (mobile uses the bottom action bar).
export function WhatsAppFloat() {
  const locale = useLocale();
  const track = useTrackConversion();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const waMessage = whatsappMessageFor(pathname, locale);

  return (
    <a
      href={whatsappHref(waMessage, { campaign: pathname, content: "float-button", term: locale })}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      className="fixed bottom-6 right-6 z-50 hidden items-center justify-center rounded-full bg-whatsapp p-3.5 text-whatsapp-foreground shadow-lg shadow-whatsapp/30 transition-transform hover:scale-110 hover:shadow-xl lg:flex"
      data-gtm="cta-whatsapp"
      data-gtm-location="float-button"
      onClick={() => track("whatsapp", "float-button")}
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
