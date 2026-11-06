const CACHE = 'minecraft-seed-explorer-v23-southern-native-coverage';
const PREFIX = 'minecraft-seed-explorer-';
const DATA_CACHE = 'minecraft-seed-explorer-checked-data-v1';
const ASSETS = ['./', './index.html', './world-data.mjs', './biome-destinations.mjs', './checked-tiles.mjs', './checked-network.mjs', './raster-overview.mjs', './data/overview/index.json', './data/checked-tiles.json', './map-gestures.mjs', './structure-search.mjs', './manifest.webmanifest', './DATA_FORMAT.md', './data/bedrock-26.60-checked-area.json', './data/bedrock-26.60-wide-area.json', './data/bedrock-26.60-cherry-grove.json'];
const scope = new URL('./', self.registration.scope);
function mapAsset(request) {
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return null;
  const path = url.pathname.slice(scope.pathname.length);
  if (/^data\/tiles\/[\w-]+\.json$/.test(path)) return 'tile';
  if (/^data\/overview\/-?\d+_-?\d+_-?\d+-[0-9a-f]{16}\.png$/.test(path)) return 'immutable';
  return null;
}
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const data = await caches.open(DATA_CACHE);
    const obsolete = (await caches.keys()).filter(key => key.startsWith(PREFIX) && key !== CACHE && key !== DATA_CACHE);
    // Migrate downloaded map assets before deleting an old application shell.
    // Failure leaves the old cache intact so a later activation can recover it.
    for (const name of obsolete) {
      const old = await caches.open(name);
      for (const request of await old.keys()) {
        if (!mapAsset(request) || await data.match(request)) continue;
        const response = await old.match(request);
        if (response?.ok) await data.put(request, response);
      }
      await caches.delete(name);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  const kind = mapAsset(request), writes = [];
  const response = (async () => {
    // Storage may be unavailable or full on a device; online loading still works.
    const cache = await caches.open(kind ? DATA_CACHE : CACHE).catch(() => null);
    const cached = await cache?.match(request).catch(() => null);
    // Only revision-named PNGs are immutable. Native JSON and metadata revalidate
    // online so a corrected observation or new catalog is not hidden by storage.
    if (kind === 'immutable' && cached) return cached;
    try {
      const result = await fetch(request);
      if (result.ok && cache) writes.push(cache.put(request, result.clone()).catch(() => {}));
      return result.ok ? result : cached || result;
    } catch {
      return cached || new Response('Unavailable offline', {status:503});
    }
  })();
  event.respondWith(response);
  // Register lifetime work synchronously, including writes discovered after fetch.
  event.waitUntil(response.then(() => Promise.all(writes)).catch(() => {}));
});
