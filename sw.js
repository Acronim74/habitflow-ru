const CACHE = 'habitflow-v2';

const ASSETS = [
  '/habitflow/',
  '/habitflow/index.html',
  '/habitflow/css/style.css',
  '/habitflow/js/assets.js',
  '/habitflow/js/data.js',
  '/habitflow/js/state.js',
  '/habitflow/js/helpers.js',
  '/habitflow/js/render.js',
  '/habitflow/js/actions.js',
  '/habitflow/js/ui.js',
  '/habitflow/manifest.json',
  '/habitflow/icons/icon-192.png',
  '/habitflow/icons/icon-512.png',
];

// Установка — кэшируем все файлы
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Активация — удаляем старые кэши и сразу берём контроль
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — сначала сеть, при офлайн берём из кэша
self.addEventListener('fetch', e => {
  // Только GET запросы
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Сохраняем свежую версию в кэш
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Офлайн — берём из кэша
        return caches.match(e.request)
          .then(cached => cached || caches.match('/habitflow/index.html'));
      })
  );
});

// Слушаем сообщение SKIP_WAITING от клиента
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
