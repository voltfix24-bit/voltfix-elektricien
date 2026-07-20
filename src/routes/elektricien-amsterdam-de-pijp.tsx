import { createFileRoute } from "@tanstack/react-router";

import heroImg from "@/assets/hero-electrician.jpg";
import { ServicePage } from "@/components/service-page";
import { Prose } from "@/components/prose";
import { absoluteUrl, altLinks, breadcrumbSchema, faqSchema, ldScript, ogImage, serviceSchema } from "@/lib/seo";

const path = "/elektricien-amsterdam-de-pijp";

const faqs = [
  {
    q: "Kunnen jullie snel komen in De Pijp bij een storing?",
    a: "Ja, De Pijp ligt centraal in ons werkgebied. Bij spoed zijn we vaak binnen 30 minuten ter plaatse.",
  },
  {
    q: "Werken jullie ook voor horeca en winkels in De Pijp?",
    a: "Ja, we verzorgen elektra, verlichting en keuringen voor cafés, restaurants en winkels in De Pijp — vaak buiten openingstijden zodat uw zaak door kan draaien.",
  },
  {
    q: "Hoe snel is er een spoed elektricien in Amsterdam De Pijp?",
    a: "Bij spoed in Amsterdam De Pijp zijn we vaak binnen 30 tot 60 minuten ter plaatse. Onze nood- en spoedservice is 24/7 bereikbaar.",
  },
  {
    q: "Wat kost een elektricien in Amsterdam De Pijp?",
    a: "U krijgt altijd een vaste prijsafspraak vooraf. Voorrijkosten en uurtarief bespreken we telefonisch of via WhatsApp, zodat u nooit voor verrassingen komt te staan.",
  },
  {
    q: "Zijn jullie gecertificeerd en geven jullie garantie?",
    a: "Onze monteurs werken volgens de NEN 1010-norm en we geven garantie op uitgevoerd werk en geplaatste materialen.",
  },
];

export const Route = createFileRoute("/elektricien-amsterdam-de-pijp")({
  head: () => ({
    meta: [
      { title: "Elektricien Amsterdam De Pijp | VoltFix" },
      {
        name: "description",
        content:
          "Elektricien in Amsterdam De Pijp nodig? VoltFix is lokaal, snel ter plaatse en 24/7 bereikbaar voor spoed, groepenkast en installaties. Vaste prijs vooraf.",
      },
      { property: "og:title", content: "Elektricien Amsterdam De Pijp | VoltFix" },
      {
        property: "og:description",
        content: "Lokale elektricien in Amsterdam De Pijp. Snel, betrouwbaar en met vaste prijs vooraf.",
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
          name: "Elektricien Amsterdam De Pijp",
          description:
            "Lokale elektricien in Amsterdam De Pijp voor spoed, storingen, groepenkast, perilex en installaties.",
          path,
        }),
      ),
      ldScript(faqSchema(faqs)),
      ldScript(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Elektricien Amsterdam", path: "/elektricien-amsterdam" },
          { name: "De Pijp", path },
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
      eyebrow="Lokale elektricien in Amsterdam De Pijp"
      title="Elektricien Amsterdam De Pijp"
      intro="De Pijp is dichtbebouwd met karakteristieke bovenhuizen, horeca en winkels. Als elektricien in De Pijp weet VoltFix hoe u snel én netjes werk levert in kleine meterkasten en drukke straten."
      image={heroImg}
      imageAlt="VoltFix elektricien aan het werk in Amsterdam De Pijp"
      whatsappMessage="Hallo VoltFix, ik zoek een elektricien in Amsterdam De Pijp."
      faqs={faqs}
    >
      <Prose>
        <p>
          Zoekt u een betrouwbare <strong>elektricien in Amsterdam De Pijp</strong>? VoltFix is uw
          lokale specialist voor spoed, storingen en installaties. We werken met vaste prijsafspraken
          vooraf, volgens de NEN 1010-norm en met garantie op uitgevoerd werk.
        </p>

        <h2>Elektricien in de Oude Pijp, Nieuwe Pijp en rond de Albert Cuyp</h2>
        <p>
          We kennen de straten, panden en meterkasten van Amsterdam De Pijp en zijn daardoor snel bij
          u ter plaatse. Van klassieke bovenhuizen tot moderne nieuwbouw — we passen ons werk aan op
          uw specifieke situatie.
        </p>

        <h2>Veelvoorkomend werk in De Pijp</h2>
        <ul>
          <li>Storingen in bovenhuizen rond de Albert Cuypmarkt</li>
          <li>Groepenkast vervangen in kleine meterkasten</li>
          <li>Extra stopcontacten en verlichting bij verbouwingen</li>
          <li>Elektra voor horeca en winkels in De Pijp</li>
          <li>Perilex of kookgroep voor inductie</li>
        </ul>

        <h2>Spoed elektricien in Amsterdam De Pijp</h2>
        <p>
          Zit u zonder stroom, heeft u kortsluiting of springt de aardlekschakelaar er steeds uit? Onze
          <strong> nood elektricien</strong> is 24/7 bereikbaar in Amsterdam De Pijp. Bel direct en
          we komen zo snel mogelijk langs om de storing op te lossen.
        </p>

        <h2>Transparante prijs en garantie</h2>
        <p>
          U krijgt altijd een <strong>vaste prijs vooraf</strong>, zodat u nooit voor verrassingen
          staat. Bel of stuur ons een WhatsApp met uw vraag en adres in Amsterdam De Pijp, dan
          helpen we u snel verder.
        </p>
      </Prose>
    </ServicePage>
  );
}
