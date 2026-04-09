const CACHE = 'habitflow-v3';

// Динамически определяем базовый путь — работает с любым именем репо
const BASE = self.location.pathname.replace(/\/sw\.js$/, '');

const ASSETS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/css/style.css',
  BASE + '/js/assets.js',
  BASE + '/js/data.js',
  BASE + '/js/state.js',
  BASE + '/js/helpers.js',
  BASE + '/js/render.js',
  BASE + '/js/actions.js',
  BASE + '/js/ui.js',
  BASE + '/manifest.json',
  BASE + '/icons/icon-192.png',
  BASE + '/icons/icon-512.png',
];

// Установка — кэшируем все файлы
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Активация — удаляем старые кэши
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch — кэш первым, затем сеть (cache-first для надёжного офлайн)
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) {
        // Есть в кэше — отдаём сразу, фоном обновляем
        fetch(e.request)
          .then(response => {
            if (response && response.status === 200) {
              caches.open(CACHE)
                .then(cache => cache.put(e.request, response));
            }
          })
          .catch(() => {}); // офлайн — не страшно
        return cached;
      }

      // Нет в кэше — идём в сеть
      return fetch(e.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE)
              .then(cache => cache.put(e.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(BASE + '/index.html'));
    })
  );
});

// Обновление по команде
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
