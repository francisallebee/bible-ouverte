// Service worker de Bible Ouverte.
//
// La version précédente préchargeait "/offline", une URL qui n'existe pas — le
// fichier est servi sur /offline.html. cache.addAll rejette dès qu'une seule
// URL répond 404, l'installation échouait donc systématiquement et aucun
// service worker n'était jamais actif : l'application n'avait pas de mode hors
// ligne, alors que c'est son premier principe.

const CACHE = "bible-ouverte-v2";
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = ["/", OFFLINE_URL];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // addAll est tout ou rien : une URL momentanément indisponible
      // empêcherait l'installation. On précharge donc une URL à la fois.
      .then((cache) =>
        Promise.all(
          PRECACHE_URLS.map((url) =>
            cache.add(url).catch(() => {
              /* sera mis en cache à la première visite */
            })
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

function isCacheable(request) {
  if (request.method !== "GET") return false;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;

  // Les réponses de l'API sont propres à un utilisateur connecté. Les garder
  // dans un cache partagé, jamais vidé à la déconnexion, exposerait les données
  // d'un compte au suivant sur le même appareil.
  if (url.pathname.startsWith("/api/")) return false;
  if (url.pathname.startsWith("/auth/")) return false;

  return true;
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;

    if (request.mode === "navigate") {
      const offline = await caches.match(OFFLINE_URL);
      if (offline) return offline;
    }
    throw err;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (!isCacheable(request)) return;

  // Les assets de build portent un hash dans leur nom : leur contenu ne change
  // jamais, inutile de repasser par le réseau.
  const url = new URL(request.url);
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(networkFirst(request));
});
