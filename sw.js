/**
 * SERVICE WORKER FOR USA MORTGAGE CALCULATOR PWA
 * Enhanced offline functionality and caching for American homebuyers
 * © 2025 FinGuid - World's First AI Calculator Platform for Americans
 */

const CACHE_NAME = 'finguid-usa-mortgage-calculator-v9.0.0';
const STATIC_CACHE = 'finguid-static-v9.0.0';
const DYNAMIC_CACHE = 'finguid-dynamic-v9.0.0';

// Files to cache for offline functionality
const STATIC_FILES = [
    '/',
    '/mortgage-calculator',
    '/mortgage-calculator-enhanced.html',
    '/mortgage-calculator-enhanced.css',
    '/mortgage-calculator-enhanced.js',
    '/manifest.json',
    '/assets/icons/icon-192x192.png',
    '/assets/icons/icon-512x512.png',
    '/assets/finguid-usa-logo.svg',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js'
];

// Dynamic content to cache
const DYNAMIC_FILES = [
    '/rates',
    '/resources',
    '/calculators',
    '/about'
];

// Install event - cache static files
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Caching static files...');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Static files cached successfully');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Failed to cache static files:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip extension requests
    if (request.url.includes('extension://')) {
        return;
    }
    
    // Skip chrome-extension requests
    if (url.protocol === 'chrome-extension:') {
        return;
    }
    
    // Handle different types of requests
    if (url.origin === location.origin) {
        // Same origin - use cache-first strategy
        event.respondWith(cacheFirst(request));
    } else {
        // External resources - use network-first for critical resources
        if (isCriticalResource(request.url)) {
            event.respondWith(networkFirst(request));
        } else {
            event.respondWith(cacheFirst(request));
        }
    }
});

// Cache-first strategy
async function cacheFirst(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            console.log('Serving from cache:', request.url);
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Cache-first failed:', error);
        
        // Return offline fallback for HTML requests
        if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/mortgage-calculator-enhanced.html');
        }
        
        // Return empty response for other requests
        return new Response('Offline content not available', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// Network-first strategy for critical resources
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('Network failed, trying cache:', request.url);
        
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

// Check if resource is critical (rates, fonts, etc.)
function isCriticalResource(url) {
    const criticalPatterns = [
        '/rates',
        'fonts.googleapis.com',
        'cdn.jsdelivr.net',
        'cdnjs.cloudflare.com'
    ];
    
    return criticalPatterns.some(pattern => url.includes(pattern));
}

// Handle background sync for offline calculations
self.addEventListener('sync', event => {
    console.log('Background sync triggered:', event.tag);
    
    if (event.tag === 'save-calculation') {
        event.waitUntil(syncCalculations());
    }
});

// Sync saved calculations when back online
async function syncCalculations() {
    try {
        // Get saved calculations from IndexedDB or localStorage
        const calculations = await getSavedCalculations();
        
        if (calculations.length > 0) {
            // Send to server when back online
            const response = await fetch('/api/sync-calculations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(calculations)
            });
            
            if (response.ok) {
                // Clear local storage after successful sync
                await clearSavedCalculations();
                console.log('Calculations synced successfully');
            }
        }
    } catch (error) {
        console.error('Failed to sync calculations:', error);
    }
}

// Get saved calculations (placeholder - implement based on storage strategy)
async function getSavedCalculations() {
    // This would integrate with your actual data storage
    return [];
}

// Clear saved calculations after sync
async function clearSavedCalculations() {
    // This would clear the synced data from local storage
}

// Handle push notifications for rate updates
self.addEventListener('push', event => {
    console.log('Push notification received');
    
    if (event.data) {
        const data = event.data.json();
        
        const options = {
            body: data.body || 'New mortgage rate update available',
            icon: '/assets/icons/icon-192x192.png',
            badge: '/assets/icons/icon-96x96.png',
            data: data,
            actions: [
                {
                    action: 'view',
                    title: 'View Rates',
                    icon: '/assets/icons/rates-96x96.png'
                },
                {
                    action: 'dismiss',
                    title: 'Dismiss'
                }
            ],
            requireInteraction: true,
            tag: 'rate-update'
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title || 'FinGuid USA Rate Update', options)
        );
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    console.log('Notification clicked:', event.notification.tag);
    
    event.notification.close();
    
    if (event.action === 'view') {
        // Open the app to rates page
        event.waitUntil(
            clients.openWindow('/rates')
        );
    } else if (event.action === 'dismiss') {
        // Just close the notification
        return;
    } else {
        // Default action - open main app
        event.waitUntil(
            clients.openWindow('/mortgage-calculator')
        );
    }
});

// Handle message events from main app
self.addEventListener('message', event => {
    console.log('Service Worker received message:', event.data);
    
    if (event.data && event.data.type) {
        switch (event.data.type) {
            case 'SKIP_WAITING':
                self.skipWaiting();
                break;
            
            case 'GET_VERSION':
                event.ports[0].postMessage({
                    version: CACHE_NAME
                });
                break;
            
            case 'CACHE_URLS':
                if (event.data.urls) {
                    cacheUrls(event.data.urls);
                }
                break;
            
            case 'CLEAR_CACHE':
                clearAllCaches();
                break;
                
            default:
                console.log('Unknown message type:', event.data.type);
        }
    }
});

// Cache specific URLs on demand
async function cacheUrls(urls) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        await cache.addAll(urls);
        console.log('URLs cached successfully:', urls);
    } catch (error) {
        console.error('Failed to cache URLs:', error);
    }
}

// Clear all caches
async function clearAllCaches() {
    try {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('All caches cleared');
    } catch (error) {
        console.error('Failed to clear caches:', error);
    }
}

// Periodic rate updates (when app is in background)
self.addEventListener('periodicsync', event => {
    if (event.tag === 'rate-update') {
        event.waitUntil(updateRatesInBackground());
    }
});

// Update rates in background
async function updateRatesInBackground() {
    try {
        const response = await fetch('/api/rates');
        if (response.ok) {
            const rates = await response.json();
            
            // Store updated rates
            await storeRates(rates);
            
            // Notify users of significant changes
            await notifyRateChanges(rates);
        }
    } catch (error) {
        console.error('Background rate update failed:', error);
    }
}

// Store rates for offline access
async function storeRates(rates) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        await cache.put('/api/rates', new Response(JSON.stringify(rates)));
    } catch (error) {
        console.error('Failed to store rates:', error);
    }
}

// Notify users of significant rate changes
async function notifyRateChanges(rates) {
    // Only notify if rates changed significantly
    const previousRates = await getPreviousRates();
    
    if (previousRates && hasSignificantChange(previousRates, rates)) {
        await self.registration.showNotification('Mortgage Rates Updated! 📊', {
            body: `30-Year Fixed: ${rates.thirtyYear}% | 15-Year Fixed: ${rates.fifteenYear}%`,
            icon: '/assets/icons/icon-192x192.png',
            tag: 'rate-change',
            data: rates,
            actions: [
                {
                    action: 'view-calculator',
                    title: 'Update My Calculation'
                }
            ]
        });
    }
}

// Get previous rates for comparison
async function getPreviousRates() {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const response = await cache.match('/api/rates-previous');
        return response ? await response.json() : null;
    } catch (error) {
        return null;
    }
}

// Check if rate change is significant (>0.125%)
function hasSignificantChange(previous, current) {
    const threshold = 0.125;
    
    return Math.abs(previous.thirtyYear - current.thirtyYear) >= threshold ||
           Math.abs(previous.fifteenYear - current.fifteenYear) >= threshold;
}

// Error handling for unhandled promise rejections
self.addEventListener('unhandledrejection', event => {
    console.error('Unhandled promise rejection in service worker:', event.reason);
    event.preventDefault();
});

// Error handling for general errors
self.addEventListener('error', event => {
    console.error('Service worker error:', event.error);
});

console.log('🚀 FinGuid USA Mortgage Calculator Service Worker v9.0.0 loaded');
console.log('📱 PWA offline functionality enabled');
console.log('🔄 Background sync and notifications ready');
