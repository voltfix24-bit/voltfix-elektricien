import { useRouterState } from "@tanstack/react-router";
import { Suspense, lazy, useState } from "react";

import { ScheduleDisclosure } from "@/components/schedule-disclosure";
import { useLocale } from "@/lib/i18n";
import { shouldRenderGlobalBooking } from "@/lib/booking-paths";

// De planner zelf is zwaar (kalender, validatie, beveiliging) en staat
// ingeklapt onderaan de pagina. We halen hem pas op zodra iemand het blok
// opent, zodat hij niet in het gedeelde bestand van élke pagina meegaat.
const SchedulePicker = lazy(() =>
  import("@/components/schedule-picker").then((m) => ({ default: m.SchedulePicker })),
);

/**
 * Globale, ingeklapte boekingflow onderaan elke plan-bare pagina.
 * Opent via #installatiemoment (vanuit hero-CTA's, mobile bar, of directe link).
 * Sla over op pagina's die al een inline SchedulePicker tonen (bv. /perilex-amsterdam).
 */
export function GlobalBookingSection() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const locale = useLocale();
  const [activated, setActivated] = useState(false);
  if (!shouldRenderGlobalBooking(pathname)) return null;

  const isEn = locale === "en";
  const loading = (
    <p className="py-6 text-center text-sm text-muted-foreground">
      {isEn ? "Loading…" : "Bezig met laden…"}
    </p>
  );

  return (
    <section className="border-t border-border bg-muted/30 py-10">
      <div className="mx-auto max-w-3xl px-4">
        <ScheduleDisclosure
          title={isEn ? "Request a time" : "Vraag een tijd aan"}
          subtitle={
            isEn
              ? "Choose your preferred time — usually within 48 hours in Amsterdam"
              : "Bekijk beschikbare voorkeuren — meestal binnen 48 uur in Amsterdam"
          }
          onOpenChange={(open) => {
            if (open) setActivated(true);
          }}
        >
          {activated ? (
            <Suspense fallback={loading}>
              <SchedulePicker location="global-schedule" lang={isEn ? "en" : "nl"} />
            </Suspense>
          ) : (
            loading
          )}
        </ScheduleDisclosure>
      </div>
    </section>
  );
}
