import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Clock,
  FileText,
  MapPin,
  Phone,
  ShieldCheck,
  Wrench,
  Zap,
} from "lucide-react";


import heroImg from "@/assets/voltfix-groepenkast-hero.webp.asset.json";
import { CtaBand } from "@/components/cta-band";
import { CostTable, type CostRow } from "@/components/cost-table";
import { PriceIndicator, type PriceRow } from "@/components/price-indicator";
import { Prose } from "@/components/prose";
import { RatesTable } from "@/components/rates-table";
import { RelatedServices } from "@/components/related-services";
import { ServiceFaq } from "@/components/service-faq";
import { Testimonials } from "@/components/testimonials";
import { business, telHref, whatsappHref } from "@/lib/business";
import { useT } from "@/lib/i18n";
import { useTrackConversion } from "@/lib/analytics";
import { eurNl, fromNl, prices, rangeNl } from "@/lib/pricing";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";

import { NeighborhoodLinks } from "@/components/neighborhood-links";
import {
  absoluteUrl,
  altLinks,
  breadcrumbSchema,
  faqSchema,
  ldScript,
  ogImage,
  pageMeta,
  ratesSchema,
  serviceSchema,
  warrantySchema,
} from "@/lib/seo";
import { priceProcessFaqs } from "@/data/service-faqs";


const path = "/Groepenkast-Amsterdam";
const whatsappMessage =
  "Hallo VoltFix, ik wil graag mijn groepenkast laten vervangen in Amsterdam.";

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
    a: `Dat is hetzelfde werk als een groepenkast vervangen: ${rangeNl(prices.groepenkastFrom, prices.groepenkastTo)} inclusief materiaal voor een standaard situatie, en vanaf ${eurNl(prices.groepenkastFullReplacementFrom)} voor een volledige vernieuwing inclusief keuring. Oude stoppenkasten met draadzekeringen vragen soms extra werk aan de bedrading of de aarding; dat verrekenen we altijd vooraf in een vaste prijs.`,
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
    detail: "Nieuwe kast, aarding en keuring van de installatie",
    price: fromNl(prices.groepenkastFullReplacementFrom),
    unit: "incl. keuring",
  },
  {
    scenario: "Extra groep bijplaatsen",
    detail: "Losse groep voor keuken, badkamer of thuiskantoor",
    price: `${eurNl(prices.hourly)} p/u`,
    unit: "excl. materiaal",
  },
  {
    scenario: "Kookgroep voor inductie",
    detail: "Eigen 230V-groep of perilex 400V voor kookplaat/fornuis",
    price: "op maat",
    unit: "vaste prijs vooraf",
  },
  {
    scenario: "Veiligheidsinspectie meterkast",
    detail: "Controle, meting en rapport van bevindingen",
    price: fromNl(prices.keuringHerkeuringFrom),
    unit: "per woning",
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
    title: "Groepenkast + uitbreiding",
    price: "op maat",
    unit: "incl. extra groepen",
    points: ["Extra groepen", "Voor laadpaal & zonnepanelen", "Inductie & keuken"],
  },
  {
    title: "Veiligheidsinspectie",
    price: fromNl(prices.keuringHerkeuringFrom),
    unit: "meterkast-check",
    points: ["Volledige controle", "Eerlijk advies", "Rapport van bevindingen"],
  },
];

export const Route = createFileRoute("/Groepenkast-Amsterdam")({
  head: () => ({
    meta: pageMeta({
      title: `Groepenkast Amsterdam | Vervangen ${rangeNl(prices.groepenkastFrom, prices.groepenkastTo)} | VoltFix`,
      description:
        `Groepenkast, meterkast of stoppenkast vervangen in Amsterdam voor ${rangeNl(prices.groepenkastFrom, prices.groepenkastTo)} incl. materiaal. Kostentabel, geschikt voor inductie. Vaste prijs vooraf.`,
      path: path,
      ogTitle: "Groepenkast Amsterdam | VoltFix",
      ogDescription: "Veilige, moderne groepenkast met extra groepen. Vaste prijs vooraf.",
    }),
    links: [{ rel: "canonical", href: absoluteUrl(path) }, { rel: "preload", as: "image", href: heroImg.url, fetchpriority: "high" }, ...altLinks(path)],
    scripts: [
      ldScript(
        serviceSchema({
          name: "Groepenkast Amsterdam",
          description:
            "Vervangen en uitbreiden van groepenkasten in Amsterdam volgens NEN 1010, met aardlekschakelaars en extra groepen.",
          path,
        }),
      ),
      ldScript(faqSchema(faqs)),
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

const usps = [
  { icon: Clock, label: "24/7", sub: "bereikbaar" },
  { icon: ShieldCheck, label: "Gecertificeerd", sub: "& betrouwbaar" },
  { icon: MapPin, label: "In heel", sub: "Amsterdam" },
];

const bandItems = [
  { icon: MapPin, label: "Lokaal in Amsterdam" },
  { icon: Zap, label: "Snelle service" },
  { icon: BadgeCheck, label: "Transparante tarieven" },
  { icon: Wrench, label: "Vakkundig werk" },
];

function Page() {
  const t = useT();
  const track = useTrackConversion();

  return (
    <>
      {/* HERO — light, tweekoloms, illustratie rechts */}
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

        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 pt-10 pb-8 lg:grid-cols-[45fr_55fr] lg:items-center lg:gap-6 lg:pt-14 lg:pb-12">
          {/* LEFT — content */}
          <div className="order-1 flex max-w-xl flex-col">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-butter/70 px-4 py-1.5 text-sm font-semibold text-foreground shadow-sm ring-1 ring-butter">
              {`Vanaf ${eurNl(prices.groepenkastFrom)} incl. materiaal`}
            </span>

            <h1 className="mt-5 text-5xl font-black leading-[1.02] tracking-tight text-balance sm:text-6xl lg:text-[64px]">
              <span className="text-foreground">Groepenkast</span>
              <br />
              <span className="text-primary">Amsterdam</span>
              <span className="text-butter">.</span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-foreground/80 sm:text-lg">
              Een verouderde of overbelaste groepenkast vergroot de kans op storingen en brand.
              VoltFix vervangt uw groepenkast in Amsterdam veilig, snel en volgens de norm — met
              ruimte om uit te breiden.
            </p>

            {/* Telefoonnummer groot */}
            <a
              href={telHref}
              className="gtm-cta-call mt-7 inline-flex items-center gap-3 text-2xl font-black tracking-tight text-primary sm:text-3xl"
              data-gtm="cta-call"
              data-gtm-location="groepenkast-hero-phone"
              onClick={() => track("call", "groepenkast-hero-phone")}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                <Phone className="h-5 w-5" />
              </span>
              {business.phoneDisplay}
            </a>

            {/* CTA's */}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={telHref}
                className="gtm-cta-call inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-md transition hover:brightness-110"
                data-gtm="cta-call"
                data-gtm-location="groepenkast-hero"
                onClick={() => track("call", "groepenkast-hero")}
              >
                <Phone className="h-4 w-4" /> Bel direct
              </a>
              <a
                href={whatsappHref(whatsappMessage, {
                  campaign: "/Groepenkast-Amsterdam",
                  content: "groepenkast-hero",
                  term: "nl",
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="gtm-cta-whatsapp inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-bold text-white shadow-md transition hover:brightness-110"
                data-gtm="cta-whatsapp"
                data-gtm-location="groepenkast-hero"
                onClick={() => track("whatsapp", "groepenkast-hero")}
              >
                <WhatsAppIcon className="h-4 w-4" /> WhatsApp
              </a>
              <a
                href={`${t.contactTo}#offerte`}
                className="gtm-cta-quote inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-primary bg-background px-5 text-sm font-bold text-primary shadow-sm transition hover:bg-primary/5"
                data-gtm="cta-quote"
                data-gtm-location="groepenkast-hero"
                onClick={() => track("quote", "groepenkast-hero")}
              >
                <FileText className="h-4 w-4" /> Offerte aanvragen
              </a>
            </div>

            <p className="mt-4 text-sm text-foreground/60">
              VoltFix · Amsterdam · {business.phoneDisplay} ·{" "}
              <a href={`mailto:${business.email}`} className="hover:text-primary">
                {business.email}
              </a>
            </p>

            {/* USPs */}
            <div className="mt-8 grid max-w-md grid-cols-3 gap-4 text-sm">
              {usps.map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-start gap-2">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="leading-tight">
                    <span className="block font-semibold text-foreground">{label}</span>
                    <span className="block text-muted-foreground">{sub}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — illustration flush to bottom */}
          <div className="order-2 relative -mx-4 flex items-end justify-center lg:mx-0 lg:-mr-6">
            <img
              src={heroImg.url}
              alt="Twee VoltFix monteurs vervangen een moderne groepenkast in een woning in Amsterdam"
              width={1600}
              height={1200}
              className="block h-auto w-full max-w-[720px] object-contain lg:max-w-none"
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
            bent u klaar voor de toekomst. Twijfelt u of uw installatie nog veilig is? Vraag dan
            een{" "}
            <Link to="/keuring-amsterdam" className="text-primary underline">
              elektrische keuring
            </Link>{" "}
            aan.
          </p>


          <h2>Wat kost een groepenkast vervangen in Amsterdam?</h2>
          <p>
            De kosten liggen tussen <strong>{rangeNl(prices.groepenkastFrom, prices.groepenkastTo)} inclusief materiaal</strong> voor een
            standaard groepenkast. De uiteindelijke prijs hangt af van het aantal groepen, de
            gewenste beveiliging, de staat van uw bedraging en eventuele uitbreidingen. Wij geven u
            altijd een <strong>vaste prijs vooraf</strong>, zonder verrassingen achteraf.
          </p>

          <CostTable
            caption="Kosten groepenkast vervangen Amsterdam per situatie"
            rows={costRows}
            footnote={`Alle bedragen zijn indicaties inclusief btw voor particulieren. Uurtarief buiten vaste prijzen: ${eurNl(prices.hourly)} per uur, spoed eerste uur ${eurNl(prices.emergencyFirstHour)}. U ontvangt vooraf een vaste prijs op basis van uw situatie.`}
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
              href={whatsappHref(whatsappMessage, {
                campaign: "/Groepenkast-Amsterdam",
                content: "synonyms-whatsapp",
                term: "nl",
              })}
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


        </Prose>
      </article>

      <CtaBand compact message={whatsappMessage} location="service-mid" />

      <PriceIndicator
        title="Prijsindicatie groepenkast vervangen"
        intro="Vaste prijs vooraf voor het vervangen van een groepenkast in Amsterdam. Inclusief btw, materiaal en 12 maanden garantie op installatiewerk."
        rows={priceRows}
        message={whatsappMessage}
        location="service-price"
      />

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

      <NeighborhoodLinks title="Groepenkast vervangen per wijk in Amsterdam" intro="Kies uw wijk voor lokale prijzen en reactietijden voor het vervangen van een groepenkast." includeEmergency={true} />
    </>
  );
}
