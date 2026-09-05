import { createFileRoute } from "@tanstack/react-router";

import heroImg from "@/assets/voltfix-groepenkast-abb-modern.webp.asset.json";
import { ServicePage } from "@/components/service-page";
import { Prose } from "@/components/prose";
import {
  absoluteUrl,
  altLinks,
  breadcrumbSchema,
  faqSchema,
  howToSchema,
  ldScript,
  pageMeta,
} from "@/lib/seo";
import { eurNl, prices } from "@/lib/pricing";
import { GuideLinks } from "@/components/guide-links";

const path = "/groepenkast-samenstellen";

const faqs = [
  {
    q: "Wat betekent 'groepenkast samenstellen'?",
    a: "Groepenkast samenstellen is het bepalen van het aantal groepen, aardlekautomaten en hoofdschakelaars dat u nodig heeft voor uw woning of bedrijfspand — inclusief indeling volgens NEN 1010. Op basis daarvan wordt de meterkast opgebouwd of vervangen.",
  },
  {
    q: "Hoeveel groepen heb ik nodig?",
    a: "Een moderne eengezinswoning heeft doorgaans 8–12 groepen: aparte groepen voor keuken (inductie/perilex), wasmachine, vaatwasser, badkamer, verlichting per verdieping en stopcontacten per ruimte. Grotere woningen, laadpalen en zonnepanelen vragen extra groepen.",
  },
  {
    q: "Wat is het verschil tussen een aardlekschakelaar en een aardlekautomaat?",
    a: "Een aardlekschakelaar (RCD) beschermt meerdere groepen tegelijk tegen lekstromen. Een aardlekautomaat combineert aardlek- én overstroombeveiliging in één module en beschermt maar één groep. Sinds NEN 1010:2020 zijn aardlekautomaten per groep de veiligste én meest gekozen oplossing.",
  },
  {
    q: "Moet ik krachtstroom (400V) of Perilex opnemen?",
    a: "Voor een inductiekookplaat of fornuis boven ~7,4 kW is een Perilex- of krachtstroomaansluiting nodig. Reken die groep direct mee bij het samenstellen — anders moet de kast later alsnog uitgebreid worden.",
  },
  {
    q: "Kan ik zelf een groepenkast samenstellen?",
    a: "U kunt de indeling zelf voorbereiden, maar het aansluiten van een groepenkast op de hoofdaansluiting is voorbehouden aan een erkend elektricien. VoltFix rekent uw wensen door volgens NEN 1010 en levert een vaste prijs voor levering én installatie.",
  },
  {
    q: "Wat kost een nieuwe groepenkast in Amsterdam?",
    a: `Een standaard vervanging met 8–12 aardlekautomaten begint bij circa ${eurNl(prices.groepenkastFullReplacementFrom)} inclusief materiaal, arbeid en NEN 1010-oplevering. Uitbreidingen voor laadpaal, zonnepanelen of driefase kunnen de prijs verhogen.`,
  },
];

export const Route = createFileRoute("/groepenkast-samenstellen")({
  head: () => ({
    meta: pageMeta({
      title: "Groepenkast samenstellen: complete gids (NEN 1010) | VoltFix",
      description:
        "Groepenkast samenstellen in 2026? Overzicht van groepen, aardlekautomaten, Perilex en NEN 1010-eisen. Checklist en prijsindicatie van VoltFix.",
      path,
      ogTitle: "Groepenkast samenstellen — praktische gids | VoltFix",
      ogDescription:
        "Hoeveel groepen, welke aardlekautomaten en wanneer Perilex? Complete NEN 1010-checklist voor uw nieuwe meterkast.",
    }),
    links: [{ rel: "canonical", href: absoluteUrl(path) }, ...altLinks(path)],
    scripts: [
      ldScript(
        howToSchema({
          name: "Groepenkast samenstellen volgens NEN 1010",
          description:
            "Stap-voor-stap gids om een moderne groepenkast samen te stellen: aantal groepen bepalen, aardlekautomaten kiezen, Perilex en laadpaal meerekenen en aansluiten volgens NEN 1010.",
          path,
          totalTime: "PT30M",
          tools: ["Notitieboek of rekentool", "Plattegrond woning", "NEN 1010-richtlijnen"],
          supplies: [
            "Hoofdschakelaar 40A",
            "Aardlekautomaten 16A/B (per groep)",
            "Perilex-automaat 3x16A (kookgroep)",
            "DIN-rail behuizing (12–24 modules)",
          ],
          steps: [
            {
              name: "Inventariseer alle vaste verbruikers",
              text: "Loop per ruimte langs de vaste apparaten: inductie, oven, wasmachine, droger, vaatwasser, boiler, cv-ketel, airco, laadpaal en zonnepanelen. Elk krachtig apparaat krijgt een eigen groep.",
            },
            {
              name: "Bepaal het aantal groepen",
              text: "Voeg één groep per ruimte toe voor stopcontacten en verlichting. Een gemiddelde eengezinswoning komt zo uit op 8–12 groepen; grotere of gerenoveerde woningen op 14+.",
            },
            {
              name: "Kies aardlekautomaten per groep",
              text: "Volgens NEN 1010:2020 verdient elke groep een eigen aardlekautomaat (30 mA, karakteristiek B of C). Dit voorkomt dat één storing meerdere ruimtes uitschakelt.",
            },
            {
              name: "Reken Perilex of krachtstroom mee",
              text: "Voor inductiekookplaten boven 7,4 kW en industriële apparaten neemt u een Perilex- of 3-fasegroep op. Reserveer daarvoor 3 modules in de kast.",
            },
            {
              name: "Plan uitbreidingen (laadpaal, PV, warmtepomp)",
              text: "Laat 2–4 modules vrij voor toekomstige uitbreidingen zoals een laadpaal, warmtepomp of extra zonnepanelen. Dat scheelt later een tweede meterkast.",
            },
            {
              name: "Laat de kast plaatsen en keuren",
              text: "Een erkend elektricien monteert de groepenkast, sluit hem aan op de hoofdaansluiting en levert een NEN 1010 inspectiecertificaat. Voor Amsterdam levert VoltFix dit inclusief installatiecertificaat.",
            },
          ],
        }),
      ),
      ldScript(faqSchema(faqs, "nl", path)),
      ldScript(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Groepenkast Amsterdam", path: "/groepenkast-amsterdam" },
          { name: "Groepenkast samenstellen", path },
        ]),
      ),
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ServicePage reviewCategory="groepenkast"
      path={path}
      eyebrow="Gids · NEN 1010"
      title="Groepenkast samenstellen — stap voor stap"
      intro="Een nieuwe of uitgebreide groepenkast begint met een goed plan. Deze gids helpt u het aantal groepen, aardlekautomaten en aansluitingen bepalen — zodat uw meterkast toekomstbestendig is en voldoet aan NEN 1010."
      image={heroImg.url}
      imageAlt="Moderne groepenkast met aardlekautomaten, samengesteld volgens NEN 1010 door VoltFix in Amsterdam"
      whatsappMessage="Hallo VoltFix, ik wil hulp bij het samenstellen van een nieuwe groepenkast in Amsterdam."
      faqs={faqs}
    >
      <Prose>
        <p>
          Groepenkast samenstellen doet u niet elke dag. Een goede indeling voorkomt storingen,
          verhoogt de veiligheid en maakt uw woning klaar voor <strong>laadpalen, zonnepanelen en
          warmtepompen</strong>. In deze gids nemen we u mee door de belangrijkste keuzes — en
          leggen we uit hoe VoltFix het in Amsterdam aanpakt.
        </p>

        <h2>1. Waarom een goede samenstelling zo belangrijk is</h2>
        <p>
          De groepenkast (of meterkast) verdeelt de stroom over uw hele woning. Een te krappe kast
          betekent dat één probleem — een lekkende wasmachine of een defecte lamp — meteen meerdere
          ruimtes platlegt. Volgens de moderne <strong>NEN 1010:2020</strong> hoort elke groep
          daarom een eigen aardlekautomaat te krijgen.
        </p>

        <h2>2. Hoeveel groepen heeft u nodig?</h2>
        <p>
          Als vuistregel voor een Amsterdamse woning:
        </p>
        <ul>
          <li>1 groep voor de <strong>inductiekookplaat</strong> (Perilex of krachtstroom).</li>
          <li>1 groep voor de <strong>wasmachine</strong> en 1 voor de <strong>droger</strong>.</li>
          <li>1 groep voor de <strong>vaatwasser</strong>.</li>
          <li>1 groep voor de <strong>badkamer</strong> (los van slaapkamers).</li>
          <li>1 groep verlichting per verdieping.</li>
          <li>1 groep stopcontacten per woonlaag of grotere ruimte.</li>
          <li>Optioneel: aparte groep voor <strong>laadpaal</strong>, <strong>warmtepomp</strong>
            en <strong>omvormer PV</strong>.</li>
        </ul>
        <p>
          Reken op minimaal 8–12 groepen voor een gemiddelde eengezinswoning en 14+ voor grotere of
          gerenoveerde panden.
        </p>

        <h2>3. Aardlekautomaten of aardlekschakelaars?</h2>
        <p>
          Een klassieke meterkast heeft één aardlekschakelaar per 4 groepen. Bij een lekstroom
          vallen dan 4 groepen tegelijk uit. Moderne kasten gebruiken <strong>aardlekautomaten</strong>
          (30 mA, B- of C-karakteristiek) per groep: valt er één uit, dan blijft de rest gewoon
          werken. Dat is veiliger én comfortabeler — en tegenwoordig de norm voor nieuwbouw en
          renovaties.
        </p>

        <h2>4. Perilex, krachtstroom en 3-fase</h2>
        <p>
          Voor moderne inductiekookplaten boven 7,4 kW is een <strong>Perilex-aansluiting</strong>
          of <strong>3-fase (400V) groep</strong> vereist. Reserveer daarvoor 3 modules in de kast
          en gebruik een geschikte Perilex-automaat. Meer over de aansluiting zelf leest u op onze
          pagina <a href="/perilex-amsterdam">perilex aansluiten Amsterdam</a>.
        </p>

        <h2>5. Denk aan de toekomst</h2>
        <p>
          De energietransitie vraagt steeds meer van de meterkast. Laat bij het samenstellen
          <strong> 2 tot 4 modules vrij</strong> voor toekomstige uitbreidingen zoals een{" "}
          <a href="/laadpaal-amsterdam">laadpaal</a>, warmtepomp of extra zonnepanelen. Dat scheelt
          u binnen enkele jaren een tweede kast.
        </p>

        <h2>6. Plaatsen én keuren</h2>
        <p>
          Het aansluiten van de groepenkast op de hoofdaansluiting is voorbehouden aan een erkend
          elektricien. VoltFix levert samenstelling, installatie én{" "}
          NEN 1010-oplevering in één traject. U ontvangt een digitaal
          certificaat — geschikt voor verzekeraar, VvE of verhuurder.
        </p>

        <h2>Klaar met samenstellen?</h2>
        <p>
          Deel uw wensen via WhatsApp of het contactformulier. U krijgt binnen een werkdag een{" "}
          <strong>vaste prijs</strong> voor levering en montage van uw nieuwe groepenkast — inclusief
          oplevering en garantie. Bekijk ook onze hoofdpagina{" "}
          <a href="/groepenkast-amsterdam">groepenkast Amsterdam</a>.
        </p>
      </Prose>
      <GuideLinks currentPath={"/groepenkast-samenstellen"} />
    </ServicePage>
  );
}
