// mortgage-sw.js

const CACHE_NAME = 'mortgage-calculator-v2';
const STATIC_FILES = [
  '/',
  '/index.html',
  '/mortgage-calculator.html',
  '/style.css',
  '/mortgage-calculator.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://kit.fontawesome.com/a076d05399.js'
];

// Install event - cache static resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
    .then(cache => cache.addAll(STATIC_FILES))
    .then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
    ))
    .then(() => self.clients.claim())
  );
});

// Fetch event - cache falling back to network
self.addEventListener('fetch', event => {
  const {request} = event;
  // Only handle GET requests
  if(request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then(response => {
      return response || fetch(request).then(fetchRes => {
        return caches.open(CACHE_NAME).then(cache => {
          // Cache fetched files for offline use
          cache.put(request, fetchRes.clone());
          return fetchRes;
        });
      });
    }).catch(() => {
      // Fallback offline page or asset can be returned here if desired
      return caches.match('/index.html');
    })
  );
});
