import { describe, expect, it } from 'vitest';
import {
  amsterdamToday,
  appointmentPurposeFor,
  formatPreferenceDate,
  isCalendarDate,
  isPastDate,
  normalisePlanning,
  planningError,
  planningPreferenceSchema,
  planningSummary,
  type PlanningPreference,
} from './planning';

const base: PlanningPreference = { schemaVersion: 1, mode: 'preference', kind: 'flexible', date: null, daypart: null };
const future = `${new Date().getFullYear() + 1}-06-11`;

describe('planningsvoorkeur', () => {
  it('gebruikt Europe/Amsterdam voor vandaag, ook rond middernacht in een andere zone', () => {
    // 22:30 UTC = 00:30 in Amsterdam (zomertijd): dat is de volgende dag.
    expect(amsterdamToday(new Date('2026-09-11T22:30:00Z'))).toBe('2026-09-12');
    // 23:30 UTC in de winter = 00:30 Amsterdam.
    expect(amsterdamToday(new Date('2026-01-31T23:30:00Z'))).toBe('2026-02-01');
  });

  it('controleert echte kalenderdagen inclusief schrikkeljaar', () => {
    expect(isCalendarDate('2028-02-29')).toBe(true);
    expect(isCalendarDate('2027-02-29')).toBe(false);
    expect(isCalendarDate('2027-13-01')).toBe(false);
    expect(isCalendarDate('11-09-2026')).toBe(false);
    expect(isPastDate('2020-01-01')).toBe(true);
    expect(isPastDate(future)).toBe(false);
  });

  it('accepteert alleen geldige combinaties', () => {
    expect(planningPreferenceSchema.safeParse(base).success).toBe(true);
    expect(planningPreferenceSchema.safeParse({ ...base, kind: 'asap' }).success).toBe(true);
    expect(planningPreferenceSchema.safeParse({ ...base, kind: 'specific_date', date: future, daypart: 'morning' }).success).toBe(true);
    expect(planningPreferenceSchema.safeParse({ ...base, kind: 'specific_date', date: future }).success).toBe(false);
    expect(planningPreferenceSchema.safeParse({ ...base, kind: 'specific_date', date: '2020-01-01', daypart: 'any' }).success).toBe(false);
    expect(planningPreferenceSchema.safeParse({ ...base, kind: 'flexible', date: future }).success).toBe(false);
    expect(planningPreferenceSchema.safeParse({ ...base, kind: 'asap', daypart: 'morning' }).success).toBe(false);
  });

  it('verwijdert datum en dagdeel bij een wissel naar in overleg of asap', () => {
    const chosen: PlanningPreference = { ...base, kind: 'specific_date', date: future, daypart: 'afternoon' };
    expect(normalisePlanning({ ...chosen, kind: 'asap' })).toEqual({ ...base, kind: 'asap' });
    expect(normalisePlanning({ ...chosen, kind: 'flexible' })).toEqual(base);
    expect(normalisePlanning(chosen)).toEqual(chosen);
  });

  it('leidt het afspraakdoel af uit de route', () => {
    expect(appointmentPurposeFor('survey')).toBe('survey');
    expect(appointmentPurposeFor('photo')).toBe('installation');
    expect(appointmentPurposeFor('later')).toBe('installation');
  });

  it('schrijft de voorkeur uit zonder bevestigde afspraak te suggereren', () => {
    expect(formatPreferenceDate('2026-09-24', 'nl')).toBe('donderdag 24 september 2026');
    expect(formatPreferenceDate('2026-09-24', 'en')).toBe('Thursday, 24 September 2026');
    const specific: PlanningPreference = { ...base, kind: 'specific_date', date: '2026-09-24', daypart: 'morning' };
    expect(planningSummary(specific, 'installation', 'nl'))
      .toBe('Installatievoorkeur: donderdag 24 september 2026, ochtend. Nog te bevestigen.');
    expect(planningSummary(specific, 'survey', 'nl')).toContain('Schouwvoorkeur');
    expect(planningSummary({ ...base, kind: 'asap' }, 'installation', 'en')).toContain('as soon as possible');
    expect(planningSummary(base, 'installation', 'nl')).toContain('in overleg');
  });

  it('geeft in overleg en asap zonder fout door en meldt een onvolledige datumroute', () => {
    expect(planningError(base, 'nl')).toBe('');
    expect(planningError({ ...base, kind: 'asap' }, 'nl')).toBe('');
    expect(planningError({ ...base, kind: 'specific_date' }, 'nl')).toContain('Kies een datum');
    expect(planningError({ ...base, kind: 'specific_date', date: '2020-01-01', daypart: 'any' }, 'nl')).toContain('verstreken');
    expect(planningError({ ...base, kind: 'specific_date', date: future }, 'nl')).toContain('dagdeel');
    expect(planningError({ ...base, kind: 'specific_date', date: future, daypart: 'any' }, 'nl')).toBe('');
  });
});
