import { createFileRoute } from "@tanstack/react-router";

import heroImg from "@/assets/voltfix-lamp-ophangen.png.asset.json";
import { ServicePage } from "@/components/service-page";
import { Prose } from "@/components/prose";
import { absoluteUrl, altLinks, breadcrumbSchema, faqSchema, ldScript, ogImage, serviceSchema } from "@/lib/seo";

const path = "/elektricien-amsterdam-zuid";

const faqs = [
  {
    q: "Werken jullie in Amsterdam Zuid en op de Zuidas?",
    a: "Ja, VoltFix werkt dagelijks in Amsterdam Zuid — van de Apollobuurt en Rivierenbuurt tot kantoren op de Zuidas. Bij spoed staan we hier vaak binnen 30–45 minuten voor de deur.",
  },
  {
    q: "Kunnen jullie een groepenkast in een jaren ’30 woning in Zuid vervangen?",
    a: "Zeker. We hebben veel ervaring met de karakteristieke meterkasten in Amsterdam Zuid en passen alles aan volgens NEN 1010 met behoud van de bestaande structuur waar mogelijk.",
  },
  {
    q: "Hoe snel is er een spoed elektricien in Amsterdam Zuid?",
    a: "Bij spoed in Amsterdam Zuid zijn we vaak binnen 30 tot 60 minuten ter plaatse. Onze nood- en spoedservice is 24/7 bereikbaar.",
  },
  {
    q: "Wat kost een elektricien in Amsterdam Zuid?",
    a: "U krijgt altijd een vaste prijsafspraak vooraf. Voorrijkosten en uurtarief bespreken we telefonisch of via WhatsApp, zodat u nooit voor verrassingen komt te staan.",
  },
  {
    q: "Zijn jullie gecertificeerd en geven jullie garantie?",
    a: "Onze monteurs werken volgens de NEN 1010-norm en we geven garantie op uitgevoerd werk en geplaatste materialen.",
  },
];

export const Route = createFileRoute("/elektricien-amsterdam-zuid")({
  head: () => ({
    meta: [
      { title: "Elektricien Amsterdam Zuid | VoltFix" },
      {
        name: "description",
        content:
          "Elektricien in Amsterdam Zuid nodig? VoltFix is lokaal, snel ter plaatse en 24/7 bereikbaar voor spoed, groepenkast en installaties. Vaste prijs vooraf.",
      },
      { property: "og:title", content: "Elektricien Amsterdam Zuid | VoltFix" },
      {
        property: "og:description",
        content: "Lokale elektricien in Amsterdam Zuid. Snel, betrouwbaar en met vaste prijs vooraf.",
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
          name: "Elektricien Amsterdam Zuid",
          description:
            "Lokale elektricien in Amsterdam Zuid voor spoed, storingen, groepenkast, perilex en installaties.",
          path,
        }),
      ),
      ldScript(faqSchema(faqs)),
      ldScript(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Elektricien Amsterdam", path: "/elektricien-amsterdam" },
          { name: "Zuid", path },
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
      eyebrow="Lokale elektricien in Amsterdam Zuid"
      title="Elektricien Amsterdam Zuid"
      intro="Van de Apollobuurt tot de Rivierenbuurt: als lokale elektricien in Amsterdam Zuid kennen we de karakteristieke jaren ’30 woningen, moderne appartementen op de Zuidas én de vaak volle meterkasten die daarbij horen."
      image={heroImg.url}
      imageAlt="VoltFix elektricien aan het werk in Amsterdam Zuid"
      whatsappMessage="Hallo VoltFix, ik zoek een elektricien in Amsterdam Zuid."
      faqs={faqs}
    >
      <Prose>
        <p>
          Zoekt u een betrouwbare <strong>elektricien in Amsterdam Zuid</strong>? VoltFix is uw
          lokale specialist voor spoed, storingen en installaties. We werken met vaste prijsafspraken
          vooraf, volgens de NEN 1010-norm en met garantie op uitgevoerd werk.
        </p>

        <h2>Elektricien in de Pijp, Rivierenbuurt en Apollobuurt</h2>
        <p>
          We kennen de straten, panden en meterkasten van Amsterdam Zuid en zijn daardoor snel bij
          u ter plaatse. Van klassieke bovenhuizen tot moderne nieuwbouw — we passen ons werk aan op
          uw specifieke situatie.
        </p>

        <h2>Veelvoorkomend werk in Amsterdam Zuid</h2>
        <ul>
          <li>Groepenkast vervangen in jaren ’30 woningen</li>
          <li>Extra groepen voor inductie of warmtepomp op de Zuidas</li>
          <li>Kortsluiting door oude bedrading in monumentale panden</li>
          <li>Verlichting en dimmers in kantoorpanden Zuidas</li>
          <li>Aardlekschakelaars en NEN 3140-keuringen</li>
        </ul>

        <h2>Spoed elektricien in Amsterdam Zuid</h2>
        <p>
          Zit u zonder stroom, heeft u kortsluiting of springt de aardlekschakelaar er steeds uit? Onze
          <strong> nood elektricien</strong> is 24/7 bereikbaar in Amsterdam Zuid. Bel direct en
          we komen zo snel mogelijk langs om de storing op te lossen.
        </p>

        <h2>Transparante prijs en garantie</h2>
        <p>
          U krijgt altijd een <strong>vaste prijs vooraf</strong>, zodat u nooit voor verrassingen
          staat. Bel of stuur ons een WhatsApp met uw vraag en adres in Amsterdam Zuid, dan
          helpen we u snel verder.
        </p>
      </Prose>
    </ServicePage>
  );
}
