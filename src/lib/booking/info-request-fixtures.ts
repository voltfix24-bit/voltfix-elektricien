import type { InfoRequestItemCode } from './info-request';

/**
 * Vaste, verzonnen scenario's voor de visuele controle van de klantpagina.
 *
 * Geen database, geen echte klant, geen bijlage-URL's en geen bericht. Deze
 * fixtures worden uitsluitend door de dev-previewroute gebruikt, die in een
 * productiebuild 404 geeft.
 */

export type InfoRequestPreviewState = {
  access: { ok: boolean; reason?: string };
  language: 'nl' | 'en';
  note: string;
  items: InfoRequestItemCode[];
  extraQuestion?: string;
  callbackRequested?: boolean;
  revision: number;
  draftRevision: number;
  answers: Record<string, { value?: string | null; unavailable?: 'dont_know' | 'dont_have' | 'later' | null }>;
  files: Array<{ attachmentId: string; category: string; filename: string; size: number }>;
  submittedAt: string | null;
};

const baseItems: InfoRequestItemCode[] = [
  'photo_consumer_unit',
  'photo_installation_location',
  'socket_present_choice',
  'extra_question',
];

export const infoRequestPreviewScenarios: Array<{
  id: string;
  label: string;
  state: InfoRequestPreviewState;
  /** Sleutel uit de teksten van de klantpagina; alleen voor de visuele controle. */
  error?: 'revisionChanged' | 'incomplete' | 'error';
}> = [
  {
    id: 'nl_open',
    label: 'NL — openstaand verzoek',
    state: {
      access: { ok: true },
      language: 'nl',
      note: 'Voor je Perilex-aansluiting hebben we nog twee foto’s en een korte vraag nodig.',
      items: baseItems,
      revision: 1,
      draftRevision: 0,
      answers: {},
      files: [],
      submittedAt: null,
    },
  },
  {
    id: 'nl_partial',
    label: 'NL — deels ingevuld',
    state: {
      access: { ok: true },
      language: 'nl',
      note: 'Voor je Perilex-aansluiting hebben we nog twee foto’s en een korte vraag nodig.',
      items: baseItems,
      revision: 1,
      draftRevision: 2,
      answers: { socket_present_choice: { value: 'yes' }, extra_question: { value: 'De kast zit in de meterkast.' } },
      files: [
        { attachmentId: '11111111-1111-4111-8111-111111111111', category: 'consumer_unit', filename: 'groepenkast.jpg', size: 842_113 },
      ],
      submittedAt: null,
    },
  },
  {
    id: 'nl_expired',
    label: 'NL — link verlopen',
    state: {
      access: { ok: false, reason: 'expired' },
      language: 'nl',
      note: '',
      items: [],
      revision: 1,
      draftRevision: 0,
      answers: {},
      files: [],
      submittedAt: null,
    },
  },
  {
    id: 'nl_done',
    label: 'NL — ingediend',
    state: {
      access: { ok: false, reason: 'already_submitted' },
      language: 'nl',
      note: '',
      items: baseItems,
      revision: 1,
      draftRevision: 3,
      answers: {},
      files: [],
      submittedAt: '2026-02-10T09:12:00.000Z',
    },
  },
  {
    id: 'en_open',
    label: 'EN — open request',
    state: {
      access: { ok: true },
      language: 'en',
      note: 'We need two photos and a short answer before we can assess your Perilex connection.',
      items: baseItems,
      revision: 1,
      draftRevision: 0,
      answers: {},
      files: [],
      submittedAt: null,
    },
  },
  {
    id: 'nl_uploads',
    label: 'NL — uploads bezig, gelukt en mislukt',
    state: {
      access: { ok: true },
      language: 'nl',
      note: 'Voor je Perilex-aansluiting hebben we nog twee foto’s en een korte vraag nodig.',
      items: baseItems,
      extraQuestion: 'Welk merk en type is het fornuis?',
      revision: 2,
      draftRevision: 4,
      answers: { socket_present_choice: { value: 'yes' } },
      files: [],
      submittedAt: null,
    },
  },
  {
    id: 'nl_missing',
    label: 'NL — ontbrekende informatie gemeld',
    state: {
      access: { ok: true },
      language: 'nl',
      note: 'Voor je Perilex-aansluiting hebben we nog twee foto’s en een korte vraag nodig.',
      items: baseItems,
      extraQuestion: 'Welk merk en type is het fornuis?',
      revision: 2,
      draftRevision: 6,
      answers: {
        photo_consumer_unit: { unavailable: 'later' },
        photo_installation_location: { unavailable: 'dont_have' },
        socket_present_choice: { value: 'unknown' },
        extra_question: { value: 'Weet ik niet, het fornuis komt nog.' },
      },
      files: [],
      submittedAt: null,
    },
  },
  {
    id: 'nl_callback',
    label: 'NL — terugbelverzoek opgeslagen',
    state: {
      access: { ok: true },
      language: 'nl',
      note: 'Voor je Perilex-aansluiting hebben we nog twee foto’s en een korte vraag nodig.',
      items: baseItems,
      extraQuestion: 'Welk merk en type is het fornuis?',
      callbackRequested: true,
      revision: 2,
      draftRevision: 7,
      answers: { socket_present_choice: { value: 'no' } },
      files: [],
      submittedAt: null,
    },
  },
  {
    id: 'nl_revision',
    label: 'NL — vraag is gewijzigd',
    state: {
      access: { ok: true },
      language: 'nl',
      note: 'Voor je Perilex-aansluiting hebben we nog twee foto’s en een korte vraag nodig.',
      items: baseItems,
      extraQuestion: 'Welk merk en type is het fornuis?',
      revision: 3,
      draftRevision: 1,
      answers: {},
      files: [],
      submittedAt: null,
    },
    error: 'revisionChanged',
  },
  {
    id: 'en_partial',
    label: 'EN — resumed draft',
    state: {
      access: { ok: true },
      language: 'en',
      note: 'We need two photos and a short answer before we can assess your Perilex connection.',
      items: baseItems,
      extraQuestion: 'What is the brand and model of the cooker?',
      revision: 2,
      draftRevision: 3,
      answers: { socket_present_choice: { value: 'yes' }, extra_question: { value: 'Bosch HKA090150.' } },
      files: [
        { attachmentId: '33333333-3333-4333-8333-333333333333', category: 'consumer_unit', filename: 'consumer-unit.jpg', size: 742_113 },
      ],
      submittedAt: null,
    },
  },
  {
    id: 'en_done',
    label: 'EN — submitted',
    state: {
      access: { ok: false, reason: 'already_submitted' },
      language: 'en',
      note: '',
      items: baseItems,
      revision: 2,
      draftRevision: 4,
      answers: {},
      files: [],
      submittedAt: '2026-02-10T09:12:00.000Z',
    },
  },
  {
    id: 'en_expired',
    label: 'EN — link expired',
    state: {
      access: { ok: false, reason: 'expired' },
      language: 'en',
      note: '',
      items: [],
      revision: 1,
      draftRevision: 0,
      answers: {},
      files: [],
      submittedAt: null,
    },
  },
];

export function infoRequestPreviewScenario(id: string) {
  return infoRequestPreviewScenarios.find(scenario => scenario.id === id) ?? infoRequestPreviewScenarios[0];
}

/** Vaste uploadregels per scenario: verzonnen bestandsnamen, geen echte bestanden. */
export type InfoRequestPreviewUpload = {
  id: string;
  code: InfoRequestItemCode;
  name: string;
  size: number;
  mime: string;
  file: null;
  attachmentId: string | null;
  status: 'uploading' | 'uploaded' | 'failed';
};

export const infoRequestPreviewUploads: Record<string, InfoRequestPreviewUpload[]> = {
  nl_uploads: [
    {
      id: 'u1',
      code: 'photo_consumer_unit',
      name: 'groepenkast.jpg',
      size: 1_642_113,
      mime: 'image/jpeg',
      file: null,
      attachmentId: '22222222-2222-4222-8222-222222222222',
      status: 'uploaded',
    },
    {
      id: 'u2',
      code: 'photo_installation_location',
      name: 'keuken-hoek.heic',
      size: 3_112_004,
      mime: 'image/heic',
      file: null,
      attachmentId: null,
      status: 'uploading',
    },
    {
      id: 'u3',
      code: 'photo_installation_location',
      name: 'meterkast-schema.pdf',
      size: 512_000,
      mime: 'application/pdf',
      file: null,
      attachmentId: null,
      status: 'failed',
    },
  ],
};

