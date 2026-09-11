import { describe, expect, it } from 'vitest';
import { groupBookingMessage, groupBookingSchema, groupFaqs, groupMoney, groupOptions, groupPackages, groupTotal } from './groepenkast';
import { redactLeadText } from './lead-privacy';

const booking = { packageId: 'single', optionIds: ['induction', 'solar'], photoReview: 'photo', postalCode: '1068 TD', houseNumber: '963', street: 'Teststraat', city: 'Amsterdam', planning: { schemaVersion: 1, mode: 'preference', kind: 'flexible', date: null, daypart: null } };
describe('Fuse box packages NL and EN', () => {
  it('uses the agreed package and all-in option prices', () => {
    expect(groupPackages.map(p => p.price)).toEqual([695, 845, 1095]);
    expect(groupOptions.map(o => o.price)).toEqual([149, 129, 120, 39, 49, 169]);
    expect(groupTotal('single', ['induction', 'solar']).total).toBe(973);
    expect(groupTotal('extended', groupOptions.map(o => o.id)).total).toBe(1750);
    expect(groupTotal('single', ['socket', 'socket']).total).toBe(734);
    expect(groupTotal('unknown', ['induction'])).toEqual({ base: null, extras: 149, total: null });
  });
  it('validates address and selections and ignores a client-provided price', () => {
    const parsed = groupBookingSchema.parse({ ...booking, total: 1 });
    expect(groupBookingMessage(parsed, 'nl')).toContain('€973');
    for (const patch of [{ packageId: '' }, { packageId: 'cheap' }, { optionIds: ['fake'] }, { postalCode: 'abcd' }, { houseNumber: '' }, { street: '' }, { photoReview: 'none' },
      { planning: { kind: 'specific_date', date: null, daypart: 'morning' } },
      { planning: { kind: 'specific_date', date: '2020-01-02', daypart: 'morning' } },
      { planning: { kind: 'specific_date', date: '2027-02-30', daypart: 'morning' } },
      { planning: { kind: 'flexible', date: '2027-03-02', daypart: null } },
      { planning: { kind: 'asap', date: null, daypart: 'morning' } }]) {
      expect(groupBookingSchema.safeParse({ ...booking, ...patch }).success).toBe(false);
    }
    expect(groupBookingSchema.parse({ ...booking, optionIds: ['socket', 'socket'] }).optionIds).toEqual(['socket']);
  });
  it.each(['nl', 'en'] as const)('preserves price details but redacts customer address in %s', lang => {
    const original = groupBookingMessage(groupBookingSchema.parse(booking), lang);
    const redacted = redactLeadText(original, { customer_name: 'Test Customer', customer_phone: '+31612345678', customer_email: 'test@example.com', address: '1068 TD 963' });
    expect(original).toContain('963');
    expect(redacted).not.toContain('963');
    expect(redacted).not.toContain('1068 TD');
    expect(redacted).toContain('€973');
    expect(redacted).toContain('6–8');
    expect(redacted).toContain('21%');
    expect(groupFaqs(lang).map(f => f.a).join(' ')).not.toMatch(/€455|€490/);
  });
  it('formats prices for both locales', () => {
    expect(groupMoney(1095, 'nl')).toBe('€1.095');
    expect(groupMoney(1095, 'en')).toBe('€1,095');
  });
});
