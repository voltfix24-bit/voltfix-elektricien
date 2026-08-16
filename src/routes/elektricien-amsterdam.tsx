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
    q: "Hoe verloopt de opname en wanneer krijg ik de offerte?",
    a: "We plannen eerst een opname op locatie: de monteur bekijkt de meterkast, de bestaande bedrading en het leidingtracé, en bespreekt met u wat er moet gebeuren. Daarna krijgt u een offerte met de werkzaamheden, het materiaal en een vaste prijs. Pas na uw akkoord plannen we de uitvoering in.",
  },
  {
    q: "Hoe lang duurt het voordat gepland werk kan worden uitgevoerd?",
    a: "Dat hangt af van de omvang. Een kookgroep of extra groep doen we meestal in een dagdeel; een groepenkast vervangen kost doorgaans een dag. Bij grotere renovaties werken we in fases en leggen we de dagen vooraf vast, zodat u weet wanneer er iemand in huis is.",
  },
  {
    q: "Moet de stroom er de hele dag uit tijdens het werk?",
    a: "Nee. We onderbreken alleen de groepen waar we aan werken en spreken vooraf af wanneer de hoofdschakelaar eruit moet. Dat blok houden we zo kort mogelijk en plannen we op een moment dat u schikt — handig als u thuiswerkt of een koelkast en vriezer heeft draaien.",
  },
  {
    q: "Wat moet ik regelen met de VvE?",
    a: "Werk in gemeenschappelijke ruimtes, aan de meterkast van het pand of in de schacht vraagt meestal toestemming van de VvE. We leveren daarvoor een omschrijving van de werkzaamheden die u kunt indienen, en stemmen desgewenst rechtstreeks af met de beheerder over toegang tot de meterruimte.",
  },
  {
    q: "Kunnen jullie werken in een bewoonde woning?",
    a: "Ja, dat is het merendeel van ons werk. We dekken af, werken per ruimte en ruimen dagelijks op. In monumenten en oudere panden werken we zo min mogelijk destructief: bestaande tracés volgen, plintgoten of opbouw waar inhakken niet mag.",
  },
  {
    q: "Wat gebeurt er bij oplevering?",
    a: "Na afronding meten we de installatie door en lopen we het werk met u na. U krijgt een meetrapport bij oplevering, 12 maanden garantie op het installatiewerk en 2 jaar fabrieksgarantie op geplaatste materialen.",
  },
  {
    q: "Werken jullie ook voor VvE's, verhuurders en bedrijven in Amsterdam?",
    a: "Ja. We doen periodieke NEN 3140-keuringen voor VvE's en verhuurders, verzorgen elektra voor winkels, kantoren en horeca en werken met één vaste monteur per adres. U krijgt een rapportage per adres en een factuur op naam van de VvE of onderneming.",
  },
  ...priceProcessFaqs.nl.elektricien,
];

export const Route = createFileRoute("/elektricien-amsterdam")({
  head: () => ({
    meta: pageMeta({
      title: "Elektricien inhuren Amsterdam | Installatie & renovatie | VoltFix",
      description:
        "Elektricien inhuren in Amsterdam voor installatie, renovatie of uitbreiding? VoltFix verzorgt de opname, duidelijke offerte, planning en vakkundige oplevering.",
      path: path,
      ogTitle: "Elektricien inhuren in Amsterdam voor gepland werk | VoltFix",
      ogDescription:
        "Opname op locatie, duidelijke offerte, vaste planning en meetrapport bij oplevering. Voor woning, VvE en bedrijf in Amsterdam.",
    }),

    links: [{ rel: "canonical", href: absoluteUrl(path) }, { rel: "preload", as: "image", href: heroImg.url, fetchpriority: "high" }, ...altLinks(path)],
    scripts: [
      ldScript(
        serviceSchema({
          name: "Elektricien inhuren Amsterdam — installatie en renovatie",
          description:
            "Gepland elektrawerk in Amsterdam: opname op locatie, offerte vooraf, vaste planning en oplevering met meetrapport. Installatie, renovatie en uitbreiding voor woning, VvE en bedrijf.",
          path,
        }),
      ),

      ldScript(faqSchema(faqs)),
      ldScript(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Elektricien inhuren Amsterdam", path },
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
      eyebrow="Vaste elektricien voor woning, VvE en bedrijf"
      title="Elektricien Amsterdam"
      intro="Zoekt u een erkende elektricien in Amsterdam voor een groepenkast, kookgroep, laadpaal of keuring? VoltFix werkt met een afgesproken tijdvak, een vaste prijs vooraf en een meetrapport bij oplevering."
      image={heroImg.url}
      imageAlt="VoltFix elektricien aan het werk in een woning in Amsterdam"
      whatsappMessage="Hallo VoltFix, ik zoek een elektricien in Amsterdam."
      faqs={faqs}
    >
      <Prose>
        <p>
          Een <strong>elektricien in Amsterdam</strong> inhuren is vooral een kwestie van
          vertrouwen: u laat iemand aan de vaste installatie van uw woning of pand werken. VoltFix
          is een lokaal team dat dagelijks in de stad werkt — van jaren-30 bovenwoningen tot VvE's
          en bedrijfspanden. Heeft u nú geen stroom of kortsluiting? Ga dan direct naar{" "}
          <a href="/spoed-elektricien-amsterdam">spoed elektricien Amsterdam</a>; op deze pagina
          leest u alles over geplande elektra-klussen.
        </p>

        <h2>Waarvoor huurt u een elektricien in Amsterdam in?</h2>
        <ul>
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
          <li>Extra stopcontacten, schakelaars, buitenverlichting en dimmers</li>
          <li>Aardlekschakelaars die blijven uitschakelen of ontbrekende aarde</li>
          <li>Complete elektra bij verbouwing, keukenrenovatie of dakopbouw</li>
          <li>
            <a href="/stroomstoring-amsterdam">Storingen en kortsluiting</a> opsporen en verhelpen
          </li>
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

        <h2>Drie klussen uit onze week in Amsterdam</h2>
        <h3>Jaren-30 bovenwoning in De Pijp — kookgroep bij inductie</h3>
        <p>
          Bewoners vervingen hun gasfornuis door inductie, maar de meterkast had één keukengroep uit
          de jaren tachtig. We legden een aparte kookgroep aan met{" "}
          <a href="/perilex-amsterdam">perilex-aansluiting</a>, trokken de leiding via het bestaande
          tracé achter het keukenblok en breidden de kast uit met een extra aardlekautomaat. Klaar in
          een halve dag, inclusief meting en rapport.
        </p>
        <h3>Grachtenpand Centrum — VvE met oude stoppenkast</h3>
        <p>
          Bij een VvE aan de grachtengordel bleek de gemeenschappelijke installatie nog zonder
          aardlek te werken. Na een{" "}
          <a href="/keuring-amsterdam">NEN 3140-inspectie</a> hebben we gefaseerd vervangen: eerst
          de trappenhuisverlichting en de meterkast, daarna per woonlaag. Zo bleef het pand bewoonbaar
          en kon de VvE de kosten over twee boekjaren spreiden.
        </p>
        <h3>Appartement IJburg — laadpaal in de parkeergarage</h3>
        <p>
          Een bewoner op Haveneiland wilde laden in de gezamenlijke garage. We berekenden de
          beschikbare capaciteit, stemden af met de VvE en installeerden een{" "}
          <a href="/laadpaal-amsterdam">laadpaal</a> met eigen groep en kWh-meter, zodat het verbruik
          netjes bij de juiste bewoner terechtkomt.
        </p>

        <h2>Werken in de stad: parkeren, VvE's en monumenten</h2>
        <p>
          Elektra in Amsterdam is ook logistiek. Onze monteurs plannen laden en lossen in, kennen de
          vergunningszones per stadsdeel en rekenen geen parkeerkosten door bovenop de afgesproken
          prijs. In appartementen stemmen we vooraf af wie toegang tot de meterruimte regelt, en in{" "}
          <strong>monumentale panden</strong> werken we zo min mogelijk destructief: bestaande
          tracés volgen, plintgoten of opbouw waar inhakken niet is toegestaan, en overleg met de VvE
          voordat we in gemeenschappelijke ruimtes beginnen.
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
