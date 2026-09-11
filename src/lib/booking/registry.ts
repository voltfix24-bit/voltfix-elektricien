import type { BookingServiceId, ServiceConfig } from './types';
import { groepenkastService } from './services/groepenkast';
import { algemeenService, laadpaalService, perilexService, spoedService, stopcontactService } from './services/placeholders';

/** Centrale registry: één plek waar alle diensten van de booking-engine staan. */
export const bookingServices: Record<BookingServiceId, ServiceConfig> = {
  groepenkast: groepenkastService,
  laadpaal: laadpaalService,
  perilex: perilexService,
  spoed: spoedService,
  stopcontact: stopcontactService,
  algemeen: algemeenService,
};

export function getBookingService(id: BookingServiceId): ServiceConfig {
  return bookingServices[id];
}

/** Diensten die live in de flow gekozen mogen worden ("dienst wijzigen"). */
export const enabledBookingServices = (): ServiceConfig[] =>
  Object.values(bookingServices).filter(service => service.enabled);
