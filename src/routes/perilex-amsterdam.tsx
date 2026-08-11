import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  CalendarClock,
  MapPin,
  Phone,
  Wrench,
  Zap,
} from "lucide-react";


import heroImg from "@/assets/voltfix-perilex-hero.webp.asset.json";
import { CtaBand } from "@/components/cta-band";
import { DiyVsPro } from "@/components/diy-vs-pro";
import { PerilexPriceSection } from "@/components/perilex-price-section";
import { Prose } from "@/components/prose";
import { RelatedServices } from "@/components/related-services";
import { ServiceFaq } from "@/components/service-faq";
import { Testimonials } from "@/components/testimonials";
import { TrustStrip } from "@/components/trust-strip";
import PerilexMeasureGuide from "@/components/perilex/PerilexMeasureGuide";
import { PerilexWizardCta } from "@/components/perilex-wizard-toggle";
import { ScheduleDisclosure } from "@/components/schedule-disclosure";
import { SchedulePicker } from "@/components/schedule-picker";
import { business, telHref, whatsappHref } from "@/lib/business";
import { useTrackConversion } from "@/lib/analytics";
import { eurNl, prices } from "@/lib/pricing";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { NeighborhoodLinks } from "@/components/neighborhood-links";

import {
  absoluteUrl,
  altLinks,
  breadcrumbSchema,
  faqSchema,
  ldScript,
  pageMeta,
  serviceSchema,
} from "@/lib/seo";
import { priceProcessFaqs } from "@/data/service-faqs";

const path = "/perilex-amsterdam";
const whatsappMessage =
  "Hallo VoltFix, ik wil een perilex / kookgroep laten aansluiten in Amsterdam.";

const LAST_UPDATED_ISO = "2026-07-26";
const LAST_UPDATED_NL = new Date(LAST_UPDATED_ISO).toLocaleDateString("nl-NL", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const faqs = [
  {
    q: "Wat kost het aansluiten van een perilex in Amsterdam?",
    a: `Een perilex stopcontact op een bestaande groep kost ${eurNl(prices.perilexFrom)} all-in, vaste prijs vooraf. Moet er een aparte kookgroep bij in de meterkast, dan kost het ${eurNl(prices.perilexWithNewGroupFrom)} all-in. Inclusief btw, materiaal en garantie op arbeid.`,
  },
  {
    q: "Wat is het verschil tussen 2-fase en 3-fase?",
    a: "Een gewone perilex (krachtstroom) gebruikt vaak 2 fasen voor zwaardere apparaten. Bij 3-fase wordt de belasting over drie fasen verdeeld, wat nodig kan zijn voor zware inductiekookplaten of fornuizen. Wij adviseren wat voor uw apparaat en woning nodig is.",
  },
  {
    q: "Heb ik een perilex nodig voor mijn inductiekookplaat?",
    a: "Veel inductiekookplaten hebben een eigen kookgroep of perilexaansluiting nodig vanwege het hoge vermogen. Controleer het aansluitvermogen van uw kookplaat; wij kijken graag mee welke aansluiting nodig is.",
  },
  {
    q: "Kan ik een gewoon stopcontact gebruiken voor inductie?",
    a: "Lichtere inductieplaten werken soms op een gewone groep, maar krachtigere modellen vereisen een aparte kookgroep of perilex om overbelasting en doorslaan van de groep te voorkomen.",
  },
  {
    q: "Moet er een extra groep in de meterkast komen?",
    a: "Vaak wel. Een kookgroep krijgt idealiter een eigen groep in de groepenkast. Als er geen ruimte is, kunnen we de groepenkast uitbreiden of aanpassen.",
  },
  {
    q: "Hoe lang duurt het aansluiten van een perilex?",
    a: "In de meeste gevallen is het binnen één tot twee uur geregeld. Als er bekabeling getrokken moet worden naar de meterkast, kan het iets langer duren.",
  },
  {
    q: "Sluiten jullie ook fornuizen en ovens aan?",
    a: "Ja, we sluiten inductiekookplaten, keramische platen, elektrische fornuizen en ovens veilig aan op de juiste groep en aansluiting in Amsterdam.",
  },
  ...priceProcessFaqs.nl.perilex,
];

export const Route = createFileRoute("/perilex-amsterdam")({
  head: () => ({
    meta: pageMeta({
      title: `Perilex aansluiten Amsterdam — ${eurNl(prices.perilexFrom)} all-in`,
      description: `Perilex of kookgroep aansluiten in Amsterdam vanaf ${eurNl(prices.perilexFrom)} all-in — vaste prijs vooraf. ⭐ 4,9 uit 56 reviews. Bel ${business.phoneDisplay}.`,
      path,
      ogTitle: `Perilex aansluiten Amsterdam vanaf ${eurNl(prices.perilexFrom)} all-in`,
      ogDescription:
        "Vaste prijs vooraf, erkend elektricien, vaak dezelfde week geplaatst. Inductie, fornuis of krachtstroom veilig aangesloten.",
      ogType: "article",
    }),
    links: [{ rel: "canonical", href: absoluteUrl(path) }, { rel: "preload", as: "image", href: heroImg.url, fetchpriority: "high" }, ...altLinks(path)],
    scripts: [
      ldScript(
        serviceSchema({
          name: "Perilex aansluiten Amsterdam",
          description:
            "Aansluiten van perilex stopcontacten en kookgroepen voor inductie en fornuis in Amsterdam, 2-fase en 3-fase.",
          path,
        }),
      ),
      ldScript(faqSchema(faqs)),
      ldScript(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Perilex aansluiten Amsterdam", path },
        ]),
      ),
    ],
  }),
  component: Page,
});


const bandItems = [
  { icon: MapPin, label: "Lokaal in Amsterdam" },
  { icon: Zap, label: "Snelle service" },
  { icon: BadgeCheck, label: "Transparante tarieven" },
  { icon: Wrench, label: "Vakkundig werk" },
];

function Page() {
  const track = useTrackConversion();

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-surface text-foreground">
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

        <div className="relative mx-auto grid max-w-7xl items-center gap-6 px-4 py-8 lg:grid-cols-[48fr_52fr] lg:py-10">
          <div className="relative z-10 flex max-w-xl flex-col">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-butter/80 px-3 py-1 text-xs font-bold text-butter-foreground shadow-sm ring-1 ring-butter">
              <span aria-hidden>★</span> 4,9 · 56 Google reviews
            </span>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 font-bold text-primary-foreground">
                {eurNl(prices.perilexFrom)} all-in, vaste prijs vooraf
              </span>
            </div>

            <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-[56px]">
              Perilex aansluiten in Amsterdam
              <span className="block text-primary">Vaste prijs vooraf, vandaag geregeld.</span>
            </h1>

            <p className="mt-4 max-w-md text-base leading-relaxed text-foreground/80 sm:text-lg">
              Veilig aansluiten van perilex stopcontacten, stekkers en kookplaten in Amsterdam.
              Gecertificeerd, met garantie op arbeid.
            </p>

            <a
              href={telHref}
              className="gtm-cta-call mt-5 inline-flex items-center gap-2 text-xl font-bold tracking-tight text-primary sm:text-2xl"
              data-gtm="cta-call"
              data-gtm-location="perilex-hero-phone"
              onClick={() => track("call", "perilex-hero-phone")}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                <Phone className="h-4 w-4" />
              </span>
              {business.phoneDisplay}
            </a>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <a
                href={telHref}
                className="gtm-cta-call inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-destructive px-5 text-sm font-bold text-destructive-foreground shadow-md transition hover:brightness-110 sm:flex-none"
                data-gtm="cta-call"
                data-gtm-location="perilex-hero"
                onClick={() => track("call", "perilex-hero")}
              >
                <Phone className="h-4 w-4" /> Bel direct
              </a>
              <a
                href={whatsappHref(whatsappMessage, {
                  campaign: "/perilex-amsterdam",
                  content: "perilex-hero",
                  term: "nl",
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="gtm-cta-whatsapp inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-whatsapp px-5 text-sm font-bold text-whatsapp-foreground shadow-md transition hover:brightness-110 sm:flex-none"
                data-gtm="cta-whatsapp"
                data-gtm-location="perilex-hero"
                onClick={() => track("whatsapp", "perilex-hero")}
              >
                <WhatsAppIcon className="h-4 w-4" ariaLabel="WhatsApp" /> WhatsApp · reactie binnen 60 min
              </a>
            </div>

            <a
              href="#installatiemoment"
              className="gtm-cta-schedule mt-3 inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-primary bg-background px-5 text-sm font-bold text-primary shadow-sm transition hover:bg-primary hover:text-primary-foreground sm:w-fit"
              data-gtm="cta-schedule"
              data-gtm-location="perilex-hero"
              onClick={() => track("schedule", "perilex-hero")}
            >
              <CalendarClock className="h-4 w-4" /> Plan direct je afspraak
            </a>
          </div>

          <div className="relative flex items-center justify-center lg:justify-end">
            <img
              src={heroImg.url}
              alt="Twee VoltFix monteurs sluiten een Perilex aan voor een inductiekookplaat in een Amsterdamse keuken"
              width={1600}
              height={1200}
              className="h-auto w-full max-w-[520px] rounded-2xl object-contain shadow-[var(--shadow-elegant)] lg:max-w-[560px]"
            loading="eager"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </div>
        </div>
      </section>

      {/* USP BAND */}
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

      {/* TRUST STRIP */}
      <TrustStrip lang="nl" />

      {/* CONTENT */}
      <article className="mx-auto max-w-3xl px-4 py-14">
        {/* ANTWOORDBLOK — feitelijk, citeerbaar */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Wat kost een perilex aansluiten in Amsterdam?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-foreground/85 sm:text-lg">
            Het aansluiten van een perilex stopcontact op een bestaande groep kost{" "}
            {eurNl(prices.perilexFrom)} all-in. Moet er een aparte kookgroep bij in de meterkast,
            dan kost het {eurNl(prices.perilexWithNewGroupFrom)} all-in. Beide prijzen zijn
            inclusief btw, materiaal en garantie op arbeid, en je krijgt ze vóórdat we beginnen.
            De klus duurt meestal 1 tot 2 uur. VoltFix werkt in heel Amsterdam, inclusief Noord,
            Oost, West, Zuid, De Pijp en Centrum.
          </p>
          <p className="mt-3 text-sm">
            <a
              href="#installatiemoment"
              className="font-medium text-primary underline underline-offset-4"
            >
              Bekijk vrije installatiemomenten →
            </a>
          </p>
        </section>

        {/* VERMOGENSTABEL */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Welke aansluiting heb je nodig?
          </h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Aansluitvermogen kookplaat</th>
                  <th className="px-4 py-3 font-semibold">Benodigde aansluiting</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-3">tot 3,7 kW</td>
                  <td className="px-4 py-3">Eigen kookgroep 230 V, 16 A</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">3,7 – 7,4 kW</td>
                  <td className="px-4 py-3">Perilex 2-fase, 400 V</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">7,4 – 11 kW</td>
                  <td className="px-4 py-3">Perilex 3-fase, 400 V</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">meer dan 11 kW of fornuis met oven</td>
                  <td className="px-4 py-3">Perilex 3-fase + eigen groep in de meterkast</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Indicatie. Volg altijd het typeplaatje en het aansluitschema van de fabrikant — wij
            controleren dit bij je thuis.
          </p>
        </section>

        {/* CALLBACK / CTA naar wizard-route */}
        <div className="my-10">
          <PerilexWizardCta href="#perilex-diy" />
        </div>

        <Prose>
          <p>
            Wie in Amsterdam overstapt van gas op inductie of een nieuw fornuis plaatst, krijgt al
            snel te maken met de vraag: welke aansluiting heb ik nodig? Krachtige kooktoestellen
            vragen meer stroom dan een gewoon stopcontact veilig kan leveren. Daarom is een{" "}
            <strong>perilex aansluiting of aparte kookgroep</strong> vaak noodzakelijk. Als{" "}
            <Link to="/elektricien-amsterdam" className="font-medium text-primary underline underline-offset-4">
              gecertificeerde elektricien in Amsterdam
            </Link>{" "}
            installeert VoltFix deze veilig en vakkundig, zodat u zorgeloos kunt koken.
          </p>

          <h2>Wat is een perilex aansluiting?</h2>
          <p>
            Een perilex is een vijfpolige stekker-en-contactdoos die bedoeld is voor apparaten met
            een hoog vermogen, zoals elektrische fornuizen en zware inductiekookplaten. Een perilex
            kan meerdere fasen tegelijk gebruiken, waardoor er veel meer vermogen beschikbaar is dan
            via een standaard wandcontactdoos. Voor inductiekoken is dat belangrijk: meerdere
            kookzones tegelijk op vol vermogen trekken eenvoudig 7.000 watt of meer.
          </p>

          <h2>Kookgroep of perilex — wat heeft u nodig?</h2>
          <p>
            Niet elke inductiekookplaat heeft dezelfde aansluiting nodig. Het hangt af van het
            aansluitvermogen dat de fabrikant voorschrijft:
          </p>
          <ul>
            <li>
              <strong>Lichte inductieplaat:</strong> werkt soms op een eigen kookgroep (gewone 230V
              groep, zwaarder uitgevoerd).
            </li>
            <li>
              <strong>Zwaardere inductieplaat:</strong> vraagt vaak om een perilex met 2 fasen.
            </li>
            <li>
              <strong>Krachtig fornuis of grote kookplaat:</strong> kan een 3-fase aansluiting nodig
              hebben.
            </li>
          </ul>

          <h2>2-fase en 3-fase uitgelegd</h2>
          <p>
            In veel Amsterdamse woningen komt 1-fase stroom binnen, maar zwaardere apparaten vragen
            om een verdeling over meerdere fasen. <strong>Bij 2-fase</strong> wordt het vermogen
            over twee fasen verdeeld, wat genoeg is voor de meeste inductiekookplaten.{" "}
            <strong>Bij 3-fase</strong> (ook wel krachtstroom) wordt de belasting over drie fasen
            gespreid, ideaal voor zeer krachtige toestellen of meerdere zware apparaten.
          </p>

          <h2>Waarom dit in Amsterdam vaak speelt</h2>
          <p>
            Veel vooroorlogse woningen in <strong>Oost, West en De Pijp</strong> hebben nog een
            1-fase invoer of een volle groepenkast. Een nieuwe kookgroep of perilex vraagt daar
            vaak om uitbreiding of vervanging van de meterkast. Wij combineren dit in één bezoek —
            bekijk ook onze pagina over{" "}
            <Link to="/groepenkast-amsterdam" className="font-medium text-primary underline underline-offset-4">
              groepenkast vervangen in Amsterdam
            </Link>
            .
          </p>

          <h2>Zo gaan wij te werk</h2>
          <ul>
            <li>We controleren uw groepenkast en de beschikbare ruimte voor een groep.</li>
            <li>Indien nodig plaatsen we een nieuwe, zwaardere kookgroep bij.</li>
            <li>We trekken de juiste bekabeling naar de keuken.</li>
            <li>We monteren het perilex stopcontact of de vaste aansluiting.</li>
            <li>We sluiten uw kookplaat of fornuis aan en testen alles door.</li>
          </ul>

          <h2>Veilig koken zonder zorgen</h2>
          <p>
            Een verkeerd aangesloten kookplaat kan zorgen voor oververhitting, doorslaande groepen
            of in het ergste geval brand. Door de aansluiting door een vakkundige elektricien te
            laten verzorgen, weet u zeker dat alles volgens de NEN 1010-norm is uitgevoerd. Slaat
            er tijdens het koken toch een groep door? Onze{" "}
            <Link to="/spoed-elektricien-amsterdam" className="font-medium text-primary underline underline-offset-4">
              spoed elektricien in Amsterdam
            </Link>{" "}
            staat 24/7 klaar. VoltFix levert het werk veilig op en geeft garantie — u kunt direct
            een{" "}
            <a href="#installatiemoment" className="font-medium text-primary underline underline-offset-4">
              afspraak inplannen voor uw perilex aansluiting
            </a>{" "}
            met vaste prijs vooraf.
          </p>

          <p className="text-sm text-muted-foreground">
            Laatst bijgewerkt: <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED_NL}</time>.
            Geschreven en gecontroleerd door de gecertificeerde elektriciens van VoltFix — al het
            werk volgens NEN 1010.
          </p>
        </Prose>

        {/* DIY meet- en aansluitgids (Claude design) */}
        <div id="perilex-diy" className="mt-10 mb-8 scroll-mt-24">
          <PerilexMeasureGuide phone={business.phoneE164} />
        </div>

      </article>

      <PerilexPriceSection lang="nl" />

      {/* BOEKINGFLOW — ingeklapt, opent via #installatiemoment */}
      <div className="mx-auto max-w-3xl px-4 pb-14">
        <ScheduleDisclosure>
          <SchedulePicker location="perilex-schedule" lang="nl" />
        </ScheduleDisclosure>
      </div>

      <DiyVsPro lang="nl" message={whatsappMessage} />

      <Testimonials category="perilex" />

      <CtaBand message={whatsappMessage} location="service-cta" />

      <ServiceFaq faqs={faqs} />

      <RelatedServices currentPath={path} />

      <CtaBand
        compact
        title="Direct hulp nodig?"
        message={whatsappMessage}
        location="service-footer"
        secondaryHref="#installatiemoment"
        secondaryLabel="Kies een moment"
      />

      <NeighborhoodLinks title="Perilex aansluiten in uw wijk in Amsterdam" intro="Kies uw wijk voor lokale reactietijden en straatnamen. VoltFix sluit perilex aan in heel Amsterdam en regio." includeEmergency={true} />
    </>
  );
}
