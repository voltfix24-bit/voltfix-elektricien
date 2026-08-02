import { createFileRoute } from "@tanstack/react-router";

import heroImg from "@/assets/voltfix-lamp-ophangen.png.asset.json";
import { ServicePage } from "@/components/service-page";
import { Prose } from "@/components/prose";
import { NeighborhoodLinks } from "@/components/neighborhood-links";
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
import { priceProcessFaqs } from "@/data/service-faqs";
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
    a: "Bij spoed zijn we binnen 60 minuten in heel Amsterdam ter plaatse — 24/7. Voor geplande klussen plannen we meestal binnen enkele werkdagen een afspraak in.",
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
  ...priceProcessFaqs.nl.elektricien,
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
          24/7 bereikbaar — ook 's avonds, in het weekend en op feestdagen. Bij spoed zijn we
          binnen 60 minuten in heel Amsterdam ter plaatse om de oorzaak op te sporen en uw stroom
          weer veilig aan de praat te krijgen.
        </p>

        <h2>Waarvoor kunt u ons inschakelen?</h2>
        <ul>
          <li>
            <a href="/stroomstoring-amsterdam">Storingen, kortsluiting en stroomuitval</a> verhelpen
          </li>
          <li>
            <a href="/Groepenkast-Amsterdam">Groepenkast vervangen</a> of uitbreiden met extra groepen
          </li>
          <li>
            <a href="/perilex-amsterdam">Perilex en kookgroep aansluiten</a> voor inductie of fornuis
          </li>
          <li>
            <a href="/laadpaal-amsterdam">Laadpaal installeren</a> voor uw elektrische auto
          </li>
          <li>
            <a href="/keuring-amsterdam">NEN 1010 / NEN 3140-keuring</a> en veiligheidsinspecties
          </li>
          <li>Extra stopcontacten, schakelaars en verlichting</li>
          <li>Aardlekschakelaars die blijven uitschakelen</li>
          <li>Complete elektra-installaties voor woning en bedrijf</li>
        </ul>

        <h2>Elektra in Amsterdamse panden: wat wij dagelijks tegenkomen</h2>
        <p>
          Amsterdam heeft geen standaard woningvoorraad, en dat zie je terug in de meterkast. In de{" "}
          <strong>grachtenpanden en het Centrum</strong> treffen we nog regelmatig oude stoppenkasten
          zonder aardlekschakelaar aan, vaak in combinatie met kwetsbare bedrading en beperkte
          leidingruimte in monumentale muren. In de <strong>jaren-30 woningen</strong> in Zuid, De
          Pijp en West is de kern van het probleem meestal capaciteit: twee of drie groepen die een
          moderne keuken met inductie, vaatwasser en oven moeten voeden. Dat merkt u aan een groep
          die eruit klapt zodra u meerdere apparaten tegelijk gebruikt — meestal opgelost met een{" "}
          <a href="/Groepenkast-Amsterdam">nieuwe groepenkast</a> of een aparte kookgroep met{" "}
          <a href="/perilex-amsterdam">perilex-aansluiting</a>.
        </p>
        <p>
          In de nieuwbouw op <strong>IJburg, Overhoeks en de Zuidas</strong> is de installatie
          doorgaans modern, maar zien we vooral vragen over uitbreiding: een{" "}
          <a href="/laadpaal-amsterdam">laadpaal in de parkeergarage</a>, extra groepen voor een
          thuiswerkplek of het aanpassen van een installatie na een verbouwing. Voor VvE's en
          verhuurders voeren we daarnaast periodieke{" "}
          <a href="/keuring-amsterdam">elektrakeuringen</a> uit, zodat u aantoonbaar voldoet aan de
          veiligheidsnormen. Wilt u eerst zelf begrijpen hoe een installatie is opgebouwd? Lees dan
          onze uitleg over{" "}
          <a href="/groepenkast-samenstellen">een groepenkast samenstellen</a>.
        </p>


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

        <h2>Zo werkt een afspraak met VoltFix</h2>
        <p>
          U belt, appt of vraagt online een afspraak aan met een concreet aankomstuur (bijvoorbeeld
          14:00 – 15:00), zodat u niet een halve dag hoeft te wachten. We stellen vooraf een paar
          gerichte vragen — welk pand, welke klacht, wat er al is geprobeerd — en nemen de juiste
          materialen direct mee. Ter plaatse krijgt u eerst de diagnose en de prijs, daarna pas het
          werk. Bij <a href="/spoed-elektricien-amsterdam">spoed</a> slaan we die stap over en rijden
          we meteen: binnen 60 minuten in heel Amsterdam.
        </p>
        <p>
          Werkgebied: alle Amsterdamse stadsdelen (postcodes 1011 t/m 1109) plus{" "}
          <a href="/elektricien-amstelveen">Amstelveen</a>,{" "}
          <a href="/elektricien-haarlem">Haarlem</a>, Diemen, Ouder-Amstel en Zaandam. Twijfelt u of
          uw adres binnen het werkgebied valt? <a href="/contact">Neem contact op</a> — we zeggen het
          u meteen.
        </p>




      <NeighborhoodLinks title="Elektricien per wijk en regio" intro="Kies uw wijk of regio voor lokale reactietijden, straten en buurt-specifieke informatie." includeEmergency={true} />
      </Prose>
    </ServicePage>
  );
}
