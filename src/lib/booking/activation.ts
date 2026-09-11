import { groupOptions, groupPackages, groupTotal, type OptionId, type PackageId } from '@/lib/groepenkast';
import { prices } from '@/lib/pricing';
import { bookingServices } from './registry';
import type { BookingIntent, BookingServiceId } from './types';

/**
 * Centrale activatiecontrole. Eén plek die bepaalt of een dienst publiek
 * aangevraagd mag worden. De server gebruikt dezelfde functie als de UI, zodat
 * een uitgeschakelde dienst ook via een handmatige POST niet boekbaar is.
 */
export const bookingServiceIds = Object.keys(bookingServices) as BookingServiceId[];

export function isBookingServiceId(value: string): value is BookingServiceId {
  return (bookingServiceIds as string[]).includes(value);
}

export function isBookingServiceActive(value: string): boolean {
  return isBookingServiceId(value) && bookingServices[value].enabled === true;
}

export const bookingIntents: BookingIntent[] = ['price', 'survey', 'photo', 'emergency', 'quote'];

export function isBookingIntent(value: string): value is BookingIntent {
  return (bookingIntents as string[]).includes(value);
}

/**
 * Merktoeslagen voor de groepenkast. Centraal vastgelegd, maar de merkkeuze is
 * nog niet actief in de aanvraagflow: `brandChoiceEnabled` blijft false totdat
 * UI, server, opslag en tests samen kloppen. Hager staat er bewust niet in.
 */
export const groepenkastBrands = [
  { id: 'voltfix', nl: 'VoltFix-keuze / AEG', en: 'VoltFix choice / AEG', surcharge: prices.groepenkastBrandVoltfix },
  { id: 'eaton', nl: 'Eaton', en: 'Eaton', surcharge: prices.groepenkastBrandEaton },
  { id: 'abb-haf', nl: 'ABB Haf', en: 'ABB Haf', surcharge: prices.groepenkastBrandAbbHaf },
] as const;

export type BrandId = (typeof groepenkastBrands)[number]['id'];

export const brandChoiceEnabled = false;

export function isBrandId(value: string): value is BrandId {
  return groepenkastBrands.some(b => b.id === value);
}

export function brandSurcharge(brandId: BrandId | null | undefined): number {
  return groepenkastBrands.find(b => b.id === brandId)?.surcharge ?? 0;
}

/**
 * Prijsversie van de catalogus. Wijzigt zodra een bedrag in `prices` verandert,
 * zodat elke aanvraag met de op dat moment geldende bedragen bewaard blijft.
 */
export const priceCatalogVersion = [
  prices.groepenkast1Phase,
  prices.groepenkast3Phase,
  prices.groepenkast3PhaseExtended,
  prices.groepenkastInduction,
  prices.groepenkastSolar,
  prices.groepenkastRcbo,
  prices.groepenkastSocket,
  prices.groepenkastBell,
  prices.groepenkastSurge,
  prices.groepenkastSurvey,
  prices.groepenkastBrandVoltfix,
  prices.groepenkastBrandEaton,
  prices.groepenkastBrandAbbHaf,
].join('-');

export type PriceStatus = 'indication' | 'review_needed' | 'survey_requested';

export type PriceSnapshot = {
  catalogVersion: string;
  packageId: PackageId;
  packagePrice: number | null;
  options: Array<{ id: OptionId; price: number }>;
  brandId: BrandId | null;
  brandSurcharge: number;
  surveyFee: number | null;
  status: PriceStatus;
  totalEur: number | null;
  currency: 'EUR';
};

/**
 * Server-side herberekening van de groepenkastprijs. Clientbedragen worden
 * nooit vertrouwd: alleen pakket-ID's en optie-ID's bepalen het bedrag.
 * `total` is null zodra de prijs pas na foto- of schouwcontrole vaststaat.
 */
export function recalculateGroepenkastPrice(input: {
  packageId: PackageId;
  optionIds: readonly OptionId[];
  photoReview: 'photo' | 'survey' | 'later';
  brandId?: BrandId | null;
}): PriceSnapshot {
  const totals = groupTotal(input.packageId, input.optionIds);
  const pkg = groupPackages.find(p => p.id === input.packageId) ?? null;
  // Merkkeuze telt alleen mee zodra die officieel geactiveerd is.
  const brandId = brandChoiceEnabled && input.brandId && isBrandId(input.brandId) ? input.brandId : null;
  const surcharge = brandSurcharge(brandId);
  const status: PriceStatus =
    input.photoReview === 'survey' ? 'survey_requested' : totals.total === null ? 'review_needed' : 'indication';
  return {
    catalogVersion: priceCatalogVersion,
    packageId: input.packageId,
    packagePrice: pkg ? pkg.price : null,
    options: groupOptions
      .filter(o => input.optionIds.includes(o.id))
      .map(o => ({ id: o.id, price: o.price })),
    brandId,
    brandSurcharge: surcharge,
    surveyFee: input.photoReview === 'survey' ? prices.groepenkastSurvey : null,
    status,
    totalEur: status === 'indication' && totals.total !== null ? totals.total + surcharge : null,
    currency: 'EUR',
  };
}

/** Alleen het cijferdeel van een postcode; nooit het volledige adres. */
export function postalAreaOf(postalCode: string | null | undefined): string | null {
  const match = /^\s*([1-9]\d{3})/.exec(postalCode ?? '');
  return match ? match[1] : null;
}
