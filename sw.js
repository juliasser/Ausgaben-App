const CACHE_NAME = 'ausgaben-v3'

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './css/style.css',
  './js/app.js',
  './js/config.js',
  './js/store.js',
  './js/components/NavBar.js',
  './js/components/AddTransaction.js',
  './js/components/TransactionList.js',
  './js/components/Statistics.js',
  './js/components/Settings.js',
  './js/db.js',
]

// Pre-cache app shell on install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  )
})

// Remove old caches on activate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

// Cache-first for local files; network-first with cache fallback for CDN
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  if (url.origin === location.origin) {
    // Local assets: cache first, network fallback + update cache
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached
        return fetch(event.request).then(response => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          return response
        })
      })
    )
  } else {
    // External (Vue CDN etc.): network first, cache fallback
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          return response
        })
        .catch(() => caches.match(event.request))
    )
  }
})
