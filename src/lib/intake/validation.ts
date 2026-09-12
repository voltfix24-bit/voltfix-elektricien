import { getService } from './service-config';
import { questionIdOf } from './routing';
import type { IntakeState, Step } from './types';

/** Lege string = geldig. De UI toont de reden pas bij een klik, niet tijdens typen. */
export function validateStep(step: Step, state: IntakeState): string {
  if (step === 'dienst' && !state.service) return 'Kies eerst een dienst.';
  if (step === 'intent' && !state.intent) return 'Kies wat je nodig hebt.';

  const vraagId = questionIdOf(step);
  if (vraagId) {
    const v = getService(state.service)?.vragen.find((q) => q.id === vraagId);
    if (v?.type === 'single' && !state.keuzeData[v.id]) return 'Maak een keuze om verder te gaan.';
  }

  if (step === 'gebied') {
    if (state.postcode.replace(/\s/g, '').length < 4) return 'Vul je postcode in — dan weten we meteen of we bij je werken.';
    if (!state.huisnummer) return 'Vul je huisnummer in.';
  }

  if (step === 'contact') {
    if (!state.naam.trim()) return 'Vul je naam in.';
    if (state.telefoon.replace(/\D/g, '').length < 9) return 'Vul een geldig telefoonnummer in — daarop bellen we je prijs door.';
  }

  if (step === 'overzicht' && !state.akkoord) return 'Zet even een vinkje dat we contact mogen opnemen.';

  return '';
}
