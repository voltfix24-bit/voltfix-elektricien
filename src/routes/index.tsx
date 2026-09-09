import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  BatteryCharging,
  CalendarClock,
  Clock,
  Gauge,
  MapPin,
  Phone,
  PhoneCall,
  Plug,
  ShieldCheck,
  Star,
  Wrench,
  Zap,
  ZapOff,
} from "lucide-react";

import amsterdamImg from "@/assets/amsterdam-map.webp.asset.json";
import { ServiceAreaMap } from "@/components/service-area-map";

import { CertificationStrip } from "@/components/certifications";

import { CtaBand } from "@/components/cta-band";
import { NeighborhoodLinks } from "@/components/neighborhood-links";
import { ServiceFaq } from "@/components/service-faq";
import { Testimonials } from "@/components/testimonials";
import { business, serviceAreas, telHref, whatsappHref } from "@/lib/business";
import { whatsappMessageFor } from "@/lib/whatsapp-messages";
import { absoluteUrl, altLinks, faqSchema, imageObjectSchema, ldScript, pageMeta, ratesSchema, warrantySchema } from "@/lib/seo";
import { useTrackConversion } from "@/lib/analytics";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { aggregateRating } from "@/data/reviews";

import {
  allInSublabelNl,
  eurNl,
  firstHourAllInNl,
  firstHourNoteNl,
  fromNl,
  noSurprisePromiseNl,
  perHourNl,
  prices,
  vatConsumerNoteNl,
} from "@/lib/pricing";
import { GuideLinks } from "@/components/guide-links";

const HERO_PHOTO = "/images/team/hassan-monteur.jpg";

const ratingNl = aggregateRating.ratingValue.toString().replace(".", ",");

// Homepage-FAQ: vragen die álle bezoekers hebben. De uitgebreide
// stroomstoringvragen (inclusief de Liander-uitleg) staan op
// /stroomstoring-amsterdam.
const homeFaqs = [
  {
    q: "Wat kost een eerste bezoek van een elektricien in Amsterdam?",
    a: `Binnen kantooruren betaal je ${firstHourAllInNl(prices.emergencyFirstHour)} — voorrijden inbegrepen. Buiten kantooruren (avond, nacht, weekend en feestdagen) is dat ${firstHourAllInNl(prices.offHoursFirstHour)}. ${firstHourNoteNl} Loopt het uit of is er materiaal nodig? Dan stopt de monteur en hoor je eerst wat het extra kost.`,
  },
  {
    q: "Hoe snel kunnen jullie er zijn?",
    a: "Bij spoed staan we in heel Amsterdam meestal binnen 60 minuten voor de deur — 24/7, ook 's avonds, in het weekend en op feestdagen. Gepland werk plannen we in overleg, vaak al binnen 48 uur.",
  },
  {
    q: "Werken jullie ook voor VvE's en bedrijven?",
    a: "Ja. We werken voor particulieren, VvE's, horeca, winkels en kantoren in Amsterdam. Voor terugkerend onderhoud of grotere projecten maken we vooraf een opname en een duidelijke offerte.",
  },
  {
    q: "Welke garantie krijg ik op het werk?",
    a: "Je krijgt 12 maanden garantie op het werk van onze monteurs en 2 jaar fabrieksgarantie op geplaatste materialen. Alle werkzaamheden voldoen aan de NEN 1010-norm.",
  },
  {
    q: "Kan ik bij de monteur pinnen?",
    a: "Ja, je kunt ter plekke pinnen. Liever achteraf per factuur? Ook dat kan — geef het even door aan de monteur, dan sturen we de factuur per e-mail.",
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
  {
    to: "/elektricien-amsterdam",
    title: "Elektricien inhuren",
    icon: Wrench,
    text: "Gepland werk: verbouwing, extra groepen of een complete installatie.",
  },
];

const fixedJobs = [
  {
    to: "/groepenkast-amsterdam",
    title: "Groepenkast vervangen",
    price: fromNl(prices.groepenkastFrom),
    unit: "incl. materiaal — garantie op installatiewerk",
    points: ["Aardlekschakelaars", "Extra groepen mogelijk", "NEN 1010 conform"],
  },
  {
    to: "/perilex-amsterdam",
    title: "Perilex / kookgroep",
    price: fromNl(prices.perilexFrom),
    unit: "aansluiten — vaste prijs vooraf",
    points: ["Inductie & fornuis", "2- of 3-fase", "Veilig aangesloten"],
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
      ogTitle: "Elektricien Amsterdam — 24/7 bereikbaar | VoltFix",
      ogDescription:
        `Gecertificeerde elektricien in heel Amsterdam. Vaste all-in tarieven, bij spoed binnen 60 minuten ter plaatse. Bel ${business.phoneDisplay} of app direct.`,
    }),

    links: [
      { rel: "canonical", href: absoluteUrl("/") },
      { rel: "preload", as: "image", href: HERO_PHOTO, fetchpriority: "high" },
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

function StarRating({ className }: { className?: string }) {
  return (
    <span className={`flex gap-0.5 text-primary ${className ?? ""}`} aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-current" />
      ))}
    </span>
  );
}

function RatePanel() {
  const [evening, setEvening] = useState(false);
  const amount = evening ? prices.offHoursFirstHour : prices.emergencyFirstHour;
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-lg font-semibold">Uurtarief &amp; storingen</h3>
      <div className="mt-4 inline-flex rounded-full border border-border bg-background p-1 text-xs font-bold">
        {[
          { key: false, label: "Ma–vr 08:00–18:00" },
          { key: true, label: "Avond, weekend & feestdag" },
        ].map((opt) => (
          <button
            key={String(opt.key)}
            type="button"
            aria-pressed={evening === opt.key}
            onClick={() => setEvening(opt.key)}
            className={
              "rounded-full px-3 py-1.5 transition " +
              (evening === opt.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            {opt.label}
          </button>
        ))}
      </div>
      <p className="mt-4 text-4xl font-bold text-primary">{firstHourAllInNl(amount)}</p>
      <p className="text-xs text-muted-foreground">{allInSublabelNl}</p>
      <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
        <li className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" /> {firstHourNoteNl}
        </li>
        <li className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" /> Regulier uurtarief{" "}
          {perHourNl(prices.hourly)} voor gepland werk
        </li>
        <li className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" /> Avondtoeslag{" "}
          {eurNl(prices.eveningSurcharge)} op het eerste uur
        </li>
      </ul>
      <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-foreground">
        <StarRating />
        {ratingNl} uit {aggregateRating.reviewCount} Google-reviews
      </p>
    </div>
  );
}

function Home() {
  const track = useTrackConversion();
  const yearsActive = new Date().getFullYear() - Number(business.foundingDate);
  return (
    <>
      {/* 01 — HERO met bewijs */}
      <section className="relative overflow-hidden bg-background text-foreground">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 right-1/3 h-[520px] w-[520px] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-32 h-[520px] w-[520px] rounded-full bg-butter/50 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto grid max-w-7xl gap-8 px-4 pb-10 pt-6 sm:pt-10 lg:grid-cols-[55fr_45fr] lg:items-center lg:pt-16">
          <div className="flex max-w-xl flex-col justify-center">
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

            <h1 className="mt-5 text-[38px] font-black leading-[1.08] tracking-tight text-balance sm:text-6xl sm:leading-[1.05] lg:text-[60px]">
              <span className="text-foreground">Storing in Amsterdam?</span>
              <br />
              <span className="text-primary">Binnen 60 minuten voor de deur.</span>
            </h1>

            <p className="mt-4 max-w-lg text-base font-medium text-foreground/85 sm:text-lg">
              Je belt, je krijgt meteen een monteur aan de lijn en hoort vooraf wat het kost.
              Ook voor gepland elektrawerk in heel Amsterdam.
            </p>

            {/* Bellen dominant, WhatsApp secundair, diensten als tekstlink */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={telHref}
                className="gtm-cta-call inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-primary px-6 text-base font-black text-primary-foreground shadow-lg transition hover:brightness-110 sm:text-lg"
                data-gtm="cta-call"
                data-gtm-location="home-hero-primary"
                onClick={() => track("call", "home-hero-primary")}
              >
                <Phone className="h-5 w-5" /> Bel {business.phoneDisplay}
              </a>
              <a
                href={whatsappHref(whatsappMessageFor("/", "nl"), {
                  campaign: "/",
                  content: "home-hero-primary",
                  term: "nl",
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="gtm-cta-whatsapp inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-whatsapp bg-background px-5 text-sm font-bold text-whatsapp transition hover:bg-whatsapp/10"
                data-gtm="cta-whatsapp"
                data-gtm-location="home-hero-primary"
                onClick={() => track("whatsapp", "home-hero-primary")}
              >
                <WhatsAppIcon className="h-4 w-4" ariaLabel="WhatsApp" /> WhatsApp
              </a>
            </div>

            {/* Bewijs direct onder de knoppen */}
            <p className="mt-4 flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
              <StarRating />
              {ratingNl} uit {aggregateRating.reviewCount} Google-reviews
              <a href="#reviews" className="font-medium text-primary underline underline-offset-4">
                lees de reviews
              </a>
            </p>

            <ul className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
              {[
                { icon: Clock, label: "24/7", sub: "bereikbaar" },
                { icon: MapPin, label: `${yearsActive} jaar`, sub: "actief in Amsterdam" },
                { icon: ShieldCheck, label: "NEN 1010", sub: "en 12 mnd garantie" },
              ].map(({ icon: Icon, label, sub }) => (
                <li key={label} className="flex items-center gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="leading-tight">
                    <span className="block font-semibold text-foreground">{label}</span>
                    <span className="block text-muted-foreground">{sub}</span>
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-5 text-sm">
              <a
                href="#diensten"
                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
              >
                Bekijk onze diensten
                <ArrowRight className="h-4 w-4" />
              </a>
            </p>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <img
              src={HERO_PHOTO}
              alt="Hassan, gecertificeerd elektricien bij VoltFix in Amsterdam"
              width={1024}
              height={1024}
              loading="eager"
              fetchPriority="high"
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="block aspect-square w-full max-w-[460px] rounded-3xl object-cover shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* 02 — SPOED NÚ / KLUS PLANNEN */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-5xl gap-4 px-4 py-10 sm:grid-cols-2">
          <div className="flex flex-col rounded-2xl border-2 border-destructive/30 bg-background p-6 shadow-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
              <PhoneCall className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-xl font-bold">Ik heb nu een storing</h2>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">
              Geen stroom, kortsluiting of een groep die eruit vliegt? Bel of app — je krijgt
              meteen een inschatting en bij spoed staan we binnen 60 minuten voor de deur.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <a
                href={telHref}
                className="gtm-cta-call inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-destructive px-4 text-sm font-bold text-destructive-foreground shadow-sm transition hover:brightness-110"
                data-gtm="cta-call"
                data-gtm-location="home-split-urgent"
                onClick={() => track("call", "home-split-urgent")}
              >
                <Phone className="h-4 w-4" /> Bel direct
              </a>
              <a
                href={whatsappHref(whatsappMessageFor("/", "nl"), {
                  campaign: "/",
                  content: "home-split-urgent",
                  term: "nl",
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="gtm-cta-whatsapp inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-whatsapp bg-background px-4 text-sm font-bold text-whatsapp transition hover:bg-whatsapp/10"
                data-gtm="cta-whatsapp"
                data-gtm-location="home-split-urgent"
                onClick={() => track("whatsapp", "home-split-urgent")}
              >
                <WhatsAppIcon className="h-4 w-4" ariaLabel="WhatsApp" /> WhatsApp
              </a>
            </div>
          </div>

          <div className="flex flex-col rounded-2xl border-2 border-primary/30 bg-background p-6 shadow-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <CalendarClock className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-xl font-bold">Ik wil een klus plannen</h2>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">
              Groepenkast, perilex, laadpaal of een verbouwing? Geef je voorkeurstijd door — we
              bevestigen persoonlijk en werken met een vaste prijs vooraf.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <a
                href="#installatiemoment"
                className="gtm-cta-schedule inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm transition hover:brightness-110"
                data-gtm="cta-schedule"
                data-gtm-location="home-split-plan"
                onClick={() => track("schedule", "home-split-plan")}
              >
                <CalendarClock className="h-4 w-4" /> Vraag een tijd aan
              </a>
              <Link
                to="/elektricien-amsterdam"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-primary bg-background px-4 text-sm font-bold text-primary transition hover:bg-primary/5"
              >
                Gepland werk
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 03 — WAT GEBEURT ER NA JE TELEFOONTJE */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Wat gebeurt er nadat je belt?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Geen wachten op een offerte per post. In drie stappen weet je waar je aan toe bent.
          </p>
        </div>
        <ol className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Je belt of appt",
              text: "Binnen enkele minuten krijg je een telefonische inschatting van de oorzaak, de tijd en de kosten.",
            },
            {
              title: "De monteur komt kijken",
              text: "Hij bekijkt de situatie ter plekke en geeft de vaste prijs vóór hij begint. Akkoord? Dan pas gaan we aan de slag.",
            },
            {
              title: "Klaar, getest en op papier",
              text: "Het werk wordt getest en opgeleverd volgens NEN 1010, met garantie en een duidelijke factuur.",
            },
          ].map((s, i) => (
            <li key={s.title} className="rounded-xl border border-border bg-card p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-base font-black text-primary-foreground">
                {i + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 04 — TARIEVEN */}
      <section id="tarieven" className="scroll-mt-24 border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Tarieven</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Je krijgt altijd een vaste prijs vooraf, afgestemd op jouw situatie.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <RatePanel />
            <div className="grid gap-4 sm:grid-cols-2">
              {fixedJobs.map((p) => (
                <Link key={p.title} to={p.to} className="group block">
                  <div className="h-full rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-[var(--shadow-gold)]">
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
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border-2 border-primary/30 bg-background p-6">
            <h3 className="text-lg font-bold">{noSurprisePromiseNl.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Duurt het langer of is er materiaal nodig? Dan stopt de monteur en hoor je eerst het
              bedrag. Pas daarna gaan we door.
            </p>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Indicatieve prijzen. {vatConsumerNoteNl} De exacte prijs hangt af van je situatie en
            wordt vooraf afgesproken.
          </p>
        </div>
      </section>

      {/* 05 — REVIEWS */}
      <div id="reviews" className="scroll-mt-24">
        <Testimonials showFilters />
      </div>

      {/* 06 — DIENSTEN (één keer) */}
      <section id="diensten" className="scroll-mt-24 border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Onze diensten</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Van acute storing tot complete groepenkast — alle elektra-klussen voor woning en
              bedrijf in Amsterdam.
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* 07 — WERKGEBIED */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <ServiceAreaMap
            alt="Werkgebied VoltFix elektricien Amsterdam: spoed, storing, groepenkast, perilex en laadpaal in Centrum, Zuid, West, Oost, Noord, De Pijp, IJburg en omgeving"
            caption="Werkgebied van VoltFix: elektricien in heel Amsterdam en omstreken, bij spoed vaak binnen 60 minuten ter plaatse."
            previewLabel="Kaart vergroten"
          />
          <div>
            <h2 className="text-3xl font-bold">Elektricien in heel Amsterdam en omstreken</h2>
            <p className="mt-3 text-muted-foreground">
              VoltFix is je lokale elektricien in Amsterdam. We werken in alle wijken — Centrum,
              Zuid, West, Oost, Noord, De Pijp, Jordaan, Oud-West, Bos en Lommer, Watergraafsmeer,
              IJburg en Zuidoost — en in de directe regio Amstelveen, Diemen, Ouder-Amstel en
              Zaandam.
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

      {/* 08 — VEILIGHEID, GARANTIE & CERTIFICERINGEN */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-4xl px-4 pt-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Veiligheid, garantie &amp; certificeringen</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Elektra is geen ruimte voor risico's. We werken veilig, volgens de norm en staan
              achter ons werk.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              "Alle werkzaamheden volgens NEN 1010",
              "12 maanden garantie op het werk, 2 jaar op materialen",
              "Veiligheidsinspectie van je meterkast op verzoek",
              "Vakbekwame, VCA VOL-gecertificeerde monteurs",
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
        <CertificationStrip />
      </section>

      {/* 09 — FAQ + één slot-CTA */}
      <ServiceFaq faqs={homeFaqs} title="Veelgestelde vragen over een elektricien in Amsterdam" />

      <CtaBand
        title="Klaar om je elektra-probleem op te lossen?"
        text={`Bel ${business.phoneDisplay}, stuur een WhatsApp of vraag een tijd aan. VoltFix staat voor je klaar in heel Amsterdam.`}
      />
    </>
  );
}
