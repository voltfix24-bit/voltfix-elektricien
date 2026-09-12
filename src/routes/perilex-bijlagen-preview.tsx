import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { PerilexAttachmentsStep } from '@/components/booking/steps/perilex-attachments';
import type { AttachmentCategory } from '@/lib/booking/attachments';
import type { AttachmentItem } from '@/lib/booking/attachment-upload';
import type { GroupLocale } from '@/lib/groepenkast';

// TIJDELIJKE previewroute voor screenshots van de Perilex-bijlagenstap.
// Bevat geen echte gegevens en verstuurt niets.
export const Route = createFileRoute('/perilex-bijlagen-preview')({
  validateSearch: (search: Record<string, unknown>) => ({
    lang: search['lang'] === 'en' ? 'en' : 'nl',
    scenario: typeof search['scenario'] === 'string' ? search['scenario'] : 'empty',
    route: typeof search['route'] === 'string' ? search['route'] : 'photo_review',
    intent: typeof search['intent'] === 'string' ? search['intent'] : null,
  }),
  component: Preview,
  head: () => ({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] }),
});

function fakeFile(name: string, type: string, size: number): File {
  const file = new File([new Uint8Array(8)], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

function Preview() {
  const search = Route.useSearch();
  const lang = search.lang as GroupLocale;
  const { scenario, route, intent } = search;

  const base: AttachmentItem[] = [
    { id: '1', file: fakeFile('groepenkast.jpg', 'image/jpeg', 1_420_000), category: 'consumer_unit', name: 'groepenkast.jpg', size: 1_420_000, mime: 'image/jpeg', status: 'uploaded' },
    { id: '2', file: fakeFile('aansluitplek.jpg', 'image/jpeg', 980_000), category: 'installation_location', name: 'aansluitplek.jpg', size: 980_000, mime: 'image/jpeg', status: 'uploading' },
  ];
  const scenarios: Record<string, AttachmentItem[]> = {
    empty: [],
    uploading: base,
    uploaded: base.map(item => ({ ...item, status: 'uploaded' as const })),
    failed: [...base.slice(0, 1), { ...base[1]!, status: 'failed' as const, errorCode: 'network_error' }],
    pdf: [...base.slice(0, 1), { id: '3', file: fakeFile('keukentekening.pdf', 'application/pdf', 3_200_000), category: 'kitchen_plan', name: 'keukentekening.pdf', size: 3_200_000, mime: 'application/pdf', status: 'uploaded' }],
  };

  const [items, setItems] = useState<AttachmentItem[]>(scenarios[scenario] ?? []);
  const [later, setLater] = useState(scenario === 'later');

  // Scenario komt uit de URL; bij een wissel opnieuw opbouwen.
  useEffect(() => {
    setItems(scenarios[scenario] ?? []);
    setLater(scenario === 'later');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario]);

  return <main className="mx-auto max-w-2xl p-4">
    <PerilexAttachmentsStep
      lang={lang}
      route={route}
      intent={intent}
      items={items}
      addFiles={() => undefined}
      removeItem={id => setItems(previous => previous.filter(item => item.id !== id))}
      retryItem={() => undefined}
      setCategory={(id, category: AttachmentCategory) => setItems(previous => previous.map(item => (item.id === id ? { ...item, category } : item)))}
      later={later}
      setLater={setLater}
      issue={scenario === 'issue' ? 'file_too_large' : ''}
    />
  </main>;
}
