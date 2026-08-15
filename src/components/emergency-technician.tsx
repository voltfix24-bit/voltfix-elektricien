import { Phone, ShieldCheck, Clock, BadgeCheck } from "lucide-react";

import monteurImg from "@/assets/voltfix-monteur.webp.asset.json";
import { business, telHref } from "@/lib/business";
import { useTrackConversion } from "@/lib/analytics";

const points = [
  { icon: Clock, text: "24/7 bereikbaar — vaak binnen 60 minuten ter plaatse" },
  { icon: ShieldCheck, text: "Werkt volgens NEN 1010 / NEN 3140" },
  { icon: BadgeCheck, text: "Prijs vooraf afgesproken, geen verrassingen" },
];

export function EmergencyTechnician() {
  const track = useTrackConversion();
  return (
    <section className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 md:grid-cols-2">
        <div className="relative mx-auto w-full max-w-sm">
          <div
            className="absolute inset-x-4 bottom-4 top-8 rounded-3xl bg-primary/10"
            aria-hidden
          />
          <img
            src={monteurImg.url}
            alt="VoltFix spoed elektricien in Amsterdam met multimeter-meetpennen, klaar voor een storingsmelding"
            width={815}
            height={996}
            loading="lazy"
            decoding="async"
            className="relative h-auto w-full object-contain"
          />
        </div>

        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Uw monteur bij spoed
          </span>
          <h2 className="mt-4 text-2xl font-bold sm:text-3xl">
            Een echte vakman aan de deur — geen callcenter
          </h2>
          <p className="mt-3 text-muted-foreground">
            Bij VoltFix krijgt u direct een ervaren elektricien aan de lijn die met u meedenkt. Onze
            monteurs rijden met een volledig uitgeruste bus door Amsterdam, zodat de meeste
            storingen in één bezoek verholpen zijn.
          </p>
          <ul className="mt-5 space-y-3 text-sm text-foreground/85">
            {points.map((p) => (
              <li key={p.text} className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <p.icon className="h-4 w-4" />
                </span>
                <span>{p.text}</span>
              </li>
            ))}
          </ul>
          <a
            href={telHref}
            className="gtm-cta-call mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            data-gtm="cta-call"
            data-gtm-location="spoed-monteur"
            onClick={() => track("call", "spoed-monteur")}
          >
            <Phone className="h-4 w-4" /> {business.phoneDisplay}
          </a>
        </div>
      </div>
    </section>
  );
}
