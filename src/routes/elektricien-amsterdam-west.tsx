import { createFileRoute } from "@tanstack/react-router";

import heroImg from "@/assets/hero-electrician.jpg";
import { ServicePage } from "@/components/service-page";
import { Prose } from "@/components/prose";
import { absoluteUrl, altLinks, breadcrumbSchema, faqSchema, ldScript, ogImage, serviceSchema } from "@/lib/seo";

const path = "/elektricien-amsterdam-west";

const faqs = [
  {
    q: "Zijn jullie snel in Amsterdam West bij een storing?",
    a: "Ja. Onze spoedmonteurs zijn bij storingen in Amsterdam West vaak binnen 30–60 minuten ter plaatse — 24/7, ook in het weekend.",
  },
  {
    q: "Kunnen jullie in een klein bovenhuis in West een nieuwe groepenkast plaatsen?",
    a: "Ja, we passen de kast aan op de beschikbare ruimte in de meterkast en zorgen dat alles voldoet aan NEN 1010.",
  },
  {
    q: "Hoe snel is er een spoed elektricien in Amsterdam West?",
    a: "Bij spoed in Amsterdam West zijn we vaak binnen 30 tot 60 minuten ter plaatse. Onze nood- en spoedservice is 24/7 bereikbaar.",
  },
  {
    q: "Wat kost een elektricien in Amsterdam West?",
    a: "U krijgt altijd een vaste prijsafspraak vooraf. Voorrijkosten en uurtarief bespreken we telefonisch of via WhatsApp, zodat u nooit voor verrassingen komt te staan.",
  },
  {
    q: "Zijn jullie gecertificeerd en geven jullie garantie?",
    a: "Onze monteurs werken volgens de NEN 1010-norm en we geven garantie op uitgevoerd werk en geplaatste materialen.",
  },
];

export const Route = createFileRoute("/elektricien-amsterdam-west")({
  head: () => ({
    meta: [
      { title: "Elektricien Amsterdam West | VoltFix" },
      {
        name: "description",
        content:
          "Elektricien in Amsterdam West nodig? VoltFix is lokaal, snel ter plaatse en 24/7 bereikbaar voor spoed, groepenkast en installaties. Vaste prijs vooraf.",
      },
      { property: "og:title", content: "Elektricien Amsterdam West | VoltFix" },
      {
        property: "og:description",
        content: "Lokale elektricien in Amsterdam West. Snel, betrouwbaar en met vaste prijs vooraf.",
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
          name: "Elektricien Amsterdam West",
          description:
            "Lokale elektricien in Amsterdam West voor spoed, storingen, groepenkast, perilex en installaties.",
          path,
        }),
      ),
      ldScript(faqSchema(faqs)),
      ldScript(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Elektricien Amsterdam", path: "/elektricien-amsterdam" },
          { name: "West", path },
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
      eyebrow="Lokale elektricien in Amsterdam West"
      title="Elektricien Amsterdam West"
      intro="In Amsterdam West — van de Baarsjes en Bos en Lommer tot Westerpark en de Jordaanrand — vragen zowel oude bovenhuizen als nieuwbouw om vakkundig elektrawerk. VoltFix is uw lokale elektricien in Amsterdam West."
      image={heroImg}
      imageAlt="VoltFix elektricien aan het werk in Amsterdam West"
      whatsappMessage="Hallo VoltFix, ik zoek een elektricien in Amsterdam West."
      faqs={faqs}
    >
      <Prose>
        <p>
          Zoekt u een betrouwbare <strong>elektricien in Amsterdam West</strong>? VoltFix is uw
          lokale specialist voor spoed, storingen en installaties. We werken met vaste prijsafspraken
          vooraf, volgens de NEN 1010-norm en met garantie op uitgevoerd werk.
        </p>

        <h2>Elektricien in de Baarsjes, Bos en Lommer en Westerpark</h2>
        <p>
          We kennen de straten, panden en meterkasten van Amsterdam West en zijn daardoor snel bij
          u ter plaatse. Van klassieke bovenhuizen tot moderne nieuwbouw — we passen ons werk aan op
          uw specifieke situatie.
        </p>

        <h2>Veelvoorkomend werk in Amsterdam West</h2>
        <ul>
          <li>Storingen in oude bovenhuizen en portiekwoningen</li>
          <li>Perilex- of kookgroep aansluiten voor inductie</li>
          <li>Extra stopcontacten in gerenoveerde woningen</li>
          <li>Groepenkast uitbreiden in kleine meterkasten</li>
          <li>Verlichting voor winkels en horeca in West</li>
        </ul>

        <h2>Spoed elektricien in Amsterdam West</h2>
        <p>
          Zit u zonder stroom, heeft u kortsluiting of springt de aardlekschakelaar er steeds uit? Onze
          <strong> nood elektricien</strong> is 24/7 bereikbaar in Amsterdam West. Bel direct en
          we komen zo snel mogelijk langs om de storing op te lossen.
        </p>

        <h2>Transparante prijs en garantie</h2>
        <p>
          U krijgt altijd een <strong>vaste prijs vooraf</strong>, zodat u nooit voor verrassingen
          staat. Bel of stuur ons een WhatsApp met uw vraag en adres in Amsterdam West, dan
          helpen we u snel verder.
        </p>
      </Prose>
    </ServicePage>
  );
}
