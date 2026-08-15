import { createFileRoute } from "@tanstack/react-router";

import heroImg from "@/assets/voltfix-lamp-ophangen.webp.asset.json";
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
  eurNl,
  firstHourAllInNl,
  firstHourNoteNl,
  fromNl,
  perHourNl,
  prices,
  vatConsumerNoteNl,
} from "@/lib/pricing";
import { priceProcessFaqs } from "@/data/service-faqs";


const path = "/elektricien-amsterdam";

const faqs = [
  {
    q: "Wanneer heb ik een erkende elektricien nodig en wat mag ik zelf?",
    a: "Een stopcontact vervangen mag u zelf, maar alles wat de vaste installatie raakt — een groep bijleggen, de groepenkast aanpassen, een kookgroep of laadpaal aansluiten — hoort bij een vakman. Die klussen moeten volgens NEN 1010 worden aangelegd én gemeten. Verzekeraars vragen bij schade regelmatig naar dat bewijs; wij leveren daarom een meetrapport bij oplevering.",
  },
  {
    q: "Werken jullie ook voor VvE's, verhuurders en bedrijven in Amsterdam?",
    a: "Ja. We doen periodieke NEN 3140-keuringen voor VvE's en verhuurders, verhelpen storingen in gemeenschappelijke ruimtes en verzorgen elektra voor winkels, kantoren en horeca. U krijgt één vaste monteur, een rapportage per adres en een factuur op naam van de VvE of onderneming.",
  },
  {
    q: "Kan ik een vast tijdvak afspreken in plaats van een hele dag wachten?",
    a: "Ja. Voor geplande klussen spreken we een aankomstuur af (bijvoorbeeld 14:00 – 15:00) en belt de monteur onderweg. Zo hoeft u geen halve dag vrij te nemen — handig in de stad, waar parkeren en laden vaak strak gepland moeten worden.",
  },
  {
    q: "Hoe gaan jullie om met monumentale panden en grachtenpanden?",
    a: "In monumenten werken we zo min mogelijk destructief: we volgen bestaande leidingtracés, gebruiken opbouw of plintgoten waar inhakken niet mag en overleggen bij twijfel met de VvE of eigenaar. Oude bedrading en ontbrekende aarde pakken we stapsgewijs aan, met voorrang voor de groepen die het meest onveilig zijn.",
  },
  {
    q: "Welke klussen voert VoltFix uit?",
    a: "Van groepenkast vervangen, perilex en kookgroepen, laadpalen en extra groepen tot verlichting, stopcontacten, aardlekschakelaars, NEN-keuringen en complete installaties — voor woning, VvE en bedrijf in heel Amsterdam.",
  },
  {
    q: "Zijn jullie gecertificeerd en geven jullie garantie?",
    a: "Onze monteurs zijn vakbekwaam (VCA, MBO niveau 4) en werken volgens de NEN 1010-norm. U krijgt 12 maanden garantie op installatiewerk en 2 jaar fabrieksgarantie op geplaatste materialen.",
  },
  {
    q: "In welke delen van Amsterdam werken jullie?",
    a: "We werken in heel Amsterdam (postcodes 1011 t/m 1109) en directe omgeving, waaronder Centrum, Zuid, West, Oost, Noord, De Pijp, Jordaan, IJburg, plus Amstelveen, Haarlem, Diemen, Ouder-Amstel en Zaandam.",
  },
  ...priceProcessFaqs.nl.elektricien,
];

export const Route = createFileRoute("/elektricien-amsterdam")({
  head: () => ({
    meta: pageMeta({
      title: "Elektricien Amsterdam inhuren | VoltFix",
      description:
        "Vaste elektricien in Amsterdam voor groepenkast, kookgroep, laadpaal en keuring. Vast tijdvak, prijs vooraf, NEN 1010 en meetrapport. Bel of app.",
      path: path,
      ogTitle: "Elektricien Amsterdam inhuren | VoltFix",
      ogDescription:
        "Erkende elektricien voor woning, VvE en bedrijf in Amsterdam. Vast tijdvak, vaste prijs en meetrapport bij oplevering.",
    }),

    links: [{ rel: "canonical", href: absoluteUrl(path) }, { rel: "preload", as: "image", href: heroImg.url, fetchpriority: "high" }, ...altLinks(path)],
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
            <a href="/groepenkast-amsterdam">Groepenkast vervangen</a> of uitbreiden met extra groepen
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
          <a href="/groepenkast-amsterdam">nieuwe groepenkast</a> of een aparte kookgroep met{" "}
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
