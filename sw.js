const CACHE = 'minecraft-seed-explorer-v14-lossless-overviews';
const PREFIX = 'minecraft-seed-explorer-';
const ASSETS = ['./', './index.html', './world-data.mjs', './checked-tiles.mjs', './raster-overview.mjs', './data/overview/index.json', './data/checked-tiles.json', './map-gestures.mjs', './structure-search.mjs', './manifest.webmanifest', './DATA_FORMAT.md', './data/bedrock-26.60-checked-area.json', './data/bedrock-26.60-wide-area.json', './data/bedrock-26.60-cherry-grove.json'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, copy)));
    }
    return response;
  }).catch(async () => (await caches.match(event.request)) || new Response('Unavailable offline', {status:503})));
});
