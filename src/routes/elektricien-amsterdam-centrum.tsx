import { createFileRoute } from "@tanstack/react-router";

import heroImg from "@/assets/hero-electrician.jpg";
import { ServicePage } from "@/components/service-page";
import { Prose } from "@/components/prose";
import { absoluteUrl, altLinks, breadcrumbSchema, faqSchema, ldScript, ogImage, serviceSchema } from "@/lib/seo";

const path = "/elektricien-amsterdam-centrum";

const faqs = [
  {
    q: "Werken jullie in Amsterdam Centrum en de grachtengordel?",
    a: "Ja, VoltFix werkt dagelijks in Amsterdam Centrum — van de Jordaan en 9 Straatjes tot de Nieuwmarkt, Wallen en grachtengordel. Bij spoed staan we hier vaak binnen 30–45 minuten voor de deur.",
  },
  {
    q: "Kunnen jullie werken in een monumentaal grachtenpand?",
    a: "Zeker. We hebben veel ervaring met monumentale panden in het Centrum en werken zorgvuldig met de bestaande structuur, kabelgoten en houten vloeren, volgens de NEN 1010-norm.",
  },
  {
    q: "Hoe snel is een spoed elektricien in Amsterdam Centrum?",
    a: "In Amsterdam Centrum zijn we bij spoed vaak binnen 30 tot 60 minuten ter plaatse. Onze nood- en spoedservice is 24/7 bereikbaar, ook in de weekenden.",
  },
  {
    q: "Kunnen jullie de groepenkast in een bovenhuis of appartement vervangen?",
    a: "Ja, we vervangen groepenkasten in bovenhuizen, appartementen en winkelpanden in het Centrum. We stemmen af met de VvE waar nodig en werken netjes en snel.",
  },
  {
    q: "Doen jullie ook horeca en winkels in het Centrum?",
    a: "Ja, we werken voor horeca, winkels en kantoren in Amsterdam Centrum: extra groepen, verlichting, keukens, terrasverwarming en NEN 3140-keuringen.",
  },
  {
    q: "Wat kost een elektricien in Amsterdam Centrum?",
    a: "U krijgt altijd een vaste prijsafspraak vooraf. Voorrijkosten en uurtarief bespreken we telefonisch of via WhatsApp, zodat u nooit voor verrassingen komt te staan.",
  },
];

export const Route = createFileRoute("/elektricien-amsterdam-centrum")({
  head: () => ({
    meta: [
      { title: "Elektricien Amsterdam Centrum | VoltFix" },
      {
        name: "description",
        content:
          "Elektricien in Amsterdam Centrum nodig? VoltFix is lokaal, snel ter plaatse en 24/7 bereikbaar voor spoed, groepenkast en installaties. Vaste prijs vooraf.",
      },
      { property: "og:title", content: "Elektricien Amsterdam Centrum | VoltFix" },
      {
        property: "og:description",
        content: "Lokale elektricien in Amsterdam Centrum. Grachtengordel, Jordaan, Nieuwmarkt en Wallen.",
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
          name: "Elektricien Amsterdam Centrum",
          description:
            "Lokale elektricien in Amsterdam Centrum voor spoed, storingen, groepenkast, perilex en installaties in monumentale panden en horeca.",
          path,
        }),
      ),
      ldScript(faqSchema(faqs)),
      ldScript(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Elektricien Amsterdam", path: "/elektricien-amsterdam" },
          { name: "Centrum", path },
        ]),
      ),
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ServicePage
      path={path}
      eyebrow="Lokale elektricien in Amsterdam Centrum"
      title="Elektricien Amsterdam Centrum"
      intro="Van de grachtengordel en Jordaan tot de Nieuwmarkt, Wallen en 9 Straatjes: als lokale elektricien in Amsterdam Centrum kennen we de monumentale grachtenpanden, smalle trappen en vaak overvolle meterkasten die daarbij horen."
      image={heroImg}
      imageAlt="VoltFix elektricien aan het werk in Amsterdam Centrum"
      whatsappMessage="Hallo VoltFix, ik zoek een elektricien in Amsterdam Centrum."
      faqs={faqs}
    >
      <Prose>
        <p>
          Zoekt u een betrouwbare <strong>elektricien in Amsterdam Centrum</strong>? VoltFix is uw
          lokale specialist voor spoed, storingen en installaties in het hart van de stad. We werken
          met vaste prijsafspraken vooraf, volgens de NEN 1010-norm en met garantie op uitgevoerd werk.
        </p>

        <h2>Elektricien in de Jordaan, grachtengordel en Nieuwmarkt</h2>
        <p>
          We kennen de straten, panden en meterkasten van Amsterdam Centrum en zijn daardoor snel
          bij u ter plaatse. Van monumentale grachtenpanden tot bovenhuizen in de Jordaan en
          winkelpanden op de Nieuwmarkt — we passen ons werk aan op uw specifieke situatie.
        </p>

        <h2>Veelvoorkomend werk in Amsterdam Centrum</h2>
        <ul>
          <li>Groepenkast vervangen in monumentale grachtenpanden</li>
          <li>Extra groepen voor inductie in kleine keukens</li>
          <li>Kortsluiting door oude bedrading in bovenhuizen</li>
          <li>Verlichting, dimmers en spots in winkels en horeca</li>
          <li>Aardlekschakelaars en NEN 3140-keuringen voor bedrijven</li>
          <li>Perilex en kookgroepen in appartementen</li>
        </ul>

        <h2>Spoed elektricien in Amsterdam Centrum</h2>
        <p>
          Zit u zonder stroom, heeft u kortsluiting of springt de aardlekschakelaar er steeds uit?
          Onze <strong>nood elektricien</strong> is 24/7 bereikbaar in Amsterdam Centrum — ook in de
          weekenden en 's avonds. Bel direct en we komen zo snel mogelijk langs om de storing op te
          lossen.
        </p>

        <h2>Werken in monumentale panden</h2>
        <p>
          Veel panden in het Centrum zijn monument of hebben een beschermde status. Wij werken
          zorgvuldig met de bestaande structuur en houden rekening met houten vloeren, oude
          leidingen en de eisen van de gemeente Amsterdam en de VvE.
        </p>

        <h2>Transparante prijs en garantie</h2>
        <p>
          U krijgt altijd een <strong>vaste prijs vooraf</strong>, zodat u nooit voor verrassingen
          staat. Bel of stuur ons een WhatsApp met uw vraag en adres in Amsterdam Centrum, dan
          helpen we u snel verder.
        </p>
      </Prose>
    </ServicePage>
  );
}
