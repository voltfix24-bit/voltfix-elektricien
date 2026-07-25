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

import heroImg from "@/assets/voltfix-perilex-hero.png.asset.json";
import { CallbackForm } from "@/components/callback-form";
import { CtaBand } from "@/components/cta-band";
import { DiyVsPro } from "@/components/diy-vs-pro";
import { PriceIndicator, type PriceRow } from "@/components/price-indicator";
import { Prose } from "@/components/prose";
import { RelatedServices } from "@/components/related-services";
import { ServiceFaq } from "@/components/service-faq";
import { Testimonials } from "@/components/testimonials";
import { TrustStrip } from "@/components/trust-strip";
import { PerilexWizardToggle, PerilexWizardCta } from "@/components/perilex-wizard-toggle";
import { PerilexMeasureCard } from "@/components/perilex-measure-card";
import { business, telHref, whatsappHref } from "@/lib/business";
import { useT } from "@/lib/i18n";
import { useTrackConversion } from "@/lib/analytics";
import {
  absoluteUrl,
  altLinks,
  breadcrumbSchema,
  faqSchema,
  howToSchema,
  ldScript,
  ogImage,
  pageMeta,
  serviceSchema,
} from "@/lib/seo";

const path = "/perilex-amsterdam";
const whatsappMessage =
  "Hallo VoltFix, ik wil een perilex / kookgroep laten aansluiten in Amsterdam.";

const faqs = [
  {
    q: "Wat kost het aansluiten van een perilex in Amsterdam?",
    a: "Het aansluiten van een perilex stopcontact of kookgroep begint bij ongeveer € 120. De prijs hangt af van de afstand tot de meterkast en of er een nieuwe groep moet worden bijgeplaatst. U krijgt vooraf een vaste prijs.",
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
];

export const Route = createFileRoute("/perilex-amsterdam")({
  head: () => ({
    meta: pageMeta({
      title: "Perilex Aansluiten Amsterdam | Kookgroep | VoltFix",
      description:
        "Perilex aansluiten in Amsterdam voor inductie of fornuis. Vaste prijs vanaf € 120, 1 jaar garantie op arbeid. Veilig geïnstalleerd door VoltFix.",
      path,
      ogTitle: "Perilex Aansluiten Amsterdam | VoltFix",
      ogDescription:
        "Kookgroep en perilex stopcontact voor inductie en fornuis. Veilig aangesloten.",
      ogType: "article",
    }),
    links: [{ rel: "canonical", href: absoluteUrl(path) }, ...altLinks(path)],
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
        howToSchema({
          name: "Perilex zelf aansluiten — stappenplan",
          description:
            "Stap-voor-stap veilig een perilex stopcontact aansluiten voor inductie of fornuis in Amsterdam. Bij twijfel of werk aan de meterkast: laat VoltFix het doen.",
          path,
          totalTime: "PT45M",
          tools: [
            "Goedgekeurde dubbelpolige spanningstester",
            "Kruiskop- en platte schroevendraaier",
            "Striptang",
            "Zijkniptang",
          ],
          supplies: [
            "Perilex stekker (2- of 3-fase, passend bij de configuratie)",
            "Perilex kabel met juiste doorsnede",
          ],
          steps: [
            {
              name: "Meet de configuratie",
              text: "Bepaal met een dubbelpolige spanningstester welke contacten fase (L) en nul (N) zijn. Markeer de bedrading van de bestaande contactdoos.",
            },
            {
              name: "Spanning eraf",
              text: "Schakel de juiste groep in de meterkast uit en controleer met de spanningstester dat er geen spanning meer op de aansluiting staat.",
            },
            {
              name: "Kabel voorbereiden",
              text: "Strip de buitenmantel en losse aders op de juiste lengte. Houd de aardader (geel-groen) iets langer dan de fasen en de nul.",
            },
            {
              name: "Aders op kleurcode aansluiten",
              text: "Sluit elke ader aan op de gemarkeerde klem in de perilex stekker. Volg de labels op de stekker; geen blank koper buiten de klem.",
            },
            {
              name: "Trekontlasting vastzetten",
              text: "Zet de kabelklem stevig vast op de buitenmantel — nooit op losse aders — zodat de aansluiting bij trekken niet loskomt.",
            },
            {
              name: "Apparaatzijde: bruggen instellen",
              text: "Stel de bruggen op het aansluitblok van het apparaat in volgens het fabrikantsschema voor 1-, 2- of 3-fase, passend bij je gemeten configuratie.",
            },
            {
              name: "Sluiten & controleren",
              text: "Schroef de stekker dicht, controleer of alle schroeven vastzitten en niets klemt. Schakel daarna pas de groep weer in en test de werking.",
            },
          ],
        }),
      ),
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

const priceRows: PriceRow[] = [
  {
    title: "Perilex aansluiten",
    price: "vanaf € 120",
    unit: "op bestaande groep",
    points: ["2- of 3-fase", "Inductie & fornuis", "1 jaar garantie op arbeid"],
    featured: true,
  },
  {
    title: "Kookgroep + nieuwe groep",
    price: "vanaf € 275",
    unit: "incl. extra groep",
    points: ["Eigen kookgroep", "Bekabeling naar meterkast", "NEN 1010 conform"],
  },
];

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
          <div className="order-1 relative z-10 flex max-w-xl flex-col rounded-2xl bg-background/80 p-5 shadow-sm backdrop-blur-sm sm:p-6 lg:bg-background/70">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-butter/70 px-4 py-1.5 text-sm font-semibold text-foreground shadow-sm ring-1 ring-butter">
              Perilex aansluiten in Amsterdam
            </span>

            <h1 className="mt-5 text-5xl font-black leading-[1.02] tracking-tight text-balance sm:text-6xl lg:text-[64px]">
              <span className="text-foreground">Perilex</span>
              <br />
              <span className="text-primary">Amsterdam</span>
              <span className="text-butter">.</span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-foreground/80 sm:text-lg">
              Een Perilex aansluiting zorgt ervoor dat uw inductiekookplaat veilig en correct wordt
              aangesloten. VoltFix helpt in Amsterdam met het aansluiten van Perilex stopcontacten,
              stekkers en kookplaten — vakkundig, snel en netjes afgewerkt.
            </p>

            <a
              href={telHref}
              className="gtm-cta-call mt-7 inline-flex items-center gap-3 text-2xl font-black tracking-tight text-primary sm:text-3xl"
              data-gtm="cta-call"
              data-gtm-location="perilex-hero-phone"
              onClick={() => track("call", "perilex-hero-phone")}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                <Phone className="h-5 w-5" />
              </span>
              {business.phoneDisplay}
            </a>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={telHref}
                className="gtm-cta-call inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-md transition hover:brightness-110"
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
                className="gtm-cta-whatsapp inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-bold text-white shadow-md transition hover:brightness-110"
                data-gtm="cta-whatsapp"
                data-gtm-location="perilex-hero"
                onClick={() => track("whatsapp", "perilex-hero")}
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
              <a
                href={`${t.contactTo}#offerte`}
                className="gtm-cta-quote inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-primary bg-background px-5 text-sm font-bold text-primary shadow-sm transition hover:bg-primary/5"
                data-gtm="cta-quote"
                data-gtm-location="perilex-hero"
                onClick={() => track("quote", "perilex-hero")}
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

          {/* RIGHT — illustration full-bleed on desktop, inline on mobile */}
          <div className="order-2 relative -mx-4 flex items-end justify-center lg:mx-0 lg:absolute lg:inset-0 lg:z-0 lg:block">
            <img
              src={heroImg.url}
              alt="Twee VoltFix monteurs sluiten een Perilex aan voor een inductiekookplaat in een Amsterdamse keuken"
              width={1600}
              height={1200}
              className="block h-auto w-full max-w-[720px] object-contain lg:h-full lg:w-full lg:max-w-none lg:object-cover lg:object-center"
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

      {/* TRUST STRIP — direct onder hero */}
      <TrustStrip lang="nl" />

      {/* CONTENT */}
      <article className="mx-auto max-w-3xl px-4 py-14">
        {/* CALLBACK FORM — primaire conversie boven de content */}
        <div className="mb-10">
          <CallbackForm lang="nl" location="perilex-callback-top" topic="Amsterdam" />
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
            <Link to="/contact" hash="offerte" className="font-medium text-primary underline underline-offset-4">
              vrijblijvende offerte voor uw perilex aansluiting
            </Link>{" "}
            aanvragen met vaste prijs vooraf.
          </p>
        </Prose>

        <div className="my-10">
          <PerilexWizardCta />
        </div>

        <PerilexWizardToggle />
      </article>

      <CtaBand compact message={whatsappMessage} location="service-mid" />

      <PriceIndicator
        title="Prijsindicatie perilex & kookgroep"
        intro="Vaste prijs vooraf voor het aansluiten van een perilex of kookgroep in Amsterdam. Inclusief btw en 1 jaar garantie op arbeid."
        rows={priceRows}
        message={whatsappMessage}
        location="service-price"
      />

      <Testimonials category="perilex" />

      <CtaBand message={whatsappMessage} location="service-cta" />

      <ServiceFaq faqs={faqs} />

      <RelatedServices currentPath={path} />

      <CtaBand
        compact
        title="Direct hulp nodig?"
        message={whatsappMessage}
        location="service-footer"
      />
    </>
  );
}
