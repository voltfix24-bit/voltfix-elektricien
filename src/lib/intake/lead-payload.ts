import { computePrice } from './pricing-engine';
import { buildPath, type PathFlags } from './routing';
import { planningLabel } from './scheduling';
import { checkArea } from './service-area';
import type { IntakeContext, IntakeState, PriceStatus, ServiceId } from './types';

// Altijd dezelfde basisstructuur, ongeacht dienst. Dienstspecifieke antwoorden
// gaan als 'selections' mee — niet als losse kolommen, anders moet het schema
// meegroeien met elke nieuwe dienst.

export type LeadStatus = 'draft' | 'new' | 'triaged' | 'quoted' | 'accepted' | 'scheduled' | 'needs_info' | 'lost';

export type LeadPayload = {
  intakeSessionId: string;
  status: LeadStatus;
  service: ServiceId | null;
  intent: IntakeContext['intent'];
  sourcePage: string;
  route: string;
  postcode: string | null;
  huisnummer: string | null;
  plaats: string | null;
  inServiceArea: boolean | null;
  priceStatus: PriceStatus;
  priceAmount: number | null;
  selections: Record<string, string | string[]>;
  photos: number;
  preferredSlot: string | null;
  naam: string | null;
  telefoon: string | null;
  email: string | null;
  consent: boolean;
};

export function toLeadPayload(
  state: IntakeState,
  ctx: IntakeContext,
  opts: { sessionId: string; status: LeadStatus; flags: PathFlags },
): LeadPayload {
  const prijs = computePrice(state);
  const area = checkArea(state.postcode);
  const pad = buildPath(state, opts.flags);

  return {
    intakeSessionId: opts.sessionId,
    status: opts.status,
    service: state.service,
    intent: state.intent,
    sourcePage: ctx.sourcePage,
    route: pad.alle.join(' → '),
    postcode: state.postcode || null,
    huisnummer: state.huisnummer || null,
    plaats: area?.plaats ?? null,
    inServiceArea: area ? area.ok : null,
    priceStatus: prijs.status,
    priceAmount: prijs.bedragCent,
    selections: state.keuzeData,
    photos: state.fotos.length,
    preferredSlot: planningLabel(state.planDatum, state.planDagdeel) || null,
    // Een draft draagt bewust géén contactgegevens: dat is het hele punt van
    // opslaan vóór de contactstap.
    naam: opts.status === 'draft' ? null : state.naam || null,
    telefoon: opts.status === 'draft' ? null : state.telefoon || null,
    email: opts.status === 'draft' ? null : state.email || null,
    consent: state.akkoord,
  };
}
