const CACHE_NAME = 'jp-flashcards-v4';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './vocabulary.json',
];

const OPTIONAL_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;600;700&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(CORE_ASSETS).then(() =>
        // Fonts are optional — don't block install if they fail
        Promise.allSettled(OPTIONAL_ASSETS.map((url) => cache.add(url)))
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  const isSameOrigin = url.origin === self.location.origin;

  // Network-first for same-origin HTML and vocabulary.json so deploys aren't stale
  if (isSameOrigin && (e.request.destination === 'document' || url.pathname.endsWith('vocabulary.json'))) {
    e.respondWith(
      fetch(e.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => caches.match(e.request).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  // Cache-first for everything else (fonts, manifest, etc.)
  e.respondWith(
    caches.match(e.request).then((cached) => {
      return cached || fetch(e.request).then((response) => {
        if (response.ok && (isSameOrigin || e.request.url.includes('fonts.googleapis.com') || e.request.url.includes('fonts.gstatic.com'))) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return response;
      });
    }).catch(() => caches.match('./index.html'))
  );
});
