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

export const infoRequestPreviewScenarios: Array<{ id: string; label: string; state: InfoRequestPreviewState }> = [
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
];

export function infoRequestPreviewScenario(id: string) {
  return infoRequestPreviewScenarios.find(scenario => scenario.id === id) ?? infoRequestPreviewScenarios[0];
}
