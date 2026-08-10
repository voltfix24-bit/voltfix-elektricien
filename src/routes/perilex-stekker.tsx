import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Phone, Plug, Ruler, ShieldCheck, Zap } from "lucide-react";

import { CtaBand } from "@/components/cta-band";
import { Prose } from "@/components/prose";
import { RelatedServices } from "@/components/related-services";
import { ServiceFaq } from "@/components/service-faq";
import { ServiceQuickLinks } from "@/components/service-quick-links";
import { Testimonials } from "@/components/testimonials";
import { TrustStrip } from "@/components/trust-strip";
import { useTrackConversion } from "@/lib/analytics";
import { business, telHref } from "@/lib/business";
import { eurNl, prices } from "@/lib/pricing";
import {
  absoluteUrl,
  altLinks,
  breadcrumbSchema,
  faqSchema,
  howToSchema,
  ldScript,
  pageMeta,
} from "@/lib/seo";

const path = "/perilex-stekker";

const steps = [
  {
    name: "Controleer het vermogen van je apparaat",
    text: "Kijk op het typeplaatje of in de handleiding naar het aansluitvermogen in kW. Onder ongeveer 3,5 kW volstaat meestal een gewone geaarde groep; daarboven is een perilex of aparte kookgroep nodig.",
  },
  {
    name: "Bepaal welk type perilex je nodig hebt",
    text: "Een perilex stekker heeft vijf pennen: twee of drie fasen, nul en aarde. Voor de meeste inductiekookplaten volstaat 2-fase (2x16A); zware fornuizen en horeca-apparatuur vragen om 3-fase (3x16A).",
  },
  {
    name: "Meet de bestaande aansluiting op",
    text: "Meet met de meetkaart of tussen de pennen spanning staat op één, twee of drie fasen. Zo weet je zeker of het aanwezige perilex stopcontact past bij je nieuwe apparaat.",
  },
  {
    name: "Controleer de groepenkast",
    text: "Een kookgroep hoort op een eigen groep met de juiste automaat en aardlekschakelaar. Is er geen vrije groep, dan moet de groepenkast worden uitgebreid.",
  },
  {
    name: "Laat de aansluiting maken en testen",
    text: "Een erkend elektricien sluit de perilex aan volgens NEN 1010, meet de aarding en isolatieweerstand na en test het apparaat onder belasting.",
  },
];

const faqs = [
  {
    q: "Wat is een perilex stekker precies?",
    a: "Een perilex stekker is een vijfpolige stekker (twee of drie fasen, nul en aarde) voor apparaten met een hoog vermogen, zoals inductiekookplaten, elektrische fornuizen en sommige ovens. Doordat de belasting over meerdere fasen wordt verdeeld, kan er veel meer vermogen door dan bij een gewoon stopcontact.",
  },
  {
    q: "Wat is het verschil tussen perilex en krachtstroom?",
    a: "Perilex is een specifieke vijfpolige aansluiting van 230/400V die veel in woningen wordt gebruikt voor kookapparatuur. Krachtstroom is de bredere term voor 400V-aansluitingen, vaak met een CEE-stekker (blauw of rood) voor machines, laadpalen of werkplaatsen.",
  },
  {
    q: "Wanneer heb ik een perilex nodig?",
    a: "Zodra je apparaat meer vraagt dan een gewone groep aankan — vaak vanaf circa 3,5 kW. Denk aan inductiekookplaten van 7 kW, elektrische fornuizen en dubbele ovens. Het typeplaatje van je apparaat vermeldt het aansluitvermogen.",
  },
  {
    q: "Kan ik een perilex stekker zelf vervangen?",
    a: "Het vervangen van de stekker aan het snoer mag je in principe zelf doen, mits de groep spanningsloos is en je de fasen, nul en aarde correct aansluit. Werk aan de groepenkast of het trekken van een nieuwe kookgroep laat je altijd door een erkend elektricien doen.",
  },
  {
    q: "Wat kost het aansluiten van een perilex stekker?",
    a: `Een perilex stopcontact op een bestaande groep kost ${eurNl(prices.perilexFrom)} all-in, vaste prijs vooraf. Moet er een aparte kookgroep bij in de meterkast, dan kost het ${eurNl(prices.perilexWithNewGroupFrom)} all-in — inclusief btw, materiaal en garantie op arbeid.`,
  },
  {
    q: "Hoe weet ik of mijn perilex 2-fase of 3-fase is?",
    a: "Dat meet je aan het stopcontact: bij 2-fase staat er op twee pennen spanning ten opzichte van nul, bij 3-fase op drie. Met onze meetkaart loop je dat stap voor stap na, zonder de kap open te schroeven.",
  },
  {
    q: "Past elke inductiekookplaat op een perilex?",
    a: "Bijna alle inductiekookplaten kunnen op perilex worden aangesloten, maar het aansluitschema verschilt per model. Sommige platen worden vast bedraad op een kookgroep in plaats van via een stekker; het aansluitschema van de fabrikant is leidend.",
  },
  {
    q: "Hoe lang duurt het plaatsen van een perilex stopcontact?",
    a: "Op een bestaande kookgroep meestal één tot twee uur. Moet er nieuwe bekabeling naar de meterkast en een extra groep bij, reken dan op een halve dag.",
  },
];

export const Route = createFileRoute("/perilex-stekker")({
  head: () => ({
    meta: pageMeta({
      title: "Perilex Stekker: Uitleg, Aansluiten & Kosten | VoltFix",
      description:
        "Alles over de perilex stekker: wat het is, 2-fase vs 3-fase, aansluitschema, stappenplan en kosten. Uitleg van erkend elektricien VoltFix Amsterdam.",
      path,
      ogTitle: "Perilex stekker: complete uitleg en stappenplan",
      ogDescription:
        "Wat is een perilex stekker, wanneer heb je er een nodig en hoe sluit je hem veilig aan? Praktische gids met kosten en FAQ.",
      ogType: "article",
    }),
    links: [{ rel: "canonical", href: absoluteUrl(path) }, ...altLinks(path)],
    scripts: [
      ldScript(
        howToSchema({
          name: "Perilex stekker aansluiten: stappenplan",
          description:
            "Stap voor stap bepalen welke perilex aansluiting je nodig hebt en hoe je die veilig laat aansluiten.",
          path,
          totalTime: "PT1H",
          tools: ["Spanningstester", "Meetkaart", "Schroevendraaier"],
          steps,
        }),
      ),
      ldScript(faqSchema(faqs)),
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
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-butter/80 px-3 py-1 text-xs font-bold text-butter-foreground ring-1 ring-butter">
            <Plug className="h-3.5 w-3.5" aria-hidden /> Kennisbank · Perilex
          </span>
          <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight text-balance sm:text-5xl">
            Perilex stekker
            <span className="block text-primary">uitleg, aansluiten en kosten</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground/80 sm:text-lg">
            Een perilex stekker is een vijfpolige stekker voor apparaten met een hoog vermogen,
            zoals inductiekookplaten en elektrische fornuizen. Op deze pagina lees je wat perilex
            precies is, wanneer je het nodig hebt, hoe het aansluiten in zijn werk gaat en wat het
            kost.
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
            Een perilex stekker heeft vijf pennen: <strong>twee of drie fasen, een nul en een
            aarde</strong>. Doordat de stroom over meerdere fasen wordt verdeeld, kan er veel meer
            vermogen door dan bij een gewoon stopcontact van 230V/16A. Daarom zie je perilex vooral
            bij kookapparatuur: inductiekookplaten, keramische platen en elektrische fornuizen.
          </p>
          <p>
            Perilex is een merknaam die inmiddels de standaardterm is geworden voor deze
            230/400V-aansluiting in Nederlandse woningen. De aansluiting hoort altijd op een eigen{" "}
            <Link to="/groepenkast-amsterdam" className="font-semibold text-primary underline">
              groep in de groepenkast
            </Link>{" "}
            met de juiste automaat en aardlekbeveiliging.
          </p>

          <h2>Perilex 2-fase of 3-fase: wat is het verschil?</h2>
          <ul>
            <li>
              <strong>2-fase (2x16A)</strong> — twee fasen actief, samen circa 7,3 kW. Voldoende
              voor vrijwel elke inductiekookplaat in een woning.
            </li>
            <li>
              <strong>3-fase (3x16A)</strong> — drie fasen actief, samen circa 11 kW. Nodig voor
              zware fornuizen, dubbele ovens of combinaties van kookplaat en oven op één groep.
            </li>
          </ul>
          <p>
            Welke variant je hebt, hangt af van je meterkast: bij een 1-fase aansluiting is 3-fase
            perilex niet mogelijk zonder verzwaring bij de netbeheerder.
          </p>

          <h2>Welk apparaat vraagt welke aansluiting?</h2>
        </Prose>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Aansluitvermogen per apparaat en bijbehorende aansluiting
            </caption>
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
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
        <p className="mt-3 text-xs text-muted-foreground">
          Indicatief. Het typeplaatje of aansluitschema van de fabrikant is altijd leidend.
        </p>
      </section>

      <CtaBand
        compact
        title="Twijfel je welke aansluiting je nodig hebt?"
        text="Stuur een foto van je meterkast en het typeplaatje — je krijgt zsm een vaste prijs."
        message="Hallo VoltFix, ik heb een vraag over een perilex stekker / aansluiting."
        location="perilex-stekker-mid"
      />

      <section className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="text-2xl font-bold sm:text-3xl">Perilex aansluiten in 5 stappen</h2>
        <ol className="mt-6 space-y-4">
          {steps.map((s, i) => (
            <li
              key={s.name}
              id={`wizard-step-${i + 1}`}
              className="flex gap-4 rounded-2xl border border-border bg-background p-4"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {i + 1}
              </span>
              <div>
                <h3 className="font-semibold text-foreground">{s.name}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            to="/perilex-zelf-aansluiten"
            className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4 transition hover:border-primary"
          >
            <Ruler className="h-5 w-5 text-primary" aria-hidden />
            <span className="text-sm font-semibold">
              Zelf meten met de perilex-wizard
              <span className="block text-xs font-normal text-muted-foreground">
                Stap voor stap bepalen wat je hebt
              </span>
            </span>
          </Link>
          <Link
            to="/perilex-amsterdam"
            className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4 transition hover:border-primary"
          >
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
            <span className="text-sm font-semibold">
              Perilex laten aansluiten in Amsterdam
              <span className="block text-xs font-normal text-muted-foreground">
                Vanaf {eurNl(prices.perilexFrom)} all-in, vaste prijs vooraf
              </span>
            </span>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-12">
        <Prose>
          <h2>Wat kost een perilex stekker aansluiten?</h2>
          <ul>
            <li>
              <strong>Perilex stopcontact op bestaande groep</strong> — {eurNl(prices.perilexFrom)}{" "}
              all-in, vaste prijs vooraf.
            </li>
            <li>
              <strong>Perilex inclusief nieuwe kookgroep</strong> —{" "}
              {eurNl(prices.perilexWithNewGroupFrom)} all-in, inclusief materiaal en btw.
            </li>
          </ul>
          <p>
            Alle prijzen zijn inclusief btw, materiaal, voorrijden binnen Amsterdam en garantie op
            arbeid. Bekijk ook de{" "}
            <Link to="/perilex-amsterdam" className="font-semibold text-primary underline">
              complete prijsopbouw voor perilex in Amsterdam
            </Link>
            .
          </p>

          <h2>Veiligheid: wat mag je zelf en wat niet?</h2>
          <p>
            Het vervangen van een perilex stekker aan het snoer van je apparaat mag je zelf doen,
            zolang de groep spanningsloos is en de fasen, nul en aarde correct worden aangesloten.
            Werk in de groepenkast, het bijplaatsen van een kookgroep of het trekken van nieuwe
            bekabeling hoort bij een erkend elektricien: dat werk valt onder NEN 1010 en is
            bepalend voor je verzekering.
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
        text={`Vaste prijs vooraf vanaf ${eurNl(prices.perilexFrom)} all-in. Bel of app en we plannen een moment in.`}
        message="Hallo VoltFix, ik wil een perilex laten aansluiten."
        location="perilex-stekker-footer"
      />

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
