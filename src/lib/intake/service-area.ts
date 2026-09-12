// Werkgebied op postcode. Eén bron, ook bruikbaar in de admin en in de
// structured data van de locatiepagina's.

export type AreaResult = { ok: boolean; plaats: string | null };

const RANGES: { van: number; tot: number; plaats: string }[] = [
  { van: 1000, tot: 1109, plaats: 'Amsterdam' },
  { van: 1110, tot: 1113, plaats: 'Diemen' },
  { van: 1180, tot: 1189, plaats: 'Amstelveen' },
  { van: 1500, tot: 1509, plaats: 'Zaandam' },
  { van: 2000, tot: 2065, plaats: 'Haarlem' },
];

export function checkArea(postcode: string): AreaResult | null {
  const pc = (postcode || '').replace(/\s/g, '');
  if (pc.length < 4) return null;
  const n = parseInt(pc.slice(0, 4), 10);
  if (!n) return null;
  const hit = RANGES.find((r) => n >= r.van && n <= r.tot);
  return hit ? { ok: true, plaats: hit.plaats } : { ok: false, plaats: null };
}
