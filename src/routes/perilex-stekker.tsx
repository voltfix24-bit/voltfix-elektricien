import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Phone, Plug, ShieldCheck, Zap } from "lucide-react";

import { CtaBand } from "@/components/cta-band";
import { Prose } from "@/components/prose";
import { RelatedServices } from "@/components/related-services";
import { ServiceFaq } from "@/components/service-faq";
import { ServiceQuickLinks } from "@/components/service-quick-links";
import { Testimonials } from "@/components/testimonials";
import { TrustStrip } from "@/components/trust-strip";
import { useTrackConversion } from "@/lib/analytics";
import { business, telHref } from "@/lib/business";
import { perilexAmount } from "@/lib/perilex-content";
import {
  absoluteUrl,
  altLinks,
  breadcrumbSchema,
  faqSchema,
  ldScript,
  pageMeta,
} from "@/lib/seo";
import { GuideLinks } from "@/components/guide-links";

const path = "/perilex-stekker";

const standard = perilexAmount("existing_connection_standard", "nl");
const priority = perilexAmount("existing_connection_priority_24h", "nl");
const survey = perilexAmount("site_survey", "nl");

const faqs = [
  {
    q: "Wat is een perilex stekker precies?",
    a: "Een Perilex-stekker is een vijfpolige stekker die in Nederland vaak wordt gebruikt voor kookplaten, fornuizen en sommige ovens. De vorm van de stekker zegt niet hoe het aansluitpunt elektrisch is bedraad; het fabrikantschema en controle van de aanwezige installatie zijn leidend.",
  },
  {
    q: "Wat is het verschil tussen perilex en krachtstroom?",
    a: "Perilex is de vorm van een vijfpolige stekker en wandcontactdoos die veel voor kookapparatuur wordt gebruikt. Krachtstroom verwijst naar een elektrische aansluiting met meerdere fasen. Een Perilex-wandcontactdoos bewijst daarom niet automatisch dat er 400 V of drie fasen aanwezig zijn.",
  },
  {
    q: "Wanneer heb ik een perilex nodig?",
    a: "Dat volgt uit het aansluitschema van de fabrikant en de werkelijk aanwezige groep en bedrading. Alleen het vermogen op het typeplaatje of de vorm van het stopcontact is niet genoeg om de juiste aansluiting te bepalen.",
  },
  {
    q: "Moet ik zelf meten of de stekker aansluiten?",
    a: "Nee. Meet niet zelf onder spanning, verwijder geen afdekkingen en bepaal de bedrading niet op basis van de penposities. Laat een elektricien het fabrikantschema vergelijken met de werkelijk aanwezige groep, bedrading en wandcontactdoos.",
  },
  {
    q: "Wat kost het aansluiten van een perilex stekker?",
    a: `Het aansluiten van de Perilex-stekker op je apparaat kost ${standard} bij een bestaande geschikte wandcontactdoos en werkende groep. ${priority} is het totale tarief voor exact dezelfde klus met voorrang binnen 24 uur, uitsluitend na bevestigde beschikbaarheid. Nieuwe aanleg of aanpassing wordt beoordeeld en geoffreerd.`,
  },
  {
    q: "Hoe weet ik of mijn Perilex-aansluiting bij mijn apparaat past?",
    a: "Een elektricien controleert de bedrading, de beveiliging in de groepenkast en het aansluitschema van de fabrikant. Stuur bij je eerste aanvraag desgewenst een foto of modelnummer; dat is optioneel en kan ook later of op locatie worden beoordeeld.",
  },
  {
    q: "Past elke inductiekookplaat op een perilex?",
    a: "Bijna alle inductiekookplaten kunnen op perilex worden aangesloten, maar het aansluitschema verschilt per model. Sommige platen worden vast bedraad op een kookgroep in plaats van via een stekker; het aansluitschema van de fabrikant is leidend.",
  },
  {
    q: "Hoe lang duurt het plaatsen van een perilex stopcontact?",
    a: "De duur hangt af van het fabrikantschema en van de aanwezige aansluiting. Bij nieuwe bekabeling, een nieuwe groep, een wandcontactdoos, een groepenkastaanpassing of bouwkundig werk beoordelen we eerst de situatie en volgt een offerte.",
  },
];

export const Route = createFileRoute("/perilex-stekker")({
  head: () => ({
    meta: pageMeta({
      title: "Perilex Stekker: Uitleg, Aansluiten & Kosten | VoltFix",
      description:
        "Uitleg over de Perilex-stekker, kookgroepen, fabrikantschema's en veilige aansluiting van een kookplaat, oven of fornuis in Amsterdam.",
      path,
      ogTitle: "Perilex-stekker: uitleg en veilige aansluiting",
      ogDescription:
        "Wat is een Perilex-stekker, wanneer heb je die nodig en hoe laat je een kookplaat, oven of fornuis veilig aansluiten?",
      ogType: "article",
    }),
    links: [{ rel: "canonical", href: absoluteUrl(path) }, ...altLinks(path)],
    scripts: [
      ldScript(faqSchema(faqs, "nl", path)),
      ldScript(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Perilex aansluiten Amsterdam", path: "/perilex-amsterdam" },
          { name: "Perilex stekker", path },
        ]),
      ),
    ],
  }),
  component: Page,
});

const powerRows = [
  { device: "Inductiekookplaat 2 zones", power: "± 3,7 kW", advice: "Kookgroep 16A of perilex 2-fase" },
  { device: "Inductiekookplaat 4 zones", power: "± 7,4 kW", advice: "Perilex 2-fase (2x16A)" },
  { device: "Elektrisch fornuis met oven", power: "± 9–11 kW", advice: "Perilex 3-fase (3x16A)" },
  { device: "Losse oven", power: "± 2,5–3,5 kW", advice: "Gewone geaarde groep" },
  { device: "Horeca- of werkplaatsapparatuur", power: "> 11 kW", advice: "Krachtstroom (CEE) i.p.v. perilex" },
];

function Page() {
  const track = useTrackConversion();

  return (
    <>
      <section className="relative overflow-hidden bg-surface text-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-[-6rem] h-72 w-72 rounded-full bg-butter/70 blur-2xl"
        />
        <div className="relative mx-auto max-w-4xl px-4 py-10">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-butter/80 px-3 py-1 t-meta font-bold text-butter-foreground ring-1 ring-butter">
            <Plug className="h-3.5 w-3.5" aria-hidden /> Kennisbank · Perilex
          </span>
          <h1 className="mt-4 text-4xl font-black leading-[1.05] text-balance sm:text-5xl">
            Perilex stekker
            <span className="block text-primary">uitleg, aansluiten en kosten</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground/80 sm:text-lg">
             Een Perilex-stekker wordt in Nederland vaak gebruikt voor een inductiekookplaat,
             oven of fornuis. Hier lees je wat de stekker wel en niet vertelt, welke controle nodig
             is en welke tarieven gelden voor aansluiting en beoordeling.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={telHref}
              className="gtm-cta-call inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-destructive px-5 text-sm font-bold text-destructive-foreground shadow-md transition hover:brightness-110"
              data-gtm="cta-call"
              data-gtm-location="perilex-stekker-hero"
              onClick={() => track("call", "perilex-stekker-hero")}
            >
              <Phone className="h-4 w-4" /> {business.phoneDisplay}
            </a>
            <Link
              to="/perilex-amsterdam"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 text-sm font-bold transition hover:border-primary"
            >
              Perilex laten aansluiten <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <ServiceQuickLinks currentPath={path} />
      <TrustStrip />

      <section className="mx-auto max-w-3xl px-4 py-12">
        <Prose>
          <h2>Wat is een perilex stekker?</h2>
          <p>
             Een Perilex-stekker heeft vijf pennen en wordt vooral gebruikt bij kookapparatuur.
             Welke geleiders en fasen werkelijk zijn aangesloten, verschilt per installatie. De
             vorm van de stekker of wandcontactdoos is daarom geen aansluitschema.
          </p>
          <p>
             Het schema van de fabrikant, de aanwezige bedrading en de beveiliging in de{" "}
            <Link to="/groepenkast-amsterdam" className="font-semibold text-primary underline">
             groepenkast
            </Link>{" "}
             moeten samen worden gecontroleerd voordat het apparaat wordt aangesloten.
          </p>

          <h2>Perilex, kookgroep en 3-fase: wat is het verschil?</h2>
          <ul>
            <li>
               <strong>Kookgroep</strong> — een aparte beveiligde groep voor kookapparatuur. De
               precieze bedrading verschilt per installatie.
            </li>
            <li>
               <strong>3-fase</strong> — drie fasen in de netaansluiting. Of een apparaat die nodig
               heeft, volgt uit het fabrikantschema en de installatie.
            </li>
          </ul>
          <p>
             Laat een elektricien controleren welke variant aanwezig is. Meet niet zelf onder
             spanning en verwijder geen afdekkingen.
          </p>

          <h2>Welk apparaat vraagt welke aansluiting?</h2>
        </Prose>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Aansluitvermogen per apparaat en bijbehorende aansluiting
            </caption>
            <thead className="bg-muted/50 t-meta uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">Apparaat</th>
                <th scope="col" className="px-4 py-3">Vermogen</th>
                <th scope="col" className="px-4 py-3">Aansluiting</th>
              </tr>
            </thead>
            <tbody>
              {powerRows.map((r) => (
                <tr key={r.device} className="border-t border-border">
                  <th scope="row" className="px-4 py-3 font-semibold text-foreground">
                    {r.device}
                  </th>
                  <td className="px-4 py-3 text-muted-foreground">{r.power}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.advice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 t-meta text-muted-foreground">
          Indicatief. Het typeplaatje of aansluitschema van de fabrikant is altijd leidend.
        </p>
      </section>

      <CtaBand
        compact
        title="Twijfel je welke aansluiting je nodig hebt?"
         text="Een foto of modelnummer mag helpen, maar is bij de eerste aanvraag niet verplicht."
        message="Hallo VoltFix, ik heb een vraag over een perilex stekker / aansluiting."
        location="perilex-stekker-mid"
      />

       <section className="mx-auto max-w-3xl px-4 py-12">
         <h2 className="text-2xl font-bold sm:text-3xl">Zo laat je de aansluiting beoordelen</h2>
         <ol className="mt-6 space-y-4">
           {[
             ['Vertel welk apparaat je hebt', 'Het merk, model of fabrikantschema helpt; een foto mag, maar is niet verplicht.'],
             ['Wij beoordelen de aansluiting', 'Een elektricien vergelijkt het fabrikantschema met de aanwezige wandcontactdoos, bedrading en groep.'],
             ['Je krijgt vooraf duidelijkheid', 'Bij een bestaande geschikte aansluiting geldt het vaste tarief. Nieuw aanlegwerk wordt eerst geoffreerd.'],
           ].map(([name, text], i) => (
             <li key={name} className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-4 rounded-2xl border border-border bg-background p-4">
               <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{i + 1}</span>
               <div className="min-w-0"><h3 className="font-semibold text-foreground">{name}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p></div>
             </li>
           ))}
         </ol>

         <div className="mt-8 grid min-w-0 gap-3">
          <Link
            to="/perilex-amsterdam"
            className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4 transition hover:border-primary"
          >
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
            <span className="text-sm font-semibold">
              Perilex laten aansluiten in Amsterdam
              <span className="block t-meta font-normal text-muted-foreground">
                 {standard} bij een bestaande geschikte aansluiting
              </span>
            </span>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-12">
        <Prose>
           <h2>Wat kost een Perilex-stekker aansluiten?</h2>
          <ul>
            <li>
               <strong>Stekker op het apparaat aansluiten</strong> — {standard}, bij een bestaande
               geschikte Perilex-wandcontactdoos en werkende groep.
            </li>
            <li>
               <strong>Dezelfde klus met voorrang binnen 24 uur</strong> — {priority} totaal,
               uitsluitend na bevestigde beschikbaarheid. Dit is geen toeslag bovenop {standard}.
             </li>
             <li>
               <strong>Schouw en advies op locatie</strong> — {survey}. Dit bedrag wordt volledig
               verrekend op de eindfactuur wanneer VoltFix de geoffreerde werkzaamheden uitvoert.
            </li>
          </ul>
          <p>
             Alle genoemde bedragen zijn exclusief btw. Een nieuwe kabel, groep, wandcontactdoos,
             verplaatsing, groepenkastaanpassing of bouwkundig werk wordt beoordeeld en geoffreerd. Bekijk de{" "}
            <Link to="/perilex-amsterdam" className="font-semibold text-primary underline">
              complete prijsopbouw voor perilex in Amsterdam
            </Link>
            .
          </p>

          <h2>Veiligheid: wat mag je zelf en wat niet?</h2>
          <p>
             Meet niet zelf onder spanning, verwijder geen afdekkingen en sluit de stekker niet aan
             op basis van een algemeen pinschema. Het fabrikantschema van jouw apparaat en de
             werkelijk aanwezige bedrading en beveiliging zijn leidend. Laat die combinatie door
             een elektricien controleren.
          </p>
          <p>
            Twijfel je over de aarding of zie je bruinverkleuring bij het stopcontact? Schakel dan
            direct hulp in via onze{" "}
            <Link to="/spoed-elektricien-amsterdam" className="font-semibold text-primary underline">
              spoedservice
            </Link>
            .
          </p>
        </Prose>

        <div className="mt-8 flex items-center gap-3 rounded-2xl bg-muted/50 p-4 text-sm">
          <BadgeCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          <p className="text-muted-foreground">
            Geschreven door de monteurs van {business.name} — erkend elektricien in Amsterdam,
            werkzaam volgens NEN 1010.
          </p>
        </div>
      </section>

      <ServiceFaq faqs={faqs} title="Veelgestelde vragen over de perilex stekker" />

      <Testimonials category="perilex" />

      <CtaBand
        title="Perilex laten aansluiten?"
         text={`${standard} bij een bestaande geschikte aansluiting en werkende groep. Nieuwe aanleg wordt eerst beoordeeld en geoffreerd.`}
        message="Hallo VoltFix, ik wil een perilex laten aansluiten."
        location="perilex-stekker-footer"
      />

      <GuideLinks currentPath={path} />
      <RelatedServices currentPath={path} />

      <div className="mx-auto max-w-3xl px-4 pb-12 text-center">
        <Link
          to="/perilex-amsterdam"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
        >
          <Zap className="h-4 w-4" aria-hidden /> Naar de servicepagina perilex Amsterdam
        </Link>
      </div>
    </>
  );
}
