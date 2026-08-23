/* Minimal service worker — makes ResQra installable (PWA).
   Passthrough for API calls; navigation falls back to a plain message
   when offline. Real offline caching is a post-V1 polish item. */
self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(
        () =>
          new Response(
            '<!doctype html><meta charset="utf-8"><title>ResQra — offline</title><body style="font-family:system-ui;padding:2rem;text-align:center"><h1 style="color:#0284c7">ResQra</h1><p>You are offline. Your request status will refresh once the network returns.</p></body>',
            { status: 503, headers: { 'Content-Type': 'text/html' } }
          )
      )
    )
  }
})
