// Rutina Gym: permite abrir la app sin internet.
// - La app (HTML, iconos): primero intenta la red para traer la versión nueva; si no hay internet, usa la copia guardada.
// - Fotos de ejercicios y tipografías: se guardan la primera vez y luego se leen del teléfono.
// - Google (inicio de sesión y Drive): nunca se guarda, siempre va directo.
const APP = "rg-app-v10", IMGS = "rg-img-v1";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "logo.png", "fb.js"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(APP).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k.startsWith("rg-app-") && k !== APP).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

function networkFirst(req) {
  return new Promise((resolve) => {
    let done = false;
    const fromCache = () => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match("index.html"));
    const timer = setTimeout(() => { fromCache().then((r) => { if (r && !done) { done = true; resolve(r); } }); }, 4000);
    fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(APP).then((c) => c.put(req, copy)); }
      clearTimeout(timer); if (!done) { done = true; resolve(res); }
    }).catch(() => { clearTimeout(timer); fromCache().then((r) => { if (!done) { done = true; resolve(r || Response.error()); } }); });
  });
}
function cacheFirst(req) {
  return caches.open(IMGS).then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok || res.type === "opaque") c.put(req, res.clone());
    return res;
  })));
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) { e.respondWith(networkFirst(req)); return; }
  if (url.hostname === "raw.githubusercontent.com" || url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(cacheFirst(req)); return;
  }
  // accounts.google.com y googleapis.com: sin intervenir
});
