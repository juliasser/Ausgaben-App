// Service worker stub — caching will be added in Phase 6
const CACHE_NAME = 'ausgaben-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', () => self.clients.claim())
