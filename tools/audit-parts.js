#!/usr/bin/env node
/* ============================================================
   tools/audit-parts.js — внутренний аудит каталога на противоречия
   ------------------------------------------------------------
   Зачем: прежде чем «наполнять» базу внешней информацией, надо
   вычистить противоречия внутри неё самой — иначе новые данные
   лягут поверх старых и станет хуже. Инструмент НЕ меняет файлы,
   он собирает список расхождений с доказательствами.

   Проверки (A…J):
     A  моменты затяжки в карточках против раздела «Моменты затяжки»
     B  разные моменты у одного и того же узла внутри карточек
     C  суперсессии (общая база OEM, хвост ≤2 знака) без поля `sup`
     D  в названии упомянут код мотора, которого нет в `engines`
     E  в названии упомянут объём (1.4, 1.9 TDI…), но `engines` пуст
     F  `gens` противоречит `bodies` (6N1/6N2 против caddy-*)
     G  интервалы обслуживания: одно изделие, разные цифры
     H  одинаковое название в разных категориях/подкатегориях
     I  записи без применимости в категориях, где она обязательна
     J  «мёртвые» артикулы: аналог/донор указывает на несуществующую позицию

   Запуск:  node tools/audit-parts.js [--json] [--top N]
   Отчёт:   restore/PARTS-AUDIT.md + restore/parts-audit.json
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ARGS = process.argv.slice(2);
const TOP = (() => { const i = ARGS.indexOf('--top'); return i >= 0 ? Number(ARGS[i + 1]) || 20 : 20; })();

const parts = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'parts.json'), 'utf8'));
const sections = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'sections.json'), 'utf8'));
const appSrc = fs.readFileSync(path.join(ROOT, 'js', 'app.js'), 'utf8');
const ENGINES = new Set([...appSrc.slice(appSrc.indexOf('const ENGINES = {'), appSrc.indexOf('\n};')).matchAll(/'([^']+)'\s*:/g)].map(m => m[1]));
const ENGINE_FAM_BLOCK = appSrc.slice(appSrc.indexOf('const ENGINE_FAMILIES = {'), appSrc.indexOf('const ENGINE_CODE_FAM'));
const BODIES = new Set([...appSrc.slice(appSrc.indexOf('const BODIES = {'), appSrc.indexOf('\n};', appSrc.indexOf('const BODIES = {'))).matchAll(/'([^']+)'\s*:/g)].map(m => m[1]));

const norm = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const oemOf = r => String(r.o || r.oem || '').trim();
const nameOf = r => String(r.n || r.name || '').trim();
const instOf = r => (Array.isArray(r.i) ? r.i.map(x => (Array.isArray(x) ? x[1] : ''))
    : (Array.isArray(r.inst) ? r.inst.map(x => (x && x.text) || '') : [])).filter(Boolean);
const label = r => '`' + (oemOf(r) || '—') + '` ' + nameOf(r);

const F = { A: [], B: [], C: [], D: [], E: [], F: [], G: [], H: [], I: [], J: [] };

/* ---------- A/B: моменты затяжки ---------- */
/* из справочника «Моменты затяжки» */
const refTorque = [];
(sections.Torque.rows || []).forEach(row => {
    const m = String(row[1]).match(/(\d{1,3}(?:[.,]\d)?)\s*(?:Нм|Nm)/i);
    if (m) refTorque.push({ node: String(row[0]).toLowerCase(), val: parseFloat(m[1].replace(',', '.')) });
});
/* из карточек */
const cardTorque = [];
parts.forEach((r, i) => instOf(r).forEach(t => {
    const m = t.match(/(\d{1,3}(?:[.,]\d)?)\s*(?:Нм|Nm)/i);
    if (m) cardTorque.push({ i, oem: oemOf(r), name: nameOf(r), val: parseFloat(m[1].replace(',', '.')), text: t.slice(0, 90) });
}));
/* B: одна и та же нормализованная база OEM — разные моменты */
const byBase = new Map();
cardTorque.forEach(t => {
    const base = norm(t.oem).replace(/[A-Z]{1,3}$/g, x => (/^\d+$/.test(x) ? x : ''));
    const key = base || norm(t.oem);
    if (!byBase.has(key)) byBase.set(key, []);
    byBase.get(key).push(t);
});
byBase.forEach((list, key) => {
    /* шум убираем: сравниваем только записи с ОДИНАКОВЫМ названием и только
       одиночные значения — строки вида «Верх 25, низ 60 Нм» описывают РАЗНЫЕ
       крепёжные точки, а не противоречат друг другу */
    const single = list.filter(x => (x.text.match(/\d{1,3}(?:[.,]\d)?\s*(?:Нм|Nm)/gi) || []).length === 1);
    const names = new Set(single.map(x => x.name.toLowerCase().replace(/\s+/g, ' ')));
    const vals = [...new Set(single.map(x => x.val))];
    if (vals.length > 1 && names.size === 1 && key.length >= 6) {
        F.B.push({ key, vals, items: single.map(x => ({ oem: x.oem, name: x.name, val: x.val, text: x.text })) });
    }
});
/* A: карточка против справочника «Моменты затяжки».
   Сравнение — ТОЛЬКО по артикулам, которые справочник сам цитирует
   («К N 905 876 02»): сопоставление по ключевым словам давало 88 ложных пар
   («Свечи зажигания» против «Свечи накаливания»). */
const ART_RE = /\b(?:[0-9A-Z]{3} \d{3} \d{3}[A-Z0-9 ]*|N \d{3} \d{3} \d{1,2}|WHT \d{3} \d{3}|G \d{3} \d{3}[A-Z0-9 ]*|VW \d{3} \d{2})\b/g;
const cardByOem = new Map();
cardTorque.forEach(t => { if (!cardByOem.has(norm(t.oem))) cardByOem.set(norm(t.oem), t); });
(sections.Torque.rows || []).forEach(row => {
    const m = String(row[1]).match(/(\d{1,3}(?:[.,]\d)?)\s*(?:Нм|Nm)/i);
    if (!m) return;
    const refVal = parseFloat(m[1].replace(',', '.'));
    const arts = [...new Set((row.join(' ').match(ART_RE) || []).map(a => norm(a)))];
    arts.forEach(a => {
        const card = cardByOem.get(a);
        if (!card) return;
        if (Math.abs(card.val - refVal) > 0.51)
            F.A.push({ oem: card.oem, name: card.name, card: card.val, ref: refVal, refNode: String(row[0]), text: card.text });
    });
});

/* ---------- C: суперсессии без sup ---------- */
const byOemNorm = new Map();
parts.forEach((r, i) => {
    const n = norm(oemOf(r));
    if (!n) return;
    if (!byOemNorm.has(n)) byOemNorm.set(n, []);
    byOemNorm.get(n).push(i);
});
const supLike = (a, b) => {
    if (!a || !b || a === b) return false;
    let i = 0;
    while (i < Math.min(a.length, b.length) && a[i] === b[i]) i++;
    const da = a.slice(i), db = b.slice(i);
    return i >= 8 && da.length <= 2 && db.length <= 2 && /^[A-Z0-9]*$/.test(da + db);
};
const allNorm = [...byOemNorm.keys()];
const supSeen = new Set();
allNorm.forEach(a => {
    const rec = parts[byOemNorm.get(a)[0]];
    if (rec.sup) return;
    allNorm.forEach(b => {
        if (a >= b || !supLike(a, b)) return;
        const pair = a + '~' + b;
        if (supSeen.has(pair)) return;
        supSeen.add(pair);
        const ra = parts[byOemNorm.get(a)[0]], rb = parts[byOemNorm.get(b)[0]];
        if (nameOf(ra).toLowerCase().replace(/\s+/g, ' ') !== nameOf(rb).toLowerCase().replace(/\s+/g, ' ')) return;
        /* Вариант по датам/шасси — НЕ суперсессия: обе позиции актуальны каждая
           для своего периода, `sup` у них ставить нельзя. Признак — диапазон
           шасси (F 6N-…>>), годы или «до/с …» в названии либо инструкции. */
        const both = [ra, rb].map(r => (nameOf(r) + ' ' + instOf(r).join(' ')).toLowerCase());
        const dateVariant = both.some(t => /(f\s*6n-|>>|\d{2}\.\d{4}|\d{4}\s*[–-]\s*\d{2,4}|первая партия|переходн|серия)/.test(t));
        F.C.push({
            a: oemOf(ra), b: oemOf(rb), name: nameOf(ra), cat: ra.cat,
            kind: dateVariant ? 'вариант по датам/шасси — sup НЕ нужен' : 'кандидат в суперсессии — решить, какой артикул новый'
        });
    });
});

/* ---------- D/E: название против применимости ---------- */
parts.forEach((r, i) => {
    const n = nameOf(r);
    const eng = r.engines || [];
    /* D: в названии код мотора (3 заглавные буквы как отдельное слово) */
    const codes = [...n.matchAll(/\b([A-Z]{3})\b/g)].map(m => m[1]).filter(c => ENGINES.has(c));
    codes.forEach(c => {
        if (!eng.includes(c)) F.D.push({ i, oem: oemOf(r), name: n, code: c, engines: eng.slice(0, 8) });
    });
    /* E: в названии объём/тип мотора, но engines пуст */
    if (!eng.length) {
        const m = n.match(/\b(1[.,]0|1[.,]05|1[.,]3|1[.,]4|1[.,]6|1[.,]7|1[.,]9)\s*(16V|8V|SDI|TDI|D)?/i);
        if (m && !/шин|диск|лампа|масло|жидкост|очистит/i.test(n))
            F.E.push({ i, oem: oemOf(r), name: n, mention: m[0], cat: r.cat });
    }
});

/* ---------- F: gens против bodies ---------- */
parts.forEach((r, i) => {
    const gens = r.gens || [], bod = r.bodies || [];
    if (!gens.length || !bod.length) return;
    const caddyOnly = bod.every(b => String(b).startsWith('caddy'));
    const poloOnly = bod.every(b => ['3d', '5d', 'classic', 'estate'].includes(b));
    if (caddyOnly && gens.some(g => /^6N/.test(g)))
        F.F.push({ i, oem: oemOf(r), name: nameOf(r), gens, bodies: bod, why: 'кузова только Caddy, но заявлено поколение 6N' });
    if (poloOnly && gens.every(g => !/^6N/.test(g)))
        F.F.push({ i, oem: oemOf(r), name: nameOf(r), gens, bodies: bod, why: 'кузова Polo, но поколение не 6N' });
});

/* ---------- G: интервалы ---------- */
const INTERVAL_RE = /(\d{1,3}(?:[.,]\d{3})*|\d{1,3})\s*(?:000|тыс)?\s*(км|km|тыс\.|лет|год|мес|месяц)/gi;
const byNameLower = new Map();
parts.forEach((r, i) => {
    const k = nameOf(r).toLowerCase().replace(/\s+/g, ' ').replace(/^[🔧🎒📊⚠️🛢️💡]+\s*/, '').trim();
    if (!k || k.length < 6) return;
    if (!byNameLower.has(k)) byNameLower.set(k, []);
    byNameLower.get(k).push({ i, oem: oemOf(r), name: nameOf(r), inst: instOf(r) });
});
byNameLower.forEach(list => {
    if (list.length < 2) return;
    const ivs = list.map(x => {
        const s = new Set();
        x.inst.forEach(t => { let m; INTERVAL_RE.lastIndex = 0; while ((m = INTERVAL_RE.exec(t))) s.add(m[0].toLowerCase().replace(/\s+/g, '')); });
        return [...s];
    });
    const flat = ivs.flat();
    if (new Set(flat).size > 1 && ivs.every(v => v.length)) {
        F.G.push({ name: list[0].name, items: list.map((x, n) => ({ oem: x.oem, iv: ivs[n].join(', ') })) });
    }
});

/* ---------- H: одинаковое название в разных категориях ---------- */
const byName = new Map();
parts.forEach((r, i) => {
    const k = nameOf(r).toLowerCase().replace(/\s+/g, ' ').replace(/^[🔧🎒📊⚠️🛢️💡]+\s*/, '').trim();
    if (!k || k.length < 8) return;
    if (!byName.has(k)) byName.set(k, []);
    byName.get(k).push({ i, oem: oemOf(r), cat: r.cat, sub: r.sub || '' });
});
byName.forEach(list => {
    const cats = new Set(list.map(x => x.cat + '/' + x.sub));
    if (cats.size > 1) F.H.push({ name: list[0].cat ? list.map(x => x).slice(0, 1)[0] && nameOf(parts[list[0].i]) : '', items: list });
});

/* ---------- I: нет применимости там, где она нужна ---------- */
const NEED_APP = new Set(['Engine', 'Cooling', 'Ignition', 'Fuel', 'Exhaust', 'Transmission', 'Brakes', 'Suspension', 'Steering', 'RearAxle']);
parts.forEach((r, i) => {
    if (!NEED_APP.has(r.cat)) return;
    const has = (r.engines || []).length || (r.bodies || []).length || (r.gens || []).length ||
        (r.transmissions || []).length || (r.transCodes || []).length;
    if (!has) F.I.push({ i, oem: oemOf(r), name: nameOf(r), cat: r.cat, sub: r.sub || '' });
});

/* ---------- J: аналог/донор, которого нет в каталоге (информационно) ---------- */
const oemSet = new Set(parts.map(r => norm(oemOf(r))));
let analogTotal = 0, analogInDb = 0;
parts.forEach(r => (r.a || []).forEach(a => {
    const n = norm(a);
    if (n.length < 5) return;
    analogTotal++;
    if (oemSet.has(n)) analogInDb++;
}));

/* ---------- отчёт ---------- */
const L = [];
L.push('# Внутренний аудит каталога — ' + new Date().toISOString().slice(0, 10));
L.push('');
L.push('Записей: **' + parts.length + '**. Инструмент ничего не меняет — только показывает расхождения.');
L.push('');
L.push('| Проверка | Что ищет | Найдено |');
L.push('|---|---|---|');
L.push('| A | момент в карточке против справочника «Моменты затяжки» | ' + F.A.length + ' |');
L.push('| B | разные моменты у одной базы OEM | ' + F.B.length + ' |');
L.push('| C | пары с общей базой OEM и одинаковым именем без `sup` | ' + F.C.length + ' |');
L.push('| D | в названии код мотора, которого нет в `engines` | ' + F.D.length + ' |');
L.push('| E | в названии объём/тип мотора, но `engines` пуст | ' + F.E.length + ' |');
L.push('| F | `gens` противоречит `bodies` | ' + F.F.length + ' |');
L.push('| G | одно изделие — разные интервалы | ' + F.G.length + ' |');
L.push('| H | одинаковое название в разных категориях | ' + F.H.length + ' |');
L.push('| I | нет применимости в категориях, где она обязательна | ' + F.I.length + ' |');
L.push('');
L.push('Аналогов всего ' + analogTotal + ', из них указывают на позицию этого же каталога: ' + analogInDb + '.');
L.push('');

function sect(title, arr, fmt) {
    L.push('## ' + title + ' (' + arr.length + ')');
    L.push('');
    if (!arr.length) { L.push('_Нет._'); L.push(''); return; }
    arr.slice(0, TOP).forEach(x => L.push('- ' + fmt(x)));
    if (arr.length > TOP) L.push('- … и ещё ' + (arr.length - TOP) + ' (полный список в restore/parts-audit.json)');
    L.push('');
}
sect('A. Моменты: карточка против справочника', F.A, x => '`' + x.oem + '` ' + x.name + ' — в карточке **' + x.card + ' Нм**, в справочнике «' + x.node + '» **' + x.ref + ' Нм**');
sect('B. Разные моменты у одной базы OEM', F.B, x => x.items.map(i => '`' + i.oem + '` ' + i.name + ' → **' + i.val + ' Нм**').join('  ⟷  '));
const cSup = F.C.filter(x => x.kind.startsWith('кандидат'));
const cVar = F.C.filter(x => !x.kind.startsWith('кандидат'));
L.push('Из ' + F.C.length + ' пар: кандидатов в настоящие суперсессии — **' + cSup.length + '**, вариантов по датам/шасси (`sup` ставить НЕЛЬЗЯ) — **' + cVar.length + '**.');
L.push('');
sect('C1. Кандидаты в суперсессии без sup', cSup, x => '`' + x.a + '` → `' + x.b + '` · ' + x.name + ' (' + x.cat + ')');
sect('C2. Варианты по датам/шасси — sup не нужен', cVar, x => '`' + x.a + '` ↔ `' + x.b + '` · ' + x.name);
sect('D. Код мотора в названии, но нет в engines', F.D, x => '`' + x.oem + '` ' + x.name + ' — упомянут **' + x.code + '**, в engines: ' + (x.engines.join(', ') || 'пусто'));
sect('E. Объём/тип мотора в названии при пустом engines', F.E, x => '`' + x.oem + '` ' + x.name + ' — «' + x.mention + '» (' + x.cat + ')');
sect('F. gens против bodies', F.F, x => '`' + x.oem + '` ' + x.name + ' — ' + x.why + ' (gens: ' + x.gens.join(',') + '; bodies: ' + x.bodies.join(',') + ')');
sect('G. Разные интервалы у одного изделия', F.G, x => x.name + ': ' + x.items.map(i => '`' + i.oem + '` → ' + i.iv).join('  |  '));
sect('H. Одинаковое название в разных категориях', F.H, x => x.items.map(i => '`' + (i.oem || '—') + '` ' + i.cat + '/' + i.sub).join('  |  '));
sect('I. Нет применимости (первые ' + TOP + ' из ' + F.I.length + ')', F.I, x => '`' + x.oem + '` ' + x.name + ' (' + x.cat + '/' + x.sub + ')');

const OUT = path.join(ROOT, 'restore');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'PARTS-AUDIT.md'), L.join('\n'), 'utf8');
fs.writeFileSync(path.join(OUT, 'parts-audit.json'), JSON.stringify({ generated: new Date().toISOString(), counts: Object.fromEntries(Object.entries(F).map(([k, v]) => [k, v.length])), findings: F }, null, 1), 'utf8');

if (ARGS.includes('--json')) console.log(JSON.stringify({ counts: Object.fromEntries(Object.entries(F).map(([k, v]) => [k, v.length])), analogTotal, analogInDb }));
else {
    console.log('каталог: ' + parts.length + ' записей');
    Object.entries(F).forEach(([k, v]) => console.log('  ' + k + ': ' + String(v.length).padStart(4)));
    console.log('отчёт: restore/PARTS-AUDIT.md');
}
