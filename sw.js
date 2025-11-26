// Service Worker for caching tiles for offline use
const CACHE_NAME = 'offline-map-v1';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  // Cache OSM tiles
  if (event.request.url.match(/https:\/\/[abc]\.tile\.openstreetmap\.org\/
\d+\/\d+\/\d+\.png/)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(resp =>
          resp || fetch(event.request).then(networkResp => {
            cache.put(event.request, networkResp.clone());
            return networkResp;
          }).catch(() => resp) // fall back to cache on failure
        )
      )
    );
  }
});

// Receive messages from app to cache tile URLs proactively
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'cache-tile' && event.data.url) {
    caches.open(CACHE_NAME).then(cache =>
      fetch(event.data.url).then(resp => {
        if(resp.ok) cache.put(event.data.url, resp);
      }).catch(()=>{})
    );  
  }
});
