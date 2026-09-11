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
].join('-');

export type PriceStatus = 'indication' | 'review_needed' | 'survey_requested';

export type PriceSnapshot = {
  catalogVersion: string;
  packageId: PackageId;
  packagePrice: number | null;
  options: Array<{ id: OptionId; price: number }>;
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
}): PriceSnapshot {
  const totals = groupTotal(input.packageId, input.optionIds);
  const pkg = groupPackages.find(p => p.id === input.packageId) ?? null;
  const status: PriceStatus =
    input.photoReview === 'survey' ? 'survey_requested' : totals.total === null ? 'review_needed' : 'indication';
  return {
    catalogVersion: priceCatalogVersion,
    packageId: input.packageId,
    packagePrice: pkg ? pkg.price : null,
    options: groupOptions
      .filter(o => input.optionIds.includes(o.id))
      .map(o => ({ id: o.id, price: o.price })),
    surveyFee: input.photoReview === 'survey' ? prices.groepenkastSurvey : null,
    status,
    totalEur: status === 'indication' ? totals.total : null,
    currency: 'EUR',
  };
}

/** Alleen het cijferdeel van een postcode; nooit het volledige adres. */
export function postalAreaOf(postalCode: string | null | undefined): string | null {
  const match = /^\s*([1-9]\d{3})/.exec(postalCode ?? '');
  return match ? match[1] : null;
}
