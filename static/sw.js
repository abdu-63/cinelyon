// ⚠️ Pour invalider le cache sur tous les appareils, modifiez ce numéro de version.
// Il suffit d'incrémenter CACHE_VERSION à chaque déploiement majeur.
const CACHE_VERSION = 'v9';
const CACHE_NAME = `cinelyon-${CACHE_VERSION}`;

// Assets statiques mis en cache à l'installation (ne changent pas souvent)
const STATIC_ASSETS = [
    '/static/css/main.css',
    '/static/js/film.js',
    '/static/js/index.js',
    '/static/images/nocontent.png',
    '/static/images/background.svg',
];

// Installation: mise en cache des assets statiques uniquement
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Cache SW ouvert:', CACHE_NAME);
                return cache.addAll(STATIC_ASSETS);
            })
            // On ne fait plus de self.skipWaiting() ici pour laisser la bannière s'afficher
    );
});

// Activation: supprimer tous les anciens caches
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
        // Prendre le contrôle des clients existants immédiatement
        }).then(() => self.clients.claim())
    );
});

// Fetch: stratégies différenciées selon le type de ressource
self.addEventListener('fetch', (event) => {
    // Ignorer les requêtes non-GET
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);
    const isExternal = url.origin !== location.origin;

    // Ignorer les requêtes vers des domaines externes (Supabase, analytics, etc.)
    // sauf les images d'affiches (allocine, wsrv)
    const isPosterImage = url.hostname.includes('allocine.fr') ||
        url.hostname.includes('wsrv.nl') ||
        url.hostname.includes('acsta.net') ||
        url.hostname.includes('image.tmdb.org');

    if (isExternal && !isPosterImage) return;

    // Ignorer sw.js et manifest.json : ils doivent toujours être récupérés depuis le réseau
    if (url.pathname === '/static/sw.js' || url.pathname === '/static/manifest.json') return;

    const isHTMLPage = event.request.headers.get('accept')?.includes('text/html');
    const isStaticAsset = url.pathname.startsWith('/static/');

    if (isStaticAsset) {
        // Stratégie Cache First pour les assets statiques (CSS, JS, images)
        // Ils ont un cache-control long côté serveur + hash mtime dans l'URL
        event.respondWith(
            caches.match(event.request).then((cached) => {
                if (cached) return cached;
                return fetch(event.request).then((response) => {
                    if (response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    }
                    return response;
                });
            })
        );
    } else if (isHTMLPage) {
        // Stratégie Network First pour les pages HTML (données toujours fraîches)
        // Pas de mise en cache des pages HTML : elles sont dynamiques (séances du jour)
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    // Hors ligne : retourner la page principale depuis le cache si dispo
                    return caches.match('/') || new Response(
                        '<h1>Hors ligne</h1><p>Connectez-vous pour voir les séances.</p>',
                        { status: 503, headers: { 'Content-Type': 'text/html' } }
                    );
                })
        );
    } else {
        // Stratégie Network First pour tout le reste
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    }
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
    }
});
