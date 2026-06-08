const CACHE = 'petday-v1';

const PRECACHE = [
  '/',
  '/dashboard',
  '/login',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ignora requests não-GET e de outras origens
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return;

  // API e Supabase: sempre rede primeiro
  if (request.url.includes('/api/') || request.url.includes('supabase')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Páginas e assets: stale-while-revalidate
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const networkPromise = fetch(request).then((response) => {
        if (response.ok) cache.put(request, response.clone());
        return response;
      }).catch(() => null);

      return cached || await networkPromise || new Response('Offline', { status: 503 });
    })
  );
});
