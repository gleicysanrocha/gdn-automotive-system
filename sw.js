const CACHE_NAME = 'gdn-os-v6';
const ASSETS = [
    './',
    './index.html',
    './css/main.css?v=2.1',
    './js/app.js?v=2.1',
    './js/storage.js?v=2.1',
    './js/firebase-config.js?v=2.1',
    './js/modules/auth.js?v=2.1',
    './js/modules/os.js?v=2.1',
    './js/modules/clients.js?v=2.1',
    './js/modules/technicians.js?v=2.1',
    './js/modules/financial.js?v=2.1',
    './js/modules/settings.js?v=2.1',
    './assets/img/logo.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth-compat.js',
    'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore-compat.js'
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

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(keys.map((key) => {
                if (key !== CACHE_NAME) return caches.delete(key);
            }));
        })
    );
});

self.addEventListener('fetch', (e) => {
    // Strategy: Network First, falling back to Cache
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});
