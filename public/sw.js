// Service Worker for CodeSentinel PWA
const CACHE_NAME = 'codesentinel-v1.0.0';
const STATIC_CACHE = 'codesentinel-static-v1.0.0';
const API_CACHE = 'codesentinel-api-v1.0.0';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/repositories',
  '/api/analysis',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_FILES);
    })
  );
  // Force activation of new service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all clients
  self.clients.claim();
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(API_CACHE).then((cache) => {
        return fetch(request).then((response) => {
          // Cache successful GET requests for 5 minutes
          if (request.method === 'GET' && response.status === 200) {
            cache.put(request, response.clone());
          }
          return response;
        }).catch(() => {
          // Return cached version if available
          return cache.match(request);
        });
      })
    );
    return;
  }

  // Handle static assets and pages
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Cache static assets
        const responseToCache = response.clone();
        caches.open(STATIC_CACHE).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Return offline fallback for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/offline.html') || new Response(
            '<h1>Offline</h1><p>You are currently offline. Please check your internet connection.</p>',
            {
              headers: { 'Content-Type': 'text/html' }
            }
          );
        }
      });
    })
  );
});

// Background sync for offline analysis requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-analysis') {
    event.waitUntil(doBackgroundAnalysis());
  }
});

async function doBackgroundAnalysis() {
  // Process queued analysis requests when back online
  console.log('Processing background analysis requests');
  // Implementation would depend on your specific requirements
}

// Push notifications for analysis completion
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/dashboard'
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/dashboard')
  );
});

// Periodic background sync for repository updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'repo-sync') {
    event.waitUntil(syncRepositories());
  }
});

async function syncRepositories() {
  console.log('Syncing repositories in background');
  // Implementation would fetch latest repository data
}
