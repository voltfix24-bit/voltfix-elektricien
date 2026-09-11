import {
  groupBookingMessage,
  groupMoney,
  groupOptions,
  groupPackages,
  groupPhotoLater,
  groupStepCta,
  groupTotal,
  type GroupBooking,
  type GroupLocale,
  type OptionId,
  type PackageId,
} from '@/lib/groepenkast';
import { prices } from '@/lib/pricing';
import type { ServiceConfig } from '../types';

/**
 * Eerste volledige service-module. Alle prijzen, teksten en de payload komen
 * uit de bestaande centrale bronnen (`pricing.ts` / `groepenkast.ts`); hier
 * staat geen enkel los bedrag.
 */
export const groepenkastService: ServiceConfig = {
  id: 'groepenkast',
  slug: { nl: '/groepenkast-amsterdam', en: '/en-gb/groepenkast-amsterdam' },
  name: { nl: 'Groepenkast vervangen', en: 'Fuse box replacement' },
  flowType: 'fixed-price',
  enabled: true,
  steps: ['package', 'options', 'photo', 'address', 'contact', 'summary'],
  stepLabels: lang => lang === 'en'
    ? ['Package', 'Options', 'Photo', 'Address', 'Details', 'Summary']
    : ['Pakket', 'Opties', 'Foto', 'Adres', 'Gegevens', 'Overzicht'],
  stepCta: lang => groupStepCta[lang],
  photo: {
    allowLater: true,
    allowSurvey: true,
    surveyFee: prices.groepenkastSurvey,
    instructions: lang => lang === 'en'
      ? { title: 'Upload a photo of your open fuse box for a fixed-price check.', note: 'Only open the cupboard door. Never unscrew covers or touch wiring.' }
      : { title: 'Upload een foto van je geopende groepenkast voor vaste prijscontrole.', note: 'Open alleen de deur. Schroef nooit beschermkappen los en raak geen bedrading aan.' },
  },
  packages: groupPackages,
  options: groupOptions,
  price: state => groupTotal(state.packageId as PackageId, state.optionIds as readonly OptionId[]),
  status: (state, lang) => {
    if (state.photoRoute === 'survey') {
      return `${lang === 'en' ? 'Survey' : 'Schouw'} ${groupMoney(prices.groepenkastSurvey, lang)}`;
    }
    if (state.photoRoute === 'later') return lang === 'en' ? 'After photo' : 'Na foto';
    const total = groupTotal(state.packageId as PackageId, state.optionIds as readonly OptionId[]).total;
    return total === null ? (lang === 'en' ? 'After review' : 'Na controle') : groupMoney(total, lang);
  },
  successCopy: (state, lang) => {
    const en = lang === 'en';
    if (state.photoRoute === 'survey') {
      return en
        ? `We will contact you to schedule the ${groupMoney(prices.groepenkastSurvey, lang)} survey. This amount will be deducted when you approve the work.`
        : `We nemen contact op om de schouw van ${groupMoney(prices.groepenkastSurvey, lang)} in te plannen. Dit bedrag wordt verrekend bij akkoord.`;
    }
    if (state.photoRoute === 'later') {
      return en
        ? 'Send your photo via WhatsApp. Your fixed price will follow as soon as we have received your photo.'
        : 'Stuur je foto via WhatsApp. Je vaste prijs volgt zodra we je foto hebben ontvangen.';
    }
    if (state.photoCount > 0) {
      return en
        ? 'We will review your photo and contact you with the final fixed price.'
        : 'We controleren je foto en nemen contact op met de definitieve vaste prijs.';
    }
    return en
      ? 'We will review your request and contact you with the final fixed price.'
      : 'We controleren je aanvraag en nemen contact op met de definitieve vaste prijs.';
  },
  payload: (input, lang) => {
    const booking = input as GroupBooking;
    return {
      jobType: lang === 'en' ? 'Fuse box replacement — price check' : 'Groepenkast vervangen — prijscontrole',
      message: groupBookingMessage(booking, lang),
      bookingField: { name: 'groupBooking', value: booking },
    };
  },
};

export const groepenkastPhotoLater = (lang: GroupLocale) => groupPhotoLater[lang];
