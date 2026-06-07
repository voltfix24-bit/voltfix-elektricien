import { createFileRoute } from "@tanstack/react-router";

import heroImg from "@/assets/hero-electrician.jpg";
import { ServicePage } from "@/components/service-page";
import { Prose } from "@/components/prose";
import { absoluteUrl, altLinks, breadcrumbSchema, faqSchema, ldScript, ogImage, serviceSchema } from "@/lib/seo";

const path = "/elektricien-amsterdam";

const faqs = [
  {
    q: "Hoe snel is er een elektricien bij mij in Amsterdam?",
    a: "Bij spoed zoals een storing of kortsluiting zijn we vaak binnen 30 tot 60 minuten ter plaatse in Amsterdam. Voor geplande klussen plannen we meestal binnen enkele werkdagen een afspraak in.",
  },
  {
    q: "Hebben jullie een nood elektricien in Amsterdam?",
    a: "Ja, onze nood- en spoedservice is 24/7 bereikbaar, ook 's avonds, in het weekend en op feestdagen. Bel ons direct en we komen zo snel mogelijk langs.",
  },
  {
    q: "Wat kost een elektricien in Amsterdam?",
    a: "Wij werken met transparante tarieven en een vaste prijsafspraak vooraf. Voorrijkosten en uurtarief bespreken we direct, zodat u nooit voor verrassingen komt te staan.",
  },
  {
    q: "Welke klussen voert VoltFix uit?",
    a: "Van storingen en kortsluiting tot groepenkast vervangen, perilex aansluiten, extra stopcontacten, verlichting en complete installaties — voor woning en bedrijf in heel Amsterdam.",
  },
  {
    q: "Zijn jullie gecertificeerd en geven jullie garantie?",
    a: "Onze monteurs zijn vakbekwaam en werken volgens de NEN 1010-norm. Op uitgevoerd werk en geplaatste materialen geven wij garantie.",
  },
  {
    q: "In welke delen van Amsterdam werken jullie?",
    a: "We werken in heel Amsterdam en directe omgeving, waaronder Centrum, Zuid, West, Oost, Noord, De Pijp, Jordaan en IJburg.",
  },
];

export const Route = createFileRoute("/elektricien-amsterdam")({
  head: () => ({
    meta: [
      { title: "Elektricien Amsterdam | Snel & Lokaal | VoltFix" },
      {
        name: "description",
        content:
          "Elektricien in Amsterdam nodig? VoltFix is snel ter plaatse, lokaal en 24/7 bereikbaar voor spoed en nood. Vaste prijs vooraf. Bel direct.",
      },
      { property: "og:title", content: "Elektricien Amsterdam | VoltFix" },
      {
        property: "og:description",
        content: "Snel, betrouwbaar en lokaal. 24/7 nood- en spoedservice in heel Amsterdam.",
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
          name: "Elektricien Amsterdam",
          description:
            "Lokale elektricien in Amsterdam voor spoed, nood, storingen, groepenkast en alle elektra-installaties.",
          path,
        }),
      ),
      ldScript(faqSchema(faqs)),
      ldScript(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Elektricien Amsterdam", path },
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
      eyebrow="24/7 nood- & spoedservice in Amsterdam"
      title="Elektricien Amsterdam"
      intro="Op zoek naar een betrouwbare elektricien in Amsterdam? VoltFix is snel ter plaatse bij storingen en nood, en vakkundig bij installaties. Altijd een vaste prijs vooraf."
      image={heroImg}
      imageAlt="VoltFix elektricien aan het werk in een woning in Amsterdam"
      whatsappMessage="Hallo VoltFix, ik zoek een elektricien in Amsterdam."
      faqs={faqs}
    >

      <Prose>
        <p>
          Een goede <strong>elektricien in Amsterdam</strong> vinden die snel
          reageert, eerlijk communiceert en vakwerk levert — daar staat VoltFix
          voor. Of het nu gaat om een acute storing, een nieuwe groepenkast of
          extra stopcontacten: wij helpen u veilig en met een vaste prijs vooraf.
        </p>

        <h2>Nood elektricien in Amsterdam</h2>
        <p>
          Zit u zonder stroom of heeft u kortsluiting? Onze{" "}
          <strong>nood elektricien</strong> is 24/7 bereikbaar — ook 's avonds, in
          het weekend en op feestdagen. Bij spoed zijn we vaak binnen 30 tot 60
          minuten ter plaatse in Amsterdam om de oorzaak op te sporen en uw stroom
          weer veilig aan de praat te krijgen.
        </p>

        <h2>Waarvoor kunt u ons inschakelen?</h2>
        <ul>
          <li>Storingen, kortsluiting en stroomuitval verhelpen</li>
          <li>Groepenkast vervangen of uitbreiden met extra groepen</li>
          <li>Perilex en kookgroep aansluiten voor inductie of fornuis</li>
          <li>Extra stopcontacten, schakelaars en verlichting</li>
          <li>Aardlekschakelaars en veiligheidsinspecties</li>
          <li>Complete elektra-installaties voor woning en bedrijf</li>
        </ul>

        <h2>Lokaal en snel in heel Amsterdam</h2>
        <p>
          Wij kennen de stad, de panden en de meterkasten van Amsterdam — van de
          grachtenpanden in het Centrum tot de appartementen op IJburg. Daardoor
          zijn we snel bij u en weten we precies waar we op moeten letten in
          oudere én nieuwere woningen.
        </p>

        <h2>Transparante tarieven en garantie</h2>
        <p>
          U krijgt altijd een vaste prijsafspraak vooraf, zodat u nooit voor
          verrassingen komt te staan. Al ons werk voeren we uit volgens de NEN
          1010-norm en we geven garantie op uitgevoerd werk en geplaatste
          materialen. Bel ons of stuur een WhatsApp met uw vraag en adres in
          Amsterdam, dan helpen we u verder.
        </p>
      </Prose>
    </ServicePage>
  );
}
