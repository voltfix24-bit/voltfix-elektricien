import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Check,
  FileText,
  Flame,
  MapPin,
  Phone,
  PlugZap,
  ShieldCheck,
  Wrench,
  Zap,
} from "lucide-react";


import heroImg from "@/assets/voltfix-groepenkast-modern.jpg";
import { CtaBand } from "@/components/cta-band";
import { CostTable, type CostRow } from "@/components/cost-table";
import { PriceIndicator, type PriceRow } from "@/components/price-indicator";
import { Prose } from "@/components/prose";
import { RatesTable } from "@/components/rates-table";
import { RelatedServices } from "@/components/related-services";
import { ServiceFaq } from "@/components/service-faq";
import { Testimonials } from "@/components/testimonials";
import { business, telHref, whatsappHref } from "@/lib/business";
import { useTrackConversion } from "@/lib/analytics";
import { eurNl, fromNl, prices, rangeNl } from "@/lib/pricing";
import { contactQuoteHref } from "@/lib/job-prefill";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";

import { NeighborhoodLinks } from "@/components/neighborhood-links";
import {
  absoluteUrl,
  altLinks,
  breadcrumbSchema,
  faqSchema,
  ldScript,
  pageMeta,
  ratesSchema,
  serviceSchema,
  warrantySchema,
} from "@/lib/seo";
import { priceProcessFaqs } from "@/data/service-faqs";
import { GuideLinks } from "@/components/guide-links";


const path = "/groepenkast-amsterdam";
// Offerte-link met "Soort klus" vooringevuld op "Groepenkast vervangen".
const quoteHref = contactQuoteHref("/contact", path);
const whatsappMessage =
  "Hallo VoltFix, ik wil graag een vaste prijs voor het vervangen van mijn groepenkast in Amsterdam. Ik stuur een foto van mijn meterkast mee.";

const faqs = [
  {
    q: "Wat kost het vervangen van een groepenkast in Amsterdam?",
    a: `Een nieuwe groepenkast kost tussen ${rangeNl(prices.groepenkastFrom, prices.groepenkastTo)} inclusief materiaal voor een standaard situatie. De exacte prijs hangt af van het aantal groepen, de staat van de bedrading en eventuele uitbreidingen. U krijgt altijd een vaste prijs vooraf.`,
  },
  {
    q: "Hoe lang duurt het vervangen van een groepenkast?",
    a: "Een standaard vervanging duurt meestal een halve tot hele werkdag. U zit hierbij maar kort zonder stroom; we plannen het werk zo dat de overlast minimaal is.",
  },
  {
    q: "Wanneer is het nodig om mijn groepenkast te vervangen?",
    a: "Vervang uw groepenkast als er geen of te weinig aardlekschakelaars zijn, bij oude stoppenkasten met draadzekeringen, bij regelmatig doorslaan van groepen, of als u zonnepanelen, een laadpaal of inductie wilt aansluiten.",
  },
  {
    q: "Kan ik meteen extra groepen laten bijplaatsen?",
    a: "Ja, dat is juist het ideale moment. Bij vervanging breiden we uw kast graag uit met extra groepen voor bijvoorbeeld de keuken, badkamer, laadpaal of zonnepanelen.",
  },
  {
    q: "Voldoet de nieuwe groepenkast aan de veiligheidseisen?",
    a: "Wij plaatsen elke groepenkast volgens de geldende NEN 1010-norm, met de juiste aardlekschakelaars en aardlekautomaten. Zo is uw installatie veilig en toekomstbestendig.",
  },
  {
    q: "Moet ik zelf iets regelen voordat jullie komen?",
    a: "Zorg dat de meterkast goed bereikbaar is. Verder regelen wij alles, inclusief afvoer van de oude kast en het testen van de nieuwe installatie.",
  },
  {
    q: "Geven jullie garantie op een nieuwe groepenkast?",
    a: "Ja, we geven 12 maanden garantie op het installatiewerk en 2 jaar fabrieksgarantie op de geplaatste materialen. Bij oplevering controleren en documenteren we de volledige installatie.",
  },
  {
    q: "Wat is het verschil tussen een meterkast, een stoppenkast en een groepenkast?",
    a: "De meterkast is de hele kast met de elektriciteitsmeter en hoofdaansluiting. Een stoppenkast is de verouderde uitvoering met draadzekeringen en meestal zonder aardlekschakelaar. Een groepenkast is de moderne variant met installatieautomaten en aardlekschakelaars volgens NEN 1010. Vraagt u om het vervangen van uw meterkast of stoppenkast, dan gaat het in de praktijk om het vervangen van de groepenkast.",
  },
  {
    q: "Wat kost het vervangen van een meterkast of stoppenkast in Amsterdam?",
    a: `Dat is hetzelfde werk als een groepenkast vervangen: ${rangeNl(prices.groepenkastFrom, prices.groepenkastTo)} inclusief materiaal voor een standaard situatie, en vanaf ${eurNl(prices.groepenkastFullReplacementFrom)} voor een volledige vernieuwing inclusief NEN 1010-oplevering. Oude stoppenkasten met draadzekeringen vragen soms extra werk aan de bedrading of de aarding; dat verrekenen we altijd vooraf in een vaste prijs.`,
  },
  {
    q: "Moet ik mijn groepenkast aanpassen voor een inductiekookplaat?",
    a: "Bijna altijd wel. Een gemiddelde inductiekookplaat vraagt ongeveer 7.400 watt, terwijl een gewone groep van 16 ampère bij 230 volt op circa 3.680 watt zit. U heeft daarom minimaal een eigen kookgroep nodig, en bij een volwaardige kookplaat of fornuis een perilex-aansluiting op 400 volt. Wij bepalen tijdens de inspectie welke oplossing bij uw kast en woning past.",
  },
  {
    q: "Kan ik inductie en een laadpaal tegelijk laten meenemen bij het vervangen van mijn groepenkast?",
    a: "Ja, en dat is verreweg het voordeligst. Zowel de kookgroep als de laadpaalgroep kunnen we direct meenemen in de nieuwe kast, zodat er maar één keer voorgereden en één keer gemonteerd hoeft te worden. Achteraf een groep bijplaatsen kost een nieuwe afspraak en extra arbeidstijd.",
  },
  ...priceProcessFaqs.nl.groepenkast,
];

const costRows: CostRow[] = [
  {
    scenario: "Groepenkast vervangen (standaard)",
    detail: "Tot 3 groepen, aardlekschakelaars, NEN 1010",
    price: rangeNl(prices.groepenkastFrom, prices.groepenkastTo),
    unit: "incl. materiaal",
  },
  {
    scenario: "Stoppenkast vervangen door groepenkast",
    detail: "Oude draadzekeringen eruit, moderne automaten erin",
    price: rangeNl(prices.groepenkastFrom, prices.groepenkastTo),
    unit: "incl. materiaal",
  },
  {
    scenario: "Volledige vernieuwing meterkast",
    detail: "Nieuwe kast, aarding en oplevering volgens NEN 1010",
    price: fromNl(prices.groepenkastFullReplacementFrom),
    unit: "incl. NEN 1010-oplevering",
  },
  {
    scenario: "Extra groep bijplaatsen",
    detail: "Voor keuken, laadpaal, zonnepanelen of thuiskantoor",
    price: fromNl(prices.groepenkastExtraGroupFrom),
    unit: "of op basis van situatie",
  },
  {
    scenario: "Kookgroep voor inductie",
    detail: "Eigen 230V-groep of perilex 400V voor kookplaat/fornuis",
    price: "op maat",
    unit: "vaste prijs vooraf",
  },
];



const priceRows: PriceRow[] = [
  {
    title: "Standaard groepenkast",
    price: rangeNl(prices.groepenkastFrom, prices.groepenkastTo),
    unit: "incl. materiaal",
    points: ["Tot 3 groepen", "Aardlekschakelaars", "NEN 1010 conform"],
    featured: true,
  },
  {
    title: "Volledige vernieuwing meterkast",
    price: fromNl(prices.groepenkastFullReplacementFrom),
    unit: "incl. NEN 1010-oplevering",
    points: ["Nieuwe kast & aarding", "Getest en opgeleverd", "12 mnd garantie"],
  },
  {
    title: "Extra groep bijplaatsen",
    price: fromNl(prices.groepenkastExtraGroupFrom),
    unit: "of op basis van situatie",
    points: ["Keuken & inductie", "Laadpaal & zonnepanelen", "Warmtepomp & thuiskantoor"],
  },
];

export const Route = createFileRoute("/groepenkast-amsterdam")({
  head: () => ({
    meta: pageMeta({
      title: "Groepenkast vervangen Amsterdam | Vanaf €455 | VoltFix",
      description:
        "Laat je groepenkast vervangen in Amsterdam door VoltFix. Vanaf €455 incl. materiaal, vaste prijs vooraf, volgens NEN 1010 en met garantie.",
      path: path,
      ogTitle: "Groepenkast vervangen Amsterdam | VoltFix",
      ogDescription: "Veilige, moderne groepenkast met extra groepen. Vaste prijs vooraf.",
    }),
    links: [{ rel: "canonical", href: absoluteUrl(path) }, { rel: "preload", as: "image", href: heroImg, fetchpriority: "high" }, ...altLinks(path)],
    scripts: [
      ldScript(
        serviceSchema({
          name: "Groepenkast Amsterdam",
          description:
            "Vervangen en uitbreiden van groepenkasten in Amsterdam volgens NEN 1010, met aardlekschakelaars en extra groepen.",
          path,
        }),
      ),
      ldScript(faqSchema(faqs, "nl", path)),
      ldScript(ratesSchema(path)),
      ldScript(warrantySchema(path)),
      ldScript(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Groepenkast Amsterdam", path },
        ]),
      ),
    ],

  }),
  component: Page,
});

// Trust-punten boven de vouw — geplande vervanging, geen spoedclaims.
const trustPoints = [
  `Vanaf ${eurNl(prices.groepenkastFrom)} incl. materiaal`,
  "Vaste prijs vooraf",
  "Volgens NEN 1010",
  "4,9/5 uit 59 reviews",
  "12 maanden garantie",
];

// Snelle keuze direct na de hero.
const choices = [
  {
    icon: Wrench,
    title: "Oude stoppenkast vervangen",
    text: "Van keramische stoppen naar een moderne groepenkast met aardlekschakelaars.",
    href: quoteHref,
  },
  {
    icon: Flame,
    title: "Klaar voor inductie of 3-fase",
    text: "Nieuwe kookgroep, perilex of voorbereiding op 3-fase.",
    href: "/3-fase-aansluiting-amsterdam",
  },
  {
    icon: PlugZap,
    title: "Extra groepen toevoegen",
    text: "Voor keuken, laadpaal, zonnepanelen, warmtepomp of thuiskantoor.",
    href: quoteHref,
  },
];

const bandItems = [
  { icon: MapPin, label: "Lokaal in Amsterdam" },
  { icon: ShieldCheck, label: "Volgens NEN 1010" },
  { icon: BadgeCheck, label: "Vaste prijs vooraf" },
  { icon: Zap, label: "12 mnd garantie" },
];

function waHref(content: string) {
  return whatsappHref(whatsappMessage, {
    campaign: path,
    content,
    term: "nl",
  });
}

/** Kleine herhaal-CTA na hoofdsecties: WhatsApp (foto) + vaste prijs aanvragen. */
function MiniCta({ location }: { location: string }) {
  const track = useTrackConversion();
  return (
    <div className="mx-auto max-w-3xl px-4">
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface p-5 sm:flex-row">
        <a
          href={waHref(location)}
          target="_blank"
          rel="noopener noreferrer"
          className="gtm-cta-whatsapp inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-bold text-white shadow-sm transition hover:brightness-110 sm:w-auto"
          data-gtm="cta-whatsapp"
          data-gtm-location={location}
          onClick={() => track("whatsapp", location)}
        >
          <WhatsAppIcon className="h-4 w-4" ariaLabel="WhatsApp" /> Stuur foto via WhatsApp
        </a>
        <a
          href={quoteHref}
          className="gtm-cta-quote inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-primary bg-background px-5 text-sm font-bold text-primary transition hover:bg-primary/5 sm:w-auto"
          data-gtm="cta-quote"
          data-gtm-location={location}
          onClick={() => track("quote", location)}
        >
          <FileText className="h-4 w-4" /> Vraag vaste prijs aan
        </a>
      </div>
    </div>
  );
}

function Page() {
  const track = useTrackConversion();

  return (
    <>
      {/* HERO — geplande groepenkast-vervanging, geen spoedfocus */}
      <section className="relative overflow-hidden bg-[#FBFAF6] text-foreground">
        {/* Decoratieve shapes */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-[-6rem] h-72 w-72 rounded-full bg-butter/70 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[-4rem] left-[-4rem] h-72 w-72 rounded-full bg-primary/25 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_20%_35%,rgba(255,242,117,0.18),transparent_55%)]"
        />

        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 pt-10 pb-10 lg:grid-cols-2 lg:items-center lg:gap-10 lg:pt-14 lg:pb-14">
          {/* LEFT — content */}
          <div className="order-1 flex max-w-xl flex-col">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-butter/70 px-4 py-1.5 text-sm font-semibold text-foreground shadow-sm ring-1 ring-butter">
              {`Vanaf ${eurNl(prices.groepenkastFrom)} incl. materiaal · vaste prijs vooraf`}
            </span>

            <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-[56px]">
              <span className="text-foreground">Groepenkast vervangen</span>
              <br />
              <span className="text-primary">in Amsterdam</span>
              <span className="text-butter">.</span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-foreground/80 sm:text-lg">
              Stuur een foto van je huidige meterkast en ontvang snel een vaste prijs. Veilig
              geplaatst volgens NEN 1010, vanaf {eurNl(prices.groepenkastFrom)} incl. materiaal.
            </p>

            {/* CTA's — primair WhatsApp (foto), secundair offerte */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={waHref("groepenkast-hero")}
                target="_blank"
                rel="noopener noreferrer"
                className="gtm-cta-whatsapp inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 text-sm font-bold text-white shadow-md transition hover:brightness-110"
                data-gtm="cta-whatsapp"
                data-gtm-location="groepenkast-hero"
                onClick={() => track("whatsapp", "groepenkast-hero")}
              >
                <WhatsAppIcon className="h-4 w-4" ariaLabel="WhatsApp" /> Stuur foto via WhatsApp
              </a>
              <a
                href={quoteHref}
                className="gtm-cta-quote inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-primary bg-background px-6 text-sm font-bold text-primary shadow-sm transition hover:bg-primary/5"
                data-gtm="cta-quote"
                data-gtm-location="groepenkast-hero"
                onClick={() => track("quote", "groepenkast-hero")}
              >
                <FileText className="h-4 w-4" /> Vraag offerte aan
              </a>
            </div>

            <p className="mt-4 text-sm text-foreground/60">
              Liever bellen?{" "}
              <a
                href={telHref}
                className="gtm-cta-call font-semibold text-primary hover:underline"
                data-gtm="cta-call"
                data-gtm-location="groepenkast-hero"
                onClick={() => track("call", "groepenkast-hero")}
              >
                <Phone className="mr-1 inline h-3.5 w-3.5" />
                {business.phoneDisplay}
              </a>
            </p>

            {/* Trust-punten boven de vouw */}
            <ul className="mt-7 grid max-w-lg grid-cols-1 gap-x-6 gap-y-2.5 text-sm sm:grid-cols-2">
              {trustPoints.map((point) => (
                <li key={point} className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-medium text-foreground">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT — vierkante, rustige groepenkast-foto */}
          <div className="order-2 flex items-center justify-center">
            <img
              src={heroImg}
              alt="Moderne groepenkast met installatieautomaten en aardlekschakelaars, geplaatst volgens NEN 1010"
              width={1024}
              height={1024}
              className="block aspect-square w-full max-w-[520px] rounded-2xl border border-border object-cover shadow-[var(--shadow-elegant)]"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </div>
        </div>
      </section>

      {/* USP BAND — direct onder hero */}
      <div className="relative z-10 -mt-1 bg-butter">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <ul className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-8">
            {bandItems.map(({ icon: Icon, label }, i) => (
              <li
                key={label}
                className={`flex items-center gap-2 text-foreground sm:${
                  i > 0 ? "border-l sm:pl-8" : ""
                }`}
              >
                <Icon className="h-4 w-4 text-foreground" />
                <span className="font-semibold">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* SNELLE KEUZE — drie compacte blokken direct na de hero */}
      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">Wat is jouw situatie?</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {choices.map(({ icon: Icon, title, text, href }) => (
              <a
                key={title}
                href={href}
                className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:border-primary/50 hover:shadow-[var(--shadow-elegant)]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="mt-4 text-lg font-bold text-foreground">{title}</span>
                <span className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</span>
                <span className="mt-4 text-sm font-semibold text-primary group-hover:underline">
                  Vraag vaste prijs aan →
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <MiniCta location="groepenkast-keuze" />

      {/* CONTENT */}
      <article className="mx-auto max-w-3xl px-4 py-14">
        <Prose>
          <p>
            De groepenkast is het hart van de elektrische installatie in uw woning. Een moderne,
            goed beveiligde groepenkast beschermt u tegen kortsluiting, overbelasting en
            elektrocutie. Toch hebben veel woningen in Amsterdam — zeker oudere panden — nog een
            verouderde stoppenkast of een kast zonder voldoende aardlekschakelaars.{" "}
            <strong>VoltFix vervangt uw groepenkast vakkundig en veilig</strong>, afgestemd op het
            gebruik van vandaag.
          </p>

          <h2>Wanneer is een groepenkast vervangen nodig?</h2>
          <p>
            Een groepenkast gaat lang mee, maar niet eeuwig. Overweeg vervanging in deze gevallen:
          </p>
          <ul>
            <li>
              <strong>Oude stoppenkast met draadzekeringen</strong> in plaats van automaten en
              aardlekschakelaars.
            </li>
            <li>
              <strong>Geen of te weinig aardlekschakelaars</strong> — een groot veiligheidsrisico.
            </li>
            <li>
              <strong>Groepen slaan regelmatig door</strong> doordat de kast de belasting niet meer
              aankan.
            </li>
            <li>
              <strong>Te weinig groepen</strong> voor een moderne keuken, badkamer of thuiskantoor.
            </li>
            <li>
              <strong>Uitbreidingsplannen</strong> zoals zonnepanelen, een laadpaal, inductie of een
              warmtepomp.
            </li>
            <li>
              <strong>Bij aankoop of verbouwing</strong> van een woning in Amsterdam, als
              veiligheidscheck.
            </li>
          </ul>

          <h2>Wat houdt het vervangen van een groepenkast in?</h2>
          <p>
            Bij VoltFix is het vervangen van een groepenkast een strak proces. We beginnen met een
            inspectie van uw huidige installatie en bedrading. Daarna stellen we samen vast hoeveel
            groepen u nodig heeft en welke beveiliging passend is. Vervolgens demonteren we de oude
            kast, plaatsen we de nieuwe groepenkast met de juiste aardlekschakelaars en
            aardlekautomaten, en sluiten we alle groepen netjes en gelabeld aan. Tot slot testen we
            de hele installatie door en leveren we hem veilig op.
          </p>
          <p>De werkzaamheden bestaan doorgaans uit:</p>
          <ul>
            <li>Demontage en afvoer van de oude groepen- of stoppenkast.</li>
            <li>Plaatsing van een nieuwe kast volgens NEN 1010.</li>
            <li>Installatie van aardlekschakelaars en/of aardlekautomaten.</li>
            <li>Aansluiten en duidelijk labelen van alle groepen.</li>
            <li>Eventueel uitbreiden met extra groepen.</li>
            <li>Doormeten, testen en veilig opleveren.</li>
          </ul>

          <h2>Veiligheid voorop</h2>
          <p>
            Een aardlekschakelaar schakelt de stroom binnen een fractie van een seconde uit zodra er
            een lekstroom optreedt — bijvoorbeeld als iemand een draad aanraakt of als er vocht in
            een apparaat komt. Dit kan letterlijk levens redden. Oude kasten missen deze bescherming
            vaak, of hebben één aardlekschakelaar voor het hele huis, waardoor bij een storing
            meteen alles uitvalt. Met meerdere groepen en aparte beveiliging blijft de rest van uw
            huis gewoon werken als er ergens iets misgaat.
          </p>

          <h2>Uitbreiden met extra groepen</h2>
          <p>
            Moderne huishoudens vragen steeds meer van de elektrische installatie. Een
            inductiekookplaat, vaatwasser, droger, airco,{" "}
            <Link to="/laadpaal-amsterdam" className="text-primary underline">
              laadpaal
            </Link>{" "}
            of zonnepanelen hebben vaak een eigen groep nodig. Het moment waarop u uw groepenkast
            laat vervangen is ideaal om{" "}
            <strong>direct extra groepen bij te plaatsen</strong>. Zo voorkomt u overbelasting en
            bent u klaar voor de toekomst. Twijfelt u of uw installatie nog veilig is? Neem dan
            gerust contact op — we kijken bij de vervanging altijd naar de hele installatie.
          </p>
          <p>
            Gaat u inductiekoken, snelladen of een warmtepomp combineren? Dan is vaak een{" "}
            <Link to="/3-fase-aansluiting-amsterdam" className="text-primary underline">
              3-fase aansluiting (krachtstroom)
            </Link>{" "}
            de juiste basis — wij bouwen de groepenkast om en stemmen af met netbeheerder Liander.
          </p>


          <h2 id="prijzen">Wat kost een groepenkast vervangen in Amsterdam?</h2>
          <p>
            De kosten liggen tussen <strong>{rangeNl(prices.groepenkastFrom, prices.groepenkastTo)} inclusief materiaal</strong> voor een
            standaard groepenkast. De uiteindelijke prijs hangt af van het aantal groepen, de
            gewenste beveiliging, de staat van uw bedraging en eventuele uitbreidingen.
          </p>
          <p>
            <strong>Je krijgt altijd eerst een vaste prijs.</strong> Loopt er iets anders dan
            verwacht, dan bespreken we dat vooraf.
          </p>

          <CostTable
            caption="Kosten groepenkast vervangen Amsterdam per situatie"
            rows={costRows}
            footnote={`Alle bedragen zijn indicaties inclusief btw voor particulieren. U ontvangt vooraf een vaste prijs op basis van uw situatie; loopt er iets anders dan verwacht, dan bespreken we dat vooraf.`}
          />

          <h3>Waar hangen de kosten van af?</h3>
          <ul>
            <li>
              <strong>Aantal groepen.</strong> Een kast met 3 groepen is fors goedkoper dan een kast
              met 8 groepen plus krachtstroom.
            </li>
            <li>
              <strong>Staat van de bedrading.</strong> Oude stoffen- of loden bedrading in
              Amsterdamse vooroorlogse panden moet soms deels vernieuwd worden.
            </li>
            <li>
              <strong>Aarding.</strong> Ontbreekt een aardelektrode of aardleiding, dan komt het
              aanleggen daarvan erbij.
            </li>
            <li>
              <strong>Positie van de meterkast.</strong> Een krappe of dichtgetimmerde meterkast in
              een grachtenpand kost meer arbeidstijd.
            </li>
            <li>
              <strong>Uitbreidingen.</strong> Extra groepen voor inductie, laadpaal, zonnepanelen of
              een warmtepomp.
            </li>
          </ul>

          <h2>Meterkast, stoppenkast of groepenkast: wat is het verschil?</h2>
          <p>
            In de praktijk worden deze woorden door elkaar gebruikt, en dat is prima — wij weten wat
            u bedoelt. Toch betekenen ze technisch iets anders:
          </p>
          <ul>
            <li>
              <strong>Meterkast</strong> is de hele kast of ruimte waarin de elektriciteitsmeter,
              de hoofdaansluiting en vaak ook de water- en gasaansluiting zitten. Vraagt u om{" "}
              <strong>meterkast vervangen in Amsterdam</strong>, dan gaat het meestal om de
              groepenkast die erin hangt.
            </li>
            <li>
              <strong>Stoppenkast</strong> is de oude benaming, uit de tijd van draadzekeringen
              (&ldquo;stoppen&rdquo;) die u er handmatig indraaide. Heeft u nog een stoppenkast met
              keramische zekeringen, dan is de installatie vrijwel zeker verouderd en ontbreken
              aardlekschakelaars.
            </li>
            <li>
              <strong>Groepenkast</strong> is de moderne variant: installatieautomaten en
              aardlekschakelaars die de stroomkringen (groepen) van uw woning beveiligen volgens
              NEN 1010.
            </li>
          </ul>
          <p>
            Of u nu zoekt op <strong>stoppenkast vervangen</strong>, <strong>meterkast
            vernieuwen</strong> of <strong>groepenkast uitbreiden</strong>: het werk en de prijzen
            in de tabel hierboven zijn hetzelfde. Twijfelt u wat u heeft? Stuur een foto van uw
            meterkast via{" "}
            <a
              href={waHref("synonyms-whatsapp")}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>{" "}
            en u krijgt dezelfde dag een inschatting.
          </p>

          <h2>Groepenkast geschikt maken voor inductie</h2>
          <p>
            Verreweg de meest voorkomende reden om in Amsterdam een groepenkast te laten aanpassen
            is de overstap van gas naar <strong>inductie koken</strong>. Een inductiekookplaat
            vraagt aanzienlijk meer vermogen dan een gewone keukengroep aankan: een gemiddelde
            kookplaat trekt 7.400 watt, terwijl een standaard groep van 16 ampère bij 230 volt op
            ongeveer 3.680 watt zit. Aansluiten op een bestaande keukengroep leidt daarom tot een
            groep die er telkens uitklapt — of, erger, tot oververhitting van de bedrading.
          </p>
          <p>Er zijn drie manieren om dit goed op te lossen:</p>
          <ul>
            <li>
              <strong>Eigen 230V-groep (16A).</strong> Voldoende voor lichtere kookplaten tot
              ongeveer 3.500 watt of modellen met vermogensbegrenzing. Vereist een vrije groep in de
              kast en een aparte kabel naar de keuken.
            </li>
            <li>
              <strong>Perilex 400V (3-fase).</strong> De standaardoplossing voor volwaardige
              kookplaten en fornuizen. Hiervoor is een krachtstroomaansluiting nodig; lees meer over{" "}
              <Link to="/perilex-amsterdam">perilex aansluiten in Amsterdam</Link>.
            </li>
            <li>
              <strong>Verzwaring naar 3-fase.</strong> Heeft uw woning nog 1-fase (1x25A), dan is
              een verzwaring via de netbeheerder nodig voordat perilex mogelijk is. Wij bereiden de
              groepenkast voor en begeleiden de aanvraag.
            </li>
          </ul>
          <p>
            Bij het vervangen van de groepenkast is dit het slimme moment om dit meteen mee te
            nemen. Een extra kookgroep achteraf betekent opnieuw voorrijden en opnieuw de kast
            openleggen; in één keer meenemen scheelt vaak enkele honderden euro&rsquo;s. Plant u
            ook een <Link to="/laadpaal-amsterdam">laadpaal</Link> of zonnepanelen, geef dat dan
            direct aan — dan kiezen we een kast met ruimte voor die groepen.
          </p>
          <p>
            Ook voor ander elektrawerk kunt u bij ons terecht — bekijk het complete aanbod van onze{" "}
            <a href="/elektricien-amsterdam">elektricien in Amsterdam</a>.
          </p>

          <h2>Spoed of storing?</h2>
          <p>
            Heeft u geen stroom of slaat een groep steeds door? Dan kijken we liever vandaag nog mee
            via onze{" "}
            <Link to="/stroomstoring-amsterdam" className="text-primary underline">
              storingsdienst in Amsterdam
            </Link>{" "}
            of{" "}
            <Link to="/spoed-elektricien-amsterdam" className="text-primary underline">
              spoed-elektricien
            </Link>
            . Voor geplande vervanging gebruikt u de knoppen op deze pagina.
          </p>


        </Prose>
      </article>

      <MiniCta location="groepenkast-content" />

      <CtaBand compact message={whatsappMessage} location="service-mid" />

      <PriceIndicator
        title="Prijsindicatie groepenkast vervangen"
        intro="Je krijgt altijd eerst een vaste prijs. Loopt er iets anders dan verwacht, dan bespreken we dat vooraf. Alle bedragen incl. btw, materiaal en 12 maanden garantie op installatiewerk."
        rows={priceRows}
        message={whatsappMessage}
        location="service-price"
      />

      <MiniCta location="groepenkast-prijzen" />

      <RatesTable />
      <Testimonials category="groepenkast" />

      <CtaBand message={whatsappMessage} location="service-cta" />

      <ServiceFaq faqs={faqs} />

      <RelatedServices currentPath={path} />

      <CtaBand
        compact
        title="Direct hulp nodig?"
        message={whatsappMessage}
        location="service-footer"
      />

      <GuideLinks currentPath={path} />
      <NeighborhoodLinks title="Groepenkast vervangen per wijk in Amsterdam" intro="Kies uw wijk voor lokale prijzen en reactietijden voor het vervangen van een groepenkast." includeEmergency={true} />
    </>
  );
}
