const CACHE = 'wingman-v1';
const SHELL = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Never cache: API calls, external services
  const url = e.request.url;
  if (url.includes('anthropic.com') || url.includes('stripe.com') ||
      url.includes('firebaseapp.com') || url.includes('googleapis.com') ||
      url.includes('cloudfunctions.net') || url.includes('gstatic.com')) return;

  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res.status === 200 && res.type === 'basic') {
        caches.open(CACHE).then(c => c.put(e.request, res.clone()));
      }
      return res;
    }))
  );
});
