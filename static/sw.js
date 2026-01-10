const CACHE_NAME = 'cinelyon-v1';
const STATIC_ASSETS = [
    '/',
    '/static/css/main.css',
    '/static/images/nocontent.png',
    '/static/images/background.svg'
];

// Installation: mise en cache des assets statiques
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Cache ouvert');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activation: nettoyage des anciens caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Suppression ancien cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: stratégie Network First avec fallback sur le cache
self.addEventListener('fetch', (event) => {
    // Ignorer les requêtes non-GET
    if (event.request.method !== 'GET') return;

    // Ignorer les requêtes vers des domaines externes (sauf les images d'affiches)
    const url = new URL(event.request.url);
    const isExternal = url.origin !== location.origin;
    const isPosterImage = event.request.url.includes('allocine.fr') ||
        event.request.url.includes('wsrv.nl');

    if (isExternal && !isPosterImage) return;

    event.respondWith(
        // Essayer d'abord le réseau
        fetch(event.request)
            .then((response) => {
                // Cloner la réponse pour la mettre en cache
                const responseClone = response.clone();

                // Ne mettre en cache que les réponses valides
                if (response.status === 200) {
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }

                return response;
            })
            .catch(() => {
                // Si le réseau échoue, essayer le cache
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    // Pour les pages HTML, retourner la page principale en cache
                    if (event.request.headers.get('accept').includes('text/html')) {
                        return caches.match('/');
                    }

                    return new Response('Contenu non disponible hors ligne', {
                        status: 503,
                        statusText: 'Service Unavailable'
                    });
                });
            })
    );
});
