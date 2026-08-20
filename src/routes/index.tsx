import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeEuro,
  BatteryCharging,
  ClipboardCheck,
  Clock,
  Gauge,
  MapPin,
  Phone,
  Plug,
  ShieldCheck,
  Wrench,
  Zap,
  ZapOff,
} from "lucide-react";



import heroImg from "@/assets/voltfix-hero-illustration.webp.asset.json";
import amsterdamImg from "@/assets/amsterdam-map.webp.asset.json";
import { ServiceAreaMap } from "@/components/service-area-map";

import { CertificationStrip } from "@/components/certifications";
import { ServiceQuickLinks } from "@/components/service-quick-links";

import { CtaBand } from "@/components/cta-band";
import { NeighborhoodLinks } from "@/components/neighborhood-links";
import { ServiceFaq } from "@/components/service-faq";
import { Testimonials } from "@/components/testimonials";
import { TrustRow } from "@/components/trust-row";
import { business, serviceAreas, telHref, whatsappHref } from "@/lib/business";
import { whatsappMessageFor } from "@/lib/whatsapp-messages";
import { absoluteUrl, altLinks, faqSchema, imageObjectSchema, ldScript, ogImage, pageMeta, ratesSchema, warrantySchema } from "@/lib/seo";
import { useTrackConversion } from "@/lib/analytics";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";

import {
  allInSublabelNl,
  firstHourAllInNl,
  firstHourNoteNl,
  fromNl,
  prices,
  vatConsumerNoteNl,
} from "@/lib/pricing";
import { GuideLinks } from "@/components/guide-links";


const homeFaqs = [
  {
    q: "Ik heb nu een stroomstoring in Amsterdam — wat moet ik doen?",
    a: `Bel direct ${business.phoneDisplay} of app ons via WhatsApp. Wij zijn 24/7 bereikbaar en bij spoed binnen 60 minuten in heel Amsterdam voor de deur. Controleer alvast of het bij de buren ook uit is (dan ligt het bij Liander) en of één specifieke groep in de meterkast is uitgeschakeld — die informatie helpt de monteur direct met de juiste onderdelen te komen.`,
  },
  {
    q: "Hoe snel staat een elektricien van VoltFix voor mijn deur bij een stroomstoring?",
    a: "Bij spoed zijn we binnen 60 minuten in heel Amsterdam ter plaatse — 24/7, ook 's avonds, in het weekend en op feestdagen. Voor Centrum, Zuid, West, Oost, Noord, De Pijp, Jordaan en IJburg geldt dezelfde belofte.",
  },
  {
    q: "Wat kost het oplossen van een stroomstoring in Amsterdam?",
    a: "Binnen kantooruren rekenen we het vaste storingstarief van € 120 all-in voor het eerste uur — voorrijden inbegrepen. Buiten kantooruren (avond, nacht, weekend, feestdagen) is dat € 145 all-in voor het eerste uur. Daarna per 15 minuten. Loopt het uit of is er materiaal nodig? Dan stopt de monteur en hoort u eerst wat het extra kost. Pas daarna gaan we door.",
  },
  {
    q: "Ligt de stroomstoring bij mij of bij netbeheerder Liander?",
    a: "Kijk eerst of de buren óók zonder stroom zitten. Zo ja, dan is het waarschijnlijk een storing in het net van Liander — check liander.nl/storing. Zit alleen uw pand zonder stroom of alleen één groep, dan is het een storing binnen de installatie en kunnen wij het verhelpen. Twijfelt u? Bel gerust, we denken telefonisch met u mee.",
  },
  {
    q: "Werken jullie 's nachts, in het weekend en op feestdagen in Amsterdam?",
    a: "Ja. Onze spoedservice is 24/7 bereikbaar in heel Amsterdam. Voor stroomstoringen buiten kantooruren geldt het avond/nacht/weekend-tarief; binnen kantooruren betaalt u het reguliere storingstarief — ook als het spoed is.",
  },
  {
    q: "In welke wijken van Amsterdam komen jullie bij stroomstoring?",
    a: "We werken in heel Amsterdam en directe omgeving: Centrum, Zuid, West, Oost, Noord, De Pijp, Jordaan, IJburg, plus Amstelveen. Overal geldt de belofte: bij spoed binnen 60 minuten voor de deur.",
  },
  {
    q: "Geven jullie garantie op het oplossen van de storing?",
    a: "Ja. Onze monteurs werken volgens de NEN 1010-norm. U krijgt garantie op arbeid en 2 jaar fabrieksgarantie op geplaatste materialen. En: nooit een verrassing op de factuur — loopt het uit of is er extra materiaal nodig, dan stopt de monteur en hoort u eerst wat het extra kost voordat we doorgaan.",
  },
];

const services = [
  {
    to: "/spoed-elektricien-amsterdam",
    title: "Spoed elektricien",
    icon: ZapOff,
    text: "Storing, kortsluiting of stroomuitval? 24/7 snel ter plaatse.",
  },
  {
    to: "/groepenkast-amsterdam",
    title: "Groepenkast vervangen",
    icon: Gauge,
    text: "Veilige, moderne groepenkast met extra groepen en aardlekschakelaars.",
  },
  {
    to: "/perilex-amsterdam",
    title: "Perilex aansluiten",
    icon: Plug,
    text: "Kookgroep en perilex stopcontact voor inductie en fornuis.",
  },
  {
    to: "/laadpaal-amsterdam",
    title: "Laadpaal installeren",
    icon: BatteryCharging,
    text: "Laadpaal aan huis of VvE — extra groep en netbeheerder-aanmelding inbegrepen.",
  },
  {
    to: "/stroomstoring-amsterdam",
    title: "Stroomstoring oplossen",
    icon: Zap,
    text: "Snel de oorzaak van kortsluiting en stroomuitval gevonden en verholpen.",
  },
];


export const Route = createFileRoute("/")({
  head: () => ({
    meta: pageMeta({
      title: "Elektricien Amsterdam | 24/7 spoed & installatie | VoltFix",
      description:
        "Elektricien Amsterdam voor storingen, groepenkast, perilex en laadpaal. Vaste all-in tarieven, 24/7 bereikbaar, bij spoed binnen 60 minuten.",


      path: "/",
      ogType: "website",
      ogTitle: "Elektricien in Amsterdam — 24/7 bereikbaar | VoltFix",
      ogDescription:
        `Gecertificeerde elektricien in heel Amsterdam. Vaste all-in tarieven, bij spoed binnen 60 minuten ter plaatse. Bel ${business.phoneDisplay} of app direct.`,
    }),

    links: [
      { rel: "canonical", href: absoluteUrl("/") },
      { rel: "preload", as: "image", href: heroImg.url, fetchpriority: "high" },
      ...altLinks("/"),
    ],
    scripts: [
      ldScript(faqSchema(homeFaqs, "nl", "/")),
      ldScript(ratesSchema("/")),
      ldScript(warrantySchema("/")),
      ldScript(
        imageObjectSchema({
          url: `${business.url}${amsterdamImg.url}`,
          name: "Werkgebied VoltFix elektricien Amsterdam",
          description:
            "Kaart van het werkgebied van VoltFix in Amsterdam en omstreken. De elektricien biedt 24/7 spoedservice, storingen, groepenkast vervangen, perilex aansluiten en laadpaal installatie volgens NEN 1010 in Centrum, Zuid, West, Oost, Noord, De Pijp, IJburg en omgeving.",
          caption: "Werkgebied van VoltFix in Amsterdam en omstreken",
          width: 1920,
          height: 1440,
          contentLocation: "Amsterdam",
          about: "Elektricien servicegebied Amsterdam",
        }),
      ),
    ],

  }),
  component: Home,
});

function Home() {
  const track = useTrackConversion();
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-background text-foreground">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 right-1/3 h-[520px] w-[520px] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-32 h-[520px] w-[520px] rounded-full bg-butter/50 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto grid max-w-7xl gap-6 px-4 pt-6 pb-0 sm:pt-10 lg:grid-cols-[47fr_53fr] lg:items-center lg:gap-6 lg:pt-16">
          {/* LEFT — content */}
          <div className="flex max-w-xl flex-col justify-center lg:py-10">
            {/* Urgent 24/7 badge — replaces the previous 'Elektricien in Amsterdam' chip */}
            <a
              href={telHref}
              className="gtm-cta-call inline-flex w-fit items-center gap-2 rounded-full bg-destructive px-3.5 py-1.5 text-xs font-bold text-destructive-foreground shadow-md ring-1 ring-destructive/70 sm:text-sm"
              data-gtm="cta-call"
              data-gtm-location="home-hero-urgency"
              onClick={() => track("call", "home-hero-urgency")}
              aria-label="24/7 spoed — direct bellen"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                <Zap className="h-3 w-3" fill="currentColor" />
              </span>
              24/7 Spoed — Direct Bellen
            </a>

            {/* Prominent phone link — ABOVE the fold on mobile */}
            <a
              href={telHref}
              className="gtm-cta-call mt-3 inline-flex items-center gap-3 text-3xl font-black tracking-tight text-primary sm:text-4xl"
              data-gtm="cta-call"
              data-gtm-location="home-hero-phone"
              onClick={() => track("call", "home-hero-phone")}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md sm:h-12 sm:w-12">
                <Phone className="h-5 w-5" />
              </span>
              {business.phoneDisplay}
            </a>

            <h1 className="mt-5 text-[38px] font-black leading-[1.08] tracking-tight text-balance sm:text-6xl sm:leading-[1.05] lg:text-[64px]">
              <span className="text-foreground">Elektricien in Amsterdam</span>
              <br />
              <span className="text-primary">bij spoed binnen 60 minuten</span>
              <span
                className="ml-1 inline-block h-3 w-3 translate-y-[-0.1em] rounded-full bg-butter align-baseline sm:h-4 sm:w-4 lg:h-5 lg:w-5"
                aria-hidden
              />
            </h1>

            <p className="mt-4 max-w-lg text-base font-medium text-foreground/85 sm:text-lg">
              <strong className="font-semibold text-foreground">Stroomstoring of storing?</strong> Wij
              zijn 24/7 bereikbaar voor storingen, reparaties en gepland elektrawerk — bij spoed
              binnen 60 minuten voor de deur.
            </p>


            {/* CTA trio — call / whatsapp / services */}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={telHref}
                className="gtm-cta-call inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-md transition hover:brightness-110"
                data-gtm="cta-call"
                data-gtm-location="home-hero-primary"
                onClick={() => track("call", "home-hero-primary")}
              >
                <Phone className="h-4 w-4" /> Bel direct
              </a>
              <a
                href={whatsappHref(whatsappMessageFor("/", "nl"), {
                  campaign: "/",
                  content: "home-hero-primary",
                  term: "nl",
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="gtm-cta-whatsapp inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-bold text-white shadow-md transition hover:brightness-110"
                data-gtm="cta-whatsapp"
                data-gtm-location="home-hero-primary"
                onClick={() => track("whatsapp", "home-hero-primary")}
              >
                <WhatsAppIcon className="h-4 w-4" ariaLabel="WhatsApp" /> WhatsApp
              </a>
              <a
                href="#diensten"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-butter px-5 text-sm font-bold text-foreground shadow-md transition hover:brightness-105"
              >
                Onze diensten
                <ArrowRight className="h-4 w-4" />
              </a>

            </div>

            {/* USPs — clean horizontal row on mobile, grid on desktop */}
            <ul className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm lg:mt-8 lg:grid lg:max-w-md lg:grid-cols-3 lg:gap-4">
              {[
                { icon: Clock, label: "24/7", sub: "bereikbaar", href: undefined },
                {
                  icon: ShieldCheck,
                  label: "Gecertificeerd",
                  sub: "& betrouwbaar",
                  href: "#certificeringen",
                },
                { icon: MapPin, label: "In heel", sub: "Amsterdam", href: undefined },
              ].map(({ icon: Icon, label, sub, href }) => {
                const inner = (
                  <>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm lg:h-11 lg:w-11">
                      <Icon className="h-4 w-4 lg:h-5 lg:w-5" />
                    </span>
                    <span className="leading-tight">
                      <span className="block font-semibold text-foreground">{label}</span>
                      <span className="block text-muted-foreground">{sub}</span>
                    </span>
                  </>
                );
                return (
                  <li key={label}>
                    {href ? (
                      <a
                        href={href}
                        className="flex items-center gap-2 rounded-md outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary lg:flex-col lg:items-start"
                      >
                        {inner}
                      </a>
                    ) : (
                      <span className="flex items-center gap-2 lg:flex-col lg:items-start">
                        {inner}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* RIGHT — illustration inline on mobile, contained on desktop */}
          <div className="relative -mx-4 flex items-end justify-center lg:mx-0 lg:-mr-4">
            <img
              src={heroImg.url}
              alt="VoltFix elektriciens met VW ID. Buzz servicebus voor Amsterdamse grachtenpanden"
              width={1600}
              height={900}
              loading="eager"
              fetchPriority="high"
              sizes="(min-width: 1024px) 53vw, 100vw"
              className="block h-auto w-full max-w-[560px] object-contain lg:max-w-none"
            />
          </div>
        </div>
      </section>

      {/* MOBIEL — dienst-doorkliks direct onder de hero, naast de bel-CTA */}
      <ServiceQuickLinks />

      {/* CERTIFICERINGEN — compacte trust-strip direct onder de hero */}
      <CertificationStrip />


      {/* USP BAND */}
      <div className="relative z-10 bg-butter">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <TrustRow variant="band" />
        </div>
      </div>



      {/* WAAROM VOLTFIX */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Waarom VoltFix?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Een serieuze, lokale vakman die snel reageert en eerlijk communiceert. Geen
            verrassingen, wel vakwerk.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Clock,
              title: "Snel ter plaatse",
              text: "Spoedservice 24/7. Bij storingen vaak binnen 60 minuten in Amsterdam.",
            },
            {
              icon: BadgeEuro,
              title: "Transparante tarieven",
              text: "Vaste prijsafspraak vooraf. U weet precies waar u aan toe bent.",
            },
            {
              icon: ShieldCheck,
              title: "Volgens NEN 1010",
              text: "Vakbekwaam werk volgens de NEN 1010-norm. Garantie op installatiewerk en 2 jaar fabrieksgarantie op geplaatste materialen.",
            },
            {
              icon: Wrench,
              title: "Lokaal in Amsterdam",
              text: "Bekend met de stad, de panden en de meterkasten van Amsterdam.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DIENSTEN */}
      <section id="diensten" className="scroll-mt-24 border-y border-border bg-surface">

        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Onze diensten</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Van acute storing tot complete groepenkast — alle elektra-klussen voor woning en
              bedrijf in Amsterdam.
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map(({ to, title, icon: Icon, text }) => (
              <Link
                key={to}
                to={to}
                className="group flex flex-col rounded-xl border border-border bg-background p-6 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-[var(--shadow-gold)]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{text}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Meer info
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* GEPLAND ELEKTRAWERK */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-2xl border border-border bg-surface p-8 sm:p-10">
          <h2 className="text-3xl font-bold">Geen spoed? Plan uw elektrawerk vooruit</h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Niet elke klus is een storing. Voor een verbouwing, keukenrenovatie, extra groepen of
            een complete installatie werken we met een opname vooraf, een duidelijke offerte en een
            afgesproken planning. U weet dan precies wanneer de monteur komt, hoe lang de stroom
            eruit gaat en wat het kost.
          </p>
          <p className="mt-4">
            <a
              href="/elektricien-amsterdam"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              Elektricien inhuren in Amsterdam voor gepland werk
              <ArrowRight className="h-4 w-4" />
            </a>
          </p>
        </div>
      </section>

      {/* KERNPAGINA'S — extra interne links voor SEO-crawlkracht */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <h2 className="text-xl font-bold sm:text-2xl">Populaire elektricien diensten in Amsterdam</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Kies direct de pagina die bij uw klus past. Alle pagina's worden regelmatig bijgewerkt met actuele tarieven en beschikbaarheid.
          </p>
          <ul className="mt-5 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {[
              { to: "/groepenkast-amsterdam", label: "Groepenkast vervangen in Amsterdam" },
              { to: "/perilex-amsterdam", label: "Perilex aansluiten in Amsterdam" },
              { to: "/laadpaal-amsterdam", label: "Laadpaal installeren in Amsterdam" },
              { to: "/spoed-elektricien-amsterdam", label: "Spoed elektricien in Amsterdam" },
              { to: "/stroomstoring-amsterdam", label: "Stroomstoring oplossen in Amsterdam" },
              { to: "/elektricien-amsterdam", label: "Elektricien inhuren in Amsterdam" },
            ].map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="group inline-flex items-center gap-1 font-medium text-foreground transition hover:text-primary"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {l.label}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand />


      {/* TARIEVEN / INDICATIES */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Tarieven &amp; indicaties</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Richtprijzen voor veelvoorkomende klussen. U krijgt altijd een vaste prijs vooraf,
            afgestemd op uw situatie.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              to: "/spoed-elektricien-amsterdam",
              title: "Storing (ook spoed binnen kantooruren)",
              price: firstHourAllInNl(prices.emergencyFirstHour),
              unit: allInSublabelNl,
              points: [
                "Ma–vr 08:00–18:00 — geen spoedtoeslag",
                "Vaak binnen 60 minuten ter plaatse",
                "Prijs vooraf, geen verrassingen",
              ],
            },
            {
              to: "/spoed-elektricien-amsterdam",
              title: "Avond, nacht & weekend",
              price: firstHourAllInNl(prices.offHoursFirstHour),
              unit: "na 18:00, weekend & feestdagen",
              points: [
                "Tarief dat we onze monteurs voor die uren betalen",
                "24/7 bereikbaar bij acute situaties",
                "Directe telefonische inschatting",
              ],
            },
            {
              to: "/groepenkast-amsterdam",
              title: "Groepenkast vervangen",
              price: fromNl(prices.groepenkastFrom),
              unit: "incl. materiaal* — garantie op installatiewerk",
              points: ["Aardlekschakelaars", "Extra groepen mogelijk", "NEN 1010 conform"],
              featured: true,
            },
            {
              to: "/perilex-amsterdam",
              title: "Perilex / kookgroep",
              price: fromNl(prices.perilexFrom),
              unit: "aansluiten — vaste prijs vooraf",
              points: ["Inductie & fornuis", "2- of 3-fase", "Veilig aangesloten"],
            },
          ].map((p) => {
            const Card = (
              <div
                className={`h-full rounded-xl border p-6 transition-all hover:-translate-y-1 ${
                  p.featured
                    ? "border-primary bg-card shadow-[var(--shadow-gold)]"
                    : "border-border bg-card hover:border-primary/50 hover:shadow-[var(--shadow-gold)]"
                }`}
              >
                {p.featured && (
                  <span className="mb-3 inline-block rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
                    Populair
                  </span>
                )}
                <h3 className="text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 text-3xl font-bold text-primary">{p.price}</p>
                <p className="text-xs text-muted-foreground">{p.unit}</p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" /> {pt}
                    </li>
                  ))}
                </ul>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Meer info
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            );
            return (
              <Link key={p.title} to={p.to} className="group block">
                {Card}
              </Link>
            );
          })}
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          * Indicatieve prijzen. {firstHourNoteNl} {vatConsumerNoteNl} De exacte prijs hangt af van
          uw situatie en wordt vooraf afgesproken.
        </p>

      </section>

      {/* WERKGEBIED */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-2">
          <ServiceAreaMap
            alt="Werkgebied VoltFix elektricien Amsterdam: spoed, storing, groepenkast, perilex en laadpaal in Centrum, Zuid, West, Oost, Noord, De Pijp, IJburg en omgeving"
            caption="Werkgebied van VoltFix: elektricien in heel Amsterdam en omstreken, bij spoed vaak binnen 60 minuten ter plaatse."
            previewLabel="Kaart vergroten"
          />
          <div>
            <h2 className="text-3xl font-bold">Elektricien in heel Amsterdam en omstreken</h2>
            <p className="mt-3 text-muted-foreground">
              VoltFix is uw lokale elektricien in Amsterdam. Wij werken in alle wijken — Centrum,
              Zuid, West, Oost, Noord, De Pijp, Jordaan, Oud-West, Bos en Lommer, Watergraafsmeer,
              IJburg en Zuidoost — en in de directe regio Amstelveen, Diemen, Ouder-Amstel en
              Zaandam. Bij spoed zijn we 24/7 beschikbaar en vaak binnen 60 minuten ter plaatse.
            </p>
            <ul className="mt-6 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              {serviceAreas.map((a) => (
                <li key={a} className="flex items-center gap-2 text-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <GuideLinks />
      <NeighborhoodLinks />

      <CtaBand compact title="Liever direct schakelen?" />


      {/* REVIEWS */}
      <Testimonials showFilters />

      {/* VEILIGHEID & GARANTIE */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Veiligheid &amp; garantie</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Elektra is geen ruimte voor risico's. Wij werken veilig, volgens de norm en staan
              achter ons werk.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              "Alle werkzaamheden volgens NEN 1010",
              "Garantie op uitgevoerd werk en materialen",
              "Veiligheidsinspectie van uw meterkast op verzoek",
              "Vakbekwaam personeel",
            ].map((t) => (
              <div
                key={t}
                className="flex items-start gap-3 rounded-lg border border-border bg-background p-4"
              >
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm text-foreground">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ServiceFaq faqs={homeFaqs} title="Veelgestelde vragen over een elektricien in Amsterdam" />

      <CtaBand
        title="Klaar om uw elektra-probleem op te lossen?"
        text={`Bel ${business.phoneDisplay}, stuur een WhatsApp of vraag een offerte aan. VoltFix staat voor u klaar in heel Amsterdam.`}
      />
    </>
  );
}
