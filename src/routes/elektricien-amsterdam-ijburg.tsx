import { createFileRoute } from "@tanstack/react-router";

import heroImg from "@/assets/voltfix-lamp-ophangen.png.asset.json";
import { ServicePage } from "@/components/service-page";
import { Prose } from "@/components/prose";
import { absoluteUrl, altLinks, breadcrumbSchema, faqSchema, ldScript, ogImage, serviceSchema } from "@/lib/seo";

const path = "/elektricien-amsterdam-ijburg";

const faqs = [
  {
    q: "Komen jullie ook naar IJburg?",
    a: "Ja, VoltFix werkt op heel IJburg — van Steigereiland tot Centrumeiland — voor spoed én geplande installaties.",
  },
  {
    q: "Kunnen jullie een laadpaal op IJburg aansluiten?",
    a: "Ja, we leggen een aparte groep aan vanaf uw meterkast naar het laadpunt, inclusief aardlekbeveiliging en zekering conform NEN 1010.",
  },
  {
    q: "Hoe snel is er een spoed elektricien in Amsterdam IJburg?",
    a: "Bij spoed in Amsterdam IJburg zijn we vaak binnen 30 tot 60 minuten ter plaatse. Onze nood- en spoedservice is 24/7 bereikbaar.",
  },
  {
    q: "Wat kost een elektricien in Amsterdam IJburg?",
    a: "U krijgt altijd een vaste prijsafspraak vooraf. Voorrijkosten en uurtarief bespreken we telefonisch of via WhatsApp, zodat u nooit voor verrassingen komt te staan.",
  },
  {
    q: "Zijn jullie gecertificeerd en geven jullie garantie?",
    a: "Onze monteurs werken volgens de NEN 1010-norm en we geven garantie op uitgevoerd werk en geplaatste materialen.",
  },
];

export const Route = createFileRoute("/elektricien-amsterdam-ijburg")({
  head: () => ({
    meta: [
      { title: "Elektricien Amsterdam IJburg | VoltFix" },
      {
        name: "description",
        content:
          "Elektricien in Amsterdam IJburg nodig? VoltFix is lokaal, snel ter plaatse en 24/7 bereikbaar voor spoed, groepenkast en installaties. Vaste prijs vooraf.",
      },
      { property: "og:title", content: "Elektricien Amsterdam IJburg | VoltFix" },
      {
        property: "og:description",
        content: "Lokale elektricien in Amsterdam IJburg. Snel, betrouwbaar en met vaste prijs vooraf.",
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
          name: "Elektricien Amsterdam IJburg",
          description:
            "Lokale elektricien in Amsterdam IJburg voor spoed, storingen, groepenkast, perilex en installaties.",
          path,
        }),
      ),
      ldScript(faqSchema(faqs)),
      ldScript(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Elektricien Amsterdam", path: "/elektricien-amsterdam" },
          { name: "IJburg", path },
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
      eyebrow="Lokale elektricien in Amsterdam IJburg"
      title="Elektricien Amsterdam IJburg"
      intro="IJburg is een moderne wijk met nieuwbouwwoningen, appartementen en eigen parkeerplekken. Als elektricien op IJburg werkt VoltFix aan laadpunten, groepenkasten en installaties op maat."
      image={heroImg.url}
      imageAlt="VoltFix elektricien aan het werk in Amsterdam IJburg"
      whatsappMessage="Hallo VoltFix, ik zoek een elektricien in Amsterdam IJburg."
      faqs={faqs}
    >
      <Prose>
        <p>
          Zoekt u een betrouwbare <strong>elektricien in Amsterdam IJburg</strong>? VoltFix is uw
          lokale specialist voor spoed, storingen en installaties. We werken met vaste prijsafspraken
          vooraf, volgens de NEN 1010-norm en met garantie op uitgevoerd werk.
        </p>

        <h2>Elektricien op Steigereiland, Haveneiland en Centrumeiland</h2>
        <p>
          We kennen de straten, panden en meterkasten van Amsterdam IJburg en zijn daardoor snel bij
          u ter plaatse. Van klassieke bovenhuizen tot moderne nieuwbouw — we passen ons werk aan op
          uw specifieke situatie.
        </p>

        <h2>Veelvoorkomend werk op IJburg</h2>
        <ul>
          <li>Laadpalen aansluiten bij eigen parkeerplaats</li>
          <li>Extra groep voor inductie of warmtepomp</li>
          <li>Groepenkast uitbreiden in nieuwbouwwoningen</li>
          <li>Verlichting, dimmers en domotica</li>
          <li>Kortsluiting en aardlek verhelpen</li>
        </ul>

        <h2>Spoed elektricien in Amsterdam IJburg</h2>
        <p>
          Zit u zonder stroom, heeft u kortsluiting of springt de aardlekschakelaar er steeds uit? Onze
          <strong> nood elektricien</strong> is 24/7 bereikbaar in Amsterdam IJburg. Bel direct en
          we komen zo snel mogelijk langs om de storing op te lossen.
        </p>

        <h2>Transparante prijs en garantie</h2>
        <p>
          U krijgt altijd een <strong>vaste prijs vooraf</strong>, zodat u nooit voor verrassingen
          staat. Bel of stuur ons een WhatsApp met uw vraag en adres in Amsterdam IJburg, dan
          helpen we u snel verder.
        </p>
      </Prose>
    </ServicePage>
  );
}
