// Service worker mínimo: permite instalar la app. No guarda nada en caché;
// los datos siempre vienen de tu Google Drive.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
