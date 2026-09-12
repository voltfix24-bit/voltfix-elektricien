import { prices } from '../pricing';
import { getService } from './service-config';
import type { IntakeState, PriceResult, Question } from './types';

// Eén plek waar bedrag ÉN status bepaald worden. De UI toont nooit een
// verzonnen bedrag: bij een onvolledige keuze is de status 'open'.

export const euro = (n: number): string => '€' + n.toLocaleString('nl-NL');

/** Openingstijden uit business.ts: ma–vr 08:00–18:00, za 09:00–17:00, zo dicht. */
export function dienstvenster(nu: Date = new Date()): { open: boolean; opent: string } {
  const dag = nu.getDay();
  const uur = nu.getHours() + nu.getMinutes() / 60;
  if (dag >= 1 && dag <= 5) return { open: uur >= 8 && uur < 18, opent: 'morgenochtend om 08:00' };
  if (dag === 6) return { open: uur >= 9 && uur < 17, opent: uur < 9 ? 'vandaag om 09:00' : 'maandag om 08:00' };
  return { open: false, opent: 'maandag om 08:00' };
}

const somVanAntwoorden = (vragen: Question[], keuzeData: IntakeState['keuzeData']) => {
  let som = 0;
  let compleet = true;
  for (const v of vragen) {
    const gekozen = keuzeData[v.id];
    if (v.type === 'single') {
      if (typeof gekozen !== 'string' || !gekozen) {
        compleet = false;
        continue;
      }
      som += v.opties.find((o) => o.id === gekozen)?.prijs ?? 0;
    } else {
      for (const id of (gekozen as string[] | undefined) ?? []) {
        som += v.opties.find((o) => o.id === id)?.prijs ?? 0;
      }
    }
  }
  return { som, compleet };
};

export function computePrice(state: IntakeState, nu: Date = new Date()): PriceResult {
  const cfg = getService(state.service);

  if (state.intent === 'spoed') {
    const v = dienstvenster(nu);
    const bedrag = v.open ? prices.emergencyFirstHour : prices.offHoursFirstHour;
    return {
      status: 'tarief',
      label: v.open ? 'Storingstarief' : 'Avond- en weekendtarief',
      bedrag: euro(bedrag),
      bedragCent: bedrag,
      toelichting: 'Eerste uur all-in, voorrijden inbegrepen. Daarna per 15 minuten.',
    };
  }

  if (state.intent === 'schouw') {
    return {
      status: 'schouw',
      label: 'Schouw',
      bedrag: euro(prices.groepenkastSurvey),
      bedragCent: prices.groepenkastSurvey,
      toelichting:
        'Gratis als wij het werk doen: gaat de klus door, dan gaat de €90 van je eindfactuur af. Gaat hij niet door, dan houd je het rapport en betaal je alleen de schouw.',
    };
  }

  if (state.intent === 'foto') {
    return {
      status: 'na-foto',
      label: 'Jouw richtprijs',
      bedrag: 'Volgt na je foto',
      bedragCent: null,
      toelichting: cfg
        ? `Je krijgt een all-in richtprijs zodra we je foto gezien hebben. Vergelijkbare klussen starten bij ${euro(cfg.vanaf)}.`
        : 'Je krijgt een richtprijs zodra we je foto gezien hebben.',
    };
  }

  if (state.intent === 'vasteprijs' && cfg) {
    const { som, compleet } = somVanAntwoorden(cfg.vragen, state.keuzeData);
    if (!compleet) {
      return { status: 'open', label: 'Jouw richtprijs', bedrag: 'Nog te bepalen', bedragCent: null, toelichting: '' };
    }
    return {
      status: 'vast',
      label: 'Jouw richtprijs',
      bedrag: euro(som),
      bedragCent: som,
      toelichting:
        'All-in richtprijs incl. montage, materiaal en 21% btw. De vaste prijs bevestigen we na de controle, vóór de start van het werk.',
    };
  }

  return { status: 'open', label: 'Jouw richtprijs', bedrag: 'Nog te bepalen', bedragCent: null, toelichting: '' };
}
