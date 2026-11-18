// Trotamundos: guarda el juego para abrirlo como app y jugar aunque la señal sea mala.
const V = 'tmd-__VERSION__';
const FOTOS = 'fotos-tmd';
const BASE = ['./', './index.html', './datos/banderas.json', './datos/mapa-hi.json', './manifest.webmanifest', './iconos/icono-192.png', './iconos/icono-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('tmd-') && k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;
  // fotos: no cambian nunca; se guardan la primera vez que se ven
  if (u.pathname.includes('/fotos/')) {
    e.respondWith(caches.open(FOTOS).then(c => c.match(r).then(m => m || fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; }))));
    return;
  }
  // la página: primero la red (para recibir versiones nuevas) y si no hay señal, la guardada
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put('./index.html', cp)); return res; }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { if (res.ok && u.pathname.includes('/datos/')) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; })));
});
