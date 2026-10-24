#!/usr/bin/env node
/* ============================================================
   tools/dedup.js — дедупликатор каталога «База Мастера»
   ------------------------------------------------------------
   Зачем: файлы-источники (data-src/) и будущие импорты могут
   приносить одну и ту же позицию в разных написаниях. Инструмент:
     1) АВТОСЛИЯНИЕ: группы с одинаковым нормализованным OEM
        (объединение аналогов, доноров, применимости, инструкций…);
     2) ПОДОЗРЕНИЯ (без автоправок): одинаковое имя+категория при
        разных OEM (похоже на supersession-цепочку VAG или дубль),
        fuzzy-совпадение имён (Jaccard ≥ порога), пустой OEM + имя-дубль;
     3) Отчёт MD + машинный duplicates.json + очищенный файл.
   Использование:
     node tools/dedup.js --src data-src --out restore --apply
     node tools/dedup.js --src restore/parts.json            (dry-run)
     node tools/dedup.js --src data-src --min-sim 0.8
   Файлы-источники НИКОГДА не изменяются; --apply пишет только
   parts.dedup.json + DEDUP-REPORT.md + duplicates.json в --out.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

/* ---------- нормализация ---------- */
const normOem = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const nz = s => String(s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
/* 1.10.6: раньше отбрасывались ВСЕ токены короче 3 символов, а вместе с ними
   размеры — «Пружинная шайба 8» и «Пружинная шайба 12» получали сходство 1.00
   (120 таких ложных групп из 618). Числовые токены теперь сохраняем любой
   длины; короткие единицы измерения («мм», «шт») по-прежнему не учитываются. */
/* Одиночные буквы-обозначения («гнездо E» / «гнездо S») тоже значимы —
   иначе два разных разъёма 357 919 968 A и 357 955 968 A получали сходство
   1.00. Отбрасываем только чистую пунктуацию. */
const tokens = s => new Set(nz(s).split(' ').filter(t => /[0-9a-zа-я]/.test(t)));
const IM = { spec: 's', tool: 't', proc: 'p', warn: 'w', note: 'n', recommendation: 'r' };
function jaccard(a, b) {
    const A = tokens(a), B = tokens(b);
    if (!A.size || !B.size) return 0;
    let inter = 0; A.forEach(t => { if (B.has(t)) inter++; });
    return inter / (A.size + B.size - inter);
}
/* supersession-паттерн VAG: общая база ≥ 8 символов, хвосты ≤ 2 знаков:
   030103483 / 030103483K / 030103483D — цепочка замен по суффиксу */
function supersessionLike(a, b) {
    if (!a || !b || a === b) return false;
    let i = 0;
    while (i < Math.min(a.length, b.length) && a[i] === b[i]) i++;
    const da = a.slice(i), db = b.slice(i);
    return i >= 8 && da.length <= 2 && db.length <= 2 && /^[A-Z0-9]*$/.test(da + db);
}
/* Префикс OEM у VAG = семейство мотора/платформа: 030 = EA111, 044 = дизель D…
   Разные префиксы при одном имени = разные применения, а не дубль. */
const oemPrefix = k => k.slice(0, 3);

/* ---------- загрузка источников ---------- */
function loadSources(src) {
    const files = [];
    const st = fs.statSync(src);
    if (st.isDirectory()) {
        fs.readdirSync(src).filter(f => /^parts-.*\.json$/.test(f) || f === 'parts.json')
            .sort((a, b) => {
                const na = parseInt((a.match(/parts-(\d+)/) || [0, 99])[1], 10);
                const nb = parseInt((b.match(/parts-(\d+)/) || [0, 99])[1], 10);
                return na - nb || a.localeCompare(b);
            })
            .forEach(f => files.push(path.join(src, f)));
    } else files.push(src);
    const items = [];
    for (const f of files) {
        const arr = JSON.parse(fs.readFileSync(f, 'utf8'));
        if (!Array.isArray(arr)) throw new Error(f + ': ожидается массив позиций');
        arr.forEach((p, i) => items.push(Object.assign({}, p, { _src: path.basename(f), _idx: i })));
    }
    return { files: files.map(f => path.basename(f)), items };
}

/* ---------- автослияние группы ---------- */
const uniqPush = (dst, src) => { src.forEach(v => { if (!dst.includes(v)) dst.push(v); }); return dst; };
function mergeParts(group) {
    const base = Object.assign({}, group[0]);
    const mergedIds = group.map(p => p.id || p._src + '#' + p._idx);
    const out = {
        id: base.id || ('m_' + mergedIds[0].replace(/[^a-z0-9]/gi, '').slice(0, 12)),
        cat: base.cat, sub: base.sub || '',
        name: group.reduce((m, p) => (String(p.n || p.name || '').length > String(m).length ? (p.n || p.name) : m), base.n || base.name || ''),
        oem: base.o || base.oem || '',
        v: group.some(p => p.v || p.verified) ? true : undefined,
        a: uniqPush([], group.flatMap(p => p.a || p.analogs || [])),
        d: uniqPush([], group.flatMap(p => p.d || p.donors || [])),
        engines: uniqPush([], group.flatMap(p => p.engines || [])),
        bodies: uniqPush([], group.flatMap(p => p.bodies || [])),
        transmissions: uniqPush([], group.flatMap(p => p.transmissions || [])),
        transCodes: uniqPush([], group.flatMap(p => p.transCodes || [])),
        trims: uniqPush([], group.flatMap(p => p.trims || [])),
        gens: uniqPush([], group.flatMap(p => p.gens || [])),
        prReq: uniqPush([], group.flatMap(p => p.prReq || [])),
        prNo: uniqPush([], group.flatMap(p => p.prNo || [])),
        inst: [], photos: [], priceHistory: []
    };
    out.sub = out.sub || group.map(p => p.sub).find(Boolean) || '';
    /* инструкции: уникальные по type+text */
    const iSeen = new Set();
    group.forEach(p => (p.i || p.inst || []).forEach(i => {
        const t = Array.isArray(i) ? { type: i[0], text: i[1] } : i;
        const k = nz(t.type + '|' + t.text);
        if (!iSeen.has(k)) { iSeen.add(k); out.inst.push(t); }
    }));
    /* фото и история цен */
    const pSeen = new Set();
    group.forEach(p => (p.photos || (p.photo ? [p.photo] : [])).forEach(x => { if (!pSeen.has(x)) { pSeen.add(x); out.photos.push(x); } }));
    const hMap = new Map();
    group.forEach(p => (p.priceHistory || []).forEach(h => { if (h && h.ts) hMap.set(h.ts, h); }));
    out.priceHistory = Array.from(hMap.values()).sort((a, b) => String(a.ts).localeCompare(String(b.ts)));
    /* цена: первая непустая по порядку файлов */
    const priced = group.find(p => p.price != null && p.price !== '');
    if (priced) { out.price = priced.price; out.currency = priced.currency || 'RUB'; }
    const sup = group.map(p => p.sup || p.supersededTo).find(Boolean);
    if (sup) out.sup = sup;
    const notes = uniqPush([], group.map(p => String(p.notes || '')).filter(Boolean));
    if (notes.length) out.notes = notes.join(' | ');
    if (group.some(p => p.favorite)) out.favorite = true;
    if (group.some(p => p.status)) out.status = group.map(p => p.status).find(Boolean);
    /* 1.10.6: поля, которых нет в явном списке (parts[], shopUrl, analogSrc
       и любые будущие), раньше молча терялись при слиянии. Переносим их из
       записей группы: массивы объединяем, скаляры берём первые непустые. */
    const su = group.map(p => p.shopUrl).find(Boolean);
    if (su) out.shopUrl = su;
    const KNOWN = new Set(['id', 'cat', 'sub', 'n', 'name', 'o', 'oem', 'v', 'verified',
        'a', 'analogs', 'd', 'donors', 'engines', 'bodies', 'transmissions', 'transCodes',
        'trims', 'gens', 'prReq', 'prNo', 'sup', 'supersededTo', 'price', 'currency',
        'status', 'favorite', 'notes', 'shopUrl', 'photos', 'photo', 'i', 'inst',
        'priceHistory', '_src', '_idx', '_mergedFrom']);
    group.forEach(p => Object.keys(p).forEach(k => {
        if (KNOWN.has(k) || k in out) return;
        if (Array.isArray(p[k])) out[k] = uniqPush([], group.flatMap(x => Array.isArray(x[k]) ? x[k] : (x[k] == null ? [] : [x[k]])));
        else if (out[k] == null && p[k] != null) out[k] = p[k];
    }));
    /* схема источника: data-src хранит короткую (n/o/i/v:1), старые записи —
       name/oem/inst/v:true. Выдаём в той же схеме, что первая запись группы,
       чтобы сборка не смешивала форматы. */
    if ('n' in base || 'o' in base) {
        out.n = out.name; delete out.name;
        out.o = out.oem; delete out.oem;
        out.i = (out.inst || []).map(x => [IM[x.type] || 'n', x.text]);
        delete out.inst;
        if (out.v === true) out.v = 1;
    }
    /* чистим пустое */
    Object.keys(out).forEach(k => {
        if (Array.isArray(out[k]) && !out[k].length && !['a', 'd'].includes(k)) delete out[k];
        if (out[k] === undefined) delete out[k];
    });
    if (!out.v) delete out.v;
    out._mergedFrom = mergedIds;
    out._src = group[0]._src;
    return out;
}

/* ---------- группировка ---------- */
function findGroups(items) {
    const auto = [], suspicious = [];
    /* 1) точные дубли по нормализованному OEM */
    const byOem = new Map();
    items.forEach(p => { const k = normOem(p.o || p.oem); if (k) { if (!byOem.has(k)) byOem.set(k, []); byOem.get(k).push(p); } });
    byOem.forEach((g, k) => { if (g.length > 1) auto.push({ key: 'oem:' + k, reason: 'одинаковый нормализованный OEM', items: g }); });
    /* 2) подозрения: имя+категория при разных OEM / fuzzy / пустой OEM */
    const byName = new Map();
    items.forEach(p => { const k = nz(p.n || p.name) + '§' + (p.cat || ''); if (k.length > 3) { if (!byName.has(k)) byName.set(k, []); byName.get(k).push(p); } });
    byName.forEach((g, k) => {
        if (g.length < 2) return;
        const oems = [...new Set(g.map(p => normOem(p.o || p.oem)))];
        const inAuto = g.every(p => auto.some(a => a.items.includes(p)));
        if (inAuto) return;
        let reason, pri;
        if (oems.length === 1 && oems[0] === '') { reason = 'пустой OEM + одинаковое имя — вероятно дубль'; pri = 'high'; }
        else if (oems.length > 1 && oems.every((o, i) => i === 0 || supersessionLike(oems[0], o))) { reason = 'supersession-цепочка VAG (суффиксы): решить, какой артикул новый, и проставить sup у старого'; pri = 'medium'; }
        else if (oems.length > 1 && oems.every(o => oemPrefix(o) === oemPrefix(oems[0]))) { reason = 'одинаковое имя и префикс OEM при разных номерах — проверить применимость/дубль'; pri = 'medium'; }
        else if (oems.length > 1) { reason = 'одинаковое имя, разные префиксы OEM (разные платформы) — скорее разные применения, не дубль'; pri = 'low'; }
        else return;
        suspicious.push({ key: 'name:' + k, reason, pri, items: g });
    });
    /* 3) fuzzy-имена внутри категории (Jaccard) */
    const byCat = new Map();
    items.forEach(p => { const c = p.cat || ''; if (!byCat.has(c)) byCat.set(c, []); byCat.get(c).push(p); });
    byCat.forEach(g => {
        for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) {
            const a = g[i], b = g[j];
            const ka = normOem(a.o || a.oem), kb = normOem(b.o || b.oem);
            if (ka && ka === kb) continue;
            const na = nz(a.n || a.name), nb = nz(b.n || b.name);
            if (!na || !nb || na === nb) continue;
            const sim = jaccard(na, nb);
            if (sim >= (findGroups.minSim || 0.85) && (ka !== kb)) {
                suspicious.push({ key: 'fuzzy:' + na + '~' + nb, reason: 'fuzzy-совпадение имени (' + sim.toFixed(2) + ') при разных OEM', pri: 'medium', items: [a, b] });
            }
        }
    });
    /* 4) 1.10.6: сегменты композитного OEM против одиночных записей.
       «N 101 559 01 · N 102 612 01» (parts-07) и «N 101 559 01» (parts-14) —
       это две карточки одного болта, но ни правило 1 (ключ = вся строка OEM),
       ни _dedupeParts в приложении такого не видят. */
    const byNorm = new Map();
    items.forEach(p => { const k = normOem(p.o || p.oem); if (k) { if (!byNorm.has(k)) byNorm.set(k, []); byNorm.get(k).push(p); } });
    const segSeen = new Set();
    items.forEach(p => {
        const raw = String(p.o || p.oem || '');
        if (!raw.includes('·')) return;
        raw.split('·').map(normOem).filter(Boolean).forEach(seg => {
            if (segSeen.has(seg)) return;
            const hit = (byNorm.get(seg) || []).filter(q => q !== p && !String(q.o || q.oem || '').includes('·'));
            if (!hit.length) return;
            segSeen.add(seg);
            suspicious.push({
                key: 'seg:' + seg,
                reason: 'сегмент композитного OEM совпадает с отдельной позицией — в каталоге две карточки одного номера',
                pri: 'medium',
                items: [p].concat(hit)
            });
        });
    });
    suspicious.sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.pri] - { high: 0, medium: 1, low: 2 }[b.pri]));
    return { auto, suspicious };
}

/* ---------- отчёт ---------- */
const fmtP = p => '`' + (p.o || p.oem || 'без OEM') + '` · ' + (p.n || p.name || '') + ' · ' + (p.cat || '') + '/' + (p.sub || '') + ' · из ' + (p._src || '?');
function buildReport(res, merged, files, opts) {
    const L = [];
    L.push('# Отчёт дедупликатора каталога');
    L.push('');
    L.push('Дата: ' + new Date().toISOString().slice(0, 10) + ' · источников: ' + files.length + ' (' + files.join(', ') + ')');
    L.push('Позиций на входе: **' + opts.inputCount + '** · автослияний: **' + merged.length + '** · подозрений: **' + res.suspicious.length + '** · на выходе: **' + opts.outputCount + '**');
    const pc = { high: 0, medium: 0, low: 0 };
    res.suspicious.forEach(g => { pc[g.pri] = (pc[g.pri] || 0) + 1; });
    L.push('Приоритеты подозрений: 🔴 high ' + pc.high + ' · 🟡 medium ' + pc.medium + ' · 🟢 low ' + pc.low + ' (low — обычно не дубли, а разные применения).');
    L.push('');
    L.push('## 1. Автослияния (одинаковый нормализованный OEM)');
    if (!res.auto.length) L.push('_Нет: точных дублей по OEM не найдено._');
    res.auto.forEach(g => {
        L.push('');
        L.push('### ' + g.key + ' — ' + g.items.length + ' записи → 1');
        g.items.forEach(p => L.push('- ' + fmtP(p)));
        L.push('- **итог:** `' + (g.merged.o || g.merged.oem || '') + '` · ' + (g.merged.n || g.merged.name) + ' · аналогов: ' + ((g.merged.a || g.merged.analogs || []).length) + ', моторов: ' + ((g.merged.engines || []).length));
    });
    L.push('');
    L.push('## 2. Подозрения (требуют ручного решения)');
    if (!res.suspicious.length) L.push('_Нет._');
    res.suspicious.forEach((g, i) => {
        const tag = g.pri === 'high' ? '🔴' : g.pri === 'medium' ? '🟡' : '🟢';
        L.push('');
        L.push('### ' + (i + 1) + '. ' + tag + ' [' + g.reason + ']');
        g.items.forEach(p => L.push('- ' + fmtP(p)));
        L.push('- **рекомендация:** ' + (g.key.startsWith('seg:')
            ? 'композитная позиция (набор крепежа) и одиночная деталь с тем же номером. Обе легитимны: `_dedupeParts` их не схлопнет (ключ — вся строка OEM). Проверьте, что в составной позиции есть ссылка на одиночную (правило M7 миграции 1.10.6), и не заказывайте номер дважды.'
            : g.pri === 'low'
                ? 'обычно это разные применения одного названия — оставьте как есть, если применимость (моторы/кузова) различается.'
                : 'если это супрессия — оставьте обе позиции и проставьте `sup` у старой; если дубль — объедините вручную и удалите лишнюю.'));
    });
    L.push('');
    L.push('---');
    L.push('_Сформировано tools/dedup.js. Автоправкам подвергаются только группы из раздела 1._');
    return L.join('\n');
}

/* ---------- main ---------- */
function run(argv) {
    const args = argv.slice(2);
    const get = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
    const src = get('--src') || 'data-src';
    const out = get('--out') || 'restore';
    const apply = args.includes('--apply');
    findGroups.minSim = parseFloat(get('--min-sim') || '0.85');
    const { files, items } = loadSources(src);
    const res = findGroups(items);
    /* автослияние */
    const mergedSet = new Set();
    const merged = [];
    res.auto.forEach(g => {
        const m = mergeParts(g.items);
        g.merged = m;
        merged.push(m);
        g.items.forEach(p => mergedSet.add(p));
    });
    const clean = items.filter(p => !mergedSet.has(p)).map(p => { const c = Object.assign({}, p); delete c._src; delete c._idx; return c; })
        .concat(merged.map(m => { const c = Object.assign({}, m); delete c._src; delete c._idx; return c; }));
    const output = { inputCount: items.length, outputCount: clean.length };
    console.log('источников:', files.length, '| позиций:', items.length);
    console.log('автослияний:', res.auto.length, '(−' + (items.length - clean.length) + ' позиций)');
    console.log('подозрений (ручная проверка):', res.suspicious.length);
    if (apply) {
        fs.mkdirSync(out, { recursive: true });
        fs.writeFileSync(path.join(out, 'parts.dedup.json'), JSON.stringify(clean));
        fs.writeFileSync(path.join(out, 'duplicates.json'), JSON.stringify({
            auto: res.auto.map(g => ({ key: g.key, reason: g.reason, ids: g.items.map(p => p.id || p._src + '#' + p._idx), mergedId: g.merged.id })),
            suspicious: res.suspicious.map(g => ({ key: g.key, reason: g.reason, pri: g.pri, ids: g.items.map(p => p.id || p._src + '#' + p._idx) }))
        }, null, 2));
        fs.writeFileSync(path.join(out, 'DEDUP-REPORT.md'), buildReport(res, merged, files, output));
        console.log('записано:', path.join(out, 'parts.dedup.json'), '· duplicates.json · DEDUP-REPORT.md');
    } else {
        console.log('(dry-run: добавьте --apply, чтобы записать результаты)');
    }
    return { res, clean, output };
}

if (require.main === module) run(process.argv);
module.exports = { normOem, nz, jaccard, supersessionLike, mergeParts, findGroups, loadSources, run };
