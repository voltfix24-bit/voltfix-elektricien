import { describe, expect, it } from 'vitest';
import { adviseTriage, isOverdue, werkminutenTussen, TRIAGE_SLA_MINUTEN } from './triage-rules';

describe('adviseTriage', () => {
  it('adviseert een schouw zonder foto', () => {
    expect(adviseTriage({ heeftFoto: false, flags: [], priceStatus: 'vast' }).voorstel).toBe('schouw');
  });

  it('adviseert een schouw zodra er een vlag aanstaat', () => {
    expect(adviseTriage({ heeftFoto: true, flags: ['aarding'], priceStatus: 'vast' }).voorstel).toBe('schouw');
  });

  it('adviseert bellen bij een onvolledige aanvraag', () => {
    expect(adviseTriage({ heeftFoto: true, flags: [], priceStatus: 'open' }).voorstel).toBe('bellen');
  });

  it('adviseert een offerte bij foto zonder vlaggen', () => {
    expect(adviseTriage({ heeftFoto: true, flags: [], priceStatus: 'vast' }).voorstel).toBe('offerte');
  });
});

describe('werkminutenTussen', () => {
  it('telt minuten binnen kantooruren', () => {
    // dinsdag 9 juni 2026, 09:00 → 09:30
    const van = new Date(2026, 5, 9, 9, 0);
    const tot = new Date(2026, 5, 9, 9, 30);
    expect(werkminutenTussen(van, tot)).toBe(30);
  });

  it('telt niets buiten openingstijden', () => {
    const van = new Date(2026, 5, 9, 19, 0);
    const tot = new Date(2026, 5, 9, 23, 0);
    expect(werkminutenTussen(van, tot)).toBe(0);
  });

  it('telt niets op zondag', () => {
    const van = new Date(2026, 5, 7, 10, 0);
    const tot = new Date(2026, 5, 7, 16, 0);
    expect(werkminutenTussen(van, tot)).toBe(0);
  });

  it('slaat de nacht over tussen twee werkdagen', () => {
    // dinsdag 17:30 → woensdag 08:30 = 30 + 30 werkminuten
    const van = new Date(2026, 5, 9, 17, 30);
    const tot = new Date(2026, 5, 10, 8, 30);
    expect(werkminutenTussen(van, tot)).toBe(60);
  });

  it('gebruikt zaterdagvenster 09:00–17:00', () => {
    const van = new Date(2026, 5, 13, 8, 0);
    const tot = new Date(2026, 5, 13, 10, 0);
    expect(werkminutenTussen(van, tot)).toBe(60);
  });
});

describe('isOverdue', () => {
  it('is niet te laat binnen de SLA', () => {
    const van = new Date(2026, 5, 9, 9, 0);
    const nu = new Date(2026, 5, 9, 9, TRIAGE_SLA_MINUTEN);
    expect(isOverdue(van, nu)).toBe(false);
  });

  it('is te laat na de SLA in werkminuten', () => {
    const van = new Date(2026, 5, 9, 9, 0);
    const nu = new Date(2026, 5, 9, 9, TRIAGE_SLA_MINUTEN + 5);
    expect(isOverdue(van, nu)).toBe(true);
  });

  it('laat de klok stilstaan buiten openingstijden', () => {
    // vrijdagavond 18:30 → zaterdag 08:30: nul werkminuten
    const van = new Date(2026, 5, 12, 18, 30);
    const nu = new Date(2026, 5, 13, 8, 30);
    expect(isOverdue(van, nu)).toBe(false);
  });
});
