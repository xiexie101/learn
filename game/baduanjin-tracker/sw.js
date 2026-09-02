const CACHE_NAME = 'baduanjin-tracker-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/variables.css',
    './css/styles.css',
    './js/data.js',
    './js/app.js',
    './js/garden.js',
    './js/sound.js',
    './js/calendar.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
    );
});
