import { Check, Clock, Phone, CalendarClock, ClipboardCheck } from "lucide-react";

import { business, telHref, whatsappHref } from "@/lib/business";
import { useTrackConversion } from "@/lib/analytics";
import { perilexAmount } from "@/lib/perilex-content";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";


type Lang = "nl" | "en";

const copy = {
  nl: {
    title: "Wat kost Perilex of een kookgroep?",
    intro:
      "Duidelijke prijzen vooraf. Is de situatie standaard en voorbereid, dan kunnen we vaak direct een prijs geven. Is er nog niets voorbereid of is de situatie onduidelijk, dan bekijken we eerst wat er nodig is.",
    mostChosen: "Meest gekozen",
    card1: {
      title: "Perilex aansluiten",
      price: perilexAmount("existing_connection_standard", "nl"),
      unit: "Bij bestaande geschikte aansluiting",
      points: [
        "Stekker op het apparaat aansluiten",
        "Bestaande geschikte wandcontactdoos",
        "Bestaande werkende groep",
        "Fabrikantschema is leidend",
      ],
      cta: "Vraag vaste prijs",
      msg: "Hallo VoltFix, ik wil een Perilex aansluiten (bestaande aansluiting).",
    },
    card2: {
      title: "Nieuwe aanleg of aanpassing",
      price: "Beoordeling en offerte",
      unit: "Geen automatisch vast bedrag",
      points: [
        "Nieuwe kabel of groep",
        "Nieuwe wandcontactdoos",
        "Verplaatsing of groepenkastaanpassing",
        "Bouwkundig werk",
      ],
      note: "Na beoordeling ontvang je een offerte waarin werkzaamheden en materialen expliciet worden benoemd.",
      cta: "Vraag prijs voor mijn situatie",
      msg: "Hallo VoltFix, ik wil een nieuwe kookgroep laten aanleggen. Kunnen jullie een prijs geven voor mijn situatie?",
    },
    schouw: {
      title: "Nog niets voorbereid of twijfel je over de situatie?",
      body: "We komen eerst langs om te bepalen wat er nodig is. We controleren onder andere de groepenkast, aanwezige leidingen, kabelroute en benodigde aansluiting. Daarna ontvang je een duidelijke offerte voor de complete werkzaamheden.",
      price: `Schouw ${perilexAmount("site_survey", "nl")}`,
      credit: "Bij opdracht wordt dit bedrag volledig verrekend met de eindfactuur.",
      badge: "Volledig verrekend bij uitvoering",
      cta: "Plan een schouw",
      msg: "Hallo VoltFix, ik wil graag een schouw inplannen voor een Perilex of kookgroep.",
    },
    footnote:
      "De genoemde Perilex-bedragen zijn excl. btw. Nieuwe aanleg of aanpassing wordt beoordeeld en geoffreerd.",
    response: "Beschikbaarheid wordt na beoordeling bevestigd",
    call: "Bel direct",
    whatsapp: "WhatsApp",
    book: "Plan direct je afspraak",
    urgent: "Voorrang binnen 24 uur alleen na bevestigde beschikbaarheid",
  },
  en: {
    title: "What does a Perilex or cooker circuit cost?",
    intro:
      "Clear prices up front. If the situation is standard and prepared, we can often quote a fixed price straight away. If nothing is prepared or the situation is unclear, we first take a look at what's needed.",
    mostChosen: "Most chosen",
    card1: {
      title: "Perilex connection",
      price: perilexAmount("existing_connection_standard", "en"),
      unit: "For an existing, suitable connection",
      points: [
        "Connect the plug to the appliance",
        "Existing suitable socket",
        "Existing working circuit",
        "Manufacturer diagram leads",
      ],
      cta: "Request fixed price",
      msg: "Hi VoltFix, I'd like to connect a Perilex (existing connection).",
    },
    card2: {
      title: "New installation or alteration",
      price: "Assessment and quote",
      unit: "No automatic fixed amount",
      points: [
        "New cable or circuit",
        "New socket outlet",
        "Relocation or consumer unit changes",
        "Building work",
      ],
      note: "After assessment, the quote explicitly states the work and materials.",
      cta: "Request price for my situation",
      msg: "Hi VoltFix, I'd like to install a new cooker circuit. Can you quote a price for my situation?",
    },
    schouw: {
      title: "Nothing prepared, or unsure about the situation?",
      body: "We visit first to determine what's needed. We check the fuse box, existing wiring, cable route and connection point. You then receive a clear quote for the full works.",
      price: `On-site survey ${perilexAmount("site_survey", "en")}`,
      credit: "If you place the order afterwards, the full amount is credited on the final invoice.",
      badge: "Fully credited when we carry out the work",
      cta: "Book a survey",
      msg: "Hi VoltFix, I'd like to book an on-site survey for a Perilex or cooker circuit.",
    },
    footnote:
      "The stated Perilex amounts exclude VAT. New installation or alterations are assessed and quoted.",
    response: "Availability is confirmed after assessment",
    call: "Call now",
    whatsapp: "WhatsApp",
    book: "Book your installation",
    urgent: "Priority within 24 hours only after availability is confirmed",
  },
} as const;

type Props = { lang?: Lang };

export function PerilexPriceSection({ lang = "nl" }: Props) {
  const track = useTrackConversion();
  const c = copy[lang];
  const loc = "perilex-price";

  const wa = (msg: string, sub: string) =>
    whatsappHref(msg, { campaign: loc, content: `${loc}-${sub}`, term: lang });

  return (
    <section className="border-t border-border bg-surface">
      <div className="mx-auto max-w-5xl px-4 py-14">
        <div className="text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">{c.title}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{c.intro}</p>
        </div>

        {/* Twee prijskaarten */}
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {/* Kaart 1 */}
          <div className="flex flex-col rounded-xl border border-primary bg-card p-6 shadow-[var(--shadow-gold)]">
            <span className="mb-3 inline-block w-fit rounded-full bg-primary px-2.5 py-0.5 t-meta font-bold text-primary-foreground">
              {c.mostChosen}
            </span>
            <h3 className="text-lg font-semibold">{c.card1.title}</h3>
            <p className="mt-2 text-3xl font-bold text-primary">{c.card1.price}</p>
            <p className="t-meta text-muted-foreground">{c.card1.unit}</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {c.card1.points.map((pt) => (
                <li key={pt} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" /> {pt}
                </li>
              ))}
            </ul>
            <a
              href={wa(c.card1.msg, "card1")}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("whatsapp", `${loc}-card1`)}
              data-gtm="cta-whatsapp"
              data-gtm-location={`${loc}-card1`}
              className="gtm-cta-whatsapp mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 text-sm font-bold text-white shadow-sm transition hover:brightness-110"
            >
              <WhatsAppIcon className="h-4 w-4" ariaLabel="WhatsApp" /> {c.card1.cta}
            </a>
          </div>

          {/* Kaart 2 */}
          <div className="flex flex-col rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-semibold">{c.card2.title}</h3>
            <p className="mt-2 text-3xl font-bold text-primary">{c.card2.price}</p>
            <p className="t-meta text-muted-foreground">{c.card2.unit}</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {c.card2.points.map((pt) => (
                <li key={pt} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" /> {pt}
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-md bg-muted/50 p-3 t-meta text-muted-foreground">
              {c.card2.note}
            </p>
            <a
              href={wa(c.card2.msg, "card2")}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("whatsapp", `${loc}-card2`)}
              data-gtm="cta-whatsapp"
              data-gtm-location={`${loc}-card2`}
              className="gtm-cta-whatsapp mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 text-sm font-bold text-white shadow-sm transition hover:brightness-110"
            >
              <WhatsAppIcon className="h-4 w-4" ariaLabel="WhatsApp" /> {c.card2.cta}
            </a>
          </div>
        </div>

        {/* Schouw-kaart */}
        <div className="mt-6 rounded-xl border-2 border-dashed border-primary/40 bg-butter/20 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <div className="flex items-start gap-3">
                <ClipboardCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <div>
                  <h3 className="text-lg font-semibold">{c.schouw.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{c.schouw.body}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 md:items-end md:text-right md:min-w-[220px]">
              <p className="text-2xl font-bold text-primary">{c.schouw.price}</p>
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 t-meta font-semibold text-emerald-800">
                {c.schouw.badge}
              </span>
              <p className="t-meta text-muted-foreground md:max-w-[220px]">{c.schouw.credit}</p>
              <a
                href={wa(c.schouw.msg, "schouw")}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("whatsapp", `${loc}-schouw`)}
                data-gtm="cta-whatsapp"
                data-gtm-location={`${loc}-schouw`}
                className="gtm-cta-whatsapp inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm transition hover:brightness-110"
              >
                <WhatsAppIcon className="h-4 w-4" ariaLabel="WhatsApp" /> {c.schouw.cta}
              </a>
            </div>
          </div>
        </div>

        {/* Voetregel voorwaarden */}
        <p className="mt-6 text-center t-meta text-muted-foreground">{c.footnote}</p>

        {/* Response note — één keer */}
        <div className="mt-6 flex items-center justify-center gap-2 t-meta font-medium text-primary">
          <Clock className="h-3.5 w-3.5" /> {c.response}
        </div>

        {/* CTA-rij: Bel + WhatsApp + (rustige) Offerte */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={telHref}
              onClick={() => track("call", `${loc}-cta`)}
              data-gtm="cta-call"
              data-gtm-location={`${loc}-cta`}
              className="gtm-cta-call inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#E11D48] px-5 text-sm font-bold text-white shadow-sm transition hover:brightness-110"
            >
              <Phone className="h-4 w-4" /> {c.call} {business.phoneDisplay}
            </a>
            <a
              href={wa(
                lang === "en"
                  ? "Hi VoltFix, I have a question about a Perilex or cooker circuit."
                  : "Hallo VoltFix, ik heb een vraag over een Perilex of kookgroep.",
                "cta",
              )}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("whatsapp", `${loc}-cta`)}
              data-gtm="cta-whatsapp"
              data-gtm-location={`${loc}-cta`}
              className="gtm-cta-whatsapp inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-5 text-sm font-bold text-white shadow-sm transition hover:brightness-110"
            >
              <WhatsAppIcon className="h-4 w-4" ariaLabel="WhatsApp" /> {c.whatsapp}
            </a>
          </div>
          <a
            href="#installatiemoment"
            onClick={() => track("schedule", `${loc}-cta`)}
            data-gtm="cta-schedule"
            data-gtm-location={`${loc}-cta`}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-primary underline-offset-4 hover:underline"
          >
            <CalendarClock className="h-3.5 w-3.5" /> {c.book}
          </a>
          <p className="t-meta text-muted-foreground">{c.urgent}</p>
        </div>
      </div>
    </section>
  );
}

export default PerilexPriceSection;
