import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Clock,
  FileText,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Wrench,
  Zap,
} from "lucide-react";

import heroImg from "@/assets/voltfix-groepenkast-hero.png.asset.json";
import { CtaBand } from "@/components/cta-band";
import { PriceIndicator, type PriceRow } from "@/components/price-indicator";
import { Prose } from "@/components/prose";
import { RatesTable } from "@/components/rates-table";
import { RelatedServices } from "@/components/related-services";
import { ServiceFaq } from "@/components/service-faq";
import { Testimonials } from "@/components/testimonials";
import { business, defaultWhatsappMessage, telHref, whatsappHref } from "@/lib/business";
import { useT } from "@/lib/i18n";
import { useTrackConversion } from "@/lib/analytics";
import {
  absoluteUrl,
  altLinks,
  breadcrumbSchema,
  faqSchema,
  ldScript,
  ogImage,
  serviceSchema,
} from "@/lib/seo";

const path = "/Groepenkast-Amsterdam";
const whatsappMessage =
  "Hallo VoltFix, ik wil graag mijn groepenkast laten vervangen in Amsterdam.";

const faqs = [
  {
    q: "Wat kost het vervangen van een groepenkast in Amsterdam?",
    a: "Een nieuwe groepenkast kost tussen € 455 en € 850 inclusief materiaal voor een standaard situatie. De exacte prijs hangt af van het aantal groepen, de staat van de bedrading en eventuele uitbreidingen. U krijgt altijd een vaste prijs vooraf.",
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
];

const priceRows: PriceRow[] = [
  {
    title: "Standaard groepenkast",
    price: "€ 455 – € 850",
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
    price: "vanaf € 95",
    unit: "meterkast-check",
    points: ["Volledige controle", "Eerlijk advies", "Rapport van bevindingen"],
  },
];

export const Route = createFileRoute("/Groepenkast-Amsterdam")({
  head: () => ({
    meta: [
      { title: "Groepenkast Amsterdam | Vervangen € 455–€ 850 | VoltFix" },
      {
        name: "description",
        content:
          "Groepenkast vervangen in Amsterdam voor € 455 tot € 850 incl. materiaal. Vaste prijs vooraf, 12 maanden garantie op installatiewerk, 2 jaar op materialen.",
      },
      { property: "og:title", content: "Groepenkast Amsterdam | VoltFix" },
      {
        property: "og:description",
        content: "Veilige, moderne groepenkast met extra groepen. Vaste prijs vooraf.",
      },
      { property: "og:url", content: absoluteUrl(path) },
      { property: "og:type", content: "article" },
      { property: "og:image", content: ogImage },
      { name: "twitter:image", content: ogImage },
    ],
    links: [{ rel: "canonical", href: absoluteUrl(path) }, ...altLinks(path)],
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
              Vanaf € 455 incl. materiaal
            </span>

            <h1 className="mt-5 text-5xl font-black leading-[1.02] tracking-tight text-balance sm:text-6xl lg:text-[64px]">
              <span className="text-foreground">Groepenkast</span>
              <br />
              <span className="text-primary">Amsterdam</span>
              <span className="text-butter">.</span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-foreground/80 sm:text-lg">
              Een verouderde of overbelaste groepenkast vergroot de kans op
              storingen en brand. VoltFix vervangt uw groepenkast in Amsterdam
              veilig, snel en volgens de norm — met ruimte om uit te breiden.
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
                href={whatsappHref(whatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="gtm-cta-whatsapp inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-bold text-white shadow-md transition hover:brightness-110"
                data-gtm="cta-whatsapp"
                data-gtm-location="groepenkast-hero"
                onClick={() => track("whatsapp", "groepenkast-hero")}
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
              <Link
                to={t.contactTo}
                className="gtm-cta-quote inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-primary bg-background px-5 text-sm font-bold text-primary shadow-sm transition hover:bg-primary/5"
                data-gtm="cta-quote"
                data-gtm-location="groepenkast-hero"
                onClick={() => track("quote", "groepenkast-hero")}
              >
                <FileText className="h-4 w-4" /> Offerte aanvragen
              </Link>
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
            De groepenkast is het hart van de elektrische installatie in uw woning.
            Een moderne, goed beveiligde groepenkast beschermt u tegen kortsluiting,
            overbelasting en elektrocutie. Toch hebben veel woningen in Amsterdam —
            zeker oudere panden — nog een verouderde stoppenkast of een kast zonder
            voldoende aardlekschakelaars.{" "}
            <strong>VoltFix vervangt uw groepenkast vakkundig en veilig</strong>,
            afgestemd op het gebruik van vandaag.
          </p>

          <h2>Wanneer is een groepenkast vervangen nodig?</h2>
          <p>Een groepenkast gaat lang mee, maar niet eeuwig. Overweeg vervanging in deze gevallen:</p>
          <ul>
            <li><strong>Oude stoppenkast met draadzekeringen</strong> in plaats van automaten en aardlekschakelaars.</li>
            <li><strong>Geen of te weinig aardlekschakelaars</strong> — een groot veiligheidsrisico.</li>
            <li><strong>Groepen slaan regelmatig door</strong> doordat de kast de belasting niet meer aankan.</li>
            <li><strong>Te weinig groepen</strong> voor een moderne keuken, badkamer of thuiskantoor.</li>
            <li><strong>Uitbreidingsplannen</strong> zoals zonnepanelen, een laadpaal, inductie of een warmtepomp.</li>
            <li><strong>Bij aankoop of verbouwing</strong> van een woning in Amsterdam, als veiligheidscheck.</li>
          </ul>

          <h2>Wat houdt het vervangen van een groepenkast in?</h2>
          <p>
            Bij VoltFix is het vervangen van een groepenkast een strak proces. We
            beginnen met een inspectie van uw huidige installatie en bedrading.
            Daarna stellen we samen vast hoeveel groepen u nodig heeft en welke
            beveiliging passend is. Vervolgens demonteren we de oude kast, plaatsen
            we de nieuwe groepenkast met de juiste aardlekschakelaars en
            aardlekautomaten, en sluiten we alle groepen netjes en gelabeld aan. Tot
            slot testen we de hele installatie door en leveren we hem veilig op.
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
            Een aardlekschakelaar schakelt de stroom binnen een fractie van een
            seconde uit zodra er een lekstroom optreedt — bijvoorbeeld als iemand
            een draad aanraakt of als er vocht in een apparaat komt. Dit kan letterlijk
            levens redden. Oude kasten missen deze bescherming vaak, of hebben één
            aardlekschakelaar voor het hele huis, waardoor bij een storing meteen
            alles uitvalt. Met meerdere groepen en aparte beveiliging blijft de rest
            van uw huis gewoon werken als er ergens iets misgaat.
          </p>

          <h2>Uitbreiden met extra groepen</h2>
          <p>
            Moderne huishoudens vragen steeds meer van de elektrische installatie.
            Een inductiekookplaat, vaatwasser, droger, airco, laadpaal of
            zonnepanelen hebben vaak een eigen groep nodig. Het moment waarop u uw
            groepenkast laat vervangen is ideaal om{" "}
            <strong>direct extra groepen bij te plaatsen</strong>. Zo voorkomt u
            overbelasting en bent u klaar voor de toekomst.
          </p>

          <h2>Wat kost een groepenkast vervangen in Amsterdam?</h2>
          <p>
            De kosten liggen tussen <strong>€ 455 en € 850 inclusief materiaal</strong>{" "}
            voor een standaard groepenkast. De uiteindelijke prijs hangt af van het
            aantal groepen, de gewenste beveiliging, de staat van uw bedraging en
            eventuele uitbreidingen. Wij geven u altijd een{" "}
            <strong>vaste prijs vooraf</strong>, zonder verrassingen achteraf.
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
      <Testimonials />

      <CtaBand message={whatsappMessage} location="service-cta" />

      <ServiceFaq faqs={faqs} />

      <RelatedServices currentPath={path} />

      <CtaBand
        compact
        title="Direct hulp nodig?"
        message={defaultWhatsappMessage}
        location="service-footer"
      />
    </>
  );
}
