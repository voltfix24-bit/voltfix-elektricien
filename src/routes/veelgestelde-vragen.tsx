import { createFileRoute } from "@tanstack/react-router";

import { CtaBand } from "@/components/cta-band";
import { ServiceFaq, type Faq } from "@/components/service-faq";
import { RatesTable } from "@/components/rates-table";
import { TechnicianByline } from "@/components/technician-byline";
import { business } from "@/lib/business";
import { prices, warranties, eurNl, perHourNl } from "@/lib/pricing";
import { absoluteUrl, altLinks, breadcrumbSchema, faqSchema, ldScript, pageMeta } from "@/lib/seo";

const path = "/veelgestelde-vragen";

export const faqsNl: Faq[] = [
  {
    q: "Wat kost een elektricien in Amsterdam?",
    a: `Binnen kantooruren rekenen we ${perHourNl(prices.hourly)} (ma–vr 08:00–18:00), voorrijden binnen Amsterdam inbegrepen. Een storing kost ${eurNl(prices.emergencyFirstHour)} voor het eerste uur all-in. In de avond, nacht, het weekend en op feestdagen is dat ${eurNl(prices.offHoursFirstHour)} voor het eerste uur. Daarna rekenen we per 15 minuten.`,
  },
  {
    q: "Wat kost een spoed elektricien 's avonds of in het weekend?",
    a: `Buiten kantooruren — avond, nacht, weekend en feestdagen — is het starttarief ${eurNl(prices.offHoursFirstHour)} voor het eerste uur all-in. Bij een spoedmelding binnen kantooruren betaalt u gewoon het storingstarief van ${eurNl(prices.emergencyFirstHour)}, zonder toeslag.`,
  },
  {
    q: "Hoe snel is VoltFix bij spoed ter plaatse?",
    a: "Bij spoed zijn we binnen 60 minuten in heel Amsterdam. Bel 24/7 voor kortsluiting, stroomuitval of een meterkast die niet meer inschakelt.",
  },
  {
    q: "Welke garantie geeft VoltFix?",
    a: `${warranties.nl.sentence} ${warranties.nl.startNote}`,
  },
  {
    q: "Welke certificeringen hebben jullie?",
    a: "Onze elektricien Hassan werkt sinds 2010 in de installatietechniek, is VCA-gecertificeerd en opgeleid als Technicus Elektrotechniek (mbo 4, Deltion College). VoltFix werkt volgens NEN 1010 en NEN 3140 en is KvK-geregistreerd erkend leerbedrijf.",
  },
  {
    q: "Wat kost het vervangen van een groepenkast?",
    a: `Een standaard groepenkast vervangen kost vanaf ${eurNl(prices.groepenkastFrom)} incl. materiaal (bandbreedte ${eurNl(prices.groepenkastFrom)} – ${eurNl(prices.groepenkastTo)}) voor maximaal drie groepen met aardlekschakelaars. U krijgt altijd een vaste prijs vooraf.`,
  },
  {
    q: "Wat kost een perilex of kookgroep aansluiten?",
    a: `Een perilex-aansluiting kost vanaf ${eurNl(prices.perilexFrom)}. Is er een nieuwe kookgroep nodig vanuit de meterkast, dan start dat vanaf ${eurNl(prices.perilexWithNewGroupFrom)}, inclusief materiaal en test.`,
  },
  {
    q: "Kunnen jullie een laadpaal installeren?",
    a: `Ja. Een 1-fase wallbox installeren start vanaf ${eurNl(prices.laadpaal1PhaseFrom)} en 3-fase vanaf ${eurNl(prices.laadpaal3PhaseFrom)}, inclusief aparte groep en NEN 1010 installatiecertificaat.`,
  },
  {
    q: "Wat kost een elektrische keuring?",
    a: `Een NEN 1010 opleveringskeuring of NEN 3140 inspectie voor woning, VvE of bedrijf start vanaf ${eurNl(prices.keuringWoningFrom)}, inclusief digitaal rapport en certificaat. Een herkeuring kost vanaf ${eurNl(prices.keuringHerkeuringFrom)}.`,
  },
  {
    q: "Mijn aardlekschakelaar slaat steeds af — wat nu?",
    a: "Wij meten de installatie groep voor groep door met professionele meetapparatuur. Veelvoorkomende oorzaken zijn vocht, een defect apparaat of verouderde bedrading. We lossen de oorzaak op en controleren daarna de hele installatie.",
  },
  {
    q: "In welke gebieden werkt VoltFix?",
    a: "Heel Amsterdam (Centrum, Zuid, West, Oost, Noord, De Pijp, Jordaan, Watergraafsmeer, Zuidoost, IJburg) en de directe regio: Amstelveen, Diemen, Ouder-Amstel, Zaandam en Haarlem.",
  },
  {
    q: "Helpen jullie ook Engelstalige klanten?",
    a: "Ja, onze monteurs helpen expats in het Engels. De Engelstalige pagina's staan onder /en-gb.",
  },
  {
    q: "Krijg ik vooraf een prijs?",
    a: "Ja. Voor vaste diensten geven we een vaste prijs vooraf. Loopt een klus uit of is er extra materiaal nodig, dan stopt de monteur en hoort u eerst wat het extra kost — pas daarna gaan we door.",
  },
  {
    q: "Hoe kan ik een afspraak maken?",
    a: `Bel ${business.phoneDisplay}, stuur een WhatsApp of vraag online een offerte aan via het contactformulier. Voor afspraken binnen 48 uur is bellen of WhatsApp het snelst.`,
  },
];

export const Route = createFileRoute("/veelgestelde-vragen")({
  head: () => ({
    meta: pageMeta({
      title: "Veelgestelde vragen | Elektricien Amsterdam VoltFix",
      description:
        "Antwoorden over tarieven, spoed, garantie en certificering van VoltFix. € 90/uur kantooruren, € 145 eerste uur avond/weekend, 24/7 bereikbaar.",
      path,
      locale: "nl",
    }),
    links: [{ rel: "canonical", href: absoluteUrl(path) }, ...altLinks(path)],
    scripts: [
      ldScript(faqSchema(faqsNl, "nl", path)),
      ldScript(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Veelgestelde vragen", path },
        ]),
      ),
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <>
      <section className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center">
          <h1 className="text-3xl font-bold text-balance text-white sm:text-4xl">
            Veelgestelde vragen over elektriciens in Amsterdam
          </h1>
          <p className="mt-4 text-lg text-white/85">
            Antwoorden op de meest gestelde vragen over tarieven, spoed, garantie en onze
            werkwijze — kort en zonder kleine lettertjes.
          </p>
        </div>
      </section>

      <ServiceFaq faqs={faqsNl} title="Alle antwoorden op een rij" />

      <RatesTable />

      <TechnicianByline />

      <CtaBand
        title="Uw vraag er niet bij?"
        text="Bel of app ons — u krijgt direct een ervaren elektricien aan de lijn."
        location="faq-hub"
      />
    </>
  );
}
