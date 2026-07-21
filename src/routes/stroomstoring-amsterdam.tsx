import { createFileRoute } from "@tanstack/react-router";

import heroImg from "@/assets/voltfix-storing-scene.png.asset.json";
import { ServicePage } from "@/components/service-page";
import { Prose } from "@/components/prose";
import {absoluteUrl, altLinks, breadcrumbSchema, faqSchema, ldScript, ogImage, serviceSchema, pageMeta} from "@/lib/seo";

const path = "/stroomstoring-amsterdam";

const faqs = [
  {
    q: "Wat moet ik doen bij een stroomstoring in Amsterdam?",
    a: "Controleer eerst of alleen uw woning of de hele straat zonder stroom zit. Kijk daarna in de meterkast of een aardlekschakelaar of groep is uitgeschakeld. Lukt het niet om de stroom veilig terug te krijgen, bel dan VoltFix.",
  },
  {
    q: "Hoe weet ik of de storing bij mij of bij de netbeheerder ligt?",
    a: "Zit de hele straat zonder stroom, dan ligt het waarschijnlijk bij netbeheerder Liander. Is alleen uw woning getroffen, dan zit de oorzaak in uw eigen installatie en kunnen wij dit oplossen.",
  },
  {
    q: "Hoe los ik een kortsluiting op?",
    a: "Schakel de doorgeslagen groep uit, trek alle apparaten van die groep los en schakel de groep weer in. Slaat hij opnieuw door, dan is er een defect in de installatie of een apparaat. Bel dan een elektricien om het veilig op te sporen.",
  },
  {
    q: "Waarom slaat mijn aardlekschakelaar steeds door?",
    a: "Een aardlekschakelaar die telkens uitschakelt duidt op een lekstroom, vaak door een defect apparaat, vocht of beschadigde bedrading. Wij sporen de oorzaak gericht op en verhelpen het probleem.",
  },
  {
    q: "Is een stroomstoring gevaarlijk?",
    a: "Een storing zelf is vaak vooral vervelend, maar oorzaken als oververhitte bedrading, vonken of brandlucht zijn wel degelijk gevaarlijk. Bij die signalen moet u direct handelen en een spoed elektricien bellen.",
  },
  {
    q: "Kunnen jullie 's avonds bij een stroomstoring komen?",
    a: "Ja, onze storingsdienst is 24/7 bereikbaar. Ook 's avonds, in het weekend en op feestdagen komen we snel naar u toe in Amsterdam.",
  },
  {
    q: "Wat kost het oplossen van een stroomstoring?",
    a: "U betaalt voorrijkosten en een uurtarief, die we vooraf duidelijk afspreken. Veel storingen zijn bij het eerste bezoek verholpen, zodat de kosten beperkt blijven.",
  },
];

export const Route = createFileRoute("/stroomstoring-amsterdam")({
  head: () => ({
    meta: [
    meta: pageMeta({
      title: "Stroomstoring Amsterdam | Kortsluiting Oplossen | VoltFix",
      description: "Stroomstoring in Amsterdam? VoltFix lost kortsluiting, stroomuitval en doorslaande groepen snel op. Praktische uitleg, veiligheidstips en 24/7 storingsdienst.",
      path: path,
      ogTitle: "Stroomstoring Amsterdam | VoltFix",
      ogDescription: "Kortsluiting en stroomuitval snel opgelost. 24/7 storingsdienst in Amsterdam.",
    }),
    ],
    links: [{ rel: "canonical", href: absoluteUrl(path) }, ...altLinks(path)],
    scripts: [
      ldScript(
        serviceSchema({
          name: "Stroomstoring oplossen Amsterdam",
          description:
            "Opsporen en verhelpen van stroomstoringen, kortsluiting en stroomuitval in Amsterdam. 24/7 storingsdienst.",
          path,
        }),
      ),
      ldScript(faqSchema(faqs)),
      ldScript(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Stroomstoring Amsterdam", path },
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
      eyebrow="Kortsluiting & stroomuitval"
      title="Stroomstoring Amsterdam"
      intro="Plotseling zonder stroom of een groep die telkens doorslaat? VoltFix spoort de oorzaak van uw stroomstoring in Amsterdam snel op en lost het veilig op. 24/7 bereikbaar."
      image={heroImg.url}
      imageAlt="Elektricien van VoltFix onderzoekt een stroomstoring in de meterkast van een woning in Amsterdam"
      whatsappMessage="Hallo VoltFix, ik heb een stroomstoring in Amsterdam, kunnen jullie helpen?"
      faqs={faqs}
    >
      <Prose>
        <p>
          Een stroomstoring is meer dan alleen ongemak: de koelkast valt uit, het
          internet ligt eruit en in het donker wordt elke handeling lastig. Soms
          is het een simpele doorgeslagen groep, soms een serieus defect in de
          installatie. <strong>VoltFix lost stroomstoringen in Amsterdam snel en
          veilig op</strong> en legt u precies uit wat er aan de hand was. Dag en
          nacht bereikbaar, zodat u niet lang in het donker zit.
        </p>

        <h2>Wat is een stroomstoring precies?</h2>
        <p>
          Bij een stroomstoring valt de elektriciteit geheel of gedeeltelijk weg.
          Dat kan verschillende oorzaken hebben. Een{" "}
          <strong>kortsluiting</strong> ontstaat als twee draden ongewenst contact
          maken, waardoor er een veel te grote stroom gaat lopen en de beveiliging
          ingrijpt. <strong>Overbelasting</strong> treedt op als er te veel
          apparaten tegelijk op één groep zijn aangesloten. En een{" "}
          <strong>lekstroom</strong> zorgt ervoor dat de aardlekschakelaar
          uitschakelt om u te beschermen tegen elektrocutie.
        </p>

        <h2>Ligt het aan u of aan de netbeheerder?</h2>
        <p>
          De eerste belangrijke vraag bij een stroomstoring: zit alleen uw woning
          zonder stroom, of de hele straat? Kijk of bij de buren het licht nog
          brandt of of de straatverlichting nog werkt. Is de hele omgeving
          getroffen, dan ligt de storing waarschijnlijk bij de netbeheerder
          (Liander) en kunt u dit bij hen melden. Zit alleen uw woning zonder
          stroom, dan zit de oorzaak in uw eigen installatie — en daar zijn wij voor.
        </p>

        <h2>Stap voor stap: wat u zelf kunt controleren</h2>
        <p>
          Voordat u belt, kunt u vaak al een en ander nagaan. Doe dit alleen als u
          zich veilig voelt:
        </p>
        <ul>
          <li>
            <strong>Kijk in de meterkast.</strong> Staat er een groep of
            aardlekschakelaar in de uit-stand?
          </li>
          <li>
            <strong>Probeer de groep terug te zetten.</strong> Slaat hij meteen weer
            door, laat hem dan uit staan.
          </li>
          <li>
            <strong>Ontkoppel apparaten.</strong> Trek apparaten van de betreffende
            groep los en probeer opnieuw — zo achterhaalt u soms de boosdoener.
          </li>
          <li>
            <strong>Let op signalen.</strong> Ruikt u brand, ziet u rook of vonken,
            of voelt de meterkast warm aan? Blijf er dan vanaf en bel direct.
          </li>
        </ul>

        <h2>Wanneer moet u een elektricien bellen?</h2>
        <p>
          Lukt het niet om de stroom veilig terug te krijgen, of slaat een groep of
          aardlekschakelaar telkens opnieuw door, dan is dat een teken dat er een
          echt defect is. Ook bij brandlucht, beschadigde bedrading, vonken of een
          warme meterkast geldt: niet zelf aan blijven sleutelen, maar een vakman
          inschakelen. VoltFix spoort de oorzaak gericht op met de juiste
          meetapparatuur en verhelpt het probleem bij de bron.
        </p>

        <h2>Kortsluiting oplossen in Amsterdam</h2>
        <p>
          Kortsluiting is een veelvoorkomende oorzaak van storingen, zeker in
          oudere Amsterdamse woningen met verouderde bedrading. Wij meten de
          installatie systematisch door, isoleren de getroffen groep en sporen op
          welk onderdeel of apparaat de kortsluiting veroorzaakt. Vaak is het een
          defect apparaat, een beschadigde kabel of een vochtprobleem. Na de
          reparatie controleren we of de hele installatie weer veilig functioneert.
        </p>

        <h2>Voorkomen is beter dan verhelpen</h2>
        <p>
          Slaan groepen bij u regelmatig door, of heeft uw woning nog een oude
          stoppenkast zonder voldoende aardlekschakelaars? Dan is een terugkerende
          storing vaak een symptoom van een verouderde installatie. In zulke
          gevallen adviseren we u eerlijk of het verstandig is om de{" "}
          <strong>groepenkast te vervangen</strong> of uit te breiden. Zo voorkomt u
          herhaling en verhoogt u de veiligheid in huis.
        </p>

        <h2>24/7 storingsdienst, transparante prijs</h2>
        <p>
          Een stroomstoring houdt zich niet aan kantoortijden. Daarom is VoltFix
          dag en nacht bereikbaar voor storingen in heel Amsterdam. We zijn vaak
          binnen het uur ter plaatse, werken met een vaste prijsafspraak vooraf en
          lossen de meeste storingen direct op. Zit u zonder stroom? Bel ons of
          stuur een WhatsApp met een korte omschrijving en uw adres, dan helpen we
          u snel verder.
        </p>

        <h2>Veelvoorkomende oorzaken van een stroomstoring</h2>
        <p>
          De meeste stroomstoringen in Amsterdam hebben een beperkt aantal
          oorzaken. Vaak is het een defect apparaat dat kortsluiting veroorzaakt
          zodra u het inschakelt — denk aan een kapotte waterkoker, wasmachine of
          oplader. Ook een overbelaste groep komt regelmatig voor, bijvoorbeeld
          wanneer meerdere zware apparaten tegelijk op dezelfde groep draaien. In
          oudere panden spelen vocht en verouderde bedrading een rol, terwijl een
          versleten aardlekschakelaar soms onterecht uitschakelt. Door
          systematisch te meten sluiten we oorzaken één voor één uit, totdat we de
          echte boosdoener hebben gevonden.
        </p>

        <h2>Storing binnen of buiten uw meterkast?</h2>
        <p>
          Een belangrijke eerste vraag is of de storing in uw eigen installatie zit
          of bij de netbeheerder. Zit alleen uw woning zonder stroom, dan ligt de
          oorzaak vrijwel altijd binnen uw meterkast en kunnen wij u direct helpen.
          Is de hele straat of het hele appartementencomplex getroffen, dan gaat het
          meestal om een storing bij netbeheerder Liander. Wij helpen u dit snel
          vaststellen, zodat u niet onnodig wacht. Blijkt het een probleem in uw
          eigen installatie te zijn, dan lossen we het ter plaatse op en adviseren
          we u of een blijvende oplossing — zoals het{" "}
          <strong>vervangen van de groepenkast</strong> — verstandig is om
          herhaling te voorkomen.
        </p>
      </Prose>
    </ServicePage>
  );
}
