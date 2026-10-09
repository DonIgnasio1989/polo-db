// tools/merge-parts.js — одноразовое слияние всех parts-*.json в один parts.json
// Запуск: node tools/merge-parts.js
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'data');

// ─── Нормализация (упрощённая копия nP из app.js) ──────────
function normalize(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const arr = v => Array.isArray(v) ? v.map(String).filter(Boolean) : [];
    let inst = [];
    if (Array.isArray(raw.inst)) inst = raw.inst.filter(i => i && i.text)
        .map(i => ({ type: i.type, text: String(i.text) }));
    else if (Array.isArray(raw.i)) inst = raw.i
        .map(x => ({ type: x[0], text: String(x[1] || '') })).filter(x => x.text);

    const photos = (() => {
        const out = [];
        if (Array.isArray(raw.photos)) out.push(...raw.photos.filter(x => typeof x === 'string'));
        if (!out.length && typeof raw.photo === 'string') out.push(raw.photo);
        return out.slice(0, 12);
    })();

    return {
        cat: String(raw.cat || 'Engine'),
        sub: String(raw.sub || raw.subcategory || '').trim(),
        name: String(raw.n || raw.name || '').trim(),
        oem: String(raw.o || raw.oem || '').trim(),
        verified: !!(raw.v || raw.verified),
        analogs: arr(raw.a || raw.analogs),
        donors: arr(raw.d || raw.donors),
        engines: arr(raw.engines),
        bodies: arr(raw.bodies),
        transmissions: arr(raw.transmissions),
        trims: arr(raw.trims),
        gens: arr(raw.gens),
        price: raw.price == null || raw.price === '' ? null : (isFinite(Number(raw.price)) ? Number(raw.price) : null),
        currency: raw.currency || 'RUB',
        status: ['want', 'bought', 'installed'].includes(raw.status) ? raw.status : '',
        favorite: !!raw.favorite,
        notes: String(raw.notes || ''),
        shopUrl: String(raw.shopUrl || ''),
        photos,
        inst,
        parts: Array.isArray(raw.parts) ? raw.parts.filter(x => x && (x.oem || x.o || x.name || x.n))
            .map(x => ({
                name: String(x.name || x.n || ''),
                oem: String(x.oem || x.o || ''),
                note: String(x.note || '')
            })) : [],
        priceHistory: Array.isArray(raw.priceHistory)
            ? raw.priceHistory.filter(h => h && h.ts && h.price != null)
            : []
    };
}

// ─── Слияние двух записей с одинаковым ключом ──────────────
function mergeTwo(a, b) {
    const out = { ...a };
    if (!out.name && b.name) out.name = b.name;
    if (!out.oem && b.oem) out.oem = b.oem;
    if (!out.sub && b.sub) out.sub = b.sub;
    if (b.verified) out.verified = true;
    if (!out.price && b.price != null) out.price = b.price;
    if (b.favorite) out.favorite = true;
    if (!out.notes && b.notes) out.notes = b.notes;
    if (!out.shopUrl && b.shopUrl) out.shopUrl = b.shopUrl;
    if (!out.status && b.status) out.status = b.status;

    const uniq = (x, y) => Array.from(new Set([...(x || []), ...(y || [])]));
    out.analogs = uniq(a.analogs, b.analogs);
    out.donors = uniq(a.donors, b.donors);
    out.engines = uniq(a.engines, b.engines);
    out.bodies = uniq(a.bodies, b.bodies);
    out.transmissions = uniq(a.transmissions, b.transmissions);
    out.trims = uniq(a.trims, b.trims);
    out.gens = uniq(a.gens, b.gens);

    const im = new Map();
    [...(a.inst || []), ...(b.inst || [])].forEach(i => { if (i.text && !im.has(i.text)) im.set(i.text, i); });
    out.inst = Array.from(im.values());

    out.photos = Array.from(new Set([...(a.photos || []), ...(b.photos || [])])).slice(0, 12);

    const pm = new Map();
    [...(a.parts || []), ...(b.parts || [])].forEach(p => {
        const k = (p.oem || '') + '|' + (p.name || '');
        if (!pm.has(k)) pm.set(k, p);
    });
    out.parts = Array.from(pm.values());

    const hm = new Map();
    [...(a.priceHistory || []), ...(b.priceHistory || [])].forEach(h => hm.set(h.ts, h));
    out.priceHistory = Array.from(hm.values()).sort((x, y) => x.ts - y.ts).slice(-50);

    return out;
}

// ─── Главный проход ────────────────────────────────────────
const update = JSON.parse(fs.readFileSync(path.join(DATA, 'update.json'), 'utf8'));
const partFiles = update.files.filter(f => f.type === 'parts').map(f => f.path);

let raw = [];
const seenFiles = [];
for (const rel of partFiles) {
    const fp = path.join(ROOT, rel);
    if (!fs.existsSync(fp)) { console.warn('skip (missing):', rel); continue; }
    try {
        const arr = JSON.parse(fs.readFileSync(fp, 'utf8'));
        if (Array.isArray(arr)) { raw.push(...arr); seenFiles.push(rel); }
    } catch (e) { console.warn('skip (bad json):', rel, e.message); }
}

console.log('Files read:', seenFiles.length);
console.log('Raw entries:', raw.length);

const normalized = raw.map(normalize).filter(p => p && (p.oem || p.name));
console.log('Normalized:', normalized.length);

// ─── Дедупликация: ключ = oem + name ──────────────────────
const map = new Map();
const keyOf = p => (p.oem || '').toLowerCase() + '|' + (p.name || '').toLowerCase();

let dupCount = 0;
for (const p of normalized) {
    const k = keyOf(p);
    if (!k || k === '|') continue;
    if (map.has(k)) {
        map.set(k, mergeTwo(map.get(k), p));
        dupCount++;
    } else {
        map.set(k, p);
    }
}

const merged = Array.from(map.values());
console.log('After dedup:', merged.length);
console.log('Removed duplicates:', dupCount);
console.log('Saved:', (100 * (1 - merged.length / normalized.length)).toFixed(1) + '%');

// ─── Запись ────────────────────────────────────────────────
const outPath = path.join(DATA, 'parts.json');
fs.writeFileSync(outPath, JSON.stringify(merged, null, 1));
console.log('Written:', outPath);