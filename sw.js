// HomeLoan Pro Service Worker v2.0.0
// Enhanced caching for mortgage calculator with offline support

const CACHE_NAME = 'homeloan-pro-v2.0.0';
const STATIC_CACHE = 'homeloan-static-v2.0.0';
const DYNAMIC_CACHE = 'homeloan-dynamic-v2.0.0';

// Assets to cache immediately
const CORE_ASSETS = [
  '/',
  '/mortgage-calculator',
  '/mortgage-calculator.html',
  '/style.css', 
  '/mortgage-calculator.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Network-first assets (always try network first)
const NETWORK_FIRST = [
  '/api/',
  '/mortgage-rates',
  '/current-rates'
];

// Cache-first assets (try cache first)  
const CACHE_FIRST = [
  '/icons/',
  '/images/',
  '/fonts/',
  '.woff2',
  '.woff',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('HomeLoan Pro SW: Installing v2.0.0');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('HomeLoan Pro SW: Caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        console.log('HomeLoan Pro SW: Core assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('HomeLoan Pro SW: Failed to cache core assets', error);
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('HomeLoan Pro SW: Activating v2.0.0');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('HomeLoan Pro SW: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all pages
      self.clients.claim()
    ])
  );
});

// Fetch event - intelligent caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  event.respondWith(handleRequest(request));
});

// Handle different types of requests with appropriate caching strategies
async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // 1. Network-first strategy (for dynamic content)
    if (NETWORK_FIRST.some(pattern => url.pathname.startsWith(pattern))) {
      return await networkFirst(request);
    }
    
    // 2. Cache-first strategy (for static assets)
    if (CACHE_FIRST.some(pattern => 
      url.pathname.includes(pattern) || url.pathname.endsWith(pattern)
    )) {
      return await cacheFirst(request);
    }
    
    // 3. Stale-while-revalidate for core pages
    if (CORE_ASSETS.includes(url.pathname) || url.pathname === '/mortgage-calculator') {
      return await staleWhileRevalidate(request);
    }
    
    // 4. Network-only for everything else (with fallback)
    return await networkWithFallback(request);
    
  } catch (error) {
    console.error('HomeLoan Pro SW: Request failed', error);
    return await getOfflineFallback(request);
  }
}

// Network-first strategy
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Network failed, try cache
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Cache-first strategy  
async function cacheFirst(request) {
  const cached = await caches.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    throw error;
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  
  // Always try to fetch fresh version in background
  const fetchPromise = fetch(request)
    .then(response => {
      if (response.ok) {
        const cache = caches.open(STATIC_CACHE);
        cache.then(c => c.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => null);
  
  // Return cached version immediately if available
  if (cached) {
    return cached;
  }
  
  // If no cache, wait for network
  return await fetchPromise;
}

// Network with fallback
async function networkWithFallback(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache successful responses in dynamic cache
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Try to find in any cache
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Offline fallback responses
async function getOfflineFallback(request) {
  const url = new URL(request.url);
  
  // For navigation requests, return the main app
  if (request.mode === 'navigate') {
    const cachedApp = await caches.match('/mortgage-calculator');
    if (cachedApp) {
      return cachedApp;
    }
  }
  
  // For images, return a placeholder if available
  if (request.destination === 'image') {
    const placeholder = await caches.match('/icons/icon-192x192.png');
    if (placeholder) {
      return placeholder;
    }
  }
  
  // Generic offline response
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message: 'This content is not available offline',
      timestamp: new Date().toISOString()
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    }
  );
}

// Background sync for form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'mortgage-calculation') {
    event.waitUntil(syncCalculations());
  }
});

// Sync stored calculations when back online
async function syncCalculations() {
  try {
    // Get stored calculations from IndexedDB or localStorage
    const calculations = JSON.parse(localStorage.getItem('pendingCalculations') || '[]');
    
    for (const calc of calculations) {
      try {
        await fetch('/api/save-calculation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(calc)
        });
      } catch (error) {
        console.error('Failed to sync calculation', error);
      }
    }
    
    // Clear synced calculations
    localStorage.removeItem('pendingCalculations');
    
  } catch (error) {
    console.error('Background sync failed', error);
  }
}

// Push notifications for rate changes (if implemented)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'mortgage-rates',
        actions: [
          {
            action: 'recalculate',
            title: 'Recalculate'
          },
          {
            action: 'dismiss', 
            title: 'Dismiss'
          }
        ]
      })
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'recalculate') {
    event.waitUntil(
      clients.openWindow('/mortgage-calculator')
    );
  }
});

// Periodic background sync for rate updates (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'rate-update') {
    event.waitUntil(updateMortgageRates());
  }
});

async function updateMortgageRates() {
  try {
    const response = await fetch('/api/current-rates');
    const rates = await response.json();
    
    // Cache the rates
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put('/api/current-rates', new Response(JSON.stringify(rates)));
    
  } catch (error) {
    console.error('Failed to update rates', error);
  }
}

// Clean up old dynamic cache entries periodically
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_CLEANUP') {
    event.waitUntil(cleanupDynamicCache());
  }
});

async function cleanupDynamicCache() {
  const cache = await caches.open(DYNAMIC_CACHE);
  const requests = await cache.keys();
  
  // Keep only the 50 most recent entries
  if (requests.length > 50) {
    const oldRequests = requests.slice(0, requests.length - 50);
    await Promise.all(oldRequests.map(request => cache.delete(request)));
  }
}

console.log('HomeLoan Pro Service Worker v2.0.0 loaded');
