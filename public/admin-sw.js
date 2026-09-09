// Network-only: never cache customer details, authentication or API responses.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !(url.pathname.startsWith('/admin/') || url.pathname === '/auth')) return;
  event.respondWith(fetch(event.request).catch(() => new Response(
    '<!doctype html><html lang="nl"><meta name="viewport" content="width=device-width,initial-scale=1"><title>VoltFix — geen verbinding</title><body><h1>Geen internetverbinding</h1><p>Je leads zijn niet offline beschikbaar.</p><a href="/admin/leads">Opnieuw verbinden</a></body></html>',
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } }
  )));
});