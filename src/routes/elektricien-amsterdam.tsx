import { createFileRoute } from "@tanstack/react-router";

import heroImg from "@/assets/voltfix-lamp-ophangen.png.asset.json";
import { ServicePage } from "@/components/service-page";
import { Prose } from "@/components/prose";
import {
  absoluteUrl,
  altLinks,
  breadcrumbSchema,
  faqSchema,
  ldScript,
  ogImage,
  serviceSchema,
  pageMeta,
} from "@/lib/seo";
import {
  eurNl,
  firstHourAllInNl,
  firstHourNoteNl,
  fromNl,
  perHourNl,
  prices,
  vatConsumerNoteNl,
} from "@/lib/pricing";


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
    a: "Onze monteurs zijn vakbekwaam en werken volgens de NEN 1010-norm. We geven 12 maanden garantie op installatiewerk en 2 jaar fabrieksgarantie op geplaatste materialen.",
  },
  {
    q: "In welke delen van Amsterdam werken jullie?",
    a: "We werken in heel Amsterdam en directe omgeving, waaronder Centrum, Zuid, West, Oost, Noord, De Pijp, Jordaan en IJburg.",
  },
];

export const Route = createFileRoute("/elektricien-amsterdam")({
  head: () => ({
    meta: pageMeta({
      title: "Elektricien Amsterdam | Snel & Lokaal | VoltFix",
      description:
        "Elektricien in Amsterdam nodig? VoltFix is snel ter plaatse, lokaal en 24/7 bereikbaar voor spoed en nood. Vaste prijs vooraf. Bel direct.",
      path: path,
      ogTitle: "Elektricien Amsterdam | VoltFix",
      ogDescription: "Snel, betrouwbaar en lokaal. 24/7 nood- en spoedservice in heel Amsterdam.",
    }),
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
      image={heroImg.url}
      imageAlt="VoltFix elektricien aan het werk in een woning in Amsterdam"
      whatsappMessage="Hallo VoltFix, ik zoek een elektricien in Amsterdam."
      faqs={faqs}
    >
      <Prose>
        <p>
          Een goede <strong>elektricien in Amsterdam</strong> vinden die snel reageert, eerlijk
          communiceert en vakwerk levert — daar staat VoltFix voor. Of het nu gaat om een acute
          storing, een nieuwe groepenkast of extra stopcontacten: wij helpen u veilig en met een
          vaste prijs vooraf.
        </p>

        <h2>Nood elektricien in Amsterdam</h2>
        <p>
          Zit u zonder stroom of heeft u kortsluiting? Onze <strong>nood elektricien</strong> is
          24/7 bereikbaar — ook 's avonds, in het weekend en op feestdagen. Bij spoed zijn we vaak
          binnen 30 tot 60 minuten ter plaatse in Amsterdam om de oorzaak op te sporen en uw stroom
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

        <h2>Elektricien per stadsdeel en regio</h2>
        <p>
          Wij kennen de stad, de panden en de meterkasten van Amsterdam — van de grachtenpanden in
          het Centrum tot de appartementen op IJburg. Bekijk onze wijk- en regio-specifieke
          pagina's:
        </p>
        <ul>
          <li>
            <a href="/spoed-elektricien-amsterdam"><strong>Spoed elektricien Amsterdam</strong></a> —
            24/7 storingsdienst met reactietijden per wijk
          </li>
          <li>
            <a href="/elektricien-amsterdam-centrum">Elektricien Amsterdam Centrum</a> — Jordaan,
            grachtengordel, Nieuwmarkt, Wallen
          </li>
          <li>
            <a href="/elektricien-amsterdam-zuid">Elektricien Amsterdam Zuid</a> — Apollobuurt,
            Rivierenbuurt, Zuidas
          </li>
          <li>
            <a href="/elektricien-amsterdam-west">Elektricien Amsterdam West</a> — Baarsjes, Bos en
            Lommer, Westerpark
          </li>
          <li>
            <a href="/elektricien-amsterdam-oost">Elektricien Amsterdam Oost</a> — Indische Buurt,
            Watergraafsmeer, Oostelijk Havengebied
          </li>
          <li>
            <a href="/elektricien-amsterdam-noord">Elektricien Amsterdam Noord</a> — NDSM,
            Overhoeks, tuindorpen
          </li>
          <li>
            <a href="/elektricien-amsterdam-de-pijp">Elektricien in De Pijp</a> — Oude Pijp, Nieuwe
            Pijp, Albert Cuyp
          </li>
          <li>
            <a href="/elektricien-amsterdam-ijburg">Elektricien op IJburg</a> — Steigereiland,
            Haveneiland, Centrumeiland
          </li>
          <li>
            <a href="/elektricien-amstelveen">Elektricien Amstelveen</a> — Stadshart, Kronenburg,
            Uilenstede
          </li>
          <li>
            <a href="/elektricien-haarlem">Elektricien Haarlem</a> — Centrum, Schalkwijk, Haarlem-Noord
          </li>
        </ul>


        <h2>Transparante tarieven en garantie</h2>
        <p>
          U krijgt altijd een vaste prijsafspraak vooraf: uurtarief {perHourNl(prices.hourly)} binnen
          kantooruren, storing {firstHourAllInNl(prices.emergencyFirstHour)} (avond/nacht/weekend {firstHourAllInNl(prices.offHoursFirstHour)})
          en een groepenkast vervangen {fromNl(prices.groepenkastFrom)} incl. materiaal. {firstHourNoteNl} {vatConsumerNoteNl} Al ons werk
          voeren we uit volgens de NEN 1010-norm en we geven <strong>garantie op installatiewerk</strong> en
          2 jaar fabrieksgarantie op geplaatste materialen. We werken in heel Amsterdam en de directe
          regio: Amstelveen, Diemen, Ouder-Amstel en Zaandam.
        </p>

      </Prose>
    </ServicePage>
  );
}
