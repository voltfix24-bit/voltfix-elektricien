import { prices } from '@/lib/pricing';
import type { ServiceConfig } from '../types';

/**
 * Skeletconfigs voor toekomstige diensten. `enabled: false` betekent dat ze
 * nergens op de site zichtbaar zijn; ze leggen alleen de structuur vast zodat
 * een nieuwe dienst later alleen dit bestand + een knop nodig heeft.
 */
const base = (id: ServiceConfig['id']): Pick<ServiceConfig, 'enabled' | 'price' | 'status' | 'successCopy' | 'payload'> => ({
  enabled: false,
  price: () => ({ base: null, extras: 0, total: null }),
  status: (_state, lang) => (lang === 'en' ? 'After review' : 'Na controle'),
  successCopy: (_state, lang) => (lang === 'en'
    ? 'We will review your request and contact you with a fixed price.'
    : 'We controleren je aanvraag en nemen contact op met een vaste prijs.'),
  payload: (_input, lang) => ({
    jobType: id,
    message: lang === 'en' ? 'Request via booking flow.' : 'Aanvraag via bookingflow.',
  }),
});

export const laadpaalService: ServiceConfig = {
  ...base('laadpaal'),
  id: 'laadpaal',
  slug: { nl: '/laadpaal-amsterdam', en: '/en-gb/ev-charger-installation-amsterdam' },
  name: { nl: 'Laadpaal installeren', en: 'EV charger installation' },
  flowType: 'quote',
  steps: ['intake', 'photo', 'address', 'contact', 'summary'],
  stepLabels: lang => (lang === 'en'
    ? ['Charger', 'Photo', 'Address', 'Details', 'Summary']
    : ['Laadpaal', 'Foto', 'Adres', 'Gegevens', 'Overzicht']),
  stepCta: lang => (lang === 'en' ? ['Continue', 'Continue', 'Continue', 'Go to summary', 'Complete request'] : ['Verder', 'Verder', 'Verder', 'Naar overzicht', 'Aanvraag afronden']),
};

export const stopcontactService: ServiceConfig = {
  ...base('stopcontact'),
  id: 'stopcontact',
  slug: { nl: '/stopcontact-amsterdam', en: '/en-gb/socket-installation-amsterdam' },
  name: { nl: 'Stopcontact / lichtpunt', en: 'Socket / lighting point' },
  flowType: 'quote',
  steps: ['intake', 'photo', 'address', 'contact', 'summary'],
  stepLabels: lang => (lang === 'en'
    ? ['Job', 'Photo', 'Address', 'Details', 'Summary']
    : ['Klus', 'Foto', 'Adres', 'Gegevens', 'Overzicht']),
  stepCta: lang => (lang === 'en' ? ['Continue', 'Continue', 'Continue', 'Go to summary', 'Complete request'] : ['Verder', 'Verder', 'Verder', 'Naar overzicht', 'Aanvraag afronden']),
};

export const algemeenService: ServiceConfig = {
  ...base('algemeen'),
  id: 'algemeen',
  slug: { nl: '/elektricien-amsterdam', en: '/en-gb/electrician-amsterdam' },
  name: { nl: 'Algemene elektricienklus', en: 'General electrical job' },
  flowType: 'quote',
  steps: ['intake', 'photo', 'address', 'contact', 'summary'],
  stepLabels: lang => (lang === 'en'
    ? ['Job', 'Photo', 'Address', 'Details', 'Summary']
    : ['Klus', 'Foto', 'Adres', 'Gegevens', 'Overzicht']),
  stepCta: lang => (lang === 'en' ? ['Continue', 'Continue', 'Continue', 'Go to summary', 'Complete request'] : ['Verder', 'Verder', 'Verder', 'Naar overzicht', 'Aanvraag afronden']),
};

/**
 * Spoed volgt bewust een korte route: storingstype, bellen, locatie/contact.
 * Geen pakketten, geen fotostap, diagnoseprijs uit de centrale prijsbron.
 */
export const spoedService: ServiceConfig = {
  ...base('spoed'),
  id: 'spoed',
  slug: { nl: '/spoed-elektricien-amsterdam', en: '/en-gb/spoed-elektricien-amsterdam' },
  name: { nl: 'Spoed / storing', en: 'Emergency / fault' },
  flowType: 'emergency',
  steps: ['fault', 'contact'],
  stepLabels: lang => (lang === 'en' ? ['Fault', 'Contact'] : ['Storing', 'Contact']),
  stepCta: lang => (lang === 'en' ? ['Continue', 'Call now'] : ['Verder', 'Bel direct']),
  status: (_state, lang) => (lang === 'en'
    ? `Diagnosis €${prices.emergencyFirstHour} first hour`
    : `Diagnose €${prices.emergencyFirstHour} eerste uur`),
};
