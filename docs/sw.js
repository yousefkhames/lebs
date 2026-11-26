/* Offline cache. Bump VERSION when files change. */
const VERSION = 'lebs-v1';
const FILES = ['./', 'index.html', 'lebs.config.js', 'css/style.css', 'js/lib.js', 'js/i18n.js', 'js/art.js', 'js/app.js', 'assets/logo.svg', 'assets/icon-192.png', 'assets/icon-512.png', 'manifest.webmanifest', 'fonts/ibm-plex-sans-latin-400-normal.woff2', 'fonts/ibm-plex-sans-latin-600-normal.woff2', 'fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2', 'fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2', 'fonts/fraunces-latin-400-normal.woff2', 'fonts/fraunces-latin-600-normal.woff2', 'fonts/fraunces-latin-600-italic.woff2', 'fonts/reem-kufi-arabic-500-normal.woff2', 'fonts/reem-kufi-arabic-700-normal.woff2'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then((r) => {
      if (r.ok) { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); }
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((m) => m || caches.match('index.html')))
  );
});
