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
  serviceSchema,
  pageMeta,
} from "@/lib/seo";
import { fromNl, perHourNl, prices, vatConsumerNoteNl } from "@/lib/pricing";
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

      ldScript(faqSchema(faqs, "nl", path)),
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
      eyebrow="Gepland elektrawerk, installatie en renovatie"
      title="Elektricien inhuren in Amsterdam voor gepland werk"
      intro="Installatie, renovatie of uitbreiding van uw elektra? VoltFix begint met een opname op locatie, stuurt een duidelijke offerte, plant het werk vast in en levert op met controle en meetrapport."
      image={heroImg.url}
      imageAlt="VoltFix elektricien voert gepland installatiewerk uit in een woning in Amsterdam"
      whatsappMessage="Hallo VoltFix, ik wil een elektricien inhuren voor gepland werk."
      faqs={faqs}
    >
      <Prose>
        <div className="not-prose mb-10 rounded-2xl border border-border bg-surface p-6">
          <p className="text-base font-semibold text-foreground">Zo start u een geplande klus</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="#installatiemoment"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:brightness-110"
            >
              Plan een opname
            </a>
            <a
              href="/contact#offerte"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-input bg-background px-5 text-sm font-bold text-foreground transition hover:bg-accent"
            >
              Vraag een offerte aan
            </a>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Geen stroom of kortsluiting op dit moment? Dan bent u sneller geholpen bij{" "}
            <a href="/spoed-elektricien-amsterdam" className="font-medium text-primary underline underline-offset-4">
              spoed elektricien Amsterdam
            </a>
            .
          </p>
        </div>

        <p>
          Bij gepland elektrawerk is niet snelheid maar voorbereiding doorslaggevend. U wilt weten
          wat er gebeurt, wat het kost, hoe lang de stroom eruit gaat en wanneer de monteur voor de
          deur staat. VoltFix werkt daarom altijd in dezelfde volgorde: opname, offerte, planning,
          uitvoering en oplevering — voor woningen, VvE's en bedrijfspanden in Amsterdam.
        </p>

        <h2>Wanneer kiest u gepland werk in plaats van spoed?</h2>
        <p>
          Spoed is er voor situaties die niet kunnen wachten: geen stroom, kortsluiting, brandlucht
          of een aardlek die er telkens uit blijft klappen. Alles wat u vooruit kunt schuiven, is
          beter af als geplande klus. U betaalt dan het reguliere uurtarief in plaats van een
          storingstarief, we nemen het juiste materiaal in één keer mee en het werk kan in één
          aaneengesloten blok worden gedaan in plaats van in twee bezoeken.
        </p>
        <ul>
          <li>Verbouwing, keukenrenovatie of dakopbouw met nieuwe leidingen en groepen</li>
          <li>
            <a href="/groepenkast-amsterdam">Groepenkast vervangen</a> of uitbreiden met extra groepen
          </li>
          <li>
            <a href="/perilex-amsterdam">Perilex en kookgroep aansluiten</a> voor inductie of fornuis
          </li>
          <li>
            <a href="/laadpaal-amsterdam">Laadpaal installeren</a> aan huis of in een VvE-garage
          </li>
          <li>
            <a href="/keuring-amsterdam">NEN 1010 / NEN 3140-keuring</a> vóór verkoop, verhuur of overdracht
          </li>
          <li>Extra stopcontacten, verlichting, buitenaansluitingen en dimmers</li>
        </ul>

        <h2>Intake, opname en offerte</h2>
        <p>
          Het begint met een korte intake: welk pand, wat u wilt bereiken en wat er nu in de
          meterkast zit. Vaak volstaan een paar foto's van de kast en de plek van de klus. Bij
          grotere klussen komen we langs voor een opname op locatie. De monteur bekijkt de
          capaciteit van de installatie, het bestaande leidingtracé, de aanwezigheid van aarde en de
          bereikbaarheid van schachten en kruipruimte.
        </p>
        <p>
          Daarna krijgt u een offerte waarin het werk, het materiaal en de prijs staan. Ons
          uurtarief is {perHourNl(prices.hourly)} binnen kantooruren; een groepenkast vervangen doen
          we {fromNl(prices.groepenkastFrom)} inclusief materiaal. {vatConsumerNoteNl} Pas na uw
          akkoord reserveren we de dagen in de planning. Blijkt tijdens de uitvoering dat er iets
          extra's nodig is, dan stopt de monteur en hoort u eerst wat dat kost.
        </p>

        <h2>Doorlooptijd en werkplanning</h2>
        <p>
          Voor kleine klussen — een extra groep, een kookgroep, een paar stopcontacten — plannen we
          een dagdeel met een aankomstuur, bijvoorbeeld 09:00 – 10:00. Een groepenkast vervangen
          kost doorgaans een volledige werkdag. Bij een renovatie werken we in fases: eerst het
          hakwerk en de leidingen (ruwbouw), later het afmonteren en meten (afbouw), afgestemd op de
          stukadoor of keukenleverancier. U krijgt de dagen vooraf op papier zodat u weet wanneer er
          iemand in huis is.
        </p>

        <h2>Werken in een bewoonde woning</h2>
        <p>
          De meeste klussen doen we terwijl u gewoon thuis woont. We dekken vloeren en meubels af,
          werken per ruimte en ruimen aan het eind van elke dag op. Boren en hakken plannen we in
          het midden van de dag — prettig voor uzelf en voor de buren in een portiek of
          appartementencomplex. Waar mogelijk gebruiken we bestaande leidingtracés, zodat er minder
          hak- en herstelwerk nodig is.
        </p>

        <h3>Geplande stroomonderbrekingen</h3>
        <p>
          Alleen de groepen waaraan we werken gaan eruit. Voor het aansluiten of vervangen van een
          groepenkast moet de hoofdschakelaar korte tijd uit; dat blok spreken we vooraf af en
          houden we zo kort mogelijk. Werkt u thuis of heeft u een vriezer, serverkast of medische
          apparatuur? Geef dat bij de intake aan, dan plannen we de onderbreking daaromheen.
        </p>

        <h3>VvE-toestemming en afstemming</h3>
        <p>
          Werk aan de meterruimte, de schacht of gemeenschappelijke ruimtes vraagt meestal
          toestemming van de VvE of de beheerder. Wij leveren een omschrijving van de
          werkzaamheden die u kunt indienen en stemmen desgewenst rechtstreeks af over toegang tot
          de meterruimte, laden en lossen en de werktijden in het pand. Voor VvE's voeren we
          daarnaast periodieke <a href="/keuring-amsterdam">elektrakeuringen</a> uit.
        </p>

        <h2>Renovatie van oudere Amsterdamse woningen</h2>
        <p>
          In grachtenpanden en vooroorlogse woningen komen we nog regelmatig oude stoppenkasten
          zonder aardlekschakelaar tegen, in combinatie met kwetsbare bedrading en weinig
          leidingruimte in monumentale muren. In jaren-30 woningen in Zuid, De Pijp en West is het
          knelpunt meestal capaciteit: twee of drie groepen die een moderne keuken moeten voeden. In
          monumenten werken we zo min mogelijk destructief — bestaande tracés volgen, plintgoten of
          opbouw waar inhakken niet is toegestaan, en gefaseerd vervangen met voorrang voor de
          onveiligste groepen. Wilt u eerst begrijpen hoe een installatie is opgebouwd? Lees onze
          uitleg over <a href="/groepenkast-samenstellen">een groepenkast samenstellen</a>.
        </p>

        <h2>Drie geplande trajecten uit onze praktijk</h2>
        <h3>Jaren-30 bovenwoning in De Pijp — kookgroep bij inductie</h3>
        <p>
          Bewoners vervingen hun gasfornuis door inductie en meldden dat ruim voor de keukenmontage
          aan. Na opname legden we een aparte kookgroep aan met{" "}
          <a href="/perilex-amsterdam">perilex-aansluiting</a>, via het bestaande tracé achter het
          keukenblok, en breidden we de kast uit met een extra aardlekautomaat. Uitvoering in een
          halve dag op de afgesproken datum, inclusief meting en rapport.
        </p>
        <h3>Grachtenpand Centrum — VvE met oude stoppenkast</h3>
        <p>
          Bij een VvE aan de grachtengordel bleek de gemeenschappelijke installatie nog zonder
          aardlek te werken. Na een <a href="/keuring-amsterdam">NEN 3140-inspectie</a> maakten we
          een gefaseerd plan: eerst de trappenhuisverlichting en de meterkast, daarna per woonlaag.
          Zo bleef het pand bewoonbaar en kon de VvE de kosten over twee boekjaren spreiden.
        </p>
        <h3>Appartement IJburg — laadpaal in de parkeergarage</h3>
        <p>
          Een bewoner op Haveneiland wilde laden in de gezamenlijke garage. We berekenden de
          beschikbare capaciteit, leverden de onderbouwing voor de VvE-aanvraag en installeerden na
          goedkeuring een <a href="/laadpaal-amsterdam">laadpaal</a> met eigen groep en kWh-meter,
          zodat het verbruik bij de juiste bewoner terechtkomt.
        </p>

        <h2>Oplevering, controle en garantie</h2>
        <p>
          Al ons werk voeren we uit volgens de NEN 1010-norm. Bij oplevering meten we de installatie
          door — isolatieweerstand, aardverbinding en de werking van de aardlekschakelaars — en
          lopen we het resultaat met u na. U ontvangt een meetrapport, 12 maanden garantie op het
          installatiewerk en 2 jaar fabrieksgarantie op geplaatste materialen. Dat rapport is ook
          bruikbaar richting uw verzekeraar of bij verkoop van de woning.
        </p>

        <h2>Werkgebied en afstemming ter plaatse</h2>
        <p>
          We werken in alle Amsterdamse stadsdelen (postcodes 1011 t/m 1109) plus{" "}
          <a href="/elektricien-amstelveen">Amstelveen</a>,{" "}
          <a href="/elektricien-haarlem">Haarlem</a>, Diemen, Ouder-Amstel en Zaandam. Onze monteurs
          plannen laden en lossen in en kennen de vergunningszones per stadsdeel; parkeerkosten
          rekenen we niet apart door bovenop de afgesproken prijs. Twijfelt u of uw adres binnen het
          werkgebied valt? <a href="/contact">Neem contact op</a> — we zeggen het u meteen.
        </p>

      <NeighborhoodLinks title="Gepland elektrawerk per wijk en regio" intro="Kies uw wijk of regio voor lokale informatie over panden, bereikbaarheid en werkzaamheden." includeEmergency={false} />

      </Prose>
    </ServicePage>
  );
}
