const CACHE_NAME = 'mechanic-helper-v1';
const OFFLINE_URL = '/offline.html';

const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API requests (let them go to network)
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.ok) {
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          // Return cached response if network fails
          return caches.match(request);
        })
    );
    return;
  }

  // For HTML, CSS, JS - network first, fallback to cache
  if (
    request.destination === 'document' ||
    request.destination === 'script' ||
    request.destination === 'style'
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // For images and other assets - cache first
  event.respondWith(
    caches.match(request).then((cached) => {
      return (
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
      );
    })
  );
});

// Background sync for offline repairs
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-repairs') {
    event.waitUntil(syncRepairs());
  }
});

async function syncRepairs() {
  try {
    const db = await openIndexedDB();
    const repairs = await getOfflineRepairs(db);
    
    for (const repair of repairs) {
      try {
        const response = await fetch('/api/repairs/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(repair)
        });
        
        if (response.ok) {
          await deleteOfflineRepair(db, repair.id);
        }
      } catch (error) {
        console.error('Failed to sync repair:', error);
      }
    }
  } catch (error) {
    console.error('Sync repairs failed:', error);
  }
}

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MechanicHelper', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offlineRepairs')) {
        db.createObjectStore('offlineRepairs', { keyPath: 'id' });
      }
    };
  });
}

function getOfflineRepairs(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('offlineRepairs', 'readonly');
    const store = transaction.objectStore('offlineRepairs');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function deleteOfflineRepair(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('offlineRepairs', 'readwrite');
    const store = transaction.objectStore('offlineRepairs');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
