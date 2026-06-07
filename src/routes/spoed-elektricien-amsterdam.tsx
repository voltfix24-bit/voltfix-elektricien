import { createFileRoute } from "@tanstack/react-router";

import heroImg from "@/assets/hero-electrician.jpg";
import { ServicePage } from "@/components/service-page";
import { Prose } from "@/components/prose";
import { absoluteUrl, breadcrumbSchema, faqSchema, ldScript, ogImage, serviceSchema } from "@/lib/seo";

const path = "/spoed-elektricien-amsterdam";

const faqs = [
  {
    q: "Hoe snel is een spoed elektricien in Amsterdam bij mij?",
    a: "Bij spoed streven we ernaar binnen 30 tot 60 minuten ter plaatse te zijn in Amsterdam. De exacte tijd hangt af van uw locatie en het tijdstip, maar we vertrekken altijd zo snel mogelijk.",
  },
  {
    q: "Kan ik 's nachts of in het weekend een spoed elektricien bellen?",
    a: "Ja, onze spoedservice is 24 uur per dag en 7 dagen per week beschikbaar, ook 's nachts, in het weekend en op feestdagen.",
  },
  {
    q: "Wat moet ik doen bij kortsluiting of een doorgeslagen groep?",
    a: "Zet de hoofdschakelaar uit, raak geen blootliggende draden aan en houd kinderen en huisdieren uit de buurt. Bel daarna direct VoltFix; wij vinden de oorzaak en lossen het veilig op.",
  },
  {
    q: "Wat kost een spoed elektricien in Amsterdam?",
    a: "U betaalt voorrijkosten plus een uurtarief. We maken vooraf een duidelijke prijsafspraak, zodat u nooit voor verrassingen komt te staan, ook bij spoed.",
  },
  {
    q: "Mijn hele straat zit zonder stroom, kunnen jullie helpen?",
    a: "Is de storing buiten uw meterkast, dan ligt het vaak bij de netbeheerder (Liander). Wij helpen u dit snel vaststellen en lossen alles binnen uw eigen installatie op.",
  },
  {
    q: "Lossen jullie ook storingen op in bedrijfspanden?",
    a: "Zeker. We helpen zowel particulieren als bedrijven in Amsterdam bij acute storingen, uitval van groepen en problemen met de meterkast.",
  },
  {
    q: "Wat als de storing 's avonds laat optreedt?",
    a: "Bel ons gerust, ook laat op de avond. Onze monteurs zijn ingericht op spoedwerk en nemen de juiste materialen mee om uw probleem direct te verhelpen.",
  },
];

export const Route = createFileRoute("/spoed-elektricien-amsterdam")({
  head: () => ({
    meta: [
      { title: "Spoed Elektricien Amsterdam | 24/7 Storingsdienst | VoltFix" },
      {
        name: "description",
        content:
          "Spoed elektricien Amsterdam nodig? VoltFix is 24/7 bereikbaar bij storingen, kortsluiting, stroomuitval en meterkastproblemen. Vaak binnen het uur ter plaatse.",
      },
      { property: "og:title", content: "Spoed Elektricien Amsterdam | VoltFix" },
      {
        property: "og:description",
        content: "24/7 storingsdienst in heel Amsterdam. Vaak binnen het uur ter plaatse.",
      },
      { property: "og:url", content: absoluteUrl(path) },
      { property: "og:type", content: "article" },
      { property: "og:image", content: ogImage },
      { name: "twitter:image", content: ogImage },
    ],
    links: [{ rel: "canonical", href: absoluteUrl(path) }],
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
    <ServicePage
      path={path}
      eyebrow="24/7 storingsdienst"
      title="Spoed elektricien Amsterdam"
      intro="Storing, kortsluiting of plotseling zonder stroom? VoltFix is uw spoed elektricien in Amsterdam. Dag en nacht bereikbaar en vaak binnen het uur bij u thuis of in uw bedrijf."
      image={heroImg}
      imageAlt="Spoed elektricien van VoltFix lost een storing op in een meterkast in Amsterdam"
      whatsappMessage="Hallo VoltFix, ik heb met spoed een elektricien nodig in Amsterdam."
      faqs={faqs}
    >
      <Prose>
        <p>
          Een elektrische storing komt altijd op het verkeerde moment. Of het nu
          midden in de nacht is, tijdens het koken of net als u aan het
          thuiswerken bent — zonder stroom valt het hele huishouden stil.{" "}
          <strong>VoltFix is uw spoed elektricien in Amsterdam</strong> en staat
          24 uur per dag, 7 dagen per week voor u klaar. Wij komen snel ter
          plaatse, sporen de oorzaak op en zorgen dat u weer veilig stroom heeft.
        </p>

        <h2>Wanneer belt u een spoed elektricien?</h2>
        <p>
          Sommige situaties kunnen niet wachten tot morgen. Bel direct een spoed
          elektricien in Amsterdam bij:
        </p>
        <ul>
          <li>
            <strong>Kortsluiting</strong> waarbij de stroom telkens uitvalt of een
            groep niet meer aan blijft.
          </li>
          <li>
            <strong>Volledige stroomuitval</strong> in uw woning of bedrijfspand.
          </li>
          <li>
            <strong>Een doorgeslagen aardlekschakelaar</strong> die niet meer
            terug wil.
          </li>
          <li>
            <strong>Brandlucht, vonken of een warme meterkast</strong> — dit is
            altijd acuut gevaarlijk.
          </li>
          <li>
            <strong>Uitval van belangrijke apparaten</strong> zoals de cv-ketel,
            koeling of beveiliging.
          </li>
          <li>
            <strong>Beschadigde kabels of stopcontacten</strong> na een verbouwing
            of waterschade.
          </li>
        </ul>
        <p>
          Twijfelt u of uw situatie spoed is? Bel ons gerust. We schatten samen
          telefonisch in hoe acuut het is en wat u veilig zelf kunt doen tot we er
          zijn.
        </p>

        <h2>Snel ter plaatse in heel Amsterdam</h2>
        <p>
          VoltFix is een lokale elektricien en kent Amsterdam op zijn duimpje. Of
          u nu in het Centrum, in Zuid, West, Oost, Noord, De Pijp, de Jordaan of
          op IJburg woont — onze monteurs zijn meestal binnen 30 tot 60 minuten
          bij u. We rijden met een volledig uitgeruste bus, zodat we de meeste
          storingen direct bij het eerste bezoek kunnen verhelpen. Geen onnodige
          tweede afspraak, maar meteen een oplossing.
        </p>

        <h2>Zo werkt onze storingsdienst</h2>
        <p>
          Bij een spoedmelding werken we snel én zorgvuldig. Onze aanpak in het
          kort:
        </p>
        <ul>
          <li>
            <strong>1. Telefonische inschatting.</strong> We vragen wat er aan de
            hand is en geven u direct veiligheidsadvies.
          </li>
          <li>
            <strong>2. Snel onderweg.</strong> Een monteur vertrekt zo snel
            mogelijk naar uw adres in Amsterdam.
          </li>
          <li>
            <strong>3. Diagnose ter plaatse.</strong> We meten de installatie door
            en sporen de oorzaak van de storing op.
          </li>
          <li>
            <strong>4. Prijsafspraak vooraf.</strong> U weet wat het kost voordat
            we de reparatie uitvoeren.
          </li>
          <li>
            <strong>5. Veilig herstel.</strong> We lossen het probleem op en
            controleren of alles weer veilig functioneert.
          </li>
        </ul>

        <h2>Veelvoorkomende storingen die wij oplossen</h2>
        <p>
          Veel storingen in Amsterdamse woningen hebben een herkenbare oorzaak.
          Denk aan een defecte aardlekschakelaar, een overbelaste groep door te
          veel apparaten, vochtproblemen in oudere panden, of een kapot
          stopcontact. In monumentale grachtenpanden komen we regelmatig oude
          bedrading tegen die niet meer voldoet aan de huidige veiligheidseisen.
          Wij verhelpen niet alleen de storing, maar adviseren u ook eerlijk of
          een blijvende oplossing — zoals het{" "}
          <strong>vervangen van de groepenkast</strong> — verstandig is.
        </p>

        <h2>Wat u zelf kunt doen bij een storing</h2>
        <p>
          Voordat wij arriveren kunt u vaak al iets doen om de situatie veilig te
          houden. Controleer eerst of alleen uw woning getroffen is of de hele
          straat; bij een straatbrede uitval ligt het meestal bij netbeheerder
          Liander. Schakel bij twijfel de hoofdschakelaar uit, trek apparaten uit
          het stopcontact die de storing kunnen veroorzaken en raak nooit
          blootliggende of beschadigde draden aan. Ruikt u brand of ziet u rook
          uit de meterkast? Houd dan afstand en bel direct.
        </p>

        <h2>Transparante tarieven, ook bij spoed</h2>
        <p>
          Spoed betekent bij VoltFix geen onduidelijke rekening achteraf. We
          werken met heldere voorrijkosten en een vast uurtarief en bespreken de
          prijs altijd vooraf. Zo weet u precies waar u aan toe bent, ook als we
          's avonds of in het weekend komen. Geen kleine lettertjes, gewoon
          eerlijk vakwerk tegen een faire prijs.
        </p>
        <p>
          Heeft u nu een elektricien met spoed nodig in Amsterdam? Bel direct, of
          stuur ons een WhatsApp met een korte omschrijving en uw adres. VoltFix
          staat voor u klaar.
        </p>

        <h2>Spoed elektricien voor elke woning in Amsterdam</h2>
        <p>
          Amsterdam kent enorm uiteenlopende woningen, en elk type pand heeft zijn
          eigen risico's bij een storing. In de oude grachtenpanden van het Centrum
          en de Jordaan komen we vaak verouderde bedrading en stoffen mantelkabels
          tegen die gevoelig zijn voor kortsluiting. In de jaren-30 woningen in Zuid
          en Oost zien we regelmatig overbelaste groepen omdat moderne apparatuur
          meer vraagt dan de oorspronkelijke installatie aankan. En in de
          nieuwbouw op IJburg of in Zuidoost gaat het juist vaker om een
          doorgeslagen aardlekschakelaar of een defect apparaat. Onze monteurs
          herkennen deze patronen direct en weten daardoor snel waar ze moeten
          zoeken.
        </p>

        <h2>Direct geschakeld, ook buiten kantooruren</h2>
        <p>
          Een goede spoed elektricien is niet alleen snel ter plaatse, maar ook
          telefonisch direct bereikbaar. Wanneer u belt, krijgt u meteen een
          vakman aan de lijn die meedenkt — geen wachtrij en geen callcenter. We
          stellen een paar gerichte vragen, geven u veiligheidsadvies en sturen
          zodra het kan een monteur naar uw adres. Heeft u na afloop van een
          spoedreparatie behoefte aan een blijvende oplossing, bijvoorbeeld het{" "}
          <strong>vervangen van de groepenkast</strong> of het veilig{" "}
          <strong>aansluiten van een perilex</strong>, dan plannen we dat in
          overleg netjes in. Zo bent u niet alleen vandaag, maar ook op lange
          termijn verzekerd van een veilige elektra-installatie.
        </p>
      </Prose>
    </ServicePage>
  );
}
