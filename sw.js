const CACHE_NAME = 'gdn-os-v6';
const ASSETS = [
    './',
    './index.html',
    './css/main.css',
    './js/app.js',
    './js/storage.js',
    './js/modules/os.js',
    './js/modules/clients.js',
    './js/modules/technicians.js',
    './js/modules/financial.js',
    './js/modules/settings.js',
    './assets/img/logo.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', (e) => {
    self.skipWaiting(); // Força a atualização imediata do Service Worker
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS).catch(err => {
                console.warn('Alguns arquivos não puderam ser cacheados:', err);
            });
        })
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key); // Remove caches antigos
                }
            }));
        })
    );
    return self.clients.claim(); // Assume o controle das abas abertas imediatamente
});

self.addEventListener('fetch', (e) => {
    // Modo "Network First" - Tenta buscar da rede primeiro, se falhar (offline), usa o cache
    e.respondWith(
        fetch(e.request).then((response) => {
            return caches.open(CACHE_NAME).then((cache) => {
                // Atualiza o cache com a versão mais recente
                cache.put(e.request, response.clone());
                return response;
            });
        }).catch(() => {
            return caches.match(e.request);
        })
    );
});
