// Service Worker for Pool Master 3D Pro
const CACHE_NAME = 'pool-master-3d-pro-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/game.js',
  '/manifest.json',
  '/imgs/icon-192.png',
  '/imgs/pool_icon_512_1.png',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdn.jsdelivr.net/npm/cannon@0.6.2/build/cannon.min.js',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap',
  // PWA Assets
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%23D4AF37"/><circle cx="50" cy="50" r="35" fill="%23000"/><text x="50" y="65" font-size="40" text-anchor="middle" fill="%23FFF" font-family="Arial">8</text></svg>'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('🎮 Pool Master 3D Pro - Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Fetch event
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Activate event
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Background sync for game data
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync-game-data') {
    event.waitUntil(syncGameData());
  }
});

async function syncGameData() {
  try {
    // Sync game progress, scores, achievements
    console.log('🔄 Syncing game data...');
    // This would sync with your backend API
  } catch (error) {
    console.error('❌ Sync failed:', error);
  }
}

// Push notifications for events and rewards
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New rewards available!',
    icon: '/imgs/icon-192.png',
    badge: '/imgs/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Rewards',
        icon: '/imgs/icon-192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/imgs/icon-192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Pool Master 3D Pro', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
