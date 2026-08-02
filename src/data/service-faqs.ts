// Extra FAQ-blokken per dienst: prijs- en werkwijzevragen.
// Doel: citeerbare antwoorden voor AI-zoekmachines (ChatGPT, Perplexity,
// Google AI Overviews) én FAQPage JSON-LD op elke servicepagina.
// Alle bedragen komen uit src/lib/pricing.ts (single source of truth).

import {
  prices,
  eurNl,
  eurEn,
  fromNl,
  fromEn,
  rangeNl,
  rangeEn,
  perHourNl,
  perHourEn,
  firstHourAllInNl,
  firstHourAllInEn,
  vatConsumerNoteNl,
  vatConsumerNoteEn,
  firstHourNoteNl,
  firstHourNoteEn,
} from "@/lib/pricing";

export type FaqItem = { q: string; a: string };

const payNl =
  "Betalen kan direct na afloop via pin, tikkie of op factuur (14 dagen). U ontvangt altijd een gespecificeerde factuur met btw.";
const payEn =
  "You can pay right after the job by card, payment link or on invoice (14 days). You always receive a specified invoice including VAT.";

const processNl = (steps: string) =>
  `Onze werkwijze in 4 stappen: 1) u belt of appt ons en beschrijft de klus (foto's mogen), 2) u krijgt binnen korte tijd een prijsindicatie of vaste prijs, 3) we plannen een aankomstslot van één uur (bijv. 14:00–15:00), 4) ${steps} Na afloop testen we de installatie en krijgt u de factuur per e-mail.`;
const processEn = (steps: string) =>
  `Our process in 4 steps: 1) you call or WhatsApp us and describe the job (photos welcome), 2) you receive a price indication or fixed price shortly after, 3) we book a one-hour arrival slot (e.g. 14:00–15:00), 4) ${steps} Afterwards we test the installation and email you the invoice.`;

export const priceProcessFaqs = {
  nl: {
    elektricien: [
      {
        q: "Wat kost een elektricien in Amsterdam per uur?",
        a: `Ons uurtarief binnen kantooruren is ${perHourNl(prices.hourly)} inclusief voorrijden binnen Amsterdam. Bij een storing rekenen we ${firstHourAllInNl(prices.emergencyFirstHour)}; in de avond, nacht, het weekend en op feestdagen is dat ${firstHourAllInNl(prices.offHoursFirstHour)}. ${firstHourNoteNl} ${vatConsumerNoteNl}`,
      },
      {
        q: "Rekenen jullie voorrijkosten in Amsterdam?",
        a: "Nee, binnen Amsterdam en Amstelveen zitten de voorrijkosten in het tarief. Buiten dit gebied stemmen we vooraf af of er reiskosten bij komen — u weet het altijd voordat we rijden.",
      },
      {
        q: "Hoe verloopt een afspraak met VoltFix?",
        a: processNl(
          "de elektricien komt binnen het gekozen uur en voert de klus uit.",
        ),
      },
      {
        q: "Hoe kan ik betalen en krijg ik een offerte vooraf?",
        a: `Voor geplande klussen (groepenkast, perilex, laadpaal, keuring) krijgt u vooraf een vaste prijs op papier. Voor storingen werken we op uurbasis met een all-in eerste uur. ${payNl}`,
      },
    ],
    spoed: [
      {
        q: "Wat kost een spoed elektricien in Amsterdam?",
        a: `Een spoedmelding kost ${firstHourAllInNl(prices.emergencyFirstHour)} — voorrijden inbegrepen. Ook binnen kantooruren rekenen we dit tarief zonder spoedtoeslag. In de avond, nacht, het weekend en op feestdagen geldt ${firstHourAllInNl(prices.offHoursFirstHour)}. ${firstHourNoteNl} ${vatConsumerNoteNl}`,
      },
      {
        q: "Hoe snel is een spoed elektricien bij mij in Amsterdam?",
        a: "In de meeste Amsterdamse wijken zijn we binnen 60 minuten ter plaatse. U hoort bij het telefoongesprek direct een realistische aankomsttijd — geen vage beloftes.",
      },
      {
        q: "Hoe werkt een spoedmelding stap voor stap?",
        a: processNl(
          "de monteur rijdt direct naar u toe, lokaliseert de storing en herstelt waar mogelijk dezelfde rit.",
        ),
      },
      {
        q: "Betaal ik ook als de storing niet direct te verhelpen is?",
        a: `Ja, u betaalt het eerste uur voor het onderzoek en de veiligstelling. Blijkt er vervolgwerk nodig, dan hoort u eerst wat het kost voordat we doorgaan. ${payNl}`,
      },
    ],
    stroomstoring: [
      {
        q: "Wat kost het opsporen van een stroomstoring?",
        a: `Het opsporen en verhelpen van een stroomstoring kost ${firstHourAllInNl(prices.stroomstoringFirstHour)}, inclusief voorrijden en meetwerk. ${firstHourNoteNl} ${vatConsumerNoteNl}`,
      },
      {
        q: "Hoe sporen jullie een storing op?",
        a: processNl(
          "we meten de installatie groep voor groep door, isoleren de defecte groep of het defecte apparaat en herstellen de fout.",
        ),
      },
      {
        q: "Kan ik de kosten beperken door zelf iets te controleren?",
        a: "Ja. Controleer eerst of de aardlekschakelaar is uitgeschakeld, of de buren ook zonder stroom zitten en of het probleem verdwijnt als u één apparaat uitschakelt. Dit vertelt u ons aan de telefoon, zodat de monteur gerichter kan werken.",
      },
    ],
    groepenkast: [
      {
        q: "Wat kost een nieuwe groepenkast en zit alles bij die prijs in?",
        a: `Een nieuwe groepenkast kost ${rangeNl(prices.groepenkastFrom, prices.groepenkastTo)} inclusief materiaal, montage, testen en afvoer van de oude kast. Een volledige vervanging met keuring start vanaf ${eurNl(prices.groepenkastFullReplacementFrom)}. U krijgt altijd een vaste prijs vooraf. ${vatConsumerNoteNl}`,
      },
      {
        q: "Hoe verloopt het vervangen van een groepenkast?",
        a: processNl(
          "we schakelen de installatie af, plaatsen de nieuwe kast volgens NEN 1010, sluiten alle groepen aan en meten de installatie door.",
        ),
      },
      {
        q: "Wat kost een extra groep bijplaatsen?",
        a: `Een extra groep bijplaatsen in een bestaande kast start ${fromNl(prices.laadpaalExtraGroupFrom)}, afhankelijk van de ruimte in de kast en de kabelloop. Bij een complete vervanging is een extra groep vaak voordeliger om meteen mee te nemen.`,
      },
      {
        q: "Hoe betaal ik en krijg ik een offerte op papier?",
        a: `Ja, u ontvangt vooraf een schriftelijke offerte met een vaste prijs. ${payNl}`,
      },
    ],
    perilex: [
      {
        q: "Wat kost het aansluiten van een perilex stopcontact?",
        a: `Een perilex stopcontact aansluiten op een bestaande kookgroep kost ${fromNl(prices.perilexFrom)}. Is er nog geen kookgroep, dan komt er een nieuwe groep bij en start het ${fromNl(prices.perilexWithNewGroupFrom)}, inclusief materiaal en aansluiten in de meterkast. ${vatConsumerNoteNl}`,
      },
      {
        q: "Hoe lang duurt het aansluiten van perilex en hoe gaat het in zijn werk?",
        a: processNl(
          "de monteur sluit het perilex stopcontact aan, controleert de kookgroep en test het fornuis of de inductieplaat. Reken op 1 tot 2 uur werk.",
        ),
      },
      {
        q: "Moet ik zelf materiaal kopen voor de perilex-aansluiting?",
        a: "Nee, we nemen het perilex stopcontact, de kabel en de zekering standaard mee. Heeft u zelf al materiaal gekocht, geef dat door — dan verrekenen we dat in de prijs.",
      },
    ],
    laadpaal: [
      {
        q: "Wat kost het installeren van een laadpaal in Amsterdam?",
        a: `Een 1-fase laadpaalinstallatie start ${fromNl(prices.laadpaal1PhaseFrom)} en een 3-fase installatie ${fromNl(prices.laadpaal3PhaseFrom)}, inclusief een eigen groep in de meterkast. Een losse extra groep kost ${fromNl(prices.laadpaalExtraGroupFrom)}. ${vatConsumerNoteNl}`,
      },
      {
        q: "Hoe verloopt de installatie van een laadpaal?",
        a: processNl(
          "we monteren de laadpaal, leggen de voedingskabel aan, plaatsen een aparte groep met de juiste beveiliging en melden de installatie aan bij de netbeheerder.",
        ),
      },
      {
        q: "Regelen jullie de aanmelding bij de netbeheerder?",
        a: "Ja, de aanmelding bij Liander hoort standaard bij de installatie. Bij een VvE helpen we ook met de onderbouwing richting het bestuur.",
      },
    ],
    keuring: [
      {
        q: "Wat kost een elektrische keuring van een woning?",
        a: `Een elektrische keuring van een woning start ${fromNl(prices.keuringWoningFrom)} inclusief meetrapport. Een herkeuring na herstel kost ${fromNl(prices.keuringHerkeuringFrom)}. ${vatConsumerNoteNl}`,
      },
      {
        q: "Hoe verloopt een NEN 1010/3140-keuring?",
        a: processNl(
          "we inspecteren de meterkast en installatie visueel, voeren de metingen uit (isolatie, aarding, aardlek) en leveren een rapport met bevindingen en adviezen.",
        ),
      },
      {
        q: "Wat gebeurt er als de installatie afgekeurd wordt?",
        a: `U krijgt een rapport met concrete gebreken en een prijsopgave voor het herstel. Na herstel voeren we een herkeuring uit ${fromNl(prices.keuringHerkeuringFrom)} zodat u een goedgekeurd rapport heeft.`,
      },
    ],
  },
  en: {
    elektricien: [
      {
        q: "How much does an electrician in Amsterdam cost per hour?",
        a: `Our hourly rate during office hours is ${perHourEn(prices.hourly)}, call-out within Amsterdam included. For a fault call we charge ${firstHourAllInEn(prices.emergencyFirstHour)}; evenings, nights, weekends and public holidays are ${firstHourAllInEn(prices.offHoursFirstHour)}. ${firstHourNoteEn} ${vatConsumerNoteEn}`,
      },
      {
        q: "Do you charge a call-out fee in Amsterdam?",
        a: "No. Within Amsterdam and Amstelveen the call-out is included in the rate. Outside this area we agree any travel cost with you in advance, so you always know before we drive out.",
      },
      {
        q: "How does an appointment with VoltFix work?",
        a: processEn(
          "the electrician arrives within your chosen hour and carries out the work.",
        ),
      },
      {
        q: "How can I pay and do I get a quote up front?",
        a: `For planned work (fuse box, perilex, EV charger, inspection) you receive a fixed written price up front. Fault calls are billed hourly with an all-in first hour. ${payEn}`,
      },
    ],
    spoed: [
      {
        q: "How much does an emergency electrician in Amsterdam cost?",
        a: `An emergency call is ${firstHourAllInEn(prices.emergencyFirstHour)}, call-out included. During office hours we charge the same rate with no emergency surcharge. Evenings, nights, weekends and public holidays are ${firstHourAllInEn(prices.offHoursFirstHour)}. ${firstHourNoteEn} ${vatConsumerNoteEn}`,
      },
      {
        q: "How fast can an emergency electrician reach me in Amsterdam?",
        a: "In most Amsterdam neighbourhoods we are on site within 60 minutes. You get a realistic arrival time on the phone — no vague promises.",
      },
      {
        q: "What happens step by step during an emergency call?",
        a: processEn(
          "the engineer drives straight to you, traces the fault and repairs it on the same visit wherever possible.",
        ),
      },
      {
        q: "Do I pay if the fault cannot be fixed immediately?",
        a: `Yes, the first hour covers diagnosis and making the installation safe. If follow-up work is needed you hear the cost before we continue. ${payEn}`,
      },
    ],
    stroomstoring: [
      {
        q: "How much does tracing a power failure cost?",
        a: `Tracing and fixing a power failure costs ${firstHourAllInEn(prices.stroomstoringFirstHour)}, including call-out and measurements. ${firstHourNoteEn} ${vatConsumerNoteEn}`,
      },
      {
        q: "How do you trace an electrical fault?",
        a: processEn(
          "we measure the installation circuit by circuit, isolate the faulty circuit or appliance and repair the fault.",
        ),
      },
      {
        q: "Can I reduce the cost by checking things myself?",
        a: "Yes. Check whether the RCD has tripped, whether your neighbours also lost power, and whether the problem disappears when you unplug one appliance. Tell us on the phone so the engineer can work faster.",
      },
    ],
    groepenkast: [
      {
        q: "How much does a new fuse box cost and what is included?",
        a: `A new fuse box costs ${rangeEn(prices.groepenkastFrom, prices.groepenkastTo)} including materials, installation, testing and removal of the old box. A full replacement including inspection starts at ${eurEn(prices.groepenkastFullReplacementFrom)}. You always get a fixed price up front. ${vatConsumerNoteEn}`,
      },
      {
        q: "How does a fuse box replacement work?",
        a: processEn(
          "we switch off the installation, fit the new consumer unit to NEN 1010, connect every circuit and test the installation.",
        ),
      },
      {
        q: "What does adding an extra circuit cost?",
        a: `Adding an extra circuit to an existing fuse box starts ${fromEn(prices.laadpaalExtraGroupFrom)}, depending on space in the box and cable routing. During a full replacement it is usually cheaper to add it straight away.`,
      },
      {
        q: "How do I pay and do I get a written quote?",
        a: `Yes, you receive a written quote with a fixed price beforehand. ${payEn}`,
      },
    ],
    perilex: [
      {
        q: "How much does connecting a perilex socket cost?",
        a: `Connecting a perilex socket to an existing cooker circuit costs ${fromEn(prices.perilexFrom)}. If there is no cooker circuit yet, a new circuit is added and it starts ${fromEn(prices.perilexWithNewGroupFrom)}, including materials and connection in the fuse box. ${vatConsumerNoteEn}`,
      },
      {
        q: "How long does a perilex connection take and how does it work?",
        a: processEn(
          "the engineer connects the perilex socket, checks the cooker circuit and tests your hob or range. Expect 1 to 2 hours of work.",
        ),
      },
      {
        q: "Do I need to buy materials myself?",
        a: "No, we bring the perilex socket, cable and breaker as standard. If you already bought materials, let us know and we deduct it from the price.",
      },
    ],
    laadpaal: [
      {
        q: "How much does EV charger installation in Amsterdam cost?",
        a: `A single-phase installation starts ${fromEn(prices.laadpaal1PhaseFrom)} and a three-phase installation ${fromEn(prices.laadpaal3PhaseFrom)}, including a dedicated circuit in the fuse box. A separate extra circuit costs ${fromEn(prices.laadpaalExtraGroupFrom)}. ${vatConsumerNoteEn}`,
      },
      {
        q: "How does EV charger installation work?",
        a: processEn(
          "we mount the charger, run the supply cable, fit a dedicated circuit with the correct protection and notify the grid operator.",
        ),
      },
      {
        q: "Do you handle the grid operator notification?",
        a: "Yes, registration with Liander is included as standard. For a VvE we also help with the documentation for the board.",
      },
    ],
    keuring: [
      {
        q: "How much does an electrical inspection of a home cost?",
        a: `An electrical inspection of a home starts ${fromEn(prices.keuringWoningFrom)} including a measurement report. A re-inspection after repairs costs ${fromEn(prices.keuringHerkeuringFrom)}. ${vatConsumerNoteEn}`,
      },
      {
        q: "How does a NEN 1010/3140 inspection work?",
        a: processEn(
          "we visually inspect the fuse box and installation, carry out the measurements (insulation, earthing, RCD) and deliver a report with findings and advice.",
        ),
      },
      {
        q: "What happens if the installation fails the inspection?",
        a: `You receive a report listing the concrete defects plus a quote for the repairs. After the repairs we carry out a re-inspection ${fromEn(prices.keuringHerkeuringFrom)} so you end up with an approved report.`,
      },
    ],
  },
} satisfies Record<"nl" | "en", Record<string, FaqItem[]>>;
