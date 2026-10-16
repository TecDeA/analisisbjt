const VERSION = '1.3'; // Sube esta cifra en cada actualización; el chip de index.html la muestra automáticamente
const CACHE_NAME = 'bjt-analyzer-v' + VERSION;
const urlsToCache = [
  '.',
  'index.html',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Iconos/favicon y manifest: caché opcional para que si falta alguno no rompa la instalación
const iconosOpcionales = [
  'manifest.json',
  'favicon.svg',
  'favicon.ico',
  'favicon-32.png',
  'favicon-16.png',
  'apple-touch-icon.png'
];

// Instalación: cachea los recursos esenciales
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache)
          .then(() => Promise.allSettled(iconosOpcionales.map(url => cache.add(url))));
      })
  );
});

// Activación: limpia caches antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Chip de versión: responde a la página con la versión actual
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'GET_VERSION') {
    event.source.postMessage({ type: 'SW_VERSION', version: VERSION });
  }
});

// Intercepta las peticiones
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si está en cache, devuelve la copia
        if (response) {
          return response;
        }

        // Si no, busca en la red
        return fetch(event.request).then(
          networkResponse => {
            // Comprueba si la respuesta es válida
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clona la respuesta y la guarda en cache
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        );
      })
  );
});