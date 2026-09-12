import { createFileRoute, notFound } from '@tanstack/react-router';
import { useState } from 'react';
import { PerilexBooking } from '@/components/perilex-booking';
import { Button } from '@/components/ui/button';
import type { GroupLocale } from '@/lib/groepenkast';

/**
 * Uitsluitend lokale test-preview van de Perilex-flow (fase 3).
 *
 * De dienst staat op `enabled: false` en is nergens op de site gelinkt. Deze
 * route bestaat alleen om de flow lokaal te kunnen bekijken en te screenshotten;
 * in een productiebuild geeft hij een 404 en hij staat op noindex.
 */
export const Route = createFileRoute('/dev-preview/perilex')({
  ssr: false,
  beforeLoad: () => {
    if (import.meta.env.PROD) throw notFound();
  },
  head: () => ({
    meta: [
      { title: 'Perilex flow preview (dev only)' },
      { name: 'robots', content: 'noindex, nofollow' },
      { name: 'description', content: 'Local preview of the Perilex booking flow. Not part of the public site.' },
    ],
  }),
  component: PerilexPreview,
});

function PerilexPreview() {
  const params = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search);
  const initialLang: GroupLocale = params?.get('lang') === 'en' ? 'en' : 'nl';
  const [lang, setLang] = useState<GroupLocale>(initialLang);
  const [open, setOpen] = useState(true);

  return <main className="mx-auto max-w-xl p-6">
    <h1 className="text-xl font-bold">Perilex flow — local preview</h1>
    <p className="mt-2 text-sm text-muted-foreground">Service stays disabled; submitting is rejected by the server.</p>
    <div className="mt-4 flex flex-wrap gap-2">
      <Button type="button" onClick={() => setOpen(true)}>Open flow</Button>
      <Button type="button" variant="outline" onClick={() => setLang(lang === 'nl' ? 'en' : 'nl')}>Lang: {lang}</Button>
    </div>
    <PerilexBooking lang={lang} open={open} onClose={() => setOpen(false)} sourcePage="/dev-preview/perilex" />
  </main>;
}
