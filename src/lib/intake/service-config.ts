import { prices } from '../pricing';
import type { ServiceConfig, ServiceId } from './types';

// ---------------------------------------------------------------------------
// Het ENIGE bestand dat je aanraakt om een dienst toe te voegen of te wijzigen.
// Bedragen komen uit src/lib/pricing.ts — nooit hier hardcoden, anders leeft de
// prijs op twee plekken en loopt de structured data uit de pas met de pagina.
// ---------------------------------------------------------------------------

export const SERVICES: ServiceConfig[] = [
  {
    id: 'groepenkast',
    naam: 'Groepenkast vervangen',
    actief: true,
    vanaf: prices.groepenkast1Phase,
    vragen: [
      {
        id: 'pakket',
        type: 'single',
        titel: 'Welk pakket past bij je?',
        sub: 'Twijfel je? Ga terug en kies "beoordeel mijn foto" — dat is sneller dan gokken.',
        opties: [
          { id: '1fase', naam: '1-fase basis', sub: '6–8 groepen · de meeste appartementen', prijs: prices.groepenkast1Phase },
          { id: '3fase', naam: '3-fase basis', sub: '6–8 groepen · bij krachtstroom', prijs: prices.groepenkast3Phase },
          { id: '3fase-plus', naam: '3-fase uitgebreid', sub: '10–12 groepen · zon, laadpaal én inductie', prijs: prices.groepenkast3PhaseExtended },
        ],
      },
      {
        id: 'opties',
        type: 'multi',
        titel: 'Iets bij te kiezen?',
        sub: 'Alleen als je het nodig hebt. Onze monteur adviseert eerlijk.',
        opties: [
          { id: 'kook', naam: 'Kookgroep / inductie', sub: 'Eigen beveiligde groep', prijs: prices.groepenkastInduction },
          { id: 'pv', naam: 'Zonnepanelen (PV)', sub: 'Aparte groep voor de omvormer', prijs: prices.groepenkastSolar },
          { id: 'ala', naam: 'Aardlekautomaten', sub: 'Elke groep eigen aardlek', prijs: prices.groepenkastRcbo },
          { id: 'osb', naam: 'Overspanningsbeveiliging', sub: 'Bescherming bij blikseminslag', prijs: prices.groepenkastSurge },
          { id: 'bel', naam: 'Beltrafo vervangen', sub: 'Voeding voor je deurbel', prijs: prices.groepenkastBell },
        ],
      },
    ],
    foto: {
      titel: 'Zo wordt je foto bruikbaar',
      instructies: ['Deurtje open, hele kast in beeld', 'Labels en automaten leesbaar', 'Genoeg licht, niet te dichtbij'],
      waarschuwing: 'Open alleen het deurtje. Schroef de beschermkap niet los, verwijder geen zegels en raak geen bedrading aan.',
    },
    trust:
      'Inbegrepen: montage, materiaal, testen en labelen van alle groepen, afvoer van de oude kast en 21% btw. Niet inbegrepen: verzwaring van de netaansluiting (via Liander), verplaatsen van de meterkast en hak- of breekwerk.',
  },
  {
    id: 'laadpaal',
    naam: 'Laadpaal installeren',
    actief: true,
    vanaf: prices.laadpaal1PhaseFrom,
    vragen: [
      {
        id: 'aansluiting',
        type: 'single',
        titel: 'Wat voor aansluiting heb je?',
        sub: 'Weet je het niet zeker? Ga terug en stuur een foto van je meterkast.',
        opties: [
          { id: '1f', naam: '1-fase laadpunt', sub: 'Tot 3,7 kW · standaard aansluiting', prijs: prices.laadpaal1PhaseFrom },
          { id: '3f', naam: '3-fase laadpunt', sub: 'Tot 11 kW · sneller laden', prijs: prices.laadpaal3PhaseFrom },
        ],
      },
      {
        id: 'extra',
        type: 'multi',
        titel: 'Extra werk verwacht?',
        sub: 'Onze monteur bevestigt dit na de foto- of schouwcontrole.',
        opties: [
          { id: 'groep', naam: 'Extra groep in de kast', sub: 'Nodig als er geen vrije groep is', prijs: prices.laadpaalExtraGroupFrom },
        ],
      },
    ],
    foto: {
      titel: "Twee foto's helpen ons het meest",
      instructies: ['De geopende meterkast', 'De plek waar de laadpaal moet komen', 'De route ertussen, als die zichtbaar is'],
      waarschuwing: 'Open alleen het deurtje van de meterkast. Raak geen bedrading aan.',
    },
    trust:
      'Richtprijs excl. de laadpaal zelf. Inbegrepen: installatie, bekabeling tot 15 meter, aansluiting en testen. Een laadpaal op eigen terrein mag altijd; een paal aan de openbare weg loopt via de gemeente.',
  },
  {
    id: 'perilex',
    naam: 'Perilex / kookgroep',
    actief: true,
    vanaf: prices.perilexFrom,
    vragen: [
      {
        id: 'situatie',
        type: 'single',
        titel: 'Wat is de situatie?',
        sub: 'Weet je het niet? Een foto van de bestaande aansluiting is genoeg.',
        opties: [
          { id: 'bestaand', naam: 'Er ligt al een perilexgroep', sub: 'Alleen aansluiten of stopcontact vervangen', prijs: prices.perilexFrom },
          { id: 'nieuw', naam: 'Er moet een groep bij', sub: 'Nieuwe kookgroep vanuit de meterkast', prijs: prices.perilexWithNewGroupFrom },
        ],
      },
    ],
    foto: {
      titel: 'Fotografeer deze twee dingen',
      instructies: ['De huidige aansluiting achter het fornuis', 'De geopende meterkast', 'Het typeplaatje van je kookplaat, als je dat ziet'],
      waarschuwing: 'Trek de stekker eruit voor je fotografeert. Schroef niets los.',
    },
    trust:
      'Vaste prijs vooraf. Inbegrepen: materiaal, montage, testen en 21% btw. Een perilexgroep is verplicht voor de meeste inductiekookplaten — een gewoon stopcontact is niet veilig genoeg.',
  },
  {
    id: 'storing',
    naam: 'Storing of geen stroom',
    actief: true,
    alleenSpoed: true,
    vanaf: prices.emergencyFirstHour,
    vragen: [],
    trust: '',
  },
  {
    id: 'keuring',
    naam: 'Elektrische keuring',
    actief: false, // feature flag — zet op true zodra de dienst live mag
    vanaf: prices.keuringWoningFrom,
    vragen: [],
    trust: '',
  },
];

export const getService = (id: ServiceId | null): ServiceConfig | null =>
  SERVICES.find((s) => s.id === id) ?? null;

export const activeServices = (): ServiceConfig[] => SERVICES.filter((s) => s.actief);
