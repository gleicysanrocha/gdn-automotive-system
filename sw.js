const CACHE_NAME = 'gdn-os-v2';
const ASSETS = [
    './',
    './index.html',
    './css/main.css',
    './js/app.js',
    './js/storage.js',
    './js/modules/os.js',
    './js/modules/clients.js',
    './js/modules/financial.js',
    './js/modules/settings.js',
    './assets/img/logo.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS).catch(err => {
                console.warn('Alguns arquivos não puderam ser cacheados:', err);
            });
        })
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((res) => res || fetch(e.request))
    );
});
