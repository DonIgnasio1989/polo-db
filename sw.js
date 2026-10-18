/* ============================================================
   База Мастера — Service Worker (оффлайн-режим)
   Стратегии:
   · навигация      → сеть, оффлайн-фолбэк: кэш index.html;
   · data/*.json    → network-first + кэш (оффлайн отдаёт последнюю копию);
   · css/js/прочее  → cache-first + фоновое обновление (новые ?v= сами берутся из сети).
   Кэш один: bm-cache-v2; устаревшие версии удаляются при activate.
   ============================================================ */
const CACHE = 'bm-cache-v2';
const SHELL = ['./', './index.html', './css/app.css', './data/update.json'];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE)
            .then(c => c.addAll(SHELL).catch(() => { }))   // частичный успех не ломает install
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys()
            .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET') return;
    const u = new URL(req.url);
    if (u.origin !== self.location.origin) return;

    /* Навигация: сеть → кэш (оффлайн открывает последний index.html) */
    if (req.mode === 'navigate') {
        e.respondWith(
            fetch(req).then(r => {
                const cp = r.clone();
                caches.open(CACHE).then(c => c.put('./index.html', cp));
                return r;
            }).catch(() => caches.match('./index.html'))
        );
        return;
    }

    /* Данные: network-first, чтобы не тормозить обновления базы */
    if (u.pathname.includes('/data/')) {
        e.respondWith(
            fetch(req).then(r => {
                if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
                return r;
            }).catch(() => caches.match(req))
        );
        return;
    }

    /* Оболочка и прочее: cache-first + фоновое обновление */
    e.respondWith(
        caches.match(req).then(m => {
            const fres = fetch(req).then(r => {
                if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
                return r;
            }).catch(() => m);
            return m || fres;
        })
    );
});
