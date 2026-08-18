import { useRouterState } from "@tanstack/react-router";

import { ScheduleDisclosure } from "@/components/schedule-disclosure";
import { SchedulePicker } from "@/components/schedule-picker";
import { useLocale } from "@/lib/i18n";
import { shouldRenderGlobalBooking } from "@/lib/booking-paths";

/**
 * Globale, ingeklapte boekingflow onderaan elke plan-bare pagina.
 * Opent via #installatiemoment (vanuit hero-CTA's, mobile bar, of directe link).
 * Sla over op pagina's die al een inline SchedulePicker tonen (bv. /perilex-amsterdam).
 */
export function GlobalBookingSection() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const locale = useLocale();
  if (!shouldRenderGlobalBooking(pathname)) return null;

  const isEn = locale === "en";
  return (
    <section className="border-t border-border bg-muted/30 py-10">
      <div className="mx-auto max-w-3xl px-4">
        <ScheduleDisclosure
          title={isEn ? "Book your appointment" : "Plan direct je afspraak"}
          subtitle={
            isEn
              ? "Choose your preferred time — usually within 48 hours in Amsterdam"
              : "Bekijk beschikbare voorkeuren — meestal binnen 48 uur in Amsterdam"
          }
        >
          <SchedulePicker location="global-schedule" lang={isEn ? "en" : "nl"} />
        </ScheduleDisclosure>
      </div>
    </section>
  );
}
