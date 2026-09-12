import type { PriceStatus } from './types';

// ---------------------------------------------------------------------------
// Vakoordeel, geen algoritme. Deze vijf vlaggen zie je niet hard op een foto;
// staat er één aan, dan is een schouw het eerlijke antwoord en wordt een prijs
// op afstand een correctie achteraf.
// ---------------------------------------------------------------------------

export type FlagId = 'aarding' | 'kast' | 'bedrading' | 'vve' | 'fase';

export const TRIAGE_FLAGS: { id: FlagId; naam: string; sub: string }[] = [
  { id: 'aarding', naam: 'Aarding onduidelijk of afwezig', sub: 'Geen zichtbare aardleiding of oude waterleidingaarding' },
  { id: 'kast', naam: 'Kast te klein of moet verplaatst', sub: 'Geen ruimte voor het aantal groepen' },
  { id: 'bedrading', naam: 'Bedrading buiten de kast verdacht', sub: 'Stof, breuk, of zichtbaar verouderd' },
  { id: 'vve', naam: 'Gemeenschappelijke installatie (VvE)', sub: 'Stijgleiding of gedeelde meterruimte' },
  { id: 'fase', naam: '3-fase gewenst, aansluiting is 1-fase', sub: 'Verzwaring via Liander nodig' },
];

export type TriageDecision = 'offerte' | 'schouw' | 'bellen';

export type TriageAdvice = {
  voorstel: TriageDecision;
  reden: string;
};

export function adviseTriage(input: {
  heeftFoto: boolean;
  flags: FlagId[];
  priceStatus: PriceStatus;
}): TriageAdvice {
  if (!input.heeftFoto) {
    return { voorstel: 'schouw', reden: 'Zonder foto kun je geen vaste prijs geven. Chase de foto, of bied een schouw aan.' };
  }
  if (input.flags.length > 0) {
    return {
      voorstel: 'schouw',
      reden: 'Eén of meer vlaggen staan aan — dit is een schouw. Op afstand een prijs geven wordt hier een correctie achteraf.',
    };
  }
  if (input.priceStatus === 'open') {
    return { voorstel: 'bellen', reden: 'De aanvraag is onvolledig; bellen is sneller dan heen en weer mailen.' };
  }
  return { voorstel: 'offerte', reden: 'Geen vlaggen. Foto en antwoorden zijn genoeg voor een vaste prijs op afstand.' };
}

// ---------------------------------------------------------------------------
// SLA. De klok hangt aan de overgang new → triaged, niet aan de hele lead:
// anders piept het alarm pas als de kans al weg is. Alleen openingstijden
// tellen mee — je belooft niets op zondagochtend.
// ---------------------------------------------------------------------------

export const TRIAGE_SLA_MINUTEN = 20;
export const CALLBACK_SLA_MINUTEN = 120;

/** Werkminuten tussen twee momenten (ma–vr 08–18, za 09–17). */
export function werkminutenTussen(van: Date, tot: Date): number {
  let minuten = 0;
  const cursor = new Date(van);
  while (cursor < tot) {
    const dag = cursor.getDay();
    const uur = cursor.getHours() + cursor.getMinutes() / 60;
    const open = dag >= 1 && dag <= 5 ? uur >= 8 && uur < 18 : dag === 6 ? uur >= 9 && uur < 17 : false;
    if (open) minuten += 1;
    cursor.setMinutes(cursor.getMinutes() + 1);
  }
  return minuten;
}

export const isOverdue = (aangemaakt: Date, nu: Date = new Date()): boolean =>
  werkminutenTussen(aangemaakt, nu) > TRIAGE_SLA_MINUTEN;
