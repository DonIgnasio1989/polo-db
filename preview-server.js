/* ════════════════════════════════════════════════════════════════
   ДЕМО-СЕРВЕР для предпросмотра «База Мастера» + облако 1.14.0.
   Обслуживает preview-demo/ и эмулирует Supabase (auth + PostgREST
   + Storage) в памяти процесса — вход по нику и синхронизацию можно
   потрогать без настоящего Supabase-проекта. Данные сбрасываются
   при перезапуске сервера. Это НЕ прод и не часть поставки.
   Запуск: node preview-server.js  (порт 8080)
   ════════════════════════════════════════════════════════════════ */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, 'preview-demo');
const PORT = process.env.PORT || 8080;

/* ── «Supabase» в памяти ── */
const users = {};    // email → {id, password, nick}
const tokens = {};   // 'tok.<uid>' → uid
const T = {
    profiles: [], user_data: [], parts_custom: [], part_overrides: [],
    workshops_custom: [], schemes: [], votes: [], meta_shared: []
};
const PK = {
    profiles: ['id'], user_data: ['user_id', 'key'], parts_custom: ['id'],
    part_overrides: ['part_key'], workshops_custom: ['id'], schemes: ['key'],
    votes: ['user_id', 'vote_key'], meta_shared: ['key']
};
const storage = new Map();

const uidOf = req => { const m = /^Bearer tok\.(\S+)/.exec(req.headers['authorization'] || ''); return m ? m[1] : null; };
function parseFilters(q) {
    const f = [];
    for (const [k, v] of q) {
        if (['select', 'on_conflict', 'order', 'limit', 'offset'].includes(k)) continue;
        const m = /^(\w+)\.(.*)$/.exec(v);
        if (m) f.push({ col: k, op: m[1], val: m[2] });
    }
    return f;
}
const match = (row, f) => f.every(x => x.op === 'eq' ? String(row[x.col]) === x.val
    : x.op === 'in' ? x.val.replace(/^\(|\)$/g, '').split(',').map(s => s.replace(/^"|"$/g, '')).includes(String(row[x.col]))
        : true);
function body(req) {
    return new Promise(res => {
        const c = []; req.on('data', x => c.push(x));
        req.on('end', () => {
            const buf = Buffer.concat(c);
            if ((req.headers['content-type'] || '').includes('json')) { try { res(JSON.parse(buf.toString())); } catch (e) { res(null); } }
            else res(buf);
        });
    });
}
const json = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); res.end(JSON.stringify(obj)); };

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.md': 'text/markdown; charset=utf-8', '.sql': 'text/plain; charset=utf-8' };

const server = http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x');
    const p = u.pathname;

    /* ── AUTH ── */
    if (p === '/auth/v1/signup' && req.method === 'POST') {
        const b = await body(req);
        const email = String(b.email || '').toLowerCase();
        if (users[email]) return json(res, 422, { message: 'User already registered' });
        const id = crypto.randomUUID();
        users[email] = { id, password: b.password, nick: (b.data && b.data.nick) || email.split('@')[0] };
        tokens['tok.' + id] = id;
        T.profiles.push({ id, nick: users[email].nick, display_name: users[email].nick, city: '', color: '#00b0f0', initials: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
        console.log('[demo-auth] регистрация: ' + users[email].nick);
        return json(res, 200, {
            access_token: 'tok.' + id, token_type: 'bearer', expires_in: 3600, refresh_token: 'rt.' + id,
            user: { id, aud: 'authenticated', role: 'authenticated', email, user_metadata: b.data || {}, app_metadata: {}, created_at: new Date().toISOString() }
        });
    }
    if (p === '/auth/v1/token' && req.method === 'POST') {
        const b = await body(req);
        const email = String(b.email || '').toLowerCase();
        const usr = users[email];
        if (!usr || usr.password !== b.password) return json(res, 400, { error: 'invalid_grant', error_description: 'Invalid login credentials', message: 'Invalid login credentials' });
        tokens['tok.' + usr.id] = usr.id;
        console.log('[demo-auth] вход: ' + usr.nick);
        return json(res, 200, {
            access_token: 'tok.' + usr.id, token_type: 'bearer', expires_in: 3600, refresh_token: 'rt.' + usr.id,
            user: { id: usr.id, aud: 'authenticated', role: 'authenticated', email, user_metadata: { nick: usr.nick }, app_metadata: {}, created_at: new Date().toISOString() }
        });
    }
    if (p === '/auth/v1/user') {
        const uid = uidOf(req);
        const email = Object.keys(users).find(e => users[e].id === uid);
        if (!uid) return json(res, 401, { message: 'unauthorized' });
        return json(res, 200, { id: uid, aud: 'authenticated', email, user_metadata: { nick: users[email].nick }, app_metadata: {} });
    }

    /* ── STORAGE ── */
    if (p.startsWith('/storage/v1/object/bm-photos/') && req.method === 'POST') {
        const buf = await body(req);
        const key = decodeURIComponent(p.slice('/storage/v1/object/bm-photos/'.length));
        storage.set(key, buf);
        console.log('[demo-storage] +' + key + ' (' + buf.length + ' Б)');
        return json(res, 200, { Key: 'bm-photos/' + key });
    }
    if (p.startsWith('/storage/v1/object/public/bm-photos/')) {
        const key = decodeURIComponent(p.slice('/storage/v1/object/public/bm-photos/'.length));
        const buf = storage.get(key);
        if (!buf) { res.writeHead(404); return res.end(); }
        res.writeHead(200, { 'Content-Type': 'image/jpeg' }); return res.end(buf);
    }

    /* ── REST ── */
    const rm = /^\/rest\/v1\/(\w+)$/.exec(p);
    if (rm && T[rm[1]]) {
        const table = rm[1];
        const uid = uidOf(req);
        const filters = parseFilters(u.searchParams);
        const single = /vnd\.pgp-1\.0/.test(req.headers['accept'] || '');

        if (req.method === 'GET') {
            let rows = T[table].filter(r => match(r, filters));
            if (table === 'user_data' || table === 'votes') rows = table === 'user_data' ? rows.filter(r => r.user_id === uid) : rows;
            if (single) return rows.length === 1 ? json(res, 200, rows[0]) : json(res, 200, null);
            return json(res, 200, rows);
        }
        if (req.method === 'POST') {
            const b = await body(req);
            const items = Array.isArray(b) ? b : [b];
            const pk = PK[table];
            const out = [];
            for (const it of items) {
                if (table === 'user_data' && it.user_id !== uid) return json(res, 401, { message: 'RLS' });
                if (table === 'votes' && it.user_id !== uid) return json(res, 401, { message: 'RLS' });
                const idx = T[table].findIndex(r => pk.every(k => String(r[k]) === String(it[k])));
                if ((table === 'parts_custom' || table === 'workshops_custom') && idx >= 0 && T[table][idx].created_by !== uid)
                    return json(res, 401, { message: 'row-level security' });
                const row = Object.assign({}, it, { updated_at: new Date().toISOString() });
                if (idx >= 0) T[table][idx] = Object.assign({}, T[table][idx], row);
                else T[table].push(row);
                out.push(T[table].find(r => pk.every(k => String(r[k]) === String(it[k]))));
            }
            return json(res, 201, /return=representation/.test(req.headers['prefer'] || '') ? out : null);
        }
        if (req.method === 'DELETE') {
            let rows = T[table].filter(r => match(r, filters));
            if (table === 'user_data' || table === 'votes') rows = rows.filter(r => r.user_id === uid);
            if (table === 'parts_custom' || table === 'workshops_custom') rows = rows.filter(r => r.created_by === uid);
            T[table] = T[table].filter(r => !rows.includes(r));
            return json(res, 200, rows);
        }
    }

    /* ── Статика (index.html — с инъекцией демо-конфига облака) ── */
    let fp = decodeURIComponent(p); if (fp === '/') fp = '/index.html';
    const f = path.join(ROOT, fp);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('not found'); }
    const ext = path.extname(f);
    if (ext === '.html') {
        let html = fs.readFileSync(f, 'utf8');
        html = html.replace('</head>',
            '    <script>/* ДЕМО: облако указывает на этот же сервер (mock Supabase) */\n' +
            '    try { localStorage.setItem("vw_cloud_cfg", JSON.stringify({ url: location.origin, anonKey: "demo-anon-key" })); } catch (e) { }</script>\n</head>');
        res.writeHead(200, { 'Content-Type': MIME[ext], 'Cache-Control': 'no-store' });
        return res.end(html);
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(fs.readFileSync(f));
});
server.on('upgrade', (req, socket) => socket.end());

server.listen(PORT, '0.0.0.0', () => {
    console.log('Демо-сервер «База Мастера» + mock Supabase: http://0.0.0.0:' + PORT + '/');
    console.log('Каталог: ' + ROOT);
});
