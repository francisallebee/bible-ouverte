// Service worker de Bible Ouverte.
//
// La version précédente préchargeait "/offline", une URL qui n'existe pas — le
// fichier est servi sur /offline.html. cache.addAll rejette dès qu'une seule
// URL répond 404, l'installation échouait donc systématiquement et aucun
// service worker n'était jamais actif : l'application n'avait pas de mode hors
// ligne, alors que c'est son premier principe.

const CACHE = "bible-ouverte-v3";
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

  // Les traductions pèsent près de 7 Mo pièce. Elles ne sont téléchargées
  // qu'une fois, à l'import, puis vivent dans IndexedDB : les dupliquer dans le
  // Cache Storage remplirait le quota du navigateur pour rien.
  if (url.pathname.startsWith("/bibles/")) return false;

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

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

const NOTIFICATION_DEFAULTS = {
  title: "Bible Ouverte",
  body: "",
  url: "/new-reading",
};

// Le service de push peut livrer un message sans corps, ou avec un corps qui
// n'est pas du JSON. Une exception dans le gestionnaire "push" ferait taire la
// notification entière : mieux vaut un message générique qu'aucun message.
function readPayload(event) {
  if (!event.data) return { ...NOTIFICATION_DEFAULTS };
  try {
    const data = event.data.json();
    return {
      title: data.title || NOTIFICATION_DEFAULTS.title,
      body: data.body || NOTIFICATION_DEFAULTS.body,
      url: data.url || NOTIFICATION_DEFAULTS.url,
      tag: data.tag,
      kind: data.kind,
    };
  } catch {
    return { ...NOTIFICATION_DEFAULTS, body: event.data.text() };
  }
}

self.addEventListener("push", (event) => {
  const payload = readPayload(event);

  // waitUntil est obligatoire : sans lui le navigateur peut arrêter le service
  // worker avant que la notification soit affichée. Sur certains systèmes, une
  // notification promise et non tenue coupe le droit d'en envoyer d'autres.
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      // Deux notifications de même motif se remplacent au lieu de s'empiler :
      // un plan en retard n'a pas à occuper cinq lignes du centre de
      // notifications parce que le cron est passé cinq fois.
      tag: payload.tag || payload.kind || "bible-ouverte",
      data: { url: payload.url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: "window",
        // Sans cette option, un onglet non contrôlé par ce service worker est
        // invisible : on rouvrirait une fenêtre alors que l'application est
        // déjà ouverte à côté.
        includeUncontrolled: true,
      });

      const url = new URL(target, self.location.origin);
      for (const client of clientList) {
        if (new URL(client.url).origin !== url.origin) continue;
        await client.focus();
        // `navigate` n'existe pas partout, et échoue sur un client non
        // contrôlé : le focus seul vaut mieux que rien.
        if ("navigate" in client) {
          try { await client.navigate(url.href); } catch { /* focus déjà donné */ }
        }
        return;
      }

      await self.clients.openWindow(url.href);
    })()
  );
});

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
