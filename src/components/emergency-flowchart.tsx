import { AlertTriangle, Flame, Power, Zap, Phone, ArrowRight } from "lucide-react";

import { business, telHref, whatsappHref } from "@/lib/business";
import { useTrackConversion } from "@/lib/analytics";
import { useLocale } from "@/lib/i18n";

type Symptom = {
  icon: typeof AlertTriangle;
  severity: "critical" | "high" | "medium";
  question: string;
  action: string;
  steps: string[];
};

const symptomsNl: Symptom[] = [
  {
    icon: Flame,
    severity: "critical",
    question: "Ruik je brand, rook of zie je vonken uit de meterkast?",
    action: "Bel 112 én daarna VoltFix",
    steps: [
      "Zet de hoofdschakelaar direct uit",
      "Verlaat de ruimte en houd afstand",
      "Bel bij zichtbaar vuur eerst 112",
      "Bel daarna VoltFix voor veilig herstel",
    ],
  },
  {
    icon: Zap,
    severity: "high",
    question: "Slaat een groep of aardlekschakelaar telkens door?",
    action: "Bel VoltFix — kan wijzen op kortsluiting",
    steps: [
      "Trek alle apparaten uit de betreffende groep",
      "Probeer de groep één keer terug te schakelen",
      "Blijft hij eraf? Niet forceren — bel ons",
      "Wij meten door en sporen de fout op",
    ],
  },
  {
    icon: Power,
    severity: "high",
    question: "Heeft alleen jouw woning geen stroom (buren wél)?",
    action: "Bel VoltFix — probleem zit binnenshuis",
    steps: [
      "Controleer of de hoofdschakelaar omhoog staat",
      "Check of buren wél stroom hebben",
      "Zo ja: het probleem zit in jouw installatie",
      "Wij komen met spoed langs",
    ],
  },
  {
    icon: AlertTriangle,
    severity: "medium",
    question: "Zit jouw hele straat zonder stroom?",
    action: "Bel eerst Liander (0800 9009)",
    steps: [
      "Check liander.nl/storingen voor jouw postcode",
      "Straatuitval = netbeheerder Liander lost dit op",
      "Blijft alleen jouw woning zonder stroom? Bel ons",
      "Wij helpen als het aan jouw kant blijkt te zitten",
    ],
  },
];

const symptomsEn: Symptom[] = [
  { icon: Flame, severity: "critical", question: "Can you smell burning, see smoke or sparks from the fuse box?", action: "Call 112, then VoltFix", steps: ["Switch off the main switch immediately", "Leave the room and keep your distance", "If there is visible fire, call 112 first", "Then call VoltFix for a safe repair"] },
  { icon: Zap, severity: "high", question: "Does a circuit or RCD keep tripping?", action: "Call VoltFix — this may indicate a short circuit", steps: ["Unplug appliances on the affected circuit", "Try resetting the circuit once", "Does it trip again? Do not force it — call us", "We test the installation and trace the fault"] },
  { icon: Power, severity: "high", question: "Is only your property without power while neighbours have power?", action: "Call VoltFix — the fault is inside the property", steps: ["Check whether the main switch is on", "Check whether your neighbours have power", "If they do, the fault is in your installation", "We attend as an emergency"] },
  { icon: AlertTriangle, severity: "medium", question: "Is your whole street without power?", action: "Call Liander first (0800 9009)", steps: ["Check liander.nl/storingen for your postcode", "A street-wide outage is handled by Liander", "Only your property still without power? Call us", "We help if the fault is on your side"] },
];

/**
 * Dezelfde zichtbare spoed-checkvragen als hierboven, in paginavolgorde, zodat
 * het FAQ-schema exact de zichtbare vragen bevat en niets extra's.
 */
export function emergencyCheckFaqs(lang: "nl" | "en") {
  const source = lang === "en" ? symptomsEn : symptomsNl;
  return source.map(s => ({
    q: s.question,
    a: `${s.action}. ${s.steps.join(". ")}.`,
  }));
}


const severityStyles = {
  critical: {
    badge: "bg-destructive text-destructive-foreground",
    label: "LEVENSGEVAAR",
    border: "border-destructive/40",
    iconBg: "bg-destructive text-destructive-foreground",
  },
  high: {
    badge: "bg-destructive/10 text-destructive",
    label: "DIRECT BELLEN",
    border: "border-destructive/20",
    iconBg: "bg-primary text-primary-foreground",
  },
  medium: {
    badge: "bg-accent text-accent-foreground",
    label: "EERST CHECKEN",
    border: "border-border",
    iconBg: "bg-muted text-foreground",
  },
} as const;

type Props = {
  message?: string;
};

export function EmergencyFlowchart({
  message = "Hallo VoltFix, ik heb met spoed een elektricien nodig in Amsterdam.",
}: Props) {
  const track = useTrackConversion();
  const en = useLocale() === "en";
  const symptoms = en ? symptomsEn : symptomsNl;
  return (
    <section className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-3 py-1 t-meta font-semibold text-destructive">
            <AlertTriangle className="h-3.5 w-3.5" /> {en ? "30-second emergency check" : "Spoed-check in 30 seconden"}
          </span>
          <h2 className="mt-4 text-2xl font-bold sm:text-3xl">
            {en ? "What's happening — and what should you do now?" : "Wat is er aan de hand — en wat doe je nu?"}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {en ? "Find your situation below and see what you can safely do until our electrician arrives." : "Herken je situatie hieronder. We vertellen je direct wat je veilig kunt doen tot onze monteur er is."}
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {symptoms.map((s) => {
            const style = severityStyles[s.severity];
            const Icon = s.icon;
            return (
              <article
                key={s.question}
                className={`min-w-0 overflow-hidden rounded-2xl border-2 bg-background p-4 shadow-sm sm:p-6 ${style.border}`}
              >
                <div className="flex items-start gap-4">
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${style.iconBg}`}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <span
                       className={`inline-block max-w-full break-words rounded-full px-2 py-0.5 t-meta font-bold tracking-wide ${style.badge}`}
                    >
                       {en ? (s.severity === "critical" ? "DANGER" : s.severity === "high" ? "CALL NOW" : "CHECK FIRST") : style.label}
                    </span>
                    <h3 className="mt-2 break-words text-lg font-bold leading-snug text-foreground">
                      {s.question}
                    </h3>
                  </div>
                </div>

                <ol className="mt-5 space-y-2 border-l-2 border-border pl-4 text-sm text-foreground/85">
                  {s.steps.map((step, i) => (
                    <li key={step} className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 t-meta font-bold text-primary">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>

                <div className="mt-5 flex min-w-0 items-start gap-2 break-words rounded-xl bg-primary/5 p-3 text-sm font-semibold text-primary">
                  <ArrowRight className="h-4 w-4 shrink-0" />
                  {s.action}
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center sm:flex-row sm:justify-center sm:gap-6 sm:text-left">
          <p className="text-sm text-foreground/80 sm:max-w-sm">
            {en ? "Still unsure? Call us — you'll speak directly to an electrician who can assess the situation." : "Twijfel je nog? Bel ons — je krijgt direct een vakman aan de lijn die met je meedenkt."}
          </p>
          <div className="flex min-w-0 max-w-full flex-wrap justify-center gap-3">
            <a
              href={telHref}
              className="gtm-cta-call inline-flex min-h-12 max-w-full items-center gap-2 break-words rounded-xl bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90"
              data-gtm="cta-call"
              data-gtm-location="spoed-flowchart"
              onClick={() => track("call", "spoed-flowchart")}
            >
              <Phone className="h-4 w-4" /> {business.phoneDisplay}
            </a>
            <a
              href={whatsappHref(message, { medium: "whatsapp", campaign: "spoed-flowchart" })}
              target="_blank"
              rel="noopener noreferrer"
              className="gtm-cta-whatsapp inline-flex min-h-12 max-w-full items-center gap-2 break-words rounded-xl border-2 border-primary bg-background px-5 py-2 text-sm font-bold text-primary transition hover:bg-primary/5"
              data-gtm="cta-whatsapp"
              data-gtm-location="spoed-flowchart"
              onClick={() => track("whatsapp", "spoed-flowchart")}
            >
              {en ? "WhatsApp a photo" : "WhatsApp met foto"}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
