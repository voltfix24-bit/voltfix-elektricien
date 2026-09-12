import { describe, expect, it } from 'vitest';
import { validateStep } from './validation';
import { emptyState } from './types';
import { getIntakeContext } from './routing';

const base = () => emptyState(getIntakeContext('/groepenkast-amsterdam'));

describe('validateStep', () => {
  it('vraagt om een dienst wanneer die ontbreekt', () => {
    const s = { ...base(), service: null };
    expect(validateStep('dienst', s)).not.toBe('');
    expect(validateStep('dienst', base())).toBe('');
  });

  it('vraagt om een intentie', () => {
    expect(validateStep('intent', base())).not.toBe('');
    expect(validateStep('intent', { ...base(), intent: 'vasteprijs' })).toBe('');
  });

  it('eist een keuze bij een single-vraag', () => {
    const s = base();
    expect(validateStep('vraag:pakket', s)).not.toBe('');
    expect(validateStep('vraag:pakket', { ...s, keuzeData: { pakket: '1fase' } })).toBe('');
  });

  it('laat multi-vragen leeg toe', () => {
    expect(validateStep('vraag:opties', base())).toBe('');
  });

  it('controleert postcode en huisnummer', () => {
    const s = base();
    expect(validateStep('gebied', s)).toMatch(/postcode/i);
    expect(validateStep('gebied', { ...s, postcode: '1012 AB' })).toMatch(/huisnummer/i);
    expect(validateStep('gebied', { ...s, postcode: '1012 AB', huisnummer: '1' })).toBe('');
  });

  it('controleert naam en telefoonnummer', () => {
    const s = base();
    expect(validateStep('contact', s)).toMatch(/naam/i);
    expect(validateStep('contact', { ...s, naam: 'Jan' })).toMatch(/telefoon/i);
    expect(validateStep('contact', { ...s, naam: 'Jan', telefoon: '06 12345678' })).toBe('');
  });

  it('eist akkoord op het overzicht', () => {
    expect(validateStep('overzicht', base())).not.toBe('');
    expect(validateStep('overzicht', { ...base(), akkoord: true })).toBe('');
  });
});
