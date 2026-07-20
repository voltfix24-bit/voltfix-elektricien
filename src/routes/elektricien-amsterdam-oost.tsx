import { createFileRoute } from "@tanstack/react-router";

import heroImg from "@/assets/hero-electrician.jpg";
import { ServicePage } from "@/components/service-page";
import { Prose } from "@/components/prose";
import { absoluteUrl, altLinks, breadcrumbSchema, faqSchema, ldScript, ogImage, serviceSchema } from "@/lib/seo";

const path = "/elektricien-amsterdam-oost";

const faqs = [
  {
    q: "Werken jullie ook in de Indische Buurt en Watergraafsmeer?",
    a: "Ja, VoltFix is elke week actief in heel Amsterdam Oost, van de Indische Buurt tot de Watergraafsmeer en het Oostelijk Havengebied.",
  },
  {
    q: "Kunnen jullie een laadpunt of extra groep in Oost aanleggen?",
    a: "Ja, we leggen een aparte groep aan voor uw laadpunt, inductie of warmtepomp — altijd volgens NEN 1010 en met vaste prijs vooraf.",
  },
  {
    q: "Hoe snel is er een spoed elektricien in Amsterdam Oost?",
    a: "Bij spoed in Amsterdam Oost zijn we vaak binnen 30 tot 60 minuten ter plaatse. Onze nood- en spoedservice is 24/7 bereikbaar.",
  },
  {
    q: "Wat kost een elektricien in Amsterdam Oost?",
    a: "U krijgt altijd een vaste prijsafspraak vooraf. Voorrijkosten en uurtarief bespreken we telefonisch of via WhatsApp, zodat u nooit voor verrassingen komt te staan.",
  },
  {
    q: "Zijn jullie gecertificeerd en geven jullie garantie?",
    a: "Onze monteurs werken volgens de NEN 1010-norm en we geven garantie op uitgevoerd werk en geplaatste materialen.",
  },
];

export const Route = createFileRoute("/elektricien-amsterdam-oost")({
  head: () => ({
    meta: [
      { title: "Elektricien Amsterdam Oost | VoltFix" },
      {
        name: "description",
        content:
          "Elektricien in Amsterdam Oost nodig? VoltFix is lokaal, snel ter plaatse en 24/7 bereikbaar voor spoed, groepenkast en installaties. Vaste prijs vooraf.",
      },
      { property: "og:title", content: "Elektricien Amsterdam Oost | VoltFix" },
      {
        property: "og:description",
        content: "Lokale elektricien in Amsterdam Oost. Snel, betrouwbaar en met vaste prijs vooraf.",
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
          name: "Elektricien Amsterdam Oost",
          description:
            "Lokale elektricien in Amsterdam Oost voor spoed, storingen, groepenkast, perilex en installaties.",
          path,
        }),
      ),
      ldScript(faqSchema(faqs)),
      ldScript(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Elektricien Amsterdam", path: "/elektricien-amsterdam" },
          { name: "Oost", path },
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
      eyebrow="Lokale elektricien in Amsterdam Oost"
      title="Elektricien Amsterdam Oost"
      intro="Amsterdam Oost is een mix van Indische Buurt, Oostpoort, Watergraafsmeer en het Oostelijk Havengebied. Als elektricien in Amsterdam Oost werkt VoltFix zowel in vooroorlogse woningen als in moderne nieuwbouw langs het IJ."
      image={heroImg}
      imageAlt="VoltFix elektricien aan het werk in Amsterdam Oost"
      whatsappMessage="Hallo VoltFix, ik zoek een elektricien in Amsterdam Oost."
      faqs={faqs}
    >
      <Prose>
        <p>
          Zoekt u een betrouwbare <strong>elektricien in Amsterdam Oost</strong>? VoltFix is uw
          lokale specialist voor spoed, storingen en installaties. We werken met vaste prijsafspraken
          vooraf, volgens de NEN 1010-norm en met garantie op uitgevoerd werk.
        </p>

        <h2>Elektricien in de Indische Buurt, Watergraafsmeer en Oostelijk Havengebied</h2>
        <p>
          We kennen de straten, panden en meterkasten van Amsterdam Oost en zijn daardoor snel bij
          u ter plaatse. Van klassieke bovenhuizen tot moderne nieuwbouw — we passen ons werk aan op
          uw specifieke situatie.
        </p>

        <h2>Veelvoorkomend werk in Amsterdam Oost</h2>
        <ul>
          <li>Groepenkast vervangen in vooroorlogse woningen</li>
          <li>Laadpunt of extra groep voor elektrisch koken</li>
          <li>Kortsluiting en aardlek in nieuwbouwappartementen</li>
          <li>Verlichting en domotica in gerenoveerde huizen</li>
          <li>Elektra voor bedrijfsruimtes in Oostpoort</li>
        </ul>

        <h2>Spoed elektricien in Amsterdam Oost</h2>
        <p>
          Zit u zonder stroom, heeft u kortsluiting of springt de aardlekschakelaar er steeds uit? Onze
          <strong> nood elektricien</strong> is 24/7 bereikbaar in Amsterdam Oost. Bel direct en
          we komen zo snel mogelijk langs om de storing op te lossen.
        </p>

        <h2>Transparante prijs en garantie</h2>
        <p>
          U krijgt altijd een <strong>vaste prijs vooraf</strong>, zodat u nooit voor verrassingen
          staat. Bel of stuur ons een WhatsApp met uw vraag en adres in Amsterdam Oost, dan
          helpen we u snel verder.
        </p>
      </Prose>
    </ServicePage>
  );
}
