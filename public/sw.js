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

  // Strategy 1: Cloudinary Images - Cache First with fallback
  if (url.hostname.includes('cloudinary.com')) {
    event.respondWith(
      caches.match(request)
        .then((cached) => {
          if (cached) {
            return cached;
          }
          
          return fetch(request, { timeout: 5000 }).then((response) => {
            // Only cache successful responses
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(IMAGE_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            
            return response;
          }).catch((error) => {
            console.log('[SW] Cloudinary fetch failed:', error.message);
            // Return placeholder on error
            return new Response(
              '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect fill="#f3f4f6" width="400" height="300"/><text x="50%" y="50%" text-anchor="middle" fill="#9ca3af" font-size="16">📷 Offline</text></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          });
        })
    );
    return;
  }

  // Strategy 2: Firebase/Firestore - Network First
  if (url.hostname.includes('firebaseio.com') || 
      url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('googleapis.com')) {
    event.respondWith(
      fetch(request, { timeout: 5000 })
        .then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch((error) => {
          console.log('[SW] Firebase request failed, using cache:', error.message);
          // Fallback to cache on network error
          return caches.match(request)
            .then((cached) => {
              if (cached) {
                console.log('[SW] Serving from cache');
                return cached;
              }
              
              // Don't return error response, let it fail naturally
              // This allows app-level offline detection to handle it
              console.log('[SW] No cache available, passing through error');
              return Promise.reject(error);
            });
        })
    );
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
          
          return fetch(request, { timeout: 5000 }).then((response) => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          }).catch((error) => {
            console.log('[SW] Static asset fetch failed:', url.pathname);
            // Let it fail naturally, browser will show error
            return Promise.reject(error);
          });
        })
    );
    return;
  }

  // Strategy 4: HTML Pages - Network First with offline fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request, { timeout: 5000 })
        .then((response) => {
          // Cache successful HTML responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch((error) => {
          console.log('[SW] HTML fetch failed, using cache:', error.message);
          // Try cache first
          return caches.match(request)
            .then((cached) => {
              if (cached) {
                console.log('[SW] Serving cached HTML');
                return cached;
              }
              
              // Fallback to offline page
              console.log('[SW] No cache, serving offline page');
              return caches.match('/offline.html')
                .then((offlinePage) => {
                  return offlinePage || new Response(
                    '<h1>📡 Bạn đang offline</h1><p>Vui lòng kiểm tra kết nối internet</p>',
                    { headers: { 'Content-Type': 'text/html' } }
                  );
                });
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
