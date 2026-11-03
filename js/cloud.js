/* ============================================================
   VW Polo/Caddy 6N — База Мастера · cloud.js  (1.14.0)
   ------------------------------------------------------------
   Облачная синхронизация на Supabase: вход по нику + паролю,
   личные данные (гараж, ТО/пробег, журнал, список покупок,
   профиль, статусы/избранное позиций) — только у владельца;
   общие данные (правки каталога: заметки/цены/ссылки/фото,
   добавленные позиции, сервисы, схемы узлов, голоса за аналоги,
   пользовательские категории и разделы) — видны всем.

   Файл грузится ПОСЛЕ js/app.js (см. лоадер в index.html) и
   работает только если заполнен CLOUD_CONFIG ниже (или
   localStorage['vw_cloud_cfg'] = {"url":"…","anonKey":"…"}).
   Без конфигурации приложение остаётся полностью локальным —
   поведение прежнее, офлайн-режим не затрагивается.

   Схема БД и пошаговая настройка: supabase/schema.sql,
   CLOUD-SETUP.md.
   ============================================================ */

/* ══════════════ КОНФИГУРАЦИЯ ══════════════
   Впишите URL проекта и публичный anon-ключ из Supabase
   (Dashboard → Project Settings → API). Ключ anon публичный —
   безопасность обеспечивает RLS (см. schema.sql).            */
const CLOUD_CONFIG = {
    url: '',       // например: 'https://abcdefgh.supabase.co'
    anonKey: ''    // например: 'eyJhbGciOi…'
};

window.Cloud = (function () {
    'use strict';

    /* Ключ localStorage-переопределения конфига (отладка):
       localStorage.setItem('vw_cloud_cfg', JSON.stringify({url:'…',anonKey:'…'})) */
    const CFG_LS = 'vw_cloud_cfg';
    const SESS_KEY = 'bm-cloud-session';          // storageKey сессии supabase-js
    const REVKEY = 'vw_cloud_rev_v1';             // известные updated_at по личным ключам
    const SRVPK = 'vw_cloud_srvpk_v1';            // ключи серверного каталога + pristine-поля
    const SRVSIDS = 'vw_cloud_srvsids_v1';        // id серверных разделов (data/sections.json)
    const SRVW = 'vw_cloud_srvw_v1';              // id серверных сервисов (data/workshops.json)
    const PO_HASH = 'vw_cloud_po_hash_v1';        // хэши отправленных part_overrides
    const PC_HASH = 'vw_cloud_pc_hash_v1';        // хэши отправленных parts_custom
    const MYCUSTOM = 'vw_cloud_mycustom_v1';      // id моих добавленных позиций
    const OTHERSPC = 'vw_cloud_otherspc_v1';      // id ЧУЖИХ добавленных позиций (не пушим)
    const MYW = 'vw_cloud_myw_v1';                // id моих добавленных сервисов
    const OTHERSW = 'vw_cloud_othersw_v1';        // id чужих сервисов (не пушим)
    const MYVOTES = 'vw_cloud_myvotes_v1';        // мои голоса (ключи)
    const LASTSYNC = 'vw_cloud_lastsync_v1';
    const BUCKET = 'bm-photos';

    /* ── Состояние ─────────────────────────────────────── */
    let sb = null;                 // supabase-клиент
    let sbLoading = null;
    let authed = false;
    let myId = '';
    let myNick = '';
    let state = 'off';             // off | anon | dirty | sync | ok | err
    let booted = false;            // afterBoot уже вызван
    let late = false;              // приложение уже отрисовано до нас — нужен ручной ререндер
    let applying = false;          // гасим markDirty во время применения серверных данных
    let channel = null;
    const dirty = new Set();       // виды данных с несохранёнными на сервер изменениями
    let rev = {};                  // {kind: server updated_at}
    let pushT = null, remoteT = null;

    /* ── Мелкие утилиты ────────────────────────────────── */
    const $id = id => document.getElementById(id);
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }
    function toast(m, k) { try { if (typeof window.toast === 'function') window.toast(m, k); else console.log('[cloud]', m); } catch (e) { } }
    function call(name, ...a) { try { const f = window[name]; if (typeof f === 'function') return f.apply(null, a); } catch (e) { console.warn('[cloud] ' + name, e); } return undefined; }
    function lsGet(k, def) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? def : v; } catch (e) { return def; } }
    function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
    function hashStr(s) { let x = 5381, i = s.length; while (i) { x = (x * 33) ^ s.charCodeAt(--i); } return (x >>> 0).toString(36); }
    const nowIso = () => new Date().toISOString();
    /* Устойчивый ключ позиции (как pickKeyOf в app.js) */
    const pickKey = p => (String(p.oem || '').toLowerCase() + '|' + String(p.name || '').toLowerCase());
    const isDataUrl = s => typeof s === 'string' && s.indexOf('data:image/') === 0;

    /* Доступность глобальных переменных app.js (let/const верхнего уровня
       классического скрипта видны другим скриптам как «голые» идентификаторы). */
    function appReady() {
        try {
            return typeof G !== 'undefined' && typeof D !== 'undefined' && typeof W !== 'undefined'
                && typeof LOG !== 'undefined' && typeof TO_ALL !== 'undefined'
                && typeof SHOP_ALL !== 'undefined' && typeof USER !== 'undefined'
                && typeof CUSTOM !== 'undefined' && typeof SV !== 'undefined';
        } catch (e) { return false; }
    }
    /* Публичный read-only режим определяем по классу body (pubMode в app.js
       объявлена как const и на window не висит) */
    function pubMode() {
        try { return document.body && document.body.classList.contains('pub'); } catch (e) { return false; }
    }

    /* ── Конфигурация ──────────────────────────────────── */
    function cfg() {
        let c = { url: String(CLOUD_CONFIG.url || ''), anonKey: String(CLOUD_CONFIG.anonKey || '') };
        const o = lsGet(CFG_LS, null);
        if (o && o.url && o.anonKey) c = { url: String(o.url), anonKey: String(o.anonKey) };
        return c;
    }
    const configured = () => { const c = cfg(); return !!(c.url && c.anonKey); };

    /* ── Ленивая загрузка supabase-js (218 КБ — анонимам не грузим) ── */
    function ensureClient() {
        if (sb) return Promise.resolve(sb);
        if (sbLoading) return sbLoading;
        const c = cfg();
        sbLoading = new Promise((res, rej) => {
            const boot = () => {
                try {
                    sb = window.supabase.createClient(c.url, c.anonKey, {
                        auth: { persistSession: true, autoRefreshToken: true, storageKey: SESS_KEY }
                    });
                    res(sb);
                } catch (e) { rej(e); }
            };
            if (window.supabase && window.supabase.createClient) { boot(); return; }
            const s = document.createElement('script');
            s.src = 'js/supabase.js' + ((typeof APP_VERSION !== 'undefined' && APP_VERSION) ? '?v=' + APP_VERSION : '');
            s.onload = boot;
            s.onerror = () => rej(new Error('js/supabase.js не загрузился'));
            document.head.appendChild(s);
        });
        return sbLoading;
    }
    function sessionHint() {
        /* Есть ли след сохранённой сессии — чтобы не грузить supabase-js зря */
        try { return !!localStorage.getItem(SESS_KEY); } catch (e) { return false; }
    }

    /* ── Ник → псевдо-email (вход без почты) ───────────── */
    const NICK_RE = /^[a-z0-9_.\-]{3,24}$/;
    const nickEmail = n => String(n || '').trim().toLowerCase() + '@users.baza-mastera.app';
    function validNick(n) { return NICK_RE.test(String(n || '').trim().toLowerCase()); }
    function mapAuthErr(err) {
        const m = String((err && err.message) || err || '');
        if (/invalid login credentials/i.test(m)) return 'Неверный ник или пароль';
        if (/already registered/i.test(m)) return 'Такой ник уже занят — выберите другой';
        if (/password.*at least|at least.*password/i.test(m)) return 'Пароль должен быть не короче 6 символов';
        if (/email rate limit/i.test(m)) return 'Слишком много попыток — повторите через минуту';
        if (/invalid email/i.test(m)) return 'Ник должен содержать только латинские буквы, цифры, _ . - (3–24 символа)';
        return m || 'Ошибка авторизации';
    }

    /* ═══════════════ СТАТУС / ИНДИКАТОР ═══════════════ */
    const STATE_TITLE = {
        off: '☁️ Облако не подключено (не заполнен CLOUD_CONFIG в js/cloud.js)',
        anon: '☁️ Войдите, чтобы синхронизировать данные между устройствами',
        dirty: '☁️ Есть несохранённые на сервере изменения…',
        sync: '☁️ Синхронизация…',
        ok: '☁️ Синхронизировано',
        err: '☁️ Ошибка синхронизации — нажмите, чтобы повторить'
    };
    function setStatus(s) {
        state = s;
        const dot = $id('cloudDot'), chip = $id('cloudChip');
        if (dot) dot.className = 'cdot ' + (s === 'dirty' ? 'dirty' : s);
        if (chip) {
            let t = STATE_TITLE[s] || s;
            if (authed && myNick) t = '☁️ ' + myNick + ' · ' + t.replace(/^☁️ /, '');
            chip.title = t;
        }
        const st = $id('cloud_status_line');
        if (st) st.innerHTML = statusHtml();
    }
    function statusHtml() {
        const last = lsGet(LASTSYNC, '');
        const when = last ? new Date(last).toLocaleString('ru-RU') : 'ещё не было';
        if (!configured()) return '<span class="cl-st off">Облако не подключено</span>';
        if (!authed) return '<span class="cl-st anon">Не выполнен вход</span>';
        const cls = { sync: 'sync', ok: 'ok', dirty: 'dirty', err: 'err' }[state] || 'off';
        const txt = { sync: 'Синхронизация…', ok: 'Всё сохранено на сервере', dirty: 'Есть локальные изменения — отправляем…', err: 'Ошибка соединения' }[state] || state;
        return '<span class="cl-st ' + cls + '">' + esc(txt) + '</span><span class="cl-when">Последняя синхронизация: ' + esc(when) + '</span>';
    }

    /* ═══════════════ markDirty — хук из app.js ═══════════════ */
    const KNOWN_KINDS = { garage: 1, to: 1, logs: 1, shop: 1, profile: 1, pflags: 1, parts: 1, workshops: 1, schemes: 1, votes: 1, meta: 1 };
    function markDirty(kind) {
        if (applying || !KNOWN_KINDS[kind] || !configured() || !authed) return;
        dirty.add(kind);
        if (kind === 'parts') dirty.add('pflags');   // статусы/избранное позиций — личные
        if (state !== 'sync') setStatus('dirty');
        schedulePush();
    }
    function schedulePush(delay) {
        clearTimeout(pushT);
        pushT = setTimeout(() => { pushAll().catch(e => { console.warn('[cloud] push', e); setStatus('err'); }); }, delay || 1200);
    }

    /* ═══════════════ ЛИЧНЫЕ ДАННЫЕ (user_data KV) ═══════════════
       Ключи: garage, to, logs, shop, profile, pflags.
       rev[kind] — updated_at, который мы последний раз видели на сервере.
       Правило LWW: сервер новее rev и локально не грязно → принимаем сервер;
       локально грязно → после мержа отправляем.                    */

    function currentPayload(kind) {
        if (!appReady()) return null;
        switch (kind) {
            case 'garage': return G;
            case 'to': return TO_ALL;
            case 'logs': return LOG;
            case 'shop': return SHOP_ALL;
            case 'profile': return USER;
            case 'pflags': return computePflags();
            default: return null;
        }
    }
    function computePflags() {
        const out = {};
        for (const p of D) {
            if (p && (p.status || p.favorite)) out[pickKey(p)] = { s: p.status || '', f: p.favorite ? 1 : 0 };
        }
        return out;
    }

    async function pushPrivateKind(kind) {
        const data = currentPayload(kind);
        if (data == null) { dirty.delete(kind); return; }
        const row = { user_id: myId, key: kind, data: data, updated_at: nowIso() };
        const { data: res, error } = await sb.from('user_data').upsert(row, { onConflict: 'user_id,key' }).select('updated_at');
        if (error) throw error;
        if (res && res[0]) { rev[kind] = res[0].updated_at; lsSet(REVKEY, rev); }
        dirty.delete(kind);
        if (kind === 'profile') {
            /* Дублируем основные поля в profiles (ник виден сообществу) */
            try {
                await sb.from('profiles').upsert({
                    id: myId, nick: myNick, display_name: USER.name || myNick,
                    city: USER.city || '', color: USER.color || '#00b0f0', initials: USER.initials || ''
                }, { onConflict: 'id' });
            } catch (e) { }
        }
    }

    async function pullPrivate() {
        const { data: rows, error } = await sb.from('user_data').select('key,data,updated_at').eq('user_id', myId);
        if (error) throw error;
        const srv = {}; (rows || []).forEach(r => { srv[r.key] = r; });
        if (!appReady()) return;

        for (const kind of ['garage', 'to', 'logs', 'shop', 'profile', 'pflags']) {
            const r = srv[kind];
            if (!r) continue;
            const serverNewer = !rev[kind] || String(r.updated_at) > String(rev[kind]);
            const localDirty = dirty.has(kind);
            if (!serverNewer && !localDirty) continue;
            const merged = mergePrivate(kind, currentPayload(kind), r.data, serverNewer, localDirty);
            applyPrivateKind(kind, merged, serverNewer && !localDirty);
            rev[kind] = r.updated_at;
        }
        lsSet(REVKEY, rev);
    }

    /* Чистые функции слияния (покрыты тестами test/cloud.test.js) */
    function mergePrivate(kind, local, server, serverNewer, localDirty) {
        if (serverNewer && !localDirty) return server;           // сервер свежее — принимаем целиком
        if (!serverNewer && localDirty) return local;            // меняли только локально
        if (!serverNewer && !localDirty) return local;
        // Оба изменились — аккуратный мерж
        switch (kind) {
            case 'garage': return mergeGarage(local, server);
            case 'to': return mergeTo(local, server);
            case 'logs': return mergeLogs(local, server);
            case 'shop': return mergeShop(local, server);
            case 'pflags': return Object.assign({}, server, local);   // локальный приоритет
            case 'profile': return Object.assign({}, server, local);
            default: return local;
        }
    }
    function mergeGarage(local, server) {
        const L = Array.isArray(local) ? local : [], S = Array.isArray(server) ? server : [];
        const byId = new Map();
        for (const c of S) if (c && c.id) byId.set(c.id, c);
        for (const c of L) if (c && c.id) byId.set(c.id, c);     // локальный приоритет по конфликтам
        return Array.from(byId.values());
    }
    function mergeTo(local, server) {
        const out = Object.assign({}, server || {});
        for (const k of Object.keys(local || {})) {
            const l = local[k], s = out[k];
            if (!s) { out[k] = l; continue; }
            const score = t => (Number(t && t.km) || 0) + (t && t.lastDate ? new Date(t.lastDate).getTime() / 1e9 : 0);
            out[k] = score(l) >= score(s) ? l : s;
        }
        return out;
    }
    function mergeLogs(local, server) {
        const L = Array.isArray(local) ? local : [], S = Array.isArray(server) ? server : [];
        const byId = new Map();
        for (const e of S) if (e && e.id) byId.set(e.id, e);
        for (const e of L) if (e && e.id) byId.set(e.id, e);
        return Array.from(byId.values()).sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
    }
    function mergeShop(local, server) {
        const out = {};
        const keys = new Set(Object.keys(local || {}).concat(Object.keys(server || {})));
        for (const k of keys) {
            const a = Array.isArray((local || {})[k]) ? local[k] : [];
            const b = Array.isArray((server || {})[k]) ? server[k] : [];
            const u = Array.from(new Set(a.concat(b)));
            if (u.length) out[k] = u;
        }
        return out;
    }

    function applyPrivateKind(kind, data, replaceAll) {
        applying = true;
        try {
            switch (kind) {
                case 'garage':
                    G = Array.isArray(data) ? data : [];
                    if (SV.activeVinId && !G.some(g => g.id === SV.activeVinId)) SV.activeVinId = null;
                    try { localStorage.setItem(GK, JSON.stringify(G)); } catch (e) { }
                    break;
                case 'to':
                    TO_ALL = (data && typeof data === 'object') ? data : {};
                    call('_toPersist'); toSyncSafe();
                    break;
                case 'logs':
                    LOG = Array.isArray(data) ? data : [];
                    saveLogs(); call('_rebuildLogIndex');
                    break;
                case 'shop':
                    SHOP_ALL = (data && typeof data === 'object') ? data : {};
                    try { localStorage.setItem(SHPKEY, JSON.stringify({ byVin: SHOP_ALL })); } catch (e) { }
                    shopSyncSafe();
                    break;
                case 'profile':
                    if (data && typeof data === 'object') {
                        USER = Object.assign({ name: '', email: '', city: '', initials: '', color: '#00b0f0' }, data);
                        call('sProfileStorage');
                    }
                    break;
                case 'pflags':
                    /* replaceAll — когда серверная карта принята целиком:
                       снимаем флаги, которых в ней нет (иначе удалённый на
                       другом устройстве статус «воскресал» бы локально). */
                    applyPflags(data, replaceAll);
                    break;
            }
        } finally { applying = false; }
    }
    function toSyncSafe() { try { if (typeof toSync === 'function') toSync(); } catch (e) { } }
    function shopSyncSafe() { try { if (typeof shopSync === 'function') shopSync(); } catch (e) { } }
    function saveLogs() {
        /* вызывается внутри applying=true — markDirty в sLogs подавлен */
        try { if (typeof sLogs === 'function') sLogs(); } catch (e) { }
    }

    function applyPflags(map, replaceAll) {
        if (!appReady() || !map || typeof map !== 'object') return;
        for (const p of D) {
            if (!p) continue;
            const f = map[pickKey(p)];
            if (f) { p.status = f.s || ''; p.favorite = !!f.f; }
            else if (replaceAll && (p.status || p.favorite)) { p.status = ''; p.favorite = false; }
        }
        savePartsLocal();
    }
    function savePartsLocal() { try { if (typeof sD === 'function') sD(); } catch (e) { } }
    function saveWkLocal() { try { if (typeof sWk === 'function') sWk(); } catch (e) { } }

    /* ═══════════════ СЕРВЕРНЫЕ МЕТКИ КАТАЛОГА ═══════════════
       app.js сообщает нам, какие позиции/разделы/сервисы пришли из
       его справочных data-файлов — всё остальное считается
       пользовательским и синхронизируется через Supabase.        */

    function setServerParts(parts) {
        try {
            const map = {};
            for (const p of (Array.isArray(parts) ? parts : [])) {
                if (!p) continue;
                const k = pickKey(p);
                const pr = {};
                if (p.notes) pr.n = String(p.notes);
                if (p.price != null) pr.p = Number(p.price);
                if (p.currency && p.currency !== 'RUB') pr.c = String(p.currency);
                if (p.shopUrl) pr.u = String(p.shopUrl);
                map[k] = pr;
            }
            lsSet(SRVPK, map);
        } catch (e) { console.warn('[cloud] setServerParts', e); }
    }
    function noteServerSections(secs) {
        try {
            if (!secs || typeof secs !== 'object') return;
            const set = new Set(lsGet(SRVSIDS, []));
            for (const sid of Object.keys(secs)) set.add(sid);
            lsSet(SRVSIDS, Array.from(set));
        } catch (e) { }
    }
    function noteServerWorkshops(wss) {
        try {
            if (!Array.isArray(wss) || !wss.length) return;
            const ids = new Set(lsGet(SRVW, []));
            for (const w of wss) if (w && w.id) ids.add(String(w.id));
            lsSet(SRVW, Array.from(ids));
        } catch (e) { }
    }
    const serverPartMap = () => lsGet(SRVPK, {});
    const serverSids = () => new Set(lsGet(SRVSIDS, []));
    const serverWIds = () => new Set(lsGet(SRVW, []));

    /* ═══════════════ ФОТО: ЗАГРУЗКА В STORAGE ═══════════════ */
    async function uploadPhoto(dataUrl, folder) {
        const m = /^data:(image\/[a-zA-Z0-9+.]+);base64,([\s\S]+)$/.exec(dataUrl || '');
        if (!m) return null;
        const bin = atob(m[2]);
        const u8 = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        const ext = /png/i.test(m[1]) ? 'png' : /webp/i.test(m[1]) ? 'webp' : /gif/i.test(m[1]) ? 'gif' : 'jpg';
        const path = folder + '/' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8) + '.' + ext;
        const { error } = await sb.storage.from(BUCKET).upload(path, u8, { contentType: m[1], upsert: false });
        if (error) throw error;
        return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    }
    const safeFolder = s => String(s || '').replace(/[^a-zA-Z0-9_.\-]/g, '_').slice(0, 60);

    /* ═══════════════ ОБЩИЕ ДАННЫЕ: КАТАЛОГ ═══════════════ */

    function computePartsDiff() {
        /* Возвращает { customs:[parts], overrides:{key:{…}} } по текущему D.
           customs — позиции, которых нет в серверном каталоге;
           overrides — изменённые пользовательские поля серверных позиций. */
        const srv = serverPartMap();
        const customs = [], overrides = {};
        for (const p of D) {
            if (!p) continue;
            const k = pickKey(p);
            if (!(k in srv)) { customs.push(p); continue; }
            const pr = srv[k] || {};
            const o = {};
            const notes = String(p.notes || '');
            if (notes && notes !== (pr.n || '')) o.notes = notes;
            if (p.price != null && Number(p.price) !== (pr.p == null ? null : Number(pr.p))) {
                o.price = Number(p.price);
                o.currency = p.currency || 'RUB';
            } else if ((p.currency || 'RUB') !== (pr.c || 'RUB') && pr.p == null && p.price == null) { /* только валюта — не несём */ }
            const su = String(p.shopUrl || '');
            if (su && su !== (pr.u || '')) o.shopUrl = su;
            if (Array.isArray(p.priceHistory) && p.priceHistory.length) o.priceHistory = p.priceHistory.slice(-50);
            if (Array.isArray(p.photos) && p.photos.length) o.photos = p.photos.slice(0, 12);
            if (Array.isArray(p.inst) && p.inst.length) o.inst = p.inst;
            if (Object.keys(o).length) overrides[k] = o;
        }
        return { customs, overrides };
    }

    async function pushParts() {
        if (!appReady()) { dirty.delete('parts'); return; }
        /* Защита: если справочный каталог в этой сессии/LS ни разу не
           загружался полностью (нет карты серверных ключей), мы не можем
           отличить пользовательские позиции от базовых — не рискуем и
           пропускаем отправку (до первой полной загрузки data-файлов). */
        const srvMap = serverPartMap();
        if (!srvMap || !Object.keys(srvMap).length) {
            console.info('[cloud] pushParts пропущен: карта серверного каталога пуста');
            return;
        }
        const diff = computePartsDiff();

        /* 1. Фото-dataURL загружаем в Storage и заменяем прямо в D */
        let photosChanged = false;
        applying = true;
        try {
            for (const p of diff.customs) {
                if (Array.isArray(p.photos)) {
                    for (let i = 0; i < p.photos.length; i++) {
                        if (isDataUrl(p.photos[i])) {
                            try { p.photos[i] = await uploadPhoto(p.photos[i], 'parts/' + hashStr(p.id)); photosChanged = true; }
                            catch (e) { console.warn('[cloud] photo upload', e); }
                        }
                    }
                }
            }
            for (const k of Object.keys(diff.overrides)) {
                const o = diff.overrides[k];
                if (Array.isArray(o.photos)) {
                    for (let i = 0; i < o.photos.length; i++) {
                        if (isDataUrl(o.photos[i])) {
                            try { o.photos[i] = await uploadPhoto(o.photos[i], 'parts/' + hashStr(k)); photosChanged = true; }
                            catch (e) { console.warn('[cloud] photo upload', e); }
                        }
                    }
                    /* Синхронизируем URL обратно в локальную позицию */
                    const p = D.find(x => x && pickKey(x) === k);
                    if (p) p.photos = o.photos;
                }
            }
            if (photosChanged) savePartsLocal();
        } finally { applying = false; }

        /* 2. parts_custom — только изменённые (хэш-кэш).
           ВАЖНО: чужие позиции (созданные другими пользователями) не
           отправляем — их правки остаются локальными, а повторный upsert
           чужой строки заблокировал бы RLS и уронил всю отправку. */
        const pcCache = lsGet(PC_HASH, {});
        const rows = [];
        const myIds = new Set(lsGet(MYCUSTOM, []));
        const others = new Set(lsGet(OTHERSPC, []));
        for (const p of diff.customs) {
            if (others.has(p.id)) continue;
            const payload = JSON.stringify(p);
            const hh = hashStr(payload);
            if (pcCache[p.id] === hh) { myIds.add(p.id); continue; }
            rows.push({ id: p.id, data: p, created_by: myId, updated_at: nowIso() });
            pcCache[p.id] = hh; myIds.add(p.id);
        }
        if (rows.length) {
            const { error } = await sb.from('parts_custom').upsert(rows, { onConflict: 'id' });
            if (error) throw error;
            lsSet(PC_HASH, pcCache);
        }
        /* Удалённые локально мои позиции — убираем с сервера */
        const aliveIds = new Set(diff.customs.map(p => p.id));
        const gone = Array.from(myIds).filter(id => !aliveIds.has(id));
        if (gone.length) {
            try { await sb.from('parts_custom').delete().eq('created_by', myId).in('id', gone); } catch (e) { }
            gone.forEach(id => { delete pcCache[id]; myIds.delete(id); });
            lsSet(PC_HASH, pcCache);
        }
        lsSet(MYCUSTOM, Array.from(myIds));

        /* 3. part_overrides — только изменённые */
        const poCache = lsGet(PO_HASH, {});
        const orows = [];
        for (const k of Object.keys(diff.overrides)) {
            const payload = JSON.stringify(diff.overrides[k]);
            const hh = hashStr(payload);
            if (poCache[k] === hh) continue;
            orows.push({ part_key: k, data: diff.overrides[k], updated_by: myId, updated_at: nowIso() });
            poCache[k] = hh;
        }
        if (orows.length) {
            const { error } = await sb.from('part_overrides').upsert(orows, { onConflict: 'part_key' });
            if (error) throw error;
            lsSet(PO_HASH, poCache);
        }
        dirty.delete('parts');
    }

    async function pullParts() {
        if (!appReady()) return;
        const [{ data: customs, error: e1 }, { data: ovs, error: e2 }] = await Promise.all([
            sb.from('parts_custom').select('id,data,created_by,updated_at'),
            sb.from('part_overrides').select('part_key,data,updated_at')
        ]);
        if (e1) throw e1; if (e2) throw e2;
        applying = true;
        try {
            /* 1. Добавленные сообществом позиции */
            const myIds = new Set(lsGet(MYCUSTOM, []));
            const others = new Set(lsGet(OTHERSPC, []));
            const existIds = new Set(D.map(p => p && p.id));
            let added = 0;
            for (const row of (customs || [])) {
                if (row.created_by === myId) { myIds.add(row.id); others.delete(row.id); }
                else others.add(row.id);
                const np = (typeof nP === 'function') ? nP(row.data) : row.data;
                if (!np || !np.id) continue;
                const i = D.findIndex(x => x && x.id === np.id);
                if (i < 0 && !existIds.has(np.id)) { D.push(np); added++; }
                /* свою локальную копию не затираем — её отправит push */
            }
            lsSet(MYCUSTOM, Array.from(myIds));
            lsSet(OTHERSPC, Array.from(others));

            /* 2. Правки сообщества поверх каталога */
            const byKey = new Map();
            for (const p of D) if (p) { const k = pickKey(p); if (!byKey.has(k)) byKey.set(k, p); }
            for (const row of (ovs || [])) {
                const p = byKey.get(row.part_key);
                const o = row.data;
                if (!p || !o) continue;
                if (typeof o.notes === 'string') p.notes = o.notes;
                if (o.price != null) { p.price = Number(o.price); if (o.currency) p.currency = o.currency; }
                if (typeof o.shopUrl === 'string') p.shopUrl = o.shopUrl;
                if (Array.isArray(o.priceHistory) && o.priceHistory.length > (p.priceHistory || []).length) p.priceHistory = o.priceHistory;
                if (Array.isArray(o.photos) && o.photos.length) {
                    const u = Array.from(new Set((p.photos || []).concat(o.photos.filter(x => typeof x === 'string'))));
                    p.photos = u.slice(0, 12);
                }
                if (Array.isArray(o.inst) && o.inst.length) p.inst = o.inst;
            }
            if (added) console.info('[cloud] добавлено позиций сообщества: ' + added);
            savePartsLocal();
            shopSyncSafe();
            call('applyAnalogKb');
        } finally { applying = false; }
    }

    /* ═══════════════ ОБЩИЕ ДАННЫЕ: СЕРВИСЫ (мастерские) ═══════════════ */
    async function pushWorkshops() {
        if (!appReady()) { dirty.delete('workshops'); return; }
        const srvIds = serverWIds();
        const othersW = new Set(lsGet(OTHERSW, []));
        const customs = W.filter(w => w && w.id && !srvIds.has(String(w.id)) && !othersW.has(String(w.id)));
        const cache = lsGet(PC_HASH + 'w', {});
        const myIds = new Set(lsGet(MYW, []));
        const rows = [];
        for (const w of customs) {
            const payload = JSON.stringify(w);
            const hh = hashStr(payload);
            if (cache[w.id] === hh) { myIds.add(w.id); continue; }
            rows.push({ id: w.id, data: w, created_by: myId, updated_at: nowIso() });
            cache[w.id] = hh; myIds.add(w.id);
        }
        if (rows.length) {
            const { error } = await sb.from('workshops_custom').upsert(rows, { onConflict: 'id' });
            if (error) throw error;
        }
        const alive = new Set(customs.map(w => w.id));
        const gone = Array.from(myIds).filter(id => !alive.has(id));
        if (gone.length) {
            try { await sb.from('workshops_custom').delete().eq('created_by', myId).in('id', gone); } catch (e) { }
            gone.forEach(id => { delete cache[id]; myIds.delete(id); });
        }
        lsSet(PC_HASH + 'w', cache);
        lsSet(MYW, Array.from(myIds));
        dirty.delete('workshops');
    }
    async function pullWorkshops() {
        if (!appReady()) return;
        const { data: rows, error } = await sb.from('workshops_custom').select('id,data,created_by');
        if (error) throw error;
        applying = true;
        try {
            const myIds = new Set(lsGet(MYW, []));
            const othersW = new Set(lsGet(OTHERSW, []));
            const ids = new Set(W.map(w => w && w.id));
            const names = new Set(W.map(w => String((w && w.name) || '').toLowerCase()));
            let added = 0;
            for (const r of (rows || [])) {
                if (r.created_by === myId) { myIds.add(r.id); othersW.delete(r.id); }
                else othersW.add(String(r.id));
                let w = r.data;
                try { w = (typeof nW === 'function') ? nW(w) : w; } catch (e) { }
                if (!w || !w.id) continue;
                if (!ids.has(w.id) && !names.has(String(w.name || '').toLowerCase())) {
                    W.push(w); ids.add(w.id); names.add(String(w.name || '').toLowerCase()); added++;
                }
            }
            lsSet(MYW, Array.from(myIds));
            lsSet(OTHERSW, Array.from(othersW));
            if (added) saveWkLocal();
        } finally { applying = false; }
    }

    /* ═══════════════ ОБЩИЕ ДАННЫЕ: СХЕМЫ УЗЛОВ (фото+маркеры) ═══════════════ */
    async function pushSchemes() {
        if (!appReady() || typeof schAll !== 'function') { dirty.delete('schemes'); return; }
        const local = schAll() || {};
        const keys = Object.keys(local);
        if (!keys.length) { dirty.delete('schemes'); return; }
        const { data: rows, error } = await sb.from('schemes').select('key,marks,photos');
        if (error) throw error;
        const srv = {};
        for (const r of (rows || [])) srv[r.key] = { photos: (r.photos || []).map(x => typeof x === 'string' ? x : (x && x.u) || ''), marks: r.marks || [] };

        applying = true;
        let localChanged = false;
        try {
            const upserts = [];
            for (const k of keys) {
                const entry = local[k] || { photos: [], marks: [] };
                /* dataURL-фото → Storage, локально заменяем на URL */
                for (let i = 0; i < (entry.photos || []).length; i++) {
                    if (isDataUrl(entry.photos[i])) {
                        try {
                            entry.photos[i] = await uploadPhoto(entry.photos[i], 'sch/' + hashStr(k));
                            localChanged = true;
                        } catch (e) { console.warn('[cloud] scheme photo', e); }
                    }
                }
                const base = srv[k] || { photos: [], marks: [] };
                const merged = (typeof mergeSchemes === 'function')
                    ? mergeSchemes({ [k]: base }, { [k]: entry })[k]
                    : entry;
                if (JSON.stringify({ p: base.photos, m: base.marks }) !== JSON.stringify({ p: merged.photos, m: merged.marks })) {
                    upserts.push({ key: k, marks: merged.marks || [], photos: merged.photos || [], updated_by: myId, updated_at: nowIso() });
                    local[k] = merged;
                    localChanged = true;
                }
            }
            if (localChanged && typeof schSetAll === 'function') schSetAll(local);
            if (upserts.length) {
                const { error: e2 } = await sb.from('schemes').upsert(upserts, { onConflict: 'key' });
                if (e2) throw e2;
            }
        } finally { applying = false; }
        dirty.delete('schemes');
    }
    async function pullSchemes() {
        if (!appReady() || typeof schAll !== 'function') return;
        const { data: rows, error } = await sb.from('schemes').select('key,marks,photos');
        if (error) throw error;
        if (!rows || !rows.length) return;
        const srv = {};
        for (const r of rows) srv[r.key] = { photos: (r.photos || []).map(x => typeof x === 'string' ? x : (x && x.u) || ''), marks: r.marks || [] };
        applying = true;
        try {
            const merged = (typeof mergeSchemes === 'function') ? mergeSchemes(schAll() || {}, srv) : srv;
            if (typeof schSetAll === 'function') schSetAll(merged);
            /* Если открыта модалка схемы — обновим её */
            if (window._sch && window._sch.key && typeof schGet === 'function' && typeof renderSch === 'function') {
                window._sch.data = schGet(window._sch.key);
                call('renderSch');
            }
        } finally { applying = false; }
    }

    /* ═══════════════ ОБЩИЕ ДАННЫЕ: ГОЛОСА ЗА АНАЛОГИ ═══════════════ */
    async function pushVotes() {
        if (!appReady() || typeof votesAll !== 'function') { dirty.delete('votes'); return; }
        const all = votesAll() || {};
        const myPrev = new Set(lsGet(MYVOTES, []));
        const upserts = [];
        const myNow = [];
        for (const k of Object.keys(all)) {
            const my = all[k] && all[k].my;
            if (my === 'ok' || my === 'bad') { upserts.push({ user_id: myId, vote_key: k, value: my, updated_at: nowIso() }); myNow.push(k); }
        }
        if (upserts.length) {
            const { error } = await sb.from('votes').upsert(upserts, { onConflict: 'user_id,vote_key' });
            if (error) throw error;
        }
        const revoked = Array.from(myPrev).filter(k => !myNow.includes(k));
        if (revoked.length) {
            try { await sb.from('votes').delete().eq('user_id', myId).in('vote_key', revoked); } catch (e) { }
        }
        lsSet(MYVOTES, myNow);
        dirty.delete('votes');
        await pullVotesAgg();
    }
    async function pullVotesAgg() {
        if (!appReady() || typeof votesAll !== 'function') return;
        const { data: rows, error } = await sb.from('votes').select('vote_key,value,user_id');
        if (error) throw error;
        if (!rows || !rows.length) return;
        const agg = {};
        const my = {};
        for (const r of rows) {
            const a = agg[r.vote_key] || (agg[r.vote_key] = { ok: 0, bad: 0 });
            if (r.value === 'ok') a.ok++; else if (r.value === 'bad') a.bad++;
            if (r.user_id === myId) my[r.vote_key] = r.value;
        }
        applying = true;
        try {
            const local = votesAll() || {};
            /* Серверные ключи — авторитет; локальные (анонимные/импорт) — сохраняем */
            const out = Object.assign({}, local);
            for (const k of Object.keys(agg)) {
                const cur = out[k] || { ok: 0, bad: 0, my: '' };
                out[k] = { ok: agg[k].ok, bad: agg[k].bad, my: my[k] || '' };
                if (!my[k] && cur.my) out[k].my = cur.my;
            }
            lsSet(MYVOTES, Object.keys(my).filter(k => my[k]));
            try { localStorage.setItem(VOTEKEY, JSON.stringify(out)); } catch (e) { }
        } finally { applying = false; }
    }

    /* ═══════════════ ОБЩИЕ ДАННЫЕ: МЕТА (категории/разделы) ═══════════════ */
    function computeMetaRows() {
        if (!appReady()) return [];
        const rows = [];
        if (Array.isArray(CUSTOM.categories) && CUSTOM.categories.length) {
            rows.push({ key: 'categories', data: CUSTOM.categories, updated_by: myId, updated_at: nowIso() });
        }
        const sids = serverSids();
        const secs = (CUSTOM && CUSTOM.sections) || {};
        for (const sid of Object.keys(secs)) {
            const s = secs[sid];
            if (!s) continue;
            const payload = sids.has(sid)
                ? { label: s.label || '', icon: s.icon || '', parent: s.parent || null }   // серверный раздел — только оформление
                : s;                                                                        // пользовательский — целиком
            rows.push({ key: 'sec:' + sid, data: payload, updated_by: myId, updated_at: nowIso() });
        }
        return rows;
    }
    async function pushMeta() {
        if (!appReady()) { dirty.delete('meta'); return; }
        const rows = computeMetaRows();
        const cache = lsGet('vw_cloud_meta_hash_v1', {});
        const send = [];
        for (const r of rows) {
            const hh = hashStr(JSON.stringify(r.data));
            if (cache[r.key] === hh) continue;
            send.push(r); cache[r.key] = hh;
        }
        if (send.length) {
            const { error } = await sb.from('meta_shared').upsert(send, { onConflict: 'key' });
            if (error) throw error;
            lsSet('vw_cloud_meta_hash_v1', cache);
        }
        dirty.delete('meta');
    }
    async function pullMeta() {
        if (!appReady()) return;
        const { data: rows, error } = await sb.from('meta_shared').select('key,data');
        if (error) throw error;
        if (!rows || !rows.length) return;
        applying = true;
        try {
            const byId = new Map((CUSTOM.categories || []).map(c => [c.id, c]));
            for (const r of rows) {
                if (r.key === 'categories' && Array.isArray(r.data)) {
                    for (const c of r.data) {
                        if (!c || !c.id) continue;
                        const ex = byId.get(c.id);
                        if (ex) { ex.label = c.label || ex.label; ex.icon = c.icon || ex.icon; }
                        else { byId.set(c.id, c); CUSTOM.categories.push(c); }
                    }
                } else if (r.key.indexOf('sec:') === 0) {
                    const sid = r.key.slice(4);
                    const cur = CUSTOM.sections[sid] || {};
                    CUSTOM.sections[sid] = Object.assign({}, cur, r.data || {});
                }
            }
            call('sMeta');
            call('lMeta');   // пересобираём CATS из CUSTOM
        } finally { applying = false; }
    }

    /* ═══════════════ СИНХРОНИЗАЦИЯ ═══════════════ */
    async function pullShared() {
        await pullParts();
        await pullWorkshops();
        await pullSchemes();
        await pullVotesAgg();
        await pullMeta();
    }
    async function pushShared() {
        const kinds = ['parts', 'workshops', 'schemes', 'votes', 'meta'];
        for (const k of kinds) {
            if (!dirty.has(k)) continue;
            if (k === 'parts') await pushParts();
            else if (k === 'workshops') await pushWorkshops();
            else if (k === 'schemes') await pushSchemes();
            else if (k === 'votes') await pushVotes();
            else if (k === 'meta') await pushMeta();
        }
    }
    async function pushAll() {
        if (!authed || applying) return;
        if (typeof navigator !== 'undefined' && navigator.onLine === false) { setStatus('dirty'); return; }
        if (!dirty.size) { setStatus('ok'); return; }
        setStatus('sync');
        try {
            for (const kind of Array.from(dirty)) {
                if (['garage', 'to', 'logs', 'shop', 'profile', 'pflags'].includes(kind)) await pushPrivateKind(kind);
            }
            await pushShared();
            lsSet(LASTSYNC, nowIso());
            setStatus('ok');
        } catch (e) {
            console.warn('[cloud] push failed', e);
            setStatus('err');
            /* Повторим позже — например, когда вернётся сеть */
            schedulePush(15000);
        }
    }
    async function syncOnce() {
        if (!authed) return;
        setStatus('sync');
        try {
            await pullPrivate();
            await pullShared();
            if (dirty.size) await pushAll();
            lsSet(LASTSYNC, nowIso());
            setStatus(dirty.size ? 'dirty' : 'ok');
        } catch (e) {
            console.warn('[cloud] sync failed', e);
            setStatus('err');
        }
    }

    /* Первый вход с устройства: помечаем ВСЁ локальное как «грязное» и
       запускаем обычную синхронизацию. Важно: pull идёт ПЕРЕД push —
       серверные данные мержатся с локальными (правила mergePrivate),
       и только объединённое состояние уезжает обратно. Вход с нового
       пустого устройства ничего не затирает: локальная грязь пуста,
       побеждает сервер. */
    async function initialSync() {
        ['garage', 'to', 'logs', 'shop', 'profile', 'pflags', 'parts', 'workshops', 'schemes', 'votes', 'meta']
            .forEach(k => dirty.add(k));
        await syncOnce();
    }

    /* Ререндер интерфейса, если синхронизация случилась после отрисовки */
    function rerender() {
        if (!late || !appReady()) return;
        call('rGar'); call('rSB'); call('rC'); call('renderProfile');
        call('rTOWidget'); toSyncSafe(); shopSyncSafe();
    }

    /* ═══════════════ ВХОД / РЕГИСТРАЦИЯ ═══════════════ */
    async function onSession(user, isRegister) {
        authed = true;
        myId = user.id;
        myNick = String((user.user_metadata && user.user_metadata.nick) || (user.email || '').split('@')[0] || '');
        rev = lsGet(REVKEY, {});
        ensureProfileRow();
        if (appReady() && !USER.name) {
            USER.name = myNick;
            call('sProfileStorage');
        }
        call('renderProfile');
        updateProfileHint();
        if (isRegister) await initialSync();
        else await syncOnce();
        subscribeRealtime();
        rerender();
        renderCloudModal();
    }
    async function ensureProfileRow() {
        try {
            const { data } = await sb.from('profiles').select('id,nick,city,color,initials,display_name').eq('id', myId).maybeSingle();
            if (!data) {
                await sb.from('profiles').upsert({
                    id: myId, nick: myNick,
                    display_name: (appReady() && USER.name) || myNick,
                    city: (appReady() && USER.city) || '',
                    color: (appReady() && USER.color) || '#00b0f0',
                    initials: (appReady() && USER.initials) || ''
                }, { onConflict: 'id' });
            } else {
                if (!myNick && data.nick) myNick = data.nick;
                if (appReady()) {
                    let t = false;
                    if (!USER.name && (data.display_name || data.nick)) { USER.name = data.display_name || data.nick; t = true; }
                    if (!USER.city && data.city) { USER.city = data.city; t = true; }
                    if (!USER.color && data.color) { USER.color = data.color; t = true; }
                    if (t) call('sProfileStorage');
                }
            }
        } catch (e) { console.warn('[cloud] profile row', e); }
    }

    async function register(nick, pass) {
        nick = String(nick || '').trim().toLowerCase();
        if (!validNick(nick)) throw new Error('Ник: латиница, цифры, _ . - (3–24 символа)');
        if (String(pass || '').length < 6) throw new Error('Пароль должен быть не короче 6 символов');
        const c = await ensureClient();
        const { data, error } = await c.auth.signUp({
            email: nickEmail(nick), password: pass, options: { data: { nick: nick } }
        });
        if (error) throw new Error(mapAuthErr(error));
        if (!data.session) throw new Error('В проекте Supabase включено подтверждение email — отключите его (Auth → Sign In / Providers → Email → Confirm email = OFF) и повторите');
        await onSession(data.session.user, true);
    }
    async function login(nick, pass) {
        nick = String(nick || '').trim().toLowerCase();
        if (!validNick(nick)) throw new Error('Ник: латиница, цифры, _ . - (3–24 символа)');
        const c = await ensureClient();
        const { data, error } = await c.auth.signInWithPassword({ email: nickEmail(nick), password: pass });
        if (error) throw new Error(mapAuthErr(error));
        await onSession(data.user, false);
    }
    async function logout() {
        try { if (sb) await sb.auth.signOut(); } catch (e) { }
        authed = false; myId = ''; myNick = '';
        dirty.clear();
        try { if (channel) { sb && sb.removeChannel(channel); channel = null; } } catch (e) { }
        setStatus(configured() ? 'anon' : 'off');
        call('renderProfile');
        updateProfileHint();
        renderCloudModal();
        toast('Вы вышли — данные остались на устройстве', 'info');
    }

    /* Живые обновления общих данных (Realtime) */
    function subscribeRealtime() {
        try {
            if (!sb || channel) return;
            channel = sb.channel('bm-shared');
            ['part_overrides', 'parts_custom', 'workshops_custom', 'schemes', 'votes', 'meta_shared'].forEach(t => {
                channel.on('postgres_changes', { event: '*', schema: 'public', table: t }, () => scheduleRemotePull());
            });
            channel.subscribe();
        } catch (e) { console.warn('[cloud] realtime', e); }
    }
    function scheduleRemotePull() {
        if (!authed || applying) return;
        clearTimeout(remoteT);
        remoteT = setTimeout(() => {
            pullShared().then(() => { rerender(); }).catch(e => console.warn('[cloud] remote pull', e));
        }, 4000);
    }

    /* ═══════════════ СТАРТ ═══════════════ */
    async function afterBoot() {
        if (booted) return;
        booted = true;
        late = !!window._bmInited;   // app.js уже завершил init() — понадобится ререндер
        if (!configured()) { setStatus('off'); return; }
        if (!sessionHint()) { setStatus('anon'); return; }
        try {
            setStatus('sync');
            await ensureClient();
            const { data } = await sb.auth.getSession();
            if (!data || !data.session) { setStatus('anon'); renderCloudModal(); return; }
            await onSession(data.session.user, false);
        } catch (e) {
            console.warn('[cloud] afterBoot', e);
            setStatus('err');
        }
    }

    /* ═══════════════ UI: МОДАЛКА «ОБЛАКО» ═══════════════ */
    function oCloud() {
        renderCloudModal();
        try { if (typeof openM === 'function') openM('cloudmo'); else $id('cloudmo').classList.add('show'); } catch (e) { $id('cloudmo').classList.add('show'); }
    }
    function cCloud() {
        try { if (typeof closeM === 'function') closeM('cloudmo'); else $id('cloudmo').classList.remove('show'); } catch (e) { $id('cloudmo').classList.remove('show'); }
    }
    function renderCloudModal() {
        const box = $id('cloud_body');
        if (!box) return;
        let h = '';
        if (!configured()) {
            h = '<div class="cloud-off">'
                + '<p>☁️ Облако <b>не подключено</b>: заполните <code>CLOUD_CONFIG</code> в начале файла <code>js/cloud.js</code> (URL проекта и anon-ключ Supabase).</p>'
                + '<p class="fh">Пока приложение работает как раньше — все данные хранятся только на этом устройстве. Пошаговая инструкция: <code>CLOUD-SETUP.md</code>.</p>'
                + '</div>';
            box.innerHTML = h;
            return;
        }
        if (!authed) {
            if (pubMode()) {
                h = '<div class="cloud-off"><p>👁 Публичный режим: вход и синхронизация доступны в полной версии приложения.</p></div>';
                box.innerHTML = h; return;
            }
            h = '<div class="cloud-form">'
                + '<div class="cloud-tabs">'
                + '<button type="button" class="bn p" id="cl_tab_login" onclick="CloudTab(\'login\')">Вход</button>'
                + '<button type="button" class="bn" id="cl_tab_reg" onclick="CloudTab(\'reg\')">Регистрация</button>'
                + '</div>'
                + '<div class="fg"><label>Ник</label><input type="text" id="cl_nick" maxlength="24" placeholder="например: ignat_6n" autocomplete="username">'
                + '<div class="fh">Латиница, цифры, <code>_ . -</code>, 3–24 символа. Ник уникален — это ваш вход на любом устройстве.</div></div>'
                + '<div class="fg"><label>Пароль</label><input type="password" id="cl_pass" minlength="6" placeholder="не короче 6 символов" autocomplete="current-password"></div>'
                + '<div id="cl_err" class="cl-err"></div>'
                + '<button type="button" class="bn p cl-submit" id="cl_submit" onclick="CloudSubmit()">Войти</button>'
                + '<div class="cloud-what">'
                + '<b>Что даёт вход:</b>'
                + '<ul>'
                + '<li>🚗 <b>Гараж, ТО, журнал, список покупок, профиль</b> — ваши личные, видны только вам, но на всех устройствах;</li>'
                + '<li>🔧 <b>Правки каталога</b> (заметки, цены, ссылки, фото позиций), <b>добавленные позиции и сервисы</b>, <b>схемы узлов с фото</b>, <b>голоса за аналоги</b>, <b>свои разделы</b> — сохраняются на сервере и доступны всему сообществу;</li>'
                + '<li>📴 Без интернета приложение работает как раньше, изменения отправятся при первой связи.</li>'
                + '</ul></div>'
                + '<div class="fh" style="margin-top:10px">⚠️ Восстановление пароля не предусмотрено (вход без email) — не теряйте пароль.</div>'
                + '</div>';
            box.innerHTML = h;
            CloudTab(window._clTab || 'login');
            const nick = $id('cl_nick'), pass = $id('cl_pass');
            if (nick && pass) {
                pass.onkeydown = e => { if (e.key === 'Enter') CloudSubmit(); };
                nick.onkeydown = e => { if (e.key === 'Enter') pass.focus(); };
            }
            return;
        }
        /* Авторизован */
        h = '<div class="cloud-ok">'
            + '<div class="prof-avatar-row">'
            + '<div class="prof-avatar-big" style="background:' + esc((appReady() && USER.color) || '#00b0f0') + '">'
            + esc(((appReady() && USER.initials) || myNick || '?').slice(0, 2).toUpperCase()) + '</div>'
            + '<div class="prof-info"><div class="prof-name">' + esc(myNick) + '</div>'
            + '<div class="prof-sub" id="cloud_status_line">' + statusHtml() + '</div></div></div>'
            + '<div class="cloud-btns">'
            + '<button type="button" class="bn p" onclick="CloudSyncNow()">🔄 Синхронизировать сейчас</button>'
            + '<button type="button" class="bn dg-btn" onclick="CloudLogout()">Выйти</button>'
            + '</div>'
            + '<div class="cloud-what"><b>Что синхронизируется:</b>'
            + '<ul>'
            + '<li>🔒 Личное: гараж, ТО/пробег, журнал, список покупок, профиль, статусы и избранное позиций;</li>'
            + '<li>🌐 Общее: правки каталога, добавленные позиции, сервисы, схемы узлов (фото), голоса, свои разделы.</li>'
            + '</ul></div>'
            + '</div>';
        box.innerHTML = h;
    }
    window.CloudTab = function (tab) {
        window._clTab = tab;
        const l = $id('cl_tab_login'), r = $id('cl_tab_reg'), s = $id('cl_submit'), p = $id('cl_pass');
        if (!l || !r || !s) return;
        const reg = tab === 'reg';
        l.className = 'bn' + (reg ? '' : ' p'); r.className = 'bn' + (reg ? ' p' : '');
        s.textContent = reg ? '🚀 Зарегистрироваться' : 'Войти';
        if (p) p.autocomplete = reg ? 'new-password' : 'current-password';
        $id('cl_err').innerHTML = '';
    };
    window.CloudSubmit = async function () {
        const nick = ($id('cl_nick') || {}).value || '', pass = ($id('cl_pass') || {}).value || '';
        const err = $id('cl_err'), btn = $id('cl_submit');
        err.innerHTML = ''; btn.disabled = true;
        const old = btn.textContent;
        btn.textContent = '⏳ Подождите…';
        try {
            if (window._clTab === 'reg') { await register(nick, pass); toast('Добро пожаловать, ' + nick + '! Данные этого устройства загружены в облако', 'success'); }
            else { await login(nick, pass); toast('Вход выполнен: ' + nick, 'success'); }
            cCloud();
        } catch (e) {
            err.textContent = String(e.message || e);
        } finally {
            const b = $id('cl_submit');
            if (b) { b.disabled = false; b.textContent = old; }
        }
    };
    window.CloudSyncNow = async function () {
        try {
            /* Не помечаем всё «грязным»: pull должен видеть, какие данные
               на этом устройстве реально менялись, и спокойно принимать
               более свежую серверную версию (иначе локальная копия всегда
               побеждала бы и правки с других устройств не доезжали). */
            await syncOnce();
            rerender();
            renderCloudModal();
            toast(state === 'ok' ? 'Синхронизировано' : 'Синхронизация не удалась — проверьте сеть', state === 'ok' ? 'success' : 'danger');
        } catch (e) { toast('Ошибка: ' + e.message, 'danger'); }
    };
    window.CloudLogout = async function () {
        if (!confirm('Выйти из облака? Локальные данные останутся на устройстве.')) return;
        await logout();
    };

    /* Подсказки в модалке профиля: синхронизируется ли он */
    function updateProfileHint() {
        const sub = $id('prof_sub_view');
        if (sub) {
            sub.textContent = authed
                ? '☁️ Синхронизируется · ' + myNick
                : 'Локальный профиль · войдите в ☁️ Облако для синхронизации';
        }
        const hint = $id('prof_local_hint');
        if (hint) {
            hint.innerHTML = authed
                ? 'ℹ️ При входе в ☁️ Облако профиль <b>синхронизируется между вашими устройствами</b> и виден только вам.<br>Ник <b>' + esc(myNick) + '</b> отображается у ваших общих правок каталога.'
                : 'ℹ️ Профиль хранится <b>только в вашем браузере</b> и никуда не отправляется.<br>Чтобы он был на всех устройствах — войдите в ☁️ Облако (меню ⚙️ → Облако).';
        }
    }

    /* Сетевые события: вернулась сеть — пробуем отправить накопленное */
    if (typeof window !== 'undefined') {
        window.addEventListener('online', () => { if (authed && dirty.size) schedulePush(500); });
        window.addEventListener('offline', () => { if (authed && dirty.size) setStatus('dirty'); });
    }

    /* ═══════════════ ПУБЛИЧНЫЙ ИНТЕРФЕЙС ═══════════════ */
    const api = {
        /* для app.js */
        markDirty, afterBoot, setServerParts, noteServerSections, noteServerWorkshops,
        /* для UI */
        oCloud, cCloud,
        /* служебное (отладка/тесты) */
        _internal: {
            mergePrivate, mergeGarage, mergeTo, mergeLogs, mergeShop,
            computePartsDiff, computeMetaRows, validNick, nickEmail, cfg, configured,
            setStatus, isAuthed: () => authed, getState: () => state
        }
    };
    window.oCloud = oCloud;
    window.cCloud = cCloud;

    /* Если cloud.js загрузился ПОСЛЕ завершения init() (поздний старт) —
       догоняющая синхронизация с ререндером. */
    if (window._bmInited) {
        late = true;
        afterBoot().catch(e => console.warn('[cloud] lateBoot', e));
    }
    /* Индикатор сразу, даже до входа */
    setTimeout(() => {
        setStatus(configured() ? (sessionHint() ? 'sync' : 'anon') : 'off');
        updateProfileHint();
    }, 0);
    /* Обновляем подсказку профиля при каждом открытии модалки */
    const _oProfile = window.oProfile;
    if (typeof _oProfile === 'function') {
        window.oProfile = function () { _oProfile.apply(this, arguments); updateProfileHint(); };
    }

    return api;
})();
