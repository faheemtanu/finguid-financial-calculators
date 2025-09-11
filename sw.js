// AI-Enhanced Mortgage Calculator Service Worker v3.0.0
const CACHE_NAME = 'ai-mortgage-calc-v3.0.0';
const STATIC_CACHE = 'ai-mortgage-static-v3.0.0';
const DYNAMIC_CACHE = 'ai-mortgage-dynamic-v3.0.0';

// Core assets to cache immediately
const CORE_ASSETS = [
  '/',
  '/mortgage-calculator.html',
  '/style.css',
  '/mortgage-calculator.js',
  '/manifest.json',
  '/api/latest-results.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('AI Mortgage Calculator SW: Installing v3.0.0');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('AI Mortgage Calculator SW: Caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        console.log('AI Mortgage Calculator SW: Core assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('AI Mortgage Calculator SW: Failed to cache core assets', error);
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('AI Mortgage Calculator SW: Activating v3.0.0');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('AI Mortgage Calculator SW: Deleting old cache', cacheName);
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
    // API requests - network first with fallback
    if (url.pathname.startsWith('/api/')) {
      return await networkFirst(request);
    }
    
    // Static assets - cache first
    if (url.pathname.includes('.css') || url.pathname.includes('.js') || 
        url.pathname.includes('.png') || url.pathname.includes('.jpg') || 
        url.pathname.includes('.svg') || url.hostname.includes('fonts.googleapis.com') ||
        url.hostname.includes('cdnjs.cloudflare.com')) {
      return await cacheFirst(request);
    }
    
    // Core pages - stale while revalidate
    if (CORE_ASSETS.includes(url.pathname) || url.pathname === '/mortgage-calculator.html') {
      return await staleWhileRevalidate(request);
    }
    
    // Everything else - network with fallback
    return await networkWithFallback(request);
    
  } catch (error) {
    console.error('AI Mortgage Calculator SW: Request failed', error);
    return await getOfflineFallback(request);
  }
}

// Network-first strategy
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
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
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
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
    const cachedApp = await caches.match('/mortgage-calculator.html');
    if (cachedApp) {
      return cachedApp;
    }
  }
  
  // For API requests, return cached calculation data
  if (url.pathname.startsWith('/api/')) {
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'Calculation results not available offline',
        cached: true,
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

// Background sync for calculation results
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-calculations') {
    event.waitUntil(syncCalculations());
  }
});

async function syncCalculations() {
  try {
    const pendingCalculations = JSON.parse(localStorage.getItem('pendingCalculations') || '[]');
    
    for (const calc of pendingCalculations) {
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
    
    localStorage.removeItem('pendingCalculations');
  } catch (error) {
    console.error('Background sync failed', error);
  }
}

// Message handling for cache cleanup
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

console.log('AI-Enhanced Mortgage Calculator Service Worker v3.0.0 loaded');
