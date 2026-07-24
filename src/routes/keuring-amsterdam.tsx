import { createFileRoute } from "@tanstack/react-router";

import heroImg from "@/assets/voltfix-keuring-scene.png";
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

const path = "/keuring-amsterdam";

const faqs = [
  {
    q: "Wat is een NEN 1010 keuring?",
    a: "Een NEN 1010 keuring is een inspectie van een nieuwe of gewijzigde elektrische installatie om vast te stellen dat deze veilig en volgens de norm is aangelegd. Verzekeraars, verhuurders en gemeentes vragen dit certificaat regelmatig op.",
  },
  {
    q: "Wat is het verschil tussen NEN 1010 en NEN 3140?",
    a: "NEN 1010 gaat over de aanleg en oplevering van nieuwe elektrische installaties. NEN 3140 richt zich op de periodieke inspectie van bestaande installaties en elektrische arbeidsmiddelen in zakelijke omgevingen.",
  },
  {
    q: "Hoe vaak moet ik mijn installatie laten keuren?",
    a: "Voor bedrijfspanden geldt meestal een NEN 3140 keuring elke 3 tot 5 jaar, afhankelijk van gebruik en risico. Voor particuliere woningen is een keuring aan te raden bij aankoop, verhuur of na een verbouwing.",
  },
  {
    q: "Wat kost een elektrische keuring in Amsterdam?",
    a: "Een basiskeuring voor een woning begint bij ongeveer € 195. Voor zakelijke NEN 3140 inspecties maken we een offerte op basis van aantal groepen en arbeidsmiddelen. U ontvangt altijd een vaste prijs vooraf.",
  },
  {
    q: "Wat gebeurt er als er tekortkomingen worden gevonden?",
    a: "We leggen elk gebrek uit met foto's in het rapport en geven aan welke reparatie noodzakelijk is. U beslist zelf of u het herstel door VoltFix laat uitvoeren. Na herstel wordt het rapport bijgewerkt.",
  },
  {
    q: "Krijg ik een officieel keuringsrapport?",
    a: "Ja. U ontvangt een digitaal keuringsrapport met alle metingen, foto's, bevindingen en het inspectiecertificaat — geschikt voor verzekeraars, verhuurders en Arbo-doeleinden.",
  },
  {
    q: "Doen jullie ook keuringen voor verhuurders en VvE's?",
    a: "Zeker. We keuren regelmatig woningen bij mutatie, appartementencomplexen voor VvE's en bedrijfspanden in heel Amsterdam. Handig, betaalbaar en met een helder rapport voor uw administratie.",
  },
];

const priceRows: PriceRow[] = [
  {
    title: "Keuring woning (NEN 1010)",
    price: "vanaf € 195",
    unit: "installatie tot 6 groepen",
    points: ["Volledig rapport", "Foto's & metingen", "Digitaal certificaat"],
  },
  {
    title: "Zakelijke keuring (NEN 3140)",
    price: "op offerte",
    unit: "installatie & arbeidsmiddelen",
    points: ["Bedrijfspand of VvE", "Periodieke inspectie", "Arbo-conform rapport"],
    featured: true,
  },
  {
    title: "Herkeuring na herstel",
    price: "vanaf € 95",
    unit: "aanvullende inspectie",
    points: ["Update van rapport", "Certificaat bijgewerkt", "Snel ingepland"],
  },
];

export const Route = createFileRoute("/keuring-amsterdam")({
  head: () => ({
    meta: pageMeta({
      title: "Elektrische Keuring Amsterdam | NEN 1010 & NEN 3140 | VoltFix",
      description:
        "NEN 1010 en NEN 3140 keuring in Amsterdam. Officieel inspectierapport voor verzekeraar, verhuurder of VvE. Vaste prijs vanaf € 195 en snel ingepland.",
      path: path,
      ogTitle: "Elektrische Keuring Amsterdam | VoltFix",
      ogDescription:
        "NEN 1010 & NEN 3140 keuring met certificaat. Voor woning, VvE en bedrijf in Amsterdam.",
    }),
    links: [{ rel: "canonical", href: absoluteUrl(path) }, ...altLinks(path)],
    scripts: [
      ldScript(
        serviceSchema({
          name: "Elektrische keuring Amsterdam (NEN 1010 / NEN 3140)",
          description:
            "Inspectie en keuring van elektrische installaties in Amsterdam volgens NEN 1010 (nieuwbouw / oplevering) en NEN 3140 (periodiek / zakelijk), inclusief digitaal certificaat.",
          path,
        }),
      ),
      ldScript(faqSchema(faqs)),
      ldScript(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Elektrische keuring Amsterdam", path },
        ]),
      ),
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ServicePage reviewCategory="keuring"
      path={path}
      eyebrow="NEN 1010 & NEN 3140"
      title="Elektrische keuring in Amsterdam"
      intro="Zekerheid over uw elektrische installatie. VoltFix voert NEN 1010 en NEN 3140 keuringen uit voor woning, VvE en bedrijf in heel Amsterdam — met officieel rapport en digitaal certificaat."
      image={heroImg}
      imageAlt="VoltFix inspecteur meet een groepenkast door en vult een NEN keuringsrapport in bij een Amsterdamse woning"
      whatsappMessage="Hallo VoltFix, ik wil een NEN keuring van mijn elektrische installatie in Amsterdam laten doen."
      faqs={faqs}
      priceRows={priceRows}
      priceTitle="Prijsindicatie keuring"
      priceIntro="Richtprijzen voor NEN 1010 en NEN 3140 keuringen in Amsterdam, inclusief digitaal rapport."
    >
      <Prose>
        <p>
          Een elektrische installatie is pas veilig als u het ook kunt aantonen. Verzekeraars,
          verhuurders, VvE's en gemeentes vragen steeds vaker om een geldig{" "}
          <strong>keuringsrapport volgens NEN 1010 of NEN 3140</strong>. VoltFix voert deze
          inspecties uit in heel Amsterdam — vakkundig, onafhankelijk en met een helder digitaal
          certificaat.
        </p>

        <h2>NEN 1010: nieuwbouw & oplevering</h2>
        <p>
          NEN 1010 is de norm voor de aanleg van nieuwe elektrische installaties. Bij verbouwing,
          nieuwbouw of het uitbreiden van een meterkast wordt de installatie na oplevering gekeurd.
          We meten isolatieweerstand, aardverbinding, doorverbindingen en de werking van alle
          aardlekschakelaars, en leveren een <strong>inspectiecertificaat NEN 1010</strong>.
        </p>

        <h2>NEN 3140: periodieke inspectie</h2>
        <p>
          NEN 3140 is de norm voor <strong>periodieke inspectie</strong> van bestaande elektrische
          installaties en arbeidsmiddelen in zakelijke omgevingen. Werkgevers zijn op grond van de
          Arbowet verplicht om deze keuringen periodiek uit te voeren. Wij inspecteren de
          installatie én uw elektrische apparaten (verlengsnoeren, gereedschap, kantoormaterieel) en
          leveren een compleet rapport voor uw administratie.
        </p>

        <h2>Wanneer laat u keuren?</h2>
        <ul>
          <li>Bij aankoop, verkoop of verhuur van een woning of pand.</li>
          <li>Na een verbouwing of vervanging van de groepenkast.</li>
          <li>Op verzoek van uw verzekeraar of hypotheekverstrekker.</li>
          <li>Periodiek voor bedrijfspanden, VvE's en zorginstellingen.</li>
          <li>Bij twijfel over de veiligheid van bedrading of aardlekbeveiliging.</li>
        </ul>

        <h2>Zo werkt een VoltFix keuring</h2>
        <ol>
          <li>
            <strong>Visuele inspectie</strong> — we controleren meterkast, bedrading, stopcontacten
            en aardverbinding.
          </li>
          <li>
            <strong>Metingen</strong> — isolatieweerstand, aardweerstand, kortsluitstroom en werking
            van elke aardlekschakelaar.
          </li>
          <li>
            <strong>Rapport</strong> — alle bevindingen met foto's, metingen en geadviseerd herstel.
          </li>
          <li>
            <strong>Certificaat</strong> — digitaal en direct te delen met verzekeraar of VvE.
          </li>
        </ol>

        <h2>Waarom VoltFix?</h2>
        <p>
          Onze inspecteurs kennen de Amsterdamse woningvoorraad — van monumentale grachtenpanden met
          verouderde bedrading tot moderne appartementen op IJburg. We keuren onafhankelijk en
          helder: u weet precies wat er goed is, wat verbeterd kan worden en wat direct hersteld
          moet worden. Kiezen voor herstel bij VoltFix mag, maar hoeft niet.
        </p>
      </Prose>
    </ServicePage>
  );
}
