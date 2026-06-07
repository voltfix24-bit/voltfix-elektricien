import { createFileRoute } from "@tanstack/react-router";

import heroImg from "@/assets/groepenkast.jpg";
import { ServicePage } from "@/components/service-page";
import { Prose } from "@/components/prose";
import { faqSchema, ldScript, serviceSchema } from "@/lib/seo";

const path = "/groepenkast-vervangen-amsterdam";

const faqs = [
  {
    q: "Wat kost het vervangen van een groepenkast in Amsterdam?",
    a: "Een nieuwe groepenkast begint bij ongeveer € 650 inclusief materiaal voor een standaard situatie. De exacte prijs hangt af van het aantal groepen, de staat van de bedrading en eventuele uitbreidingen. U krijgt altijd een vaste prijs vooraf.",
  },
  {
    q: "Hoe lang duurt het vervangen van een groepenkast?",
    a: "Een standaard vervanging duurt meestal een halve tot hele werkdag. U zit hierbij maar kort zonder stroom; we plannen het werk zo dat de overlast minimaal is.",
  },
  {
    q: "Wanneer is het nodig om mijn groepenkast te vervangen?",
    a: "Vervang uw groepenkast als er geen of te weinig aardlekschakelaars zijn, bij oude stoppenkasten met draadzekeringen, bij regelmatig doorslaan van groepen, of als u zonnepanelen, een laadpaal of inductie wilt aansluiten.",
  },
  {
    q: "Kan ik meteen extra groepen laten bijplaatsen?",
    a: "Ja, dat is juist het ideale moment. Bij vervanging breiden we uw kast graag uit met extra groepen voor bijvoorbeeld de keuken, badkamer, laadpaal of zonnepanelen.",
  },
  {
    q: "Voldoet de nieuwe groepenkast aan de veiligheidseisen?",
    a: "Wij plaatsen elke groepenkast volgens de geldende NEN 1010-norm, met de juiste aardlekschakelaars en aardlekautomaten. Zo is uw installatie veilig en toekomstbestendig.",
  },
  {
    q: "Moet ik zelf iets regelen voordat jullie komen?",
    a: "Zorg dat de meterkast goed bereikbaar is. Verder regelen wij alles, inclusief afvoer van de oude kast en het testen van de nieuwe installatie.",
  },
  {
    q: "Geven jullie garantie op een nieuwe groepenkast?",
    a: "Ja, op het uitgevoerde werk en de geplaatste materialen geven wij garantie. Bij oplevering controleren en documenteren we de volledige installatie.",
  },
];

export const Route = createFileRoute("/groepenkast-vervangen-amsterdam")({
  head: () => ({
    meta: [
      { title: "Groepenkast Vervangen Amsterdam | Vanaf € 650 | VoltFix" },
      {
        name: "description",
        content:
          "Groepenkast vervangen in Amsterdam vanaf € 650 incl. materiaal. VoltFix plaatst veilige, moderne groepenkasten met aardlekschakelaars. Vraag een offerte.",
      },
      { property: "og:title", content: "Groepenkast Vervangen Amsterdam | VoltFix" },
      {
        property: "og:description",
        content: "Veilige, moderne groepenkast met extra groepen. Vaste prijs vooraf.",
      },
      { property: "og:url", content: path },
      { property: "og:type", content: "article" },
    ],
    links: [{ rel: "canonical", href: path }],
    scripts: [
      ldScript(
        serviceSchema({
          name: "Groepenkast vervangen Amsterdam",
          description:
            "Vervangen en uitbreiden van groepenkasten in Amsterdam volgens NEN 1010, met aardlekschakelaars en extra groepen.",
          path,
        }),
      ),
      ldScript(faqSchema(faqs)),
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ServicePage
      path={path}
      eyebrow="Vanaf € 650 incl. materiaal"
      title="Groepenkast vervangen Amsterdam"
      intro="Een verouderde of overbelaste groepenkast vergroot de kans op storingen én brand. VoltFix vervangt uw groepenkast in Amsterdam veilig, snel en volgens de norm — met ruimte om uit te breiden."
      image={heroImg}
      imageAlt="Moderne groepenkast met aardlekschakelaars geïnstalleerd door VoltFix in Amsterdam"
      whatsappMessage="Hallo VoltFix, ik wil graag mijn groepenkast laten vervangen in Amsterdam."
      faqs={faqs}
      priceTitle="Prijsindicatie groepenkast vervangen"
      priceIntro="Richtprijzen voor het vervangen van een groepenkast in Amsterdam. U krijgt altijd een vaste prijs vooraf."
      priceRows={[
        {
          title: "Standaard groepenkast",
          price: "vanaf € 650",
          unit: "incl. materiaal",
          points: ["Tot 3 groepen", "Aardlekschakelaars", "NEN 1010 conform"],
        },
        {
          title: "Groepenkast + uitbreiding",
          price: "vanaf € 850",
          unit: "incl. extra groepen",
          points: ["Extra groepen", "Voor laadpaal & zonnepanelen", "Inductie & keuken"],
          featured: true,
        },
        {
          title: "Veiligheidsinspectie",
          price: "vanaf € 95",
          unit: "meterkast-check",
          points: ["Volledige controle", "Eerlijk advies", "Rapport van bevindingen"],
        },
      ]}
    >

      <Prose>
        <p>
          De groepenkast is het hart van de elektrische installatie in uw woning.
          Een moderne, goed beveiligde groepenkast beschermt u tegen kortsluiting,
          overbelasting en elektrocutie. Toch hebben veel woningen in Amsterdam —
          zeker oudere panden — nog een verouderde stoppenkast of een kast zonder
          voldoende aardlekschakelaars.{" "}
          <strong>VoltFix vervangt uw groepenkast vakkundig en veilig</strong>,
          afgestemd op het gebruik van vandaag.
        </p>

        <h2>Wanneer is een groepenkast vervangen nodig?</h2>
        <p>
          Een groepenkast gaat lang mee, maar niet eeuwig. Overweeg vervanging in
          deze gevallen:
        </p>
        <ul>
          <li>
            <strong>Oude stoppenkast met draadzekeringen</strong> in plaats van
            automaten en aardlekschakelaars.
          </li>
          <li>
            <strong>Geen of te weinig aardlekschakelaars</strong> — een groot
            veiligheidsrisico.
          </li>
          <li>
            <strong>Groepen slaan regelmatig door</strong> doordat de kast de
            belasting niet meer aankan.
          </li>
          <li>
            <strong>Te weinig groepen</strong> voor een moderne keuken, badkamer of
            thuiskantoor.
          </li>
          <li>
            <strong>Uitbreidingsplannen</strong> zoals zonnepanelen, een laadpaal,
            inductie of een warmtepomp.
          </li>
          <li>
            <strong>Bij aankoop of verbouwing</strong> van een woning in Amsterdam,
            als veiligheidscheck.
          </li>
        </ul>

        <h2>Wat houdt het vervangen van een groepenkast in?</h2>
        <p>
          Bij VoltFix is het vervangen van een groepenkast een strak proces. We
          beginnen met een inspectie van uw huidige installatie en bedrading.
          Daarna stellen we samen vast hoeveel groepen u nodig heeft en welke
          beveiliging passend is. Vervolgens demonteren we de oude kast, plaatsen
          we de nieuwe groepenkast met de juiste aardlekschakelaars en
          aardlekautomaten, en sluiten we alle groepen netjes en gelabeld aan. Tot
          slot testen we de hele installatie door en leveren we hem veilig op.
        </p>
        <p>De werkzaamheden bestaan doorgaans uit:</p>
        <ul>
          <li>Demontage en afvoer van de oude groepen- of stoppenkast.</li>
          <li>Plaatsing van een nieuwe kast volgens NEN 1010.</li>
          <li>Installatie van aardlekschakelaars en/of aardlekautomaten.</li>
          <li>Aansluiten en duidelijk labelen van alle groepen.</li>
          <li>Eventueel uitbreiden met extra groepen.</li>
          <li>Doormeten, testen en veilig opleveren.</li>
        </ul>

        <h2>Veiligheid voorop</h2>
        <p>
          Een aardlekschakelaar schakelt de stroom binnen een fractie van een
          seconde uit zodra er een lekstroom optreedt — bijvoorbeeld als iemand
          een draad aanraakt of als er vocht in een apparaat komt. Dit kan letterlijk
          levens redden. Oude kasten missen deze bescherming vaak, of hebben één
          aardlekschakelaar voor het hele huis, waardoor bij een storing meteen
          alles uitvalt. Met meerdere groepen en aparte beveiliging blijft de rest
          van uw huis gewoon werken als er ergens iets misgaat.
        </p>

        <h2>Uitbreiden met extra groepen</h2>
        <p>
          Moderne huishoudens vragen steeds meer van de elektrische installatie.
          Een inductiekookplaat, vaatwasser, droger, airco, laadpaal of
          zonnepanelen hebben vaak een eigen groep nodig. Het moment waarop u uw
          groepenkast laat vervangen is ideaal om{" "}
          <strong>direct extra groepen bij te plaatsen</strong>. Zo voorkomt u
          overbelasting en bent u klaar voor de toekomst. Wij adviseren u eerlijk
          over hoeveel groepen verstandig zijn in uw situatie.
        </p>

        <h2>Wat kost een groepenkast vervangen in Amsterdam?</h2>
        <p>
          De kosten beginnen bij ongeveer <strong>€ 650 inclusief materiaal</strong>{" "}
          voor een standaard groepenkast. De uiteindelijke prijs hangt af van het
          aantal groepen, de gewenste beveiliging, de staat van uw bedraging en
          eventuele uitbreidingen. Bij oudere panden in Amsterdam kan extra werk
          nodig zijn aan de aarding of bekabeling. Daarom kijken we altijd eerst
          naar uw situatie en geven we u een <strong>vaste prijs vooraf</strong>,
          zonder verrassingen achteraf.
        </p>

        <h2>Lokale elektricien met garantie</h2>
        <p>
          VoltFix is een lokale elektricien in Amsterdam en kent de
          eigenaardigheden van zowel nieuwbouwappartementen als historische
          grachtenpanden. We werken netjes, ruimen alles op en geven garantie op
          ons werk en de geplaatste materialen. Vraag vrijblijvend een offerte aan
          voor het vervangen van uw groepenkast — bel ons of stuur een WhatsApp met
          uw situatie.
        </p>

        <h2>Groepenkast vervangen in oude én nieuwe panden</h2>
        <p>
          Het vervangen van een groepenkast verschilt sterk per type woning in
          Amsterdam. In monumentale grachtenpanden en vooroorlogse woningen is de
          bestaande bedrading vaak verouderd en ontbreekt een goede aarding. Wij
          beoordelen eerst of de aanwezige leidingen veilig zijn en adviseren
          eerlijk of aanvullend werk nodig is. In moderne appartementen draait het
          juist vaak om uitbreiding: extra groepen voor een inductiekookplaat, een
          warmtepomp of een laadpunt voor de elektrische auto. Dankzij onze lokale
          ervaring weten we precies waar we op moeten letten en voorkomen we
          verrassingen tijdens de uitvoering.
        </p>

        <h2>Veiligheid en wettelijke eisen</h2>
        <p>
          Een nieuwe groepenkast moet voldoen aan de NEN 1010-norm. Dat betekent
          voldoende aardlekschakelaars, een correcte verdeling van de groepen en
          een veilige aarding. Een verouderde meterkast zonder aardlekbeveiliging
          vormt een reëel risico op brand en elektrocutie. Bij de oplevering testen
          we elke groep en aardlekschakelaar, controleren we de aansluitingen en
          leveren we de meterkast netjes en overzichtelijk af met een duidelijke
          indeling. U krijgt uitleg over wat er is aangepast en garantie op zowel
          het werk als de geplaatste materialen, zodat u jarenlang veilig en
          zorgeloos stroom heeft.
        </p>
      </Prose>
    </ServicePage>
  );
}
