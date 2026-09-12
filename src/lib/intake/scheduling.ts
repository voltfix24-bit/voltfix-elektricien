import type { Dagdeel } from './types';

// Voorkeursplanning, geen echte agenda. Zodra je een echte agenda koppelt,
// vervang je eersteVrijeDag() en isWerkdag() door een beschikbaarheidsquery —
// de rest van de UI blijft ongewijzigd.

export const DAGEN_KORT = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
export const DAGEN_LANG = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
export const MAANDEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];

export const DAGDELEN: { id: Dagdeel; naam: string; tijd: string; zaTijd: string }[] = [
  { id: 'ocht', naam: 'Ochtend', tijd: '08:00–12:00', zaTijd: '09:00–12:00' },
  { id: 'mid', naam: 'Middag', tijd: '12:00–17:00', zaTijd: '12:00–17:00' },
  { id: 'flex', naam: 'Maakt niet uit', tijd: 'Hele dag', zaTijd: 'Hele dag' },
];

export const dagSleutel = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const bijDagen = (d: Date, n: number): Date => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  x.setHours(0, 0, 0, 0);
  return x;
};

/** Alle dagen planbaar, inclusief het weekend (bevestigd 12-09-2026). */
export const isWerkdag = (_d: Date): boolean => true;

/** Vroegste planbare dag ligt drie dagen vooruit (bevestigd 12-09-2026). */
export const VROEGSTE_DAGEN_VOORUIT = 3;

export function eersteVrijeDag(nu: Date = new Date()): Date {
  let d = bijDagen(nu, VROEGSTE_DAGEN_VOORUIT);
  while (!isWerkdag(d)) d = bijDagen(d, 1);
  return d;
}

export type Slot = { datum: Date; dagdeel: Dagdeel; naam: string; tijd: string };

/** De drie eerstvolgende sloten — bovenaan de planningsstap. */
export function volgendeSloten(nu: Date = new Date(), aantal = 3): Slot[] {
  const uit: Slot[] = [];
  let d = eersteVrijeDag(nu);
  while (uit.length < aantal) {
    // In het weekend hanteren we het kortere zaterdagvenster.
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    for (const id of ['ocht', 'mid'] as Dagdeel[]) {
      if (uit.length >= aantal) break;
      const def = DAGDELEN.find((x) => x.id === id)!;
      uit.push({ datum: d, dagdeel: id, naam: def.naam, tijd: weekend ? def.zaTijd : def.tijd });
    }
    d = bijDagen(d, 1);
    while (!isWerkdag(d)) d = bijDagen(d, 1);
  }
  return uit;
}

export function weekVan(offset: number, nu: Date = new Date()): { datum: Date; beschikbaar: boolean }[] {
  const eerste = eersteVrijeDag(nu);
  const maandag = bijDagen(eerste, -((eerste.getDay() + 6) % 7));
  const start = bijDagen(maandag, offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = bijDagen(start, i);
    return { datum: d, beschikbaar: isWerkdag(d) && d >= eerste };
  });
}

export const datumLabel = (d: Date | null, lang = false): string =>
  d ? `${lang ? DAGEN_LANG[d.getDay()] : DAGEN_KORT[d.getDay()]} ${d.getDate()} ${MAANDEN[d.getMonth()]}` : '';

export function planningLabel(datum: Date | null, dagdeel: Dagdeel | null): string {
  if (!datum) return '';
  const dd = DAGDELEN.find((x) => x.id === dagdeel);
  return datumLabel(datum, true) + (dd ? ` · ${dd.naam.toLowerCase()}` : '');
}
