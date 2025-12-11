// Love Journal Service Worker
// Phase 4: PWA & Offline Support

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `love-journal-${CACHE_VERSION}`;
const STATIC_CACHE = `${CACHE_NAME}-static`;
const IMAGE_CACHE = `${CACHE_NAME}-images`;
const API_CACHE = `${CACHE_NAME}-api`;

// Assets to precache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html', // Fallback page
];

// Install event - precache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Precaching static assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Service worker installed successfully');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[SW] Precache failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete old caches
              return cacheName.startsWith('love-journal-') && 
                     cacheName !== STATIC_CACHE &&
                     cacheName !== IMAGE_CACHE &&
                     cacheName !== API_CACHE;
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim(); // Take control immediately
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Skip Firebase requests - Firebase handles offline persistence natively
  if (url.hostname.includes('firebaseio.com') || 
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firebase.com')) {
    return; // Let Firebase SDK handle it with its offline persistence
  }

  // Strategy 1: Cloudinary Images - Cache First with fallback
  if (url.hostname.includes('cloudinary.com')) {
    event.respondWith(
      caches.match(request)
        .then((cached) => {
          if (cached) {
            return cached;
          }
          
          return fetch(request).then((response) => {
            // Only cache successful responses
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(IMAGE_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            
            return response;
          }).catch(() => {
            // Silently fail, return cached version if available
            return caches.match(request);
          });
        })
    );
    return;
  }

  // Strategy 2: Firebase/Firestore - SKIP, let Firebase SDK handle offline persistence
  if (url.hostname.includes('firebaseio.com') || 
      url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firebase.com')) {
    // Don't intercept Firebase requests - Firebase SDK has built-in offline persistence
    return;
  }

  // Strategy 3: Static Assets (JS, CSS, Fonts) - Cache First
  if (url.pathname.match(/\.(js|css|woff|woff2|ttf|eot)$/)) {
    event.respondWith(
      caches.match(request)
        .then((cached) => {
          if (cached) {
            return cached;
          }
          
          return fetch(request).then((response) => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          });
        })
    );
    return;
  }

  // Strategy 4: HTML Pages - Cache First (SPA)
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      caches.match(request)
        .then((cached) => {
          // Return cached HTML immediately for instant load
          return cached || fetch(request).then((response) => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          });
        })
    );
    return;
  }

  // Default: Network only
  event.respondWith(fetch(request));
});

// Background sync event (for future use)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-memories') {
    event.waitUntil(syncMemories());
  }
});

// Placeholder for background sync
async function syncMemories() {
  console.log('[SW] Syncing memories...');
  // TODO: Implement memory sync logic
  return Promise.resolve();
}

// Push notification event (for future use)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const data = event.data?.json() || {};
  const title = data.title || 'Love Journal';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: data.url,
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});

console.log('[SW] Service worker loaded');
