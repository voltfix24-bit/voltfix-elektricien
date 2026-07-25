import { createFileRoute } from "@tanstack/react-router";

import heroImg from "@/assets/voltfix-laadpaal-scene.png";
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
import type { PriceRow } from "@/components/price-indicator";

const path = "/laadpaal-amsterdam";

const faqs = [
  {
    q: "Wat kost het installeren van een laadpaal in Amsterdam?",
    a: "Een standaard laadpaal (wallbox) laten installeren begint bij ongeveer € 650 inclusief materiaal en een aparte groep. De prijs hangt af van de afstand tot de meterkast, kabelroute en gewenste vermogen (1-fase of 3-fase). U ontvangt vooraf een vaste prijs.",
  },
  {
    q: "Kan ik overal in Amsterdam een laadpaal plaatsen?",
    a: "Op eigen terrein (parkeerplaats, oprit, garage) is dat meestal geen probleem. Voor een openbare laadpaal aan de straat vraagt u die aan bij de gemeente Amsterdam. Wij installeren zowel thuisladers als zakelijke wallboxen op eigen terrein.",
  },
  {
    q: "Heb ik 3-fase krachtstroom nodig voor een laadpaal?",
    a: "Voor snel laden (11 kW of 22 kW) is 3-fase aansluiting nodig. Bij 1-fase laadt u met maximaal 3,7 of 7,4 kW. Wij controleren uw meterkast en adviseren welke aansluiting bij uw auto en verbruik past.",
  },
  {
    q: "Installeren jullie alle merken laadpalen?",
    a: "Ja. We installeren onder andere Alfen, Wallbox, EVBox, Easee, Zaptec en Tesla Wall Connector. Heeft u nog geen laadpaal? We adviseren graag een model dat past bij uw auto, aansluiting en budget.",
  },
  {
    q: "Wordt de laadpaal volgens NEN 1010 aangesloten?",
    a: "Absoluut. Elke laadpaal krijgt een aparte groep met een aardlekautomaat type B of type A-EV en wordt volgens NEN 1010 aangesloten. Na installatie meten we alles door en u ontvangt een installatiecertificaat.",
  },
  {
    q: "Kan ik de installatiekosten aftrekken of subsidie krijgen?",
    a: "Voor zakelijke rijders is een laadpaal fiscaal aftrekbaar. Particulieren kunnen in Amsterdam soms gebruikmaken van gemeentelijke of leveranciersregelingen. We geven graag een factuur die past bij uw regeling.",
  },
  {
    q: "Hoe lang duurt de installatie van een laadpaal?",
    a: "In de meeste gevallen is de installatie binnen een halve tot hele werkdag klaar. Als er extra bekabeling of een groepenkast-uitbreiding nodig is, kan het iets langer duren. We stemmen dit vooraf met u af.",
  },
];

const priceRows: PriceRow[] = [
  {
    title: "Laadpaal installatie (1-fase)",
    price: "vanaf € 650",
    unit: "incl. materiaal & aparte groep",
    points: ["Tot 7,4 kW", "NEN 1010", "Type A aardlekautomaat"],
  },
  {
    title: "Laadpaal installatie (3-fase)",
    price: "vanaf € 895",
    unit: "incl. materiaal, krachtstroom & aparte groep",
    points: ["11 of 22 kW snelladen", "Type B / A-EV aardlek", "Installatiecertificaat"],
    featured: true,
  },
  {
    title: "Groepenkast-uitbreiding voor laadpaal",
    price: "vanaf € 275",
    unit: "extra groep in bestaande meterkast",
    points: ["Aparte laadgroep", "Voorbereid op 3-fase", "garantie op arbeid"],
  },
];

export const Route = createFileRoute("/laadpaal-amsterdam")({
  head: () => ({
    meta: pageMeta({
      title: "Laadpaal Installeren Amsterdam | Wallbox | VoltFix",
      description:
        "Laadpaal (wallbox) laten installeren in Amsterdam. Vaste prijs vanaf € 650, NEN 1010 conform, aparte groep en installatiecertificaat. Gecertificeerde monteurs.",
      path: path,
      ogTitle: "Laadpaal Installeren Amsterdam | VoltFix",
      ogDescription: "Wallbox laten plaatsen in Amsterdam — vaste prijs, NEN 1010, snelle service.",
    }),
    links: [{ rel: "canonical", href: absoluteUrl(path) }, ...altLinks(path)],
    scripts: [
      ldScript(
        serviceSchema({
          name: "Laadpaal installatie Amsterdam",
          description:
            "Installatie van elektrische laadpalen (wallbox) voor thuis en bedrijf in Amsterdam, inclusief aparte groep en NEN 1010 controle.",
          path,
        }),
      ),
      ldScript(faqSchema(faqs)),
      ldScript(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Laadpaal installeren Amsterdam", path },
        ]),
      ),
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ServicePage reviewCategory="laadpaal"
      path={path}
      eyebrow="Laadpaal / Wallbox"
      title="Laadpaal installeren in Amsterdam"
      intro="Thuis of op de zaak elektrisch laden zonder gedoe? VoltFix installeert uw laadpaal (wallbox) in Amsterdam met een aparte groep, volgens NEN 1010 en met een vaste prijs vooraf."
      image={heroImg}
      imageAlt="VoltFix monteur installeert een witte wallbox laadpaal aan de gevel van een Amsterdams grachtenpand naast een elektrische auto"
      whatsappMessage="Hallo VoltFix, ik wil een laadpaal / wallbox laten installeren in Amsterdam."
      faqs={faqs}
      priceRows={priceRows}
      priceTitle="Prijsindicatie laadpaal installatie"
      priceIntro="Richtprijzen voor een complete laadpaal-installatie in Amsterdam, inclusief materiaal en aparte groep."
    >
      <Prose>
        <p>
          Steeds meer Amsterdammers rijden elektrisch — en willen thuis of op eigen terrein snel en
          veilig kunnen laden. Een <strong>eigen laadpaal (wallbox)</strong> is comfortabeler,
          sneller en goedkoper dan laden aan een openbare paal. VoltFix installeert uw laadpaal in
          heel Amsterdam, met een <strong>aparte groep in de meterkast</strong> en volgens NEN 1010.
        </p>

        <h2>Welke laadpaal past bij u?</h2>
        <p>
          De keuze hangt af van uw auto, aansluiting en dagelijks verbruik. Voor de meeste bewoners
          van een Amsterdams appartement of grachtenpand is een 1-fase wallbox van 3,7 of 7,4 kW
          voldoende — u laadt de accu in de nacht netjes vol. Wilt u sneller laden of heeft u
          meerdere elektrische auto's? Dan is een 3-fase wallbox (11 of 22 kW) een slimme keuze,
          mits uw meterkast dat aan kan.
        </p>

        <h2>Zo installeren wij uw laadpaal</h2>
        <ul>
          <li>We controleren uw meterkast en beschikbare capaciteit.</li>
          <li>We adviseren over 1-fase versus 3-fase en het juiste vermogen.</li>
          <li>
            We plaatsen een aparte groep met de correcte aardlekautomaat (type A of type B / A-EV).
          </li>
          <li>
            We trekken de bekabeling netjes naar de gewenste locatie (gevel, garage of oprit).
          </li>
          <li>We monteren en configureren de laadpaal en testen alles door.</li>
          <li>
            U ontvangt een <strong>installatiecertificaat NEN 1010</strong>.
          </li>
        </ul>

        <h2>Merken en modellen</h2>
        <p>
          VoltFix installeert alle veelgebruikte merken, waaronder{" "}
          <strong>Alfen, Wallbox, EVBox, Easee, Zaptec</strong> en Tesla Wall Connector. Heeft u nog
          geen laadpaal gekozen? We adviseren graag een model dat past bij uw auto, aansluiting en
          budget — inclusief opties voor dynamische load balancing en zonnepanelen-integratie.
        </p>

        <h2>Veilig, snel en met garantie</h2>
        <p>
          Een laadpaal die verkeerd wordt aangesloten kan uw meterkast overbelasten of onveilige
          situaties opleveren. Daarom werken onze monteurs strikt volgens de{" "}
          <strong>NEN 1010-norm</strong> en gebruiken we uitsluitend gecertificeerde materialen. U
          krijgt garantie op arbeid en volledige fabrieksgarantie op het geplaatste
          materiaal.
        </p>
      </Prose>
    </ServicePage>
  );
}
