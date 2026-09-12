import { getService } from './service-config';
import type { IntakeContext, IntakeState, ServiceId, Step } from './types';

// ---------------------------------------------------------------------------
// Vervangt de uitsluitingslijst van booking-paths.ts. Niet: "mag deze pagina
// een flow tonen", maar: "welke context geeft deze pagina mee".
// ---------------------------------------------------------------------------

type PageContext = { service: ServiceId | null; intent: IntakeContext['intent'] };

const PAGE_CONTEXT: Record<string, PageContext> = {
  '/groepenkast-amsterdam': { service: 'groepenkast', intent: null },
  '/groepenkast-vervangen-amsterdam': { service: 'groepenkast', intent: null },
  '/groepenkast-samenstellen': { service: 'groepenkast', intent: 'vasteprijs' },
  '/laadpaal-amsterdam': { service: 'laadpaal', intent: null },
  '/perilex-amsterdam': { service: 'perilex', intent: null },
  '/perilex-aansluiten-amsterdam': { service: 'perilex', intent: null },
  '/3-fase-aansluiting-amsterdam': { service: 'groepenkast', intent: null },
  // Spoed: géén wizard. Deze pagina's stonden in EXCLUDED_PREFIXES; nu geven
  // ze expliciet de spoedroute mee in plaats van helemaal geen intake.
  '/spoed-elektricien-amsterdam': { service: 'storing', intent: 'spoed' },
  '/stroomstoring-amsterdam': { service: 'storing', intent: 'spoed' },
};

/** Pagina's zonder intake: transactioneel of utility. */
const GEEN_INTAKE = ['/review', '/seo-monitor', '/conversie-monitor', '/keyword-tool', '/auth', '/onboarding', '/admin', '/postcode-check', '/postocode-check', '/perilex-zelf-aansluiten', '/cookiebeleid', '/privacybeleid'];

const normaliseer = (pathname: string): string => {
  const p = (pathname.replace(/\/+$/, '') || '/').replace(/^\/en-gb/, '');
  return p || '/';
};

export function hasIntake(pathname: string): boolean {
  const p = normaliseer(pathname);
  return !GEEN_INTAKE.some((x) => p === x || p.startsWith(x + '/'));
}

export function getIntakeContext(pathname: string): IntakeContext {
  const p = normaliseer(pathname);
  const ctx = PAGE_CONTEXT[p] ?? { service: null, intent: null };
  return { ...ctx, sourcePage: pathname };
}

// ---------------------------------------------------------------------------
// Padopbouw. Entry-stappen (dienst, intentie) staan LOS van de route: het pad
// wordt éénmalig bij binnenkomst bepaald, niet afgeleid uit ingevulde
// antwoorden. Anders verdwijnt een stap zodra hij beantwoord is en loopt de
// teller terug onder de gebruiker.
// ---------------------------------------------------------------------------

export type PathShape = { entry: Step[]; route: Step[]; alle: Step[] };

export type PathFlags = { padDienst: boolean; padIntent: boolean };

export const initialFlags = (ctx: IntakeContext): PathFlags => ({
  padDienst: !ctx.service,
  padIntent: !ctx.intent,
});

export function buildPath(state: IntakeState, flags: PathFlags): PathShape {
  const cfg = getService(state.service);
  const entry: Step[] = [];
  if (flags.padDienst) entry.push('dienst');
  if (flags.padIntent) entry.push('intent');

  let route: Step[] = [];
  if (state.intent === 'spoed') {
    route = ['spoed'];
  } else if (state.intent) {
    route = ['gebied'];
    if (state.intent === 'vasteprijs' && cfg) {
      cfg.vragen.forEach((v) => route.push(`vraag:${v.id}` as Step));
    }
    if (state.intent === 'foto') route.push('foto');
    route.push('planning', 'contact', 'overzicht');
  }

  return { entry, route, alle: [...entry, ...route] };
}

export const questionIdOf = (step: Step): string | null =>
  step.startsWith('vraag:') ? step.slice(6) : null;
