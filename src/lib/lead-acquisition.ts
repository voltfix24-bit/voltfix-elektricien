// Herkomst van een klant, in te vullen bij handmatige dossiers.
export const ACQUISITION_CHANNELS = [
  'google_ads', 'google_organic', 'google_maps', 'website_unknown', 'referral', 'repeat_customer', 'social', 'other', 'unknown',
] as const
export type AcquisitionChannel = (typeof ACQUISITION_CHANNELS)[number]
export const ACQUISITION_LABEL: Record<AcquisitionChannel, string> = {
  google_ads: 'Google-advertentie',
  google_organic: 'Google zoeken (geen advertentie)',
  google_maps: 'Google Maps / bedrijfsprofiel',
  website_unknown: 'Via website, bron onbekend',
  referral: 'Doorverwijzing / mond-tot-mond',
  repeat_customer: 'Bestaande klant',
  social: 'Social media / andere site',
  other: 'Anders',
  unknown: 'Weet ik niet',
}
