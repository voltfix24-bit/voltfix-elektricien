import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeEuro,
  Clock,
  Gauge,
  Phone,
  Plug,
  ShieldCheck,
  Wrench,
  Zap,
  ZapOff,
} from "lucide-react";

import heroImg from "@/assets/hero-electrician.jpg";
import amsterdamImg from "@/assets/amsterdam-homes.jpg";
import { CtaButtons } from "@/components/cta-buttons";
import { CtaBand } from "@/components/cta-band";
import { ServiceFaq } from "@/components/service-faq";
import { Testimonials } from "@/components/testimonials";
import { TrustRow } from "@/components/trust-row";
import { business, serviceAreas, telHref } from "@/lib/business";
import { faqSchema, ldScript, ogImage } from "@/lib/seo";

const homeFaqs = [
  {
    q: "Hoe snel kan VoltFix bij mij in Amsterdam zijn?",
    a: "Bij spoed zoals een stroomstoring of kortsluiting zijn we vaak binnen 30 tot 60 minuten ter plaatse in Amsterdam. Voor geplande klussen plannen we meestal binnen enkele werkdagen een afspraak in.",
  },
  {
    q: "Werken jullie ook 's avonds en in het weekend?",
    a: "Ja. Onze spoedservice is 24/7 bereikbaar, ook in de avond, het weekend en op feestdagen. Bel gerust voor de actuele beschikbaarheid.",
  },
  {
    q: "Wat kost een elektricien in Amsterdam?",
    a: "Wij werken met transparante tarieven en een vaste prijsafspraak vooraf. Voorrijkosten en uurtarief bespreken we direct, zodat u nooit voor verrassingen komt te staan.",
  },
  {
    q: "Zijn jullie gecertificeerd en geven jullie garantie?",
    a: "Onze monteurs zijn vakbekwaam en werken volgens de NEN 1010-norm. Op uitgevoerd werk en geplaatste materialen geven wij garantie.",
  },
  {
    q: "In welke delen van Amsterdam werken jullie?",
    a: "We werken in heel Amsterdam en directe omgeving, waaronder Centrum, Zuid, West, Oost, Noord, De Pijp, Jordaan en IJburg.",
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
    to: "/groepenkast-vervangen-amsterdam",
    title: "Groepenkast vervangen",
    icon: Gauge,
    text: "Veilige, moderne groepenkast met extra groepen en aardlekschakelaars.",
  },
  {
    to: "/perilex-aansluiten-amsterdam",
    title: "Perilex aansluiten",
    icon: Plug,
    text: "Kookgroep en perilex stopcontact voor inductie en fornuis.",
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
    meta: [
      { title: "Elektricien Amsterdam | VoltFix" },
      {
        name: "description",
        content:
          "Elektricien in Amsterdam nodig? VoltFix is snel, lokaal en 24/7 bereikbaar voor spoed, groepenkast en perilex. Bel direct voor een vaste prijs.",
      },
      { property: "og:title", content: "Elektricien Amsterdam | VoltFix" },
      {
        property: "og:description",
        content:
          "Snel, betrouwbaar en lokaal. 24/7 spoed elektricien in heel Amsterdam.",
      },
      { property: "og:url", content: "/" },
      { property: "og:image", content: ogImage },
      { name: "twitter:image", content: ogImage },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [ldScript(faqSchema(homeFaqs))],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-grid opacity-40" aria-hidden />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Clock className="h-3.5 w-3.5" /> 24/7 spoedservice in Amsterdam
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] text-balance sm:text-5xl lg:text-6xl">
              Elektricien Amsterdam
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              Snel, betrouwbaar en lokaal. VoltFix helpt u bij storingen,
              groepenkasten, perilex en alle elektra in huis of bedrijf — met
              een vaste prijs vooraf.
            </p>

            <div className="mt-7">
              <CtaButtons location="home-hero" />
            </div>

            <a
              href={telHref}
              className="gtm-cta-call mt-5 inline-flex items-center gap-3 text-2xl font-bold text-foreground"
              data-gtm="cta-call"
              data-gtm-location="home-hero"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Phone className="h-5 w-5" />
              </span>
              {business.phoneDisplay}
            </a>


            <div className="mt-8">
              <TrustRow />
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-border shadow-[var(--shadow-elegant)]">
              <img
                src={heroImg}
                alt="VoltFix elektricien aan het werk aan een groepenkast in een woning in Amsterdam"
                width={1920}
                height={1080}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 hidden rounded-xl border border-primary/30 bg-card px-4 py-3 shadow-[var(--shadow-gold)] sm:block">
              <p className="text-sm font-semibold">Vaak in 30–60 min ter plaatse</p>
              <p className="text-xs text-muted-foreground">bij spoed in Amsterdam</p>
            </div>
          </div>
        </div>
      </section>

      {/* WAAROM VOLTFIX */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Waarom VoltFix?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Een serieuze, lokale vakman die snel reageert en eerlijk
            communiceert. Geen verrassingen, wel vakwerk.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Clock,
              title: "Snel ter plaatse",
              text: "Spoedservice 24/7. Bij storingen vaak binnen het uur in Amsterdam.",
            },
            {
              icon: BadgeEuro,
              title: "Transparante tarieven",
              text: "Vaste prijsafspraak vooraf. U weet precies waar u aan toe bent.",
            },
            {
              icon: ShieldCheck,
              title: "Gecertificeerd",
              text: "Vakbekwaam, volgens NEN 1010. Garantie op werk en materialen.",
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
      <section className="border-y border-border bg-card/50">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Onze diensten</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Van acute storing tot complete groepenkast — alle elektra-klussen
              voor woning en bedrijf in Amsterdam.
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

      <CtaBand />

      {/* TARIEVEN / INDICATIES */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Tarieven &amp; indicaties</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Richtprijzen voor veelvoorkomende klussen. U krijgt altijd een vaste
            prijs vooraf, afgestemd op uw situatie.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Spoed / storing",
              price: "vanaf € 95",
              unit: "voorrijden + diagnose",
              points: ["24/7 beschikbaar", "Snel ter plaatse", "Direct duidelijkheid"],
            },
            {
              title: "Groepenkast vervangen",
              price: "vanaf € 650",
              unit: "incl. materiaal*",
              points: ["Aardlekschakelaars", "Extra groepen mogelijk", "NEN 1010 conform"],
              featured: true,
            },
            {
              title: "Perilex / kookgroep",
              price: "vanaf € 175",
              unit: "aansluiten",
              points: ["Inductie & fornuis", "2- of 3-fase", "Veilig aangesloten"],
            },
          ].map((p) => (
            <div
              key={p.title}
              className={`rounded-xl border p-6 ${
                p.featured
                  ? "border-primary bg-card shadow-[var(--shadow-gold)]"
                  : "border-border bg-card"
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
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          * Indicatieve prijzen incl. btw. De exacte prijs hangt af van uw
          situatie en wordt vooraf afgesproken.
        </p>
      </section>

      {/* WERKGEBIED */}
      <section className="border-y border-border bg-card/50">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-border">
            <img
              src={amsterdamImg}
              alt="Amsterdamse grachtenpanden waar VoltFix als lokale elektricien werkt"
              width={1920}
              height={1080}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold">Werkgebied Amsterdam</h2>
            <p className="mt-3 text-muted-foreground">
              VoltFix werkt in heel Amsterdam en directe omgeving. Of u nu in een
              grachtenpand in het Centrum woont of een appartement op IJburg
              heeft — wij kennen de stad en zijn snel bij u.
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

      <CtaBand compact title="Liever direct schakelen?" />

      {/* REVIEWS */}
      <Testimonials />


      {/* VEILIGHEID & GARANTIE */}
      <section className="border-y border-border bg-card/50">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Veiligheid &amp; garantie</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Elektra is geen ruimte voor risico's. Wij werken veilig, volgens de
              norm en staan achter ons werk.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              "Alle werkzaamheden volgens NEN 1010",
              "Garantie op uitgevoerd werk en materialen",
              "Veiligheidsinspectie van uw meterkast op verzoek",
              "Verzekerd en vakbekwaam personeel",
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
