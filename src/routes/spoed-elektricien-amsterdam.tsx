import { createFileRoute } from "@tanstack/react-router";

import heroImg from "@/assets/voltfix-spoed-scene.png.asset.json";
import { ServicePage } from "@/components/service-page";
import { Prose } from "@/components/prose";
import { EmergencyFlowchart } from "@/components/emergency-flowchart";
import { ResponseTimes } from "@/components/response-times";
import type { PriceRow } from "@/components/price-indicator";
import {
  allInSublabelNl,
  emergencyOfficeHoursNoteNl,
  eurNl,
  firstHourAllInNl,
  firstHourNoteNl,
  offHoursReasonNoteNl,
  prices,
  vatConsumerNoteNl,
} from "@/lib/pricing";

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

const path = "/spoed-elektricien-amsterdam";

const priceRows: PriceRow[] = [
  {
    title: "Storing — kantooruren (ma–vr 08:00–18:00)",
    price: firstHourAllInNl(prices.emergencyFirstHour),
    unit: allInSublabelNl,
    points: [
      "Ook bij spoed binnen kantooruren geldt gewoon dit tarief — geen toeslag",
      "Vaak binnen het uur ter plaatse",
      "Prijs vooraf, geen verrassingen",
    ],
    featured: true,
  },
  {
    title: "Avond, nacht & weekend",
    price: firstHourAllInNl(prices.offHoursFirstHour),
    unit: allInSublabelNl,
    points: [
      "Na 18:00, weekend en feestdagen",
      "Dit is het tarief dat we onze monteurs voor die uren betalen",
      "Directe telefonische inschatting",
    ],
  },
];




const faqs = [
  {
    q: "Hoe snel is een spoed elektricien in Amsterdam bij mij?",
    a: "Bij spoed zijn we binnen 60 minuten in heel Amsterdam ter plaatse. In Centrum, Zuid, West, Oost en De Pijp meestal binnen 20–40 minuten; in Noord, IJburg, Zuidoost en Amstelveen doorgaans 40–60 minuten, afhankelijk van tijdstip en verkeer.",
  },
  {
    q: "Kan ik 's nachts of in het weekend een spoed elektricien bellen?",
    a: "Ja, onze spoedservice is 24 uur per dag en 7 dagen per week beschikbaar, ook 's nachts, in het weekend en op feestdagen. Bel 06 45 19 35 89 — u krijgt direct een vakman aan de lijn, geen callcenter.",
  },
  {
    q: "Wat moet ik doen bij kortsluiting of een doorgeslagen groep?",
    a: "Zet de hoofdschakelaar uit, raak geen blootliggende draden aan en houd kinderen en huisdieren uit de buurt. Trek verdachte apparaten uit het stopcontact. Bel daarna direct VoltFix; wij vinden de oorzaak en lossen het veilig op.",
  },
  {
    q: "Wat kost een spoed elektricien in Amsterdam?",
    a: `Binnen kantooruren (ma–vr 08:00–18:00) is een storing ${firstHourAllInNl(prices.emergencyFirstHour)}. In de avond, nacht, het weekend en op feestdagen ${firstHourAllInNl(prices.offHoursFirstHour)}. ${allInSublabelNl.charAt(0).toUpperCase() + allInSublabelNl.slice(1)}. ${firstHourNoteNl} ${vatConsumerNoteNl} U hoort de eindprijs vóór we starten — ook 's nachts.`,
  },
  {
    q: "Kom ik voor verrassingen te staan als de storing langer duurt?",
    a: "Nee. Nooit een verrassing op de factuur: loopt het uit of is er extra materiaal nodig, dan stopt de monteur en hoort u eerst wat het extra kost. Pas daarna gaan we door — nooit extra werk of kosten zonder uw akkoord vooraf.",
  },
  {
    q: "Geven jullie garantie op spoedreparaties?",
    a: "Ja. U krijgt garantie op installatiewerk en 2 jaar fabrieksgarantie op geplaatste materialen (aardlekschakelaars, groepenkast-componenten, perilex-materiaal). Ook bij een spoedreparatie 's nachts of in het weekend.",
  },

  {
    q: "Mijn hele straat zit zonder stroom, kunnen jullie helpen?",
    a: "Is de storing buiten uw meterkast, dan ligt het vaak bij netbeheerder Liander (0800-9009). Wij helpen u dit binnen enkele minuten telefonisch vaststellen en lossen alles binnen uw eigen installatie op.",
  },
  {
    q: "Lossen jullie ook storingen op in bedrijfspanden en horeca?",
    a: "Zeker. We helpen zowel particulieren als bedrijven, horeca en winkels in Amsterdam bij acute storingen, uitval van groepen en meterkastproblemen — vaak buiten openingstijden om zodat u geen omzet mist.",
  },
  {
    q: "Wat als de storing 's avonds laat optreedt?",
    a: "Bel ons gerust, ook laat op de avond. Onze monteurs zijn ingericht op spoedwerk en nemen de juiste materialen mee om uw probleem direct te verhelpen — meestal in één bezoek.",
  },
  {
    q: "Springt de aardlekschakelaar continu uit — is dat spoed?",
    a: "Als de aardlekschakelaar direct terugvalt na inschakelen én u kunt geen apparaat vinden dat de oorzaak is, dan is dat een sterke indicatie voor een defect in de vaste installatie. Dat kan gevaarlijk zijn (kans op elektrocutie of brand) en behandelen wij als spoed.",
  },
  {
    q: "Ruikt het naar brand of komt er rook uit de meterkast — wat te doen?",
    a: "Zet direct de hoofdschakelaar uit, houd afstand, open ramen en bel 112 als er zichtbaar vuur is. Bel daarna VoltFix — dit is altijd acute spoed en we komen zo snel mogelijk. Raak de kast niet aan.",
  },
  {
    q: "Werken jullie in heel Amsterdam en de regio?",
    a: "Ja: heel Amsterdam (Centrum, Zuid, West, Oost, Noord, De Pijp, IJburg), Amstelveen, Diemen, Duivendrecht en Haarlem vallen in ons dagelijkse werkgebied — 24/7 bij spoed.",
  },
];


export const Route = createFileRoute("/spoed-elektricien-amsterdam")({
  head: () => ({
    meta: pageMeta({
      title: "Spoed Elektricien Amsterdam | 24/7 Storingsdienst | VoltFix",
      description:
        "Spoed elektricien Amsterdam nodig? VoltFix is 24/7 bereikbaar bij storingen, kortsluiting, stroomuitval en meterkastproblemen. Vaak binnen het uur ter plaatse.",
      path: path,
      ogTitle: "Spoed Elektricien Amsterdam | VoltFix",
      ogDescription: "24/7 storingsdienst in heel Amsterdam. Vaak binnen het uur ter plaatse.",
    }),
    links: [{ rel: "canonical", href: absoluteUrl(path) }, ...altLinks(path)],
    scripts: [
      ldScript(
        serviceSchema({
          name: "Spoed elektricien Amsterdam",
          description:
            "24/7 spoedservice voor storingen, kortsluiting, stroomuitval en meterkastproblemen in Amsterdam.",
          path,
        }),
      ),
      ldScript(faqSchema(faqs)),
      ldScript(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Spoed elektricien Amsterdam", path },
        ]),
      ),
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ServicePage reviewCategory="spoed"
      path={path}
      eyebrow="24/7 storingsdienst"
      title="Spoed elektricien Amsterdam"
      intro="Storing, kortsluiting of plotseling zonder stroom? VoltFix is uw spoed elektricien in Amsterdam. Dag en nacht bereikbaar en vaak binnen het uur bij u thuis of in uw bedrijf."
      image={heroImg.url}
      imageAlt="Spoed elektricien van VoltFix lost een storing op in een meterkast in Amsterdam"
      whatsappMessage="Hallo VoltFix, ik heb met spoed een elektricien nodig in Amsterdam."
      faqs={faqs}
      priceTitle="Tarieven spoedservice"
      priceIntro={`${emergencyOfficeHoursNoteNl} ${offHoursReasonNoteNl} ${firstHourNoteNl} ${vatConsumerNoteNl}`}
      priceRows={priceRows}

      beforeContent={
        <>
          <EmergencyFlowchart message="Hallo VoltFix, ik heb met spoed een elektricien nodig in Amsterdam." />
          <ResponseTimes />
        </>
      }
    >
      <Prose>


        <p>
          Een elektrische storing komt altijd op het verkeerde moment. Of het nu midden in de nacht
          is, tijdens het koken of net als u aan het thuiswerken bent — zonder stroom valt het hele
          huishouden stil. <strong>VoltFix is uw spoed elektricien in Amsterdam</strong> en staat 24
          uur per dag, 7 dagen per week voor u klaar. Wij komen snel ter plaatse, sporen de oorzaak
          op en zorgen dat u weer veilig stroom heeft.
        </p>

        <h2>Wanneer belt u een spoed elektricien?</h2>
        <p>
          Sommige situaties kunnen niet wachten tot morgen. Bel direct een spoed elektricien in
          Amsterdam bij:
        </p>
        <ul>
          <li>
            <strong>Kortsluiting</strong> waarbij de stroom telkens uitvalt of een groep niet meer
            aan blijft.
          </li>
          <li>
            <strong>Volledige stroomuitval</strong> in uw woning of bedrijfspand.
          </li>
          <li>
            <strong>Een doorgeslagen aardlekschakelaar</strong> die niet meer terug wil.
          </li>
          <li>
            <strong>Brandlucht, vonken of een warme meterkast</strong> — dit is altijd acuut
            gevaarlijk.
          </li>
          <li>
            <strong>Uitval van belangrijke apparaten</strong> zoals de cv-ketel, koeling of
            beveiliging.
          </li>
          <li>
            <strong>Beschadigde kabels of stopcontacten</strong> na een verbouwing of waterschade.
          </li>
        </ul>
        <p>
          Twijfelt u of uw situatie spoed is? Bel ons gerust. We schatten samen telefonisch in hoe
          acuut het is en wat u veilig zelf kunt doen tot we er zijn.
        </p>

        <h2>Snel ter plaatse in heel Amsterdam</h2>
        <p>
          VoltFix is een lokale elektricien en kent Amsterdam op zijn duimpje. Of u nu in het
          Centrum, in Zuid, West, Oost, Noord, De Pijp, de Jordaan of op IJburg woont — onze
          monteurs zijn bij spoed binnen 60 minuten bij u — in heel Amsterdam. We rijden met een volledig
          uitgeruste bus, zodat we de meeste storingen direct bij het eerste bezoek kunnen
          verhelpen. Geen onnodige tweede afspraak, maar meteen een oplossing.
        </p>

        <h2>Zo werkt onze storingsdienst</h2>
        <p>Bij een spoedmelding werken we snel én zorgvuldig. Onze aanpak in het kort:</p>
        <ul>
          <li>
            <strong>1. Telefonische inschatting.</strong> We vragen wat er aan de hand is en geven u
            direct veiligheidsadvies.
          </li>
          <li>
            <strong>2. Snel onderweg.</strong> Een monteur vertrekt zo snel mogelijk naar uw adres
            in Amsterdam.
          </li>
          <li>
            <strong>3. Diagnose ter plaatse.</strong> We meten de installatie door en sporen de
            oorzaak van de storing op.
          </li>
          <li>
            <strong>4. Prijsafspraak vooraf.</strong> U weet wat het kost voordat we de reparatie
            uitvoeren.
          </li>
          <li>
            <strong>5. Veilig herstel.</strong> We lossen het probleem op en controleren of alles
            weer veilig functioneert.
          </li>
        </ul>

        <h2>Veelvoorkomende storingen die wij oplossen</h2>
        <p>
          Veel storingen in Amsterdamse woningen hebben een herkenbare oorzaak. Denk aan een defecte
          aardlekschakelaar, een overbelaste groep door te veel apparaten, vochtproblemen in oudere
          panden, of een kapot stopcontact. In monumentale grachtenpanden komen we regelmatig oude
          bedrading tegen die niet meer voldoet aan de huidige veiligheidseisen. Wij verhelpen niet
          alleen de storing, maar adviseren u ook eerlijk of een blijvende oplossing — zoals het{" "}
          <strong>vervangen van de groepenkast</strong> — verstandig is.
        </p>

        <h2>Wat u zelf kunt doen bij een storing</h2>
        <p>
          Voordat wij arriveren kunt u vaak al iets doen om de situatie veilig te houden. Controleer
          eerst of alleen uw woning getroffen is of de hele straat; bij een straatbrede uitval ligt
          het meestal bij netbeheerder Liander. Schakel bij twijfel de hoofdschakelaar uit, trek
          apparaten uit het stopcontact die de storing kunnen veroorzaken en raak nooit
          blootliggende of beschadigde draden aan. Ruikt u brand of ziet u rook uit de meterkast?
          Houd dan afstand en bel direct.
        </p>

        <h2>Transparante tarieven, ook bij spoed</h2>
        <p>
          Spoed betekent bij VoltFix geen onduidelijke rekening achteraf. We werken met heldere
          voorrijkosten en een vast uurtarief en bespreken de prijs altijd vooraf. Zo weet u precies
          waar u aan toe bent, ook als we 's avonds of in het weekend komen. Geen kleine lettertjes,
          gewoon eerlijk vakwerk tegen een faire prijs.
        </p>
        <p>
          Heeft u nu een elektricien met spoed nodig in Amsterdam? Bel direct, of stuur ons een
          WhatsApp met een korte omschrijving en uw adres. VoltFix staat voor u klaar.
        </p>

        <h2>Spoed elektricien voor elke woning in Amsterdam</h2>
        <p>
          Amsterdam kent enorm uiteenlopende woningen, en elk type pand heeft zijn eigen risico's
          bij een storing. In de oude grachtenpanden van het Centrum en de Jordaan komen we vaak
          verouderde bedrading en stoffen mantelkabels tegen die gevoelig zijn voor kortsluiting. In
          de jaren-30 woningen in Zuid en Oost zien we regelmatig overbelaste groepen omdat moderne
          apparatuur meer vraagt dan de oorspronkelijke installatie aankan. En in de nieuwbouw op
          IJburg of in Zuidoost gaat het juist vaker om een doorgeslagen aardlekschakelaar of een
          defect apparaat. Onze monteurs herkennen deze patronen direct en weten daardoor snel waar
          ze moeten zoeken.
        </p>

        <h2>Spoed elektricien per wijk in Amsterdam</h2>
        <p>
          In <strong>Amsterdam Centrum</strong> en de <strong>Jordaan</strong> komen we bij spoed
          vaak binnen 30 minuten — meestal een storing in een grachtenpand door verouderde
          bedrading of vocht. In <strong>Amsterdam Zuid</strong> (Apollobuurt, Rivierenbuurt,
          Zuidas) is de meest voorkomende spoedmelding een aardlekschakelaar die uitspringt door
          een overbelaste groep. <strong>Amsterdam West</strong> (De Baarsjes, Bos en Lommer) en{" "}
          <strong>De Pijp</strong> kennen veel bovenhuizen waar één te oude groepenkast de hele
          etage lam legt. In <strong>Amsterdam Oost</strong>, op <strong>KNSM en Java-eiland</strong>{" "}
          en op <strong>IJburg</strong> gaat het vaak om nieuwbouw-storingen: defecte
          aardlekschakelaars of problemen met warmtepomp of laadpaal. In{" "}
          <strong>Amsterdam Noord</strong> en <strong>Amstelveen</strong> rijden we via de
          IJ-tunnel of A9 en zijn we meestal binnen 45–60 minuten ter plaatse.
        </p>

        <h2>Storingscodes die u zelf kunt herkennen</h2>
        <ul>
          <li>
            <strong>Alle groepen dood, aardlekschakelaar boven staat uit:</strong> vaak een lekstroom.
            Schakel alle groepen uit, zet de aardlek terug en schakel groepen één voor één in — de
            groep die uitvalt, veroorzaakt de fout.
          </li>
          <li>
            <strong>Eén groep valt uit, rest werkt:</strong> waarschijnlijk overbelasting of
            kortsluiting op die groep. Trek apparaten van die groep los en probeer opnieuw.
          </li>
          <li>
            <strong>Slimme meter knippert of geeft foutcode:</strong> dat is meestal een probleem
            van netbeheerder Liander — bel 0800-9009.
          </li>
          <li>
            <strong>Meterkast is warm of ruikt:</strong> altijd acute spoed. Hoofdschakelaar uit
            en direct bellen.
          </li>
        </ul>

        <h2>Direct geschakeld, ook buiten kantooruren</h2>
        <p>
          Een goede spoed elektricien is niet alleen snel ter plaatse, maar ook telefonisch direct
          bereikbaar. Wanneer u belt, krijgt u meteen een vakman aan de lijn die meedenkt — geen
          wachtrij en geen callcenter. We stellen een paar gerichte vragen, geven u
          veiligheidsadvies en sturen zodra het kan een monteur naar uw adres. Heeft u na afloop van
          een spoedreparatie behoefte aan een blijvende oplossing, bijvoorbeeld het{" "}
          <strong>vervangen van de groepenkast</strong> of het veilig{" "}
          <strong>aansluiten van een perilex</strong>, dan plannen we dat in overleg netjes in. Zo
          bent u niet alleen vandaag, maar ook op lange termijn verzekerd van een veilige
          elektra-installatie.
        </p>

        <h2>Storing of netbeheerderprobleem? Zo checkt u het</h2>
        <p>
          Voordat u een spoed elektricien belt, is het handig om te weten of het probleem in úw
          meterkast zit of bij de netbeheerder. Kijk of de buren ook zonder stroom zitten (bel of
          check <a href="https://www.liander.nl/storingen" rel="noopener" target="_blank">liander.nl/storingen</a>).
          Zit de storing straatbreed, bel dan <strong>Liander via 0800-9009</strong> — die is
          gratis. Zit het alleen in uw woning of pand, dan zijn wij er om het op te lossen.
        </p>

      </Prose>
    </ServicePage>
  );
}
