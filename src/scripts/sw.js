const CACHE_NAME = 'pwa-cache-v1';
const API_CACHE = 'pwa-api-cache-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './app.css',
  './app.webmanifest',
  './images/logo.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of STATIC_ASSETS) {
        try {
          const response = await fetch(asset);
          if (response.ok) await cache.put(asset, response);
        } catch {
          console.warn('Skip missing asset:', asset);
        }
      }
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME && key !== API_CACHE) return caches.delete(key);
      }))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin.includes('story-api.dicoding.dev')) {
    
    if (event.request.method !== 'GET') return;

    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        try {
          const networkResponse = await fetch(event.request);
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        } catch {
          const cachedResponse = await cache.match(event.request);
          return cachedResponse || new Response(JSON.stringify({ message: 'Offline: data tidak tersedia' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 503,
          });
        }
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'Notifikasi', body: event.data.text() };
  }
  const title = data.title || 'Notifikasi';
  const body = data.body || 'Pesan baru diterima.';
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: './images/logo.png',
      badge: './images/logo.png'
    })
  );
});

self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, actions, data } = event.data;
    self.registration.showNotification(title, {
      body,
      icon: './images/logo.png',
      badge: './images/logo.png',
      actions: actions || [],
      data: data || {},
      requireInteraction: true,
      vibrate: [200, 100, 200]
    });
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'open-add-page') {
    event.waitUntil(clients.openWindow(event.notification.data.url || '#/add'));
    return;
  }
  event.waitUntil(clients.openWindow(event.notification.data?.url || '#/'));
});
