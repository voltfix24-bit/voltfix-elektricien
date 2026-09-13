/**
 * Fase 5B — gerichte klantaanvulling via een beveiligde link.
 *
 * Pure module: geen storage, geen netwerk, geen React. Zowel de interne UI,
 * de klantpagina als de server gebruiken exact deze codes en regels. Alles wat
 * hieruit komt zijn stabiele codes — nooit vertaalde teksten.
 */

import type { AttachmentCategory } from './attachments';

/* -------------------------------------------------------------------------- */
/* Gevraagde punten                                                            */
/* -------------------------------------------------------------------------- */

export const infoRequestItemCodes = [
  'photo_consumer_unit',
  'photo_existing_outlet',
  'photo_installation_location',
  'photo_appliance_label',
  'kitchen_plan',
  'socket_present_choice',
  'extra_question',
] as const;
export type InfoRequestItemCode = (typeof infoRequestItemCodes)[number];

export type InfoRequestItemKind = 'file' | 'choice' | 'text';

type ItemDefinition = {
  kind: InfoRequestItemKind;
  /** Bestaande bijlagecategorie (fase 4) — nooit een nieuwe categorie. */
  category: AttachmentCategory | null;
  /** Vaste antwoordopties voor keuzevragen. */
  options: readonly string[];
  /** Welke "kan ik niet leveren"-redenen logisch zijn bij dit punt. */
  unavailableReasons: readonly InfoRequestUnavailableReason[];
};

export const infoRequestUnavailableReasons = ['dont_know', 'dont_have', 'later'] as const;
export type InfoRequestUnavailableReason = (typeof infoRequestUnavailableReasons)[number];

const fileReasons = ['dont_have', 'later'] as const;

export const infoRequestItems: Record<InfoRequestItemCode, ItemDefinition> = {
  photo_consumer_unit: { kind: 'file', category: 'consumer_unit', options: [], unavailableReasons: fileReasons },
  photo_existing_outlet: { kind: 'file', category: 'existing_outlet', options: [], unavailableReasons: fileReasons },
  photo_installation_location: { kind: 'file', category: 'installation_location', options: [], unavailableReasons: fileReasons },
  photo_appliance_label: { kind: 'file', category: 'appliance_label', options: [], unavailableReasons: fileReasons },
  kitchen_plan: { kind: 'file', category: 'kitchen_plan', options: [], unavailableReasons: fileReasons },
  socket_present_choice: {
    kind: 'choice',
    category: null,
    options: ['yes', 'no', 'unknown'],
    // "Weet ik niet" zit al in de opties; een extra reden zou dubbelop zijn.
    unavailableReasons: [],
  },
  extra_question: { kind: 'text', category: null, options: [], unavailableReasons: ['dont_know', 'later'] },
};

export function isInfoRequestItemCode(value: unknown): value is InfoRequestItemCode {
  return typeof value === 'string' && (infoRequestItemCodes as readonly string[]).includes(value);
}

/** Bijlagecategorie die bij een gevraagd punt hoort; `null` = geen bestand. */
export function categoryForItem(code: InfoRequestItemCode): AttachmentCategory | null {
  return infoRequestItems[code].category;
}

/** Welke categorieën deze vraagversie server-side toestaat. */
export function allowedCategories(codes: readonly InfoRequestItemCode[]): AttachmentCategory[] {
  const set = new Set<AttachmentCategory>();
  for (const code of codes) {
    const category = categoryForItem(code);
    if (category) set.add(category);
  }
  return [...set];
}

/* -------------------------------------------------------------------------- */
/* Suggesties uit de beoordeling                                               */
/* -------------------------------------------------------------------------- */

/** Vertaalt `missing_info`/follow-up-codes naar voorstelbare punten. */
const suggestionMap: Record<string, InfoRequestItemCode> = {
  photo_consumer_unit: 'photo_consumer_unit',
  photo_installation_location: 'photo_installation_location',
  photo_existing_outlet: 'photo_existing_outlet',
  kitchen_plan: 'kitchen_plan',
  appliance_label: 'photo_appliance_label',
  appliance_model: 'photo_appliance_label',
};

/**
 * Voorstel voor de medewerker. Al ontvangen categorieën vallen af zodat we
 * niet onnodig opnieuw vragen. Dit is een suggestie, geen selectie: de UI
 * vinkt niets standaard aan.
 *
 * Een fabrikantschema of bedradingsvraag staat hier bewust niet in: dat is
 * geen vraag voor een leek en kan op locatie worden gecontroleerd.
 */
export function suggestedInfoRequestItems(input: {
  missingInfo: readonly string[];
  receivedCategories: readonly string[];
}): InfoRequestItemCode[] {
  const out: InfoRequestItemCode[] = [];
  for (const raw of input.missingInfo) {
    const code = suggestionMap[raw];
    if (!code) continue;
    const category = categoryForItem(code);
    if (category && input.receivedCategories.includes(category)) continue;
    if (!out.includes(code)) out.push(code);
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Levenscyclus van het informatieverzoek                                      */
/* -------------------------------------------------------------------------- */

export const infoRequestStatuses = ['draft', 'open', 'submitted', 'withdrawn', 'superseded'] as const;
export type InfoRequestStatus = (typeof infoRequestStatuses)[number];

/** Alleen een open verzoek geeft de klant schrijfrechten. */
export function isWritableStatus(status: InfoRequestStatus): boolean {
  return status === 'open';
}

export type AccessState =
  | { ok: true }
  | { ok: false; reason: 'expired' | 'withdrawn' | 'superseded' | 'already_submitted' | 'not_open' };

/** Geldigheid wordt uitsluitend met servertijd getoetst. */
export function evaluateAccess(input: { status: InfoRequestStatus; expiresAt: string; now?: Date }): AccessState {
  const now = input.now ?? new Date();
  if (input.status === 'withdrawn') return { ok: false, reason: 'withdrawn' };
  if (input.status === 'superseded') return { ok: false, reason: 'superseded' };
  if (input.status === 'submitted') return { ok: false, reason: 'already_submitted' };
  if (input.status !== 'open') return { ok: false, reason: 'not_open' };
  if (new Date(input.expiresAt).getTime() <= now.getTime()) return { ok: false, reason: 'expired' };
  return { ok: true };
}

/** Standaardgeldigheid: zeven dagen, centraal. */
export const infoRequestValidityDays = 7;
/** Serversessie na inwisselen van het token: maximaal twee uur. */
export const infoRequestSessionMaxSeconds = 2 * 60 * 60;

export function infoRequestExpiresAt(from: Date = new Date()): string {
  const date = new Date(from.getTime());
  date.setUTCDate(date.getUTCDate() + infoRequestValidityDays);
  return date.toISOString();
}

/** Sessie loopt nooit door voorbij de geldigheid van het verzoek. */
export function sessionExpiresAt(requestExpiresAt: string, from: Date = new Date()): string {
  const cap = new Date(requestExpiresAt).getTime();
  const wanted = from.getTime() + infoRequestSessionMaxSeconds * 1000;
  return new Date(Math.min(cap, wanted)).toISOString();
}

/* -------------------------------------------------------------------------- */
/* Matrix aanvraagstatus × toegestane aanvullingsacties                        */
/* -------------------------------------------------------------------------- */

export type InfoRequestAction = 'create' | 'customer_submit' | 'withdraw';

/**
 * Leadstatus is eigenaar (fase 5A-QA). Een ingeplande of geclaimde opdracht
 * kan nog aanvullende informatie nodig hebben; een afgeronde of geannuleerde
 * aanvraag accepteert niets nieuws zonder bewuste interne heropening.
 */
const leadStatusActions: Record<string, readonly InfoRequestAction[]> = {
  new: ['create', 'customer_submit', 'withdraw'],
  dispatched: ['create', 'customer_submit', 'withdraw'],
  claimed: ['create', 'customer_submit', 'withdraw'],
  spam_review: ['withdraw'],
  cancelled: ['withdraw'],
  blocked_spam: ['withdraw'],
};

export function isActionAllowed(leadStatus: string | null | undefined, action: InfoRequestAction): boolean {
  if (!leadStatus) return true; // nog geen lead: alleen de aanvraag bestaat
  return (leadStatusActions[leadStatus] ?? ['withdraw']).includes(action);
}

/* -------------------------------------------------------------------------- */
/* Beantwoording                                                               */
/* -------------------------------------------------------------------------- */

export type InfoRequestAnswer = {
  /** Vrije tekst of gekozen optie; leeg wanneer het punt een bestand is. */
  value?: string | null;
  /** Expliciete reden waarom de klant niets kan aanleveren. */
  unavailable?: InfoRequestUnavailableReason | null;
};

export type AnswerCompleteness = {
  complete: boolean;
  /** Punten zonder antwoord, bestand of expliciete reden. */
  open: InfoRequestItemCode[];
  /** Punten die de klant bewust als ontbrekend heeft gemeld. */
  reported: Array<{ code: InfoRequestItemCode; reason: InfoRequestUnavailableReason }>;
};

const MAX_TEXT = 1000;

/**
 * Een lege aanvulling mag nooit stil als voltooid doorgaan: ieder gevraagd
 * punt heeft een antwoord, een opgeslagen bestand of een expliciete reden.
 */
export function evaluateAnswers(input: {
  items: readonly InfoRequestItemCode[];
  answers: Record<string, InfoRequestAnswer>;
  storedCategories: readonly string[];
}): AnswerCompleteness {
  const open: InfoRequestItemCode[] = [];
  const reported: AnswerCompleteness['reported'] = [];

  for (const code of input.items) {
    const definition = infoRequestItems[code];
    const answer = input.answers[code] ?? {};
    const reason = answer.unavailable ?? null;
    if (reason) {
      if (!definition.unavailableReasons.includes(reason)) {
        open.push(code);
        continue;
      }
      reported.push({ code, reason });
      continue;
    }
    if (definition.kind === 'file') {
      const category = definition.category;
      if (!category || !input.storedCategories.includes(category)) open.push(code);
      continue;
    }
    const value = (answer.value ?? '').trim();
    if (!value || value.length > MAX_TEXT) { open.push(code); continue; }
    if (definition.kind === 'choice' && !definition.options.includes(value)) open.push(code);
  }

  return { complete: open.length === 0, open, reported };
}

/** Begrensde, opgeschoonde antwoorden; onbekende codes verdwijnen. */
export function normaliseAnswers(
  items: readonly InfoRequestItemCode[],
  raw: unknown,
): Record<string, InfoRequestAnswer> {
  const out: Record<string, InfoRequestAnswer> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const code of items) {
    const entry = (raw as Record<string, unknown>)[code];
    if (!entry || typeof entry !== 'object') continue;
    const definition = infoRequestItems[code];
    const value = (entry as InfoRequestAnswer).value;
    const unavailable = (entry as InfoRequestAnswer).unavailable;
    const answer: InfoRequestAnswer = {};
    if (typeof value === 'string' && value.trim()) answer.value = value.trim().slice(0, MAX_TEXT);
    if (
      typeof unavailable === 'string' &&
      (infoRequestUnavailableReasons as readonly string[]).includes(unavailable) &&
      definition.unavailableReasons.includes(unavailable as InfoRequestUnavailableReason)
    ) {
      answer.unavailable = unavailable as InfoRequestUnavailableReason;
    }
    if (answer.value || answer.unavailable) out[code] = answer;
  }
  // Vrije opmerking van de klant: altijd optioneel, telt nooit mee voor
  // volledigheid en heeft geen eigen gevraagd punt nodig.
  const comment = (raw as Record<string, unknown>)[generalCommentKey];
  if (comment && typeof comment === 'object') {
    const value = (comment as InfoRequestAnswer).value;
    if (typeof value === 'string' && value.trim()) {
      out[generalCommentKey] = { value: value.trim().slice(0, MAX_TEXT) };
    }
  }
  return out;
}

/** Sleutel van de vrije, optionele opmerking; geen gevraagd punt. */
export const generalCommentKey = 'general_comment';

/* -------------------------------------------------------------------------- */
/* Klantweergave (preview)                                                     */
/* -------------------------------------------------------------------------- */

export const MAX_EXTRA_QUESTION = 300;

export type CustomerView = {
  language: 'nl' | 'en';
  /** Uitsluitend de klantgerichte toelichting — nooit de interne notitie. */
  note: string;
  items: InfoRequestItemCode[];
  /** De werkelijk gestelde aanvullende vraag; leeg wanneer die niet is gesteld. */
  extraQuestion: string;
};

/**
 * Wat de klant precies te zien krijgt. Interne notities worden nooit
 * automatisch overgenomen: de toelichting is een afzonderlijk veld.
 */
export function buildCustomerView(input: {
  language: string;
  customerNote: string | null | undefined;
  items: readonly string[];
  extraQuestion?: string | null;
}): CustomerView {
  const items = input.items.filter(isInfoRequestItemCode);
  return {
    language: input.language === 'en' ? 'en' : 'nl',
    note: (input.customerNote ?? '').trim().slice(0, 600),
    items,
    // Alleen tonen wanneer de vraag ook echt gevraagd is.
    extraQuestion: items.includes('extra_question')
      ? (input.extraQuestion ?? '').trim().slice(0, MAX_EXTRA_QUESTION)
      : '',
  };
}
