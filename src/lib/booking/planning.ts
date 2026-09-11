import { z } from 'zod';

import type { GroupLocale } from '@/lib/groepenkast';

/**
 * Gedeelde planningsmodule van de centrale booking-engine.
 *
 * Er is (nog) geen gekoppelde agendacapaciteit. Deze module verzamelt daarom
 * uitsluitend een *voorkeur*: `planningMode` staat vast op `preference`. Een
 * keuze reserveert geen monteur, materiaal of agenda en zegt niets over de
 * prijsstatus of de aanvraagstatus.
 */
export const planningSchemaVersion = 1;
export const planningTimezone = 'Europe/Amsterdam';

export type PlanningMode = 'preference';
export type PreferenceKind = 'flexible' | 'specific_date' | 'asap';
export type Daypart = 'morning' | 'afternoon' | 'any';
/** Doel van de afspraak; wordt server-side afgeleid uit de aanvraagroute. */
export type AppointmentPurpose = 'installation' | 'survey';

export const preferenceKinds = ['flexible', 'specific_date', 'asap'] as const;
export const dayparts = ['morning', 'afternoon', 'any'] as const;

export type PlanningPreference = {
  schemaVersion: number;
  mode: PlanningMode;
  kind: PreferenceKind;
  date: string | null;
  daypart: Daypart | null;
};

export const emptyPlanning: PlanningPreference = {
  schemaVersion: planningSchemaVersion,
  mode: 'preference',
  kind: 'flexible',
  date: null,
  daypart: null,
};

/** Vandaag in Europe/Amsterdam als `YYYY-MM-DD`, ongeacht de tijdzone van het toestel. */
export function amsterdamToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: planningTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Date-only controle: bestaat deze kalenderdag echt (schrikkeljaar meegerekend)? */
export function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (month < 1 || month > 12 || day < 1) return false;
  const utc = new Date(Date.UTC(year, month - 1, day));
  return utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day;
}

/** Een datumsleutel is verlopen zodra hij vóór vandaag (Amsterdam) ligt. */
export function isPastDate(value: string, now: Date = new Date()): boolean {
  return value < amsterdamToday(now);
}

/** `YYYY-MM-DD` uit een lokale Date, zonder UTC-conversie die een dag verschuift. */
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Lokale Date (middernacht) uit een datumsleutel, voor de kalendercomponent. */
export function dateFromKey(value: string | null | undefined): Date | undefined {
  if (!value || !isCalendarDate(value)) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Uitgeschreven datum in de juiste taal, bijv. 'donderdag 24 september 2026'. */
export function formatPreferenceDate(value: string, lang: GroupLocale): string {
  if (!isCalendarDate(value)) return '';
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'nl-NL', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export const daypartLabels: Record<GroupLocale, Record<Daypart, string>> = {
  nl: { morning: 'Ochtend', afternoon: 'Middag', any: 'Geen voorkeur' },
  en: { morning: 'Morning', afternoon: 'Afternoon', any: 'No preference' },
};

export const preferenceKindLabels: Record<GroupLocale, Record<PreferenceKind, string>> = {
  nl: { flexible: 'In overleg', specific_date: 'Datum kiezen', asap: 'Zo snel mogelijk' },
  en: { flexible: 'To be arranged', specific_date: 'Pick a date', asap: 'As soon as possible' },
};

/** Doel van de afspraak volgt uit de aanvraagroute, nooit uit de client. */
export function appointmentPurposeFor(photoRoute: 'photo' | 'survey' | 'later'): AppointmentPurpose {
  return photoRoute === 'survey' ? 'survey' : 'installation';
}

export function purposeLabel(purpose: AppointmentPurpose, lang: GroupLocale): string {
  const en = lang === 'en';
  if (purpose === 'survey') return en ? 'Site inspection preference' : 'Schouwvoorkeur';
  return en ? 'Installation preference' : 'Installatievoorkeur';
}

/**
 * Korte, eenduidige samenvatting. Nooit geformuleerd als bevestigde afspraak.
 * Voorbeeld: 'Installatievoorkeur: donderdag 24 september 2026, ochtend. Nog te bevestigen.'
 */
export function planningSummary(
  planning: PlanningPreference,
  purpose: AppointmentPurpose,
  lang: GroupLocale,
): string {
  const en = lang === 'en';
  const pending = en ? 'To be confirmed.' : 'Nog te bevestigen.';
  const label = purposeLabel(purpose, lang);
  if (planning.kind === 'asap') {
    return `${label}: ${en ? 'as soon as possible' : 'zo snel mogelijk'}. ${pending}`;
  }
  if (planning.kind === 'specific_date' && planning.date) {
    const daypart = planning.daypart ?? 'any';
    const daypartText = daypart === 'any'
      ? (en ? 'no time preference' : 'geen dagdeelvoorkeur')
      : daypartLabels[lang][daypart].toLowerCase();
    return `${label}: ${formatPreferenceDate(planning.date, lang)}, ${daypartText}. ${pending}`;
  }
  return `${label}: ${en ? 'to be arranged' : 'in overleg'}. ${pending}`;
}

/**
 * Servervalidatie van het voorkeurcontract. Alleen geldige combinaties komen
 * door; datum en dagdeel horen uitsluitend bij `specific_date`.
 */
export const planningPreferenceSchema = z
  .object({
    schemaVersion: z.number().int().min(1).max(planningSchemaVersion).default(planningSchemaVersion),
    mode: z.literal('preference').default('preference'),
    kind: z.enum(preferenceKinds),
    date: z.string().nullable().default(null),
    daypart: z.enum(dayparts).nullable().default(null),
  })
  .superRefine((value, ctx) => {
    if (value.kind === 'specific_date') {
      if (!value.date || !isCalendarDate(value.date)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['date'], message: 'invalid_date' });
        return;
      }
      if (isPastDate(value.date)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['date'], message: 'past_date' });
      }
      if (!value.daypart) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['daypart'], message: 'daypart_required' });
      }
      return;
    }
    if (value.date !== null) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['date'], message: 'date_not_allowed' });
    if (value.daypart !== null) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['daypart'], message: 'daypart_not_allowed' });
  });

/** Alleen een geldige, volledige keuze gaat als actieve voorkeur mee. */
export function normalisePlanning(planning: PlanningPreference): PlanningPreference {
  if (planning.kind !== 'specific_date') {
    return { ...emptyPlanning, kind: planning.kind };
  }
  return {
    schemaVersion: planningSchemaVersion,
    mode: 'preference',
    kind: 'specific_date',
    date: planning.date && isCalendarDate(planning.date) ? planning.date : null,
    daypart: planning.daypart ?? null,
  };
}

/** Clientzijde: is de stap volledig genoeg om verder te gaan? */
export function planningError(planning: PlanningPreference, lang: GroupLocale): string {
  const en = lang === 'en';
  if (planning.kind !== 'specific_date') return '';
  if (!planning.date || !isCalendarDate(planning.date)) {
    return en
      ? 'Choose a date, or switch to “To be arranged”.'
      : 'Kies een datum of zet de planning op “In overleg”.';
  }
  if (isPastDate(planning.date)) {
    return en
      ? 'That date has passed. Choose a new date, or switch to “To be arranged”.'
      : 'Die datum is verstreken. Kies een nieuwe datum of zet de planning op “In overleg”.';
  }
  if (!planning.daypart) {
    return en ? 'Choose a preferred part of the day.' : 'Kies een gewenst dagdeel.';
  }
  return '';
}
