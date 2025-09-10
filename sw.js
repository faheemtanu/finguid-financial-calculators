// sw.js
const CACHE_NAME = 'finguid-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/calculators.html',
  '/enhanced-styles.css',
  '/app.js',
  '/favicon.ico',
  '/manifest.json'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(r => r || fetch(event.request))
  );
});
