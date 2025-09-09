// ===== SERVICE WORKER FOR PWA FUNCTIONALITY =====
// USA Financial Calculators - Offline Support & Caching
// Version: 2.0.0

'use strict';

const CACHE_NAME = 'finguid-calculators-v2.0.0';
const DATA_CACHE_NAME = 'finguid-data-cache-v2.0.0';

// Define what to cache
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/calculator-styles.css',
    '/calculators.js',
    '/main.js',
    '/config.js',
    '/manifest.json',
    
    // Images and icons
    '/images/icon-192x192.png',
    '/images/icon-512x512.png',
    '/images/logo.png',
    '/favicon.ico',
    
    // External resources (optional - cache if needed offline)
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// URLs that should always be fetched from network (dynamic content)
const NETWORK_FIRST_URLS = [
    '/api/',
    'https://api.finguid.com/',
    'https://formspree.io/',
    'https://www.google-analytics.com/',
    'https://www.googletagmanager.com/'
];

// URLs that should be served from cache first (static content)
const CACHE_FIRST_URLS = [
    '/images/',
    '/css/',
    '/js/',
    'https://fonts.googleapis.com/',
    'https://fonts.gstatic.com/',
    'https://cdnjs.cloudflare.com/'
];

// ===== SERVICE WORKER INSTALLATION =====
self.addEventListener('install', (evt) => {
    console.log('[ServiceWorker] Install');
    
    // Pre-cache static resources
    evt.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[ServiceWorker] Pre-caching offline page');
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    
    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
});

// ===== SERVICE WORKER ACTIVATION =====
self.addEventListener('activate', (evt) => {
    console.log('[ServiceWorker] Activate');
    
    // Remove previous cached data from disk
    evt.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                    console.log('[ServiceWorker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    
    // Tell the active service worker to take control immediately
    self.clients.claim();
});

// ===== FETCH HANDLER =====
self.addEventListener('fetch', (evt) => {
    const { request } = evt;
    const url = new URL(request.url);
    
    // Handle different types of requests with appropriate caching strategies
    if (request.method === 'GET') {
        // API requests - Network first with cache fallback
        if (isNetworkFirstUrl(request.url)) {
            evt.respondWith(networkFirstStrategy(request));
        }
        // Static assets - Cache first with network fallback
        else if (isCacheFirstUrl(request.url)) {
            evt.respondWith(cacheFirstStrategy(request));
        }
        // HTML pages - Stale while revalidate
        else if (request.mode === 'navigate') {
            evt.respondWith(staleWhileRevalidateStrategy(request));
        }
        // Default strategy for other requests
        else {
            evt.respondWith(cacheFirstStrategy(request));
        }
    }
    // For POST requests (forms, etc.), always go to network
    else {
        evt.respondWith(fetch(request));
    }
});

// ===== CACHING STRATEGIES =====

// Network First Strategy - Try network first, fallback to cache
async function networkFirstStrategy(request) {
    try {
        // Try to fetch from network
        const networkResponse = await fetch(request);
        
        // If successful, update cache and return response
        if (networkResponse.status === 200) {
            const cache = await caches.open(DATA_CACHE_NAME);
            cache.put(request.url, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[ServiceWorker] Network request failed, trying cache:', request.url);
        
        // Network failed, try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // If no cache, return offline page for navigation requests
        if (request.mode === 'navigate') {
            return caches.match('/offline.html') || new Response('Offline', { status: 503 });
        }
        
        // For other requests, return basic offline response
        return new Response('Offline', { 
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
                'Content-Type': 'text/plain'
            })
        });
    }
}

// Cache First Strategy - Try cache first, fallback to network
async function cacheFirstStrategy(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // Not in cache, fetch from network
    try {
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request.url, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[ServiceWorker] Fetch failed for:', request.url);
        
        // Return offline indicator for failed requests
        if (request.destination === 'image') {
            return new Response(createOfflineImageSVG(), {
                headers: { 'Content-Type': 'image/svg+xml' }
            });
        }
        
        return new Response('Offline', { status: 503 });
    }
}

// Stale While Revalidate Strategy - Return cache immediately, update in background
async function staleWhileRevalidateStrategy(request) {
    const cachedResponse = await caches.match(request);
    
    // Fetch from network in the background to update cache
    const networkResponsePromise = fetch(request).then((networkResponse) => {
        if (networkResponse.status === 200) {
            const cache = caches.open(CACHE_NAME);
            cache.then(c => c.put(request.url, networkResponse.clone()));
        }
        return networkResponse;
    }).catch(() => {
        // Network failed, but we might have cache
        console.log('[ServiceWorker] Network failed for:', request.url);
    });
    
    // Return cached version immediately if available
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // No cache, wait for network
    try {
        return await networkResponsePromise;
    } catch (error) {
        // Return offline page for navigation requests
        return caches.match('/offline.html') || new Response(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>You're Offline - USA Financial Calculators</title>
                <style>
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        min-height: 100vh; 
                        margin: 0;
                        background: #f5f5f5;
                        text-align: center;
                        padding: 20px;
                    }
                    .offline-container {
                        background: white;
                        padding: 40px;
                        border-radius: 12px;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                        max-width: 400px;
                    }
                    .offline-icon {
                        font-size: 64px;
                        margin-bottom: 20px;
                    }
                    h1 { color: #333; margin-bottom: 10px; }
                    p { color: #666; margin-bottom: 20px; }
                    .retry-btn {
                        background: #2196f3;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 16px;
                    }
                    .retry-btn:hover { background: #1976d2; }
                </style>
            </head>
            <body>
                <div class="offline-container">
                    <div class="offline-icon">📱</div>
                    <h1>You're Offline</h1>
                    <p>Some calculators are still available offline, but full features require an internet connection.</p>
                    <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
                </div>
                <script>
                    // Auto-retry when online
                    window.addEventListener('online', function() {
                        window.location.reload();
                    });
                </script>
            </body>
            </html>
        `, {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
                'Content-Type': 'text/html'
            })
        });
    }
}

// ===== HELPER FUNCTIONS =====

// Check if URL should use network-first strategy
function isNetworkFirstUrl(url) {
    return NETWORK_FIRST_URLS.some(pattern => url.includes(pattern));
}

// Check if URL should use cache-first strategy
function isCacheFirstUrl(url) {
    return CACHE_FIRST_URLS.some(pattern => url.includes(pattern));
}

// Create offline image placeholder
function createOfflineImageSVG() {
    return `<svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="150" fill="#f0f0f0"/>
        <text x="100" y="75" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#999">
            Image unavailable offline
        </text>
    </svg>`;
}

// ===== BACKGROUND SYNC (Future Feature) =====
self.addEventListener('sync', (evt) => {
    console.log('[ServiceWorker] Background Sync', evt.tag);
    
    if (evt.tag === 'calculation-sync') {
        evt.waitUntil(syncCalculations());
    }
});

async function syncCalculations() {
    // Sync offline calculations when back online
    try {
        const cache = await caches.open(DATA_CACHE_NAME);
        const pendingCalculations = await cache.match('/pending-calculations');
        
        if (pendingCalculations) {
            const data = await pendingCalculations.json();
            // Send pending calculations to server
            console.log('[ServiceWorker] Syncing calculations:', data);
            // Implementation depends on your backend API
        }
    } catch (error) {
        console.log('[ServiceWorker] Sync failed:', error);
    }
}

// ===== PUSH NOTIFICATIONS (Future Feature) =====
self.addEventListener('push', (evt) => {
    console.log('[ServiceWorker] Push Received.');
    
    const title = 'USA Financial Calculators';
    const options = {
        body: evt.data ? evt.data.text() : 'New financial insights available!',
        icon: '/images/icon-192x192.png',
        badge: '/images/icon-192x192.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '1'
        },
        actions: [
            {
                action: 'explore',
                title: 'View Calculators',
                icon: '/images/checkmark.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/images/xmark.png'
            }
        ]
    };
    
    evt.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification clicks
self.addEventListener('notificationclick', (evt) => {
    console.log('[ServiceWorker] Notification click:', evt);
    
    evt.notification.close();
    
    if (evt.action === 'explore') {
        // Open the app
        evt.waitUntil(
            clients.openWindow('/')
        );
    }
});

// ===== MESSAGE HANDLING =====
self.addEventListener('message', (evt) => {
    if (evt.data && evt.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (evt.data && evt.data.type === 'GET_VERSION') {
        evt.ports[0].postMessage({ version: CACHE_NAME });
    }
    
    if (evt.data && evt.data.type === 'CACHE_CALCULATION') {
        // Cache calculation results for offline access
        cacheCalculationResult(evt.data.payload);
    }
});

// Cache calculation results
async function cacheCalculationResult(calculationData) {
    try {
        const cache = await caches.open(DATA_CACHE_NAME);
        const cacheKey = `calculation-${calculationData.id}-${Date.now()}`;
        
        await cache.put(cacheKey, new Response(JSON.stringify(calculationData), {
            headers: { 'Content-Type': 'application/json' }
        }));
        
        console.log('[ServiceWorker] Cached calculation result:', cacheKey);
    } catch (error) {
        console.error('[ServiceWorker] Failed to cache calculation:', error);
    }
}

// ===== CACHE MANAGEMENT =====

// Periodic cache cleanup
self.addEventListener('periodicsync', (evt) => {
    if (evt.tag === 'cache-cleanup') {
        evt.waitUntil(performCacheCleanup());
    }
});

async function performCacheCleanup() {
    console.log('[ServiceWorker] Performing cache cleanup');
    
    try {
        const cache = await caches.open(DATA_CACHE_NAME);
        const requests = await cache.keys();
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        
        const deletionPromises = requests
            .filter(request => {
                // Extract timestamp from cache key
                const match = request.url.match(/calculation-.*-(\d+)$/);
                if (match) {
                    const timestamp = parseInt(match[1]);
                    return now - timestamp > maxAge;
                }
                return false;
            })
            .map(request => cache.delete(request));
        
        await Promise.all(deletionPromises);
        console.log(`[ServiceWorker] Cleaned up ${deletionPromises.length} old cache entries`);
    } catch (error) {
        console.error('[ServiceWorker] Cache cleanup failed:', error);
    }
}

// ===== ERROR HANDLING =====
self.addEventListener('error', (evt) => {
    console.error('[ServiceWorker] Error:', evt.error);
});

self.addEventListener('unhandledrejection', (evt) => {
    console.error('[ServiceWorker] Unhandled promise rejection:', evt.reason);
    evt.preventDefault();
});

// ===== DEVELOPMENT HELPERS =====
if (self.location.hostname === 'localhost') {
    console.log('[ServiceWorker] Development mode detected');
    
    // Skip cache in development for easier debugging
    self.addEventListener('fetch', (evt) => {
        if (evt.request.url.includes('localhost')) {
            // Let browser handle localhost requests normally in development
            return;
        }
    });
}

// ===== SERVICE WORKER UPDATE NOTIFICATION =====
self.addEventListener('message', (evt) => {
    if (evt.data && evt.data.type === 'CHECK_UPDATE') {
        checkForUpdates().then((hasUpdate) => {
            evt.ports[0].postMessage({ hasUpdate });
        });
    }
});

async function checkForUpdates() {
    try {
        const registration = await self.registration.update();
        return !!registration.waiting;
    } catch (error) {
        console.error('[ServiceWorker] Update check failed:', error);
        return false;
    }
}

console.log('[ServiceWorker] Loaded successfully - Version:', CACHE_NAME);
