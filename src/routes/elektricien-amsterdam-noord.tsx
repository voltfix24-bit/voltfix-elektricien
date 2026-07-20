import { createFileRoute } from "@tanstack/react-router";

import heroImg from "@/assets/voltfix-lamp-ophangen.png.asset.json";
import { ServicePage } from "@/components/service-page";
import { Prose } from "@/components/prose";
import { absoluteUrl, altLinks, breadcrumbSchema, faqSchema, ldScript, ogImage, serviceSchema } from "@/lib/seo";

const path = "/elektricien-amsterdam-noord";

const faqs = [
  {
    q: "Komen jullie ook naar Amsterdam Noord?",
    a: "Ja, VoltFix werkt regelmatig in Amsterdam Noord — van de tuindorpen tot NDSM en Overhoeks. Ook bij spoed rijden we snel over de brug of via de tunnel.",
  },
  {
    q: "Kunnen jullie een laadpaal in Noord aansluiten?",
    a: "Ja, we leggen een aparte groep aan vanaf de meterkast naar de laadpaal, inclusief aardlek en zekering conform NEN 1010.",
  },
  {
    q: "Hoe snel is er een spoed elektricien in Amsterdam Noord?",
    a: "Bij spoed in Amsterdam Noord zijn we vaak binnen 30 tot 60 minuten ter plaatse. Onze nood- en spoedservice is 24/7 bereikbaar.",
  },
  {
    q: "Wat kost een elektricien in Amsterdam Noord?",
    a: "U krijgt altijd een vaste prijsafspraak vooraf. Voorrijkosten en uurtarief bespreken we telefonisch of via WhatsApp, zodat u nooit voor verrassingen komt te staan.",
  },
  {
    q: "Zijn jullie gecertificeerd en geven jullie garantie?",
    a: "Onze monteurs werken volgens de NEN 1010-norm en we geven garantie op uitgevoerd werk en geplaatste materialen.",
  },
];

export const Route = createFileRoute("/elektricien-amsterdam-noord")({
  head: () => ({
    meta: [
      { title: "Elektricien Amsterdam Noord | VoltFix" },
      {
        name: "description",
        content:
          "Elektricien in Amsterdam Noord nodig? VoltFix is lokaal, snel ter plaatse en 24/7 bereikbaar voor spoed, groepenkast en installaties. Vaste prijs vooraf.",
      },
      { property: "og:title", content: "Elektricien Amsterdam Noord | VoltFix" },
      {
        property: "og:description",
        content: "Lokale elektricien in Amsterdam Noord. Snel, betrouwbaar en met vaste prijs vooraf.",
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
          name: "Elektricien Amsterdam Noord",
          description:
            "Lokale elektricien in Amsterdam Noord voor spoed, storingen, groepenkast, perilex en installaties.",
          path,
        }),
      ),
      ldScript(faqSchema(faqs)),
      ldScript(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Elektricien Amsterdam", path: "/elektricien-amsterdam" },
          { name: "Noord", path },
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
      eyebrow="Lokale elektricien in Amsterdam Noord"
      title="Elektricien Amsterdam Noord"
      intro="Amsterdam Noord groeit snel: van de NDSM-werf en Overhoeks tot de tuindorpen. VoltFix is de lokale elektricien in Amsterdam Noord voor zowel klassieke woningen als nieuwbouwprojecten en bedrijfspanden."
      image={heroImg.url}
      imageAlt="VoltFix elektricien aan het werk in Amsterdam Noord"
      whatsappMessage="Hallo VoltFix, ik zoek een elektricien in Amsterdam Noord."
      faqs={faqs}
    >
      <Prose>
        <p>
          Zoekt u een betrouwbare <strong>elektricien in Amsterdam Noord</strong>? VoltFix is uw
          lokale specialist voor spoed, storingen en installaties. We werken met vaste prijsafspraken
          vooraf, volgens de NEN 1010-norm en met garantie op uitgevoerd werk.
        </p>

        <h2>Elektricien op NDSM, Overhoeks en in de tuindorpen</h2>
        <p>
          We kennen de straten, panden en meterkasten van Amsterdam Noord en zijn daardoor snel bij
          u ter plaatse. Van klassieke bovenhuizen tot moderne nieuwbouw — we passen ons werk aan op
          uw specifieke situatie.
        </p>

        <h2>Veelvoorkomend werk in Amsterdam Noord</h2>
        <ul>
          <li>Complete elektra-installaties in nieuwbouw</li>
          <li>Groepenkast vernieuwen in tuindorpwoningen</li>
          <li>Perilex aansluiten voor inductie of fornuis</li>
          <li>Laadpunten voor elektrische auto’s bij eigen parkeerplek</li>
          <li>Verlichting en elektra voor loodsen op NDSM</li>
        </ul>

        <h2>Spoed elektricien in Amsterdam Noord</h2>
        <p>
          Zit u zonder stroom, heeft u kortsluiting of springt de aardlekschakelaar er steeds uit? Onze
          <strong> nood elektricien</strong> is 24/7 bereikbaar in Amsterdam Noord. Bel direct en
          we komen zo snel mogelijk langs om de storing op te lossen.
        </p>

        <h2>Transparante prijs en garantie</h2>
        <p>
          U krijgt altijd een <strong>vaste prijs vooraf</strong>, zodat u nooit voor verrassingen
          staat. Bel of stuur ons een WhatsApp met uw vraag en adres in Amsterdam Noord, dan
          helpen we u snel verder.
        </p>
      </Prose>
    </ServicePage>
  );
}
