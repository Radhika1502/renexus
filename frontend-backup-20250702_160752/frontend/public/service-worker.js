// Renexus Service Worker
const CACHE_NAME = 'renexus-cache-v1';
const OFFLINE_URL = '/offline.html';

// Resources to pre-cache
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/static/css/main.chunk.css',
  '/static/js/main.chunk.js',
  '/static/js/bundle.js',
  '/logo192.png',
  '/logo512.png',
  '/favicon.ico',
  '/manifest.json'
];

// API routes to cache with network-first strategy
const API_ROUTES = [
  '/api/projects',
  '/api/tasks',
  '/api/users'
];

// Install event - pre-cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Pre-caching offline assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        // Force waiting service worker to become active
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Ensure the service worker takes control of all clients
      return self.clients.claim();
    })
  );
});

// Helper function to determine if a request is an API call
const isApiRequest = (url) => {
  return API_ROUTES.some(route => url.pathname.startsWith(route));
};

// Helper function to determine if a request is for a static asset
const isStaticAsset = (url) => {
  return url.pathname.startsWith('/static/') || 
         PRECACHE_ASSETS.includes(url.pathname);
};

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // API requests - Network first, fallback to cache
  if (isApiRequest(url)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response to store in cache
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              // Only cache successful responses
              if (response.status === 200) {
                cache.put(event.request, responseToCache);
              }
            });
          
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              
              // If not in cache, return a generic offline response
              return new Response(
                JSON.stringify({ 
                  error: 'You are offline and this data is not cached',
                  offline: true 
                }),
                { 
                  headers: { 'Content-Type': 'application/json' },
                  status: 503
                }
              );
            });
        })
    );
    return;
  }
  
  // Static assets - Cache first, fallback to network
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          return cachedResponse || fetch(event.request)
            .then((response) => {
              // Clone the response to store in cache
              const responseToCache = response.clone();
              
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
              
              return response;
            })
            .catch(() => {
              // If both cache and network fail for static assets, serve offline page
              if (event.request.mode === 'navigate') {
                return caches.match(OFFLINE_URL);
              }
              
              return new Response('Network error', { status: 503 });
            });
        })
    );
    return;
  }
  
  // HTML pages - Network first, fallback to offline page
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }
  
  // Default strategy - Network first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response to store in cache
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME)
          .then((cache) => {
            // Only cache successful responses
            if (response.status === 200) {
              cache.put(event.request, responseToCache);
            }
          });
        
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Background sync for offline changes
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-changes') {
    event.waitUntil(syncPendingChanges());
  }
});

// Function to sync pending changes
async function syncPendingChanges() {
  try {
    // Get client to communicate with the page
    const client = await self.clients.get(self.clients.matchAll());
    
    if (client) {
      // Notify the page to start syncing
      client.postMessage({
        type: 'SYNC_PENDING_CHANGES'
      });
    }
    
    return true;
  } catch (error) {
    console.error('Background sync failed:', error);
    return false;
  }
}

// Push notification event
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'New notification',
      icon: '/logo192.png',
      badge: '/logo192.png',
      data: {
        url: data.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Renexus Notification', options)
    );
  } catch (error) {
    console.error('Push notification error:', error);
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // Try to focus an existing window
        for (const client of clientList) {
          if (client.url === event.notification.data.url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window exists, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(event.notification.data.url);
        }
      })
  );
});
