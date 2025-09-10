// Service Worker — Finguid Calculator v1.1.0
const CACHE_NAME = 'finguid-calculator-v1.1.0';
const ASSETS = [
  '/', '/mortgage-calculator', '/style.css', '/mortgage-calculator.js',
  '/manifest.json', '/icons/icon-192x192.png', '/icons/icon-512x512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.map(k => k!==CACHE_NAME?caches.delete(k):Promise.resolve()))
  ));
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r =>
      r || fetch(e.request).then(resp => {
        const clone=resp.clone();
        caches.open(CACHE_NAME).then(c=>c.put(e.request,clone));
        return resp;
      }).catch(()=>r)
    )
  );
});
