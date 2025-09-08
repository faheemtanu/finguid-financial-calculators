'use strict';
const CACHE_NAME    = 'finguid-v2';
const DATA_CACHE    = 'finguid-data-v2';
const FILES_TO_CACHE = ['/', 'index.html', 'style.css', 'calculator-styles.css', 'calculators.js', 'main.js', 'config.js', 'manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(FILES_TO_CACHE)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.map(k => k !== CACHE_NAME && k !== DATA_CACHE && caches.delete(k)))
  ));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  if(e.request.url.includes('/api/') || e.request.url.includes('formspree')){
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request))
    );
  }
});
