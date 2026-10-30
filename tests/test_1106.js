#!/usr/bin/env node
/* ============================================================
   tests/test_1106.js — проверки релиза 1.10.6
   ------------------------------------------------------------
   Прогоняется без браузера и без jsdom: нужные функции берутся
   прямо из исходника js/app.js и выполняются в vm-песочнице
   с заглушками (gAV, document и т. п.). Данные читаются из
   data/parts.json и data-src/.

   Запуск:  node tests/test_1106.js
   Формат вывода — как у остальных сюит: «N ok, M fail», exit 1 при ошибках.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'js', 'app.js'), 'utf8');

let ok = 0, fail = 0;
const fails = [];
function t(name, fn) {
    try { fn(); ok++; }
    catch (e) { fail++; fails.push(name + ' — ' + e.message); }
}
const eq = (a, b, m) => { if (a !== b) throw new Error((m || '') + ' ожидается ' + JSON.stringify(b) + ', получено ' + JSON.stringify(a)); };
const okTrue = (v, m) => { if (!v) throw new Error(m || 'ожидалось true'); };

/* ---------- вырезание кусков исходника ---------- */
function cut(start, endMark) {
    const i = src.indexOf(start);
    if (i < 0) throw new Error('в js/app.js не найдено: ' + start.slice(0, 40));
    const j = src.indexOf(endMark, i);
    if (j < 0) throw new Error('в js/app.js не найден конец: ' + endMark);
    return src.slice(i, j + endMark.length);
}
const pieces = [
    cut('const normOem = ', ';\n'),
    cut('const AN_JUNK_RE = ', ';\n'),
    cut('const anCodeOk = s => {', '\n};'),
    cut('const IM = {', '};'),
    cut('const MI = {', '};'),
    cut('function instEntry(x) {', '\n}\n'),
    cut('function parseInst(p) {', '\n}\n'),
    cut('const nz = ', ';\n'),
    cut('function pCompat(p) {', '\n}\n')
];
/* песочница: заглушка активного автомобиля для pCompat */
const sandbox = { _av: null, gAV: function () { return sandbox._av; } };
vm.createContext(sandbox);
/* const/let в vm не становятся свойствами песочницы — выгружаем явно */
vm.runInContext(pieces.join('\n') +
    '\n;Object.assign(globalThis, { normOem, AN_JUNK_RE, anCodeOk, IM, MI, instEntry, parseInst, nz, pCompat });',
    sandbox);
const A = sandbox;

/* ================= anCodeOk ================= */
t('anCodeOk: мусорные описания не проходят', () => {
    ['Universeel 10.9', 'Universeel 8.8', 'Universeel М12', 'Universeel сфера R14',
        'Universeel mini 10A', 'Universal 200А', 'Universal brass', 'Used part',
        'Repro', 'Refurbished', 'ФЭСТ', 'Любой по ГОСТ'].forEach(s => {
            eq(A.anCodeOk(s), false, '«' + s + '»');
        });
});
t('anCodeOk: настоящие артикулы проходят', () => {
    ['MAHLE LAK 63', 'GMB GWVW-13A', 'NGK BKR6E', 'ATE SL.6', '056 115 561 G',
        '6PK1070', 'MANN WK 613', 'Pioneer TS-G1033i', '030 121 008 D',
        'KAMOKA KC005', 'Denso K20TT', 'Bosch DOT 4'].forEach(s => {
            eq(A.anCodeOk(s), true, '«' + s + '»');
        });
});
t('anCodeOk: строка без цифр по-прежнему не код', () => {
    eq(A.anCodeOk('Kolbenschmidt'), false); eq(A.anCodeOk('Febi'), false);
});

/* ================= parseInst ================= */
t('parseInst: основной формат [["s","текст"]]', () => {
    const r = A.parseInst({ i: [['s', 'Момент: 110 Нм.'], ['w', 'Осторожно']] });
    eq(r.length, 2); eq(r[0].type, 'spec'); eq(r[0].text, 'Момент: 110 Нм.'); eq(r[1].type, 'warn');
});
t('parseInst: объекты {type,text} (старый inst)', () => {
    const r = A.parseInst({ inst: [{ type: 'spec', text: 'Индекс нагрузки 91' }, { type: 'warn', text: '3.4 бар' }] });
    eq(r.length, 2); eq(r[0].type, 'spec'); eq(r[1].type, 'warn'); eq(r[1].text, '3.4 бар');
});
t('parseInst: объекты внутри поля i (баг 1.10.5)', () => {
    const r = A.parseInst({ i: [{ type: 'note', text: 'Давление: 2.2 / 2.4' }] });
    eq(r.length, 1); eq(r[0].type, 'note'); eq(r[0].text, 'Давление: 2.2 / 2.4');
});
t('parseInst: плоский массив ["s","текст"] (баг 1.10.5)', () => {
    const r = A.parseInst({ i: ['s', 'Шланг вентиляции картера.'] });
    eq(r.length, 1); eq(r[0].type, 'spec'); eq(r[0].text, 'Шланг вентиляции картера.');
});
t('parseInst: пустое и мусор отбрасываются', () => {
    eq(A.parseInst({}).length, 0);
    eq(A.parseInst({ i: [] }).length, 0);
    eq(A.parseInst({ i: [null, ['s', ''], 'строка', ['x']] }).length, 0);
});
t('parseInst: короткий код и длинное имя типа дают одно и то же', () => {
    eq(A.parseInst({ i: [['w', 'A']] })[0].type, A.parseInst({ i: [{ type: 'warn', text: 'A' }] })[0].type);
});

/* ================= pCompat ================= */
const compat = (model, donors) => { A._av = { ok: true, model }; return A.pCompat({ donors }); };
t('pCompat: «VW Polo 6N» против «Polo (6N1)» = подходит', () => {
    const r = compat('Polo (6N1)', ['VW Polo 6N']); eq(r.cls, 'y'); eq(r.pct, 100);
});
t('pCompat: «VW Polo 6N» против «Polo (6N2)» = подходит', () => {
    eq(compat('Polo (6N2)', ['VW Polo 6N']).cls, 'y');
});
t('pCompat: Lupo/Arosa против Polo = не подходит', () => {
    eq(compat('Polo (6N1)', ['VW Lupo 1.0', 'Seat Arosa 1.0']).cls, 'n');
});
t('pCompat: пустые доноры = нет данных', () => {
    const r = compat('Polo (6N1)', []); eq(r.cls, 'u'); eq(r.label, 'нет данных');
});
t('pCompat: Caddy 9K находится и для фургона, и для комби', () => {
    eq(compat('Caddy (9K)', ['VW Caddy 9K']).cls, 'y');
    eq(compat('Caddy (9K)', ['VW Polo 6N']).cls, 'n');
});
t('pCompat: Golf IV против Polo не стал «подходит» (ложных срабатываний нет)', () => {
    eq(compat('Polo (6N1)', ['VW Golf IV', 'VW Bora']).cls, 'n');
});
t('pCompat: смешанный список — достаточно одного совпадения', () => {
    eq(compat('Polo (6N1)', ['VW Lupo', 'VW Polo 6N']).cls, 'y');
});

/* ================= словари (нужны и проверкам данных) ================= */
const dictKeys = name => {
    const i = src.indexOf('const ' + name + ' = {');
    const j = src.indexOf('\n};', i);
    return [...src.slice(i, j).matchAll(/'([^']+)'\s*:/g)].map(m => m[1]);
};
const ENGINES = dictKeys('ENGINES');
const ENGINES_SET = new Set(ENGINES);
const egbBlock = cut('const ENGINE_GEARBOX = {', '\n};');
const EGB = [...egbBlock.matchAll(/'([0-9A-Z]{2,4})'\s*:\s*\{\s*fams:/g)].map(m => m[1]);

/* ================= данные ================= */
const parts = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'parts.json'), 'utf8'));
const oemOf = r => String(r.o || r.oem || '');
const nameOf = r => String(r.n || r.name || '');
const byOem = o => parts.find(r => oemOf(r).trim() === o);

/* T1 (аудит 2026-10-27): ожидание было захардкожено (4124) и устарело —
   каталог вырос до 4 127. Теперь ожидаемое количество считается по data-src,
   то есть проверяется ровно то, что заявлено: «бандл = сумма источников».
   Это тот же инвариант, на котором стоит tools/build-parts.js. */
const SRC_DIR = path.join(ROOT, 'data-src');
const SRC_FILES = fs.existsSync(SRC_DIR)
    ? fs.readdirSync(SRC_DIR).filter(f => /^parts-.*\.json$/.test(f)).sort()
    : [];
const SRC_TOTAL = SRC_FILES.reduce((s, f) =>
    s + JSON.parse(fs.readFileSync(path.join(SRC_DIR, f), 'utf8')).length, 0);

t('parts.json = сумма ' + SRC_FILES.length + ' файлов-источников data-src', () => {
    okTrue(SRC_FILES.length > 0, 'в data-src нет parts-*.json');
    eq(parts.length, SRC_TOTAL);
});
t('parts.json: нет мусорных «аналогов»', () => {
    const bad = parts.filter(r => (r.a || r.analogs || []).some(x => /\b(universeel|universal|used part|repro|refurbished)\b/i.test(String(x))));
    eq(bad.length, 0, 'найдено ' + bad.length + ': ' + bad.slice(0, 3).map(r => oemOf(r)).join(', '));
});
t('parts.json: в `d` нет кодов моторов', () => {
    const bad = parts.filter(r => (r.d || []).some(x => /^[0-9A-Z]{2,4}$/.test(String(x).trim()) && ENGINES_SET.has(String(x).trim())));
    eq(bad.length, 0, 'найдено: ' + bad.slice(0, 3).map(r => oemOf(r)).join(', '));
});
t('parts.json: все инструкции разбираются parseInst (битых форматов нет)', () => {
    let bad = 0, total = 0;
    parts.forEach(r => {
        const list = Array.isArray(r.i) ? r.i : (Array.isArray(r.inst) ? r.inst : null);
        if (!list) return;
        total += list.length;
        const parsed = A.parseInst(r);
        if (parsed.length !== list.length) bad++;
    });
    eq(bad, 0, 'записей с потерей строк: ' + bad);
    okTrue(total > 1600, 'инструкций suspiciously мало: ' + total);
});
t('parts.json: шины Caddy 195/65 R15 снова показывают 3.4 бар', () => {
    const r = byOem('195/65 R15'); okTrue(r, 'запись не найдена');
    const txt = A.parseInst(r).map(x => x.text).join(' | ');
    okTrue(/3\.4/.test(txt), 'нет 3.4 бар: ' + txt.slice(0, 120));
    okTrue(/615 кг/.test(txt), 'нет индекса нагрузки');
});
t('parts.json: шланг вентиляции картера 030 103 493 BC с инструкцией', () => {
    const r = byOem('030 103 493 BC'); okTrue(r, 'запись не найдена');
    eq(A.parseInst(r).length, 1);
    okTrue(/Шланг вентиляции картера/.test(A.parseInst(r)[0].text));
});
t('parts.json: болт стартера М10 не тянет чужой крепёж', () => {
    const r = byOem('N 010 245 4'); okTrue(r, 'запись не найдена');
    eq((r.a || []).filter(x => /N (905|102|101)/.test(String(x))).length, 0);
});
t('parts.json: у гайки тормозного шланга нет динамика в аналогах', () => {
    const r = byOem('N 011 184 14'); okTrue(r, 'запись не найдена');
    eq((r.a || []).filter(x => /pioneer/i.test(String(x))).length, 0);
});
t('parts.json: 3A0 601 139 — доноры 4×100 и предупреждение', () => {
    const r = byOem('3A0 601 139'); okTrue(r, 'запись не найдена');
    okTrue(r.d.includes('VW Polo 6N') && r.d.includes('VW Golf III'), 'доноры: ' + r.d);
    eq(r.d.includes('VW Golf IV'), false); eq(r.d.includes('VW Passat B5'), false);
    okTrue(A.parseInst(r).some(x => x.type === 'warn' && /4×100/.test(x.text)), 'нет предупреждения про 4×100');
});
t('parts.json: AFD убран из применимости, AEH остался', () => {
    eq(parts.filter(r => (r.engines || []).includes('AFD')).length, 0);
    const r = byOem('1J0 411 105 BG'); okTrue(r, 'пружина не найдена');
    okTrue((r.engines || []).includes('AEH'), 'AEH потерян');
});
t('parts.json: 030 109 243 J помечен как заменённый (sup → K)', () => {
    const r = byOem('030 109 243 J'); okTrue(r, 'запись не найдена');
    eq(r.sup, '030 109 243 K');
});
t('parts.json: жгуты parts-21/22 на месте (206 новых позиций)', () => {
    const n = parts.filter(r => /^6N1 971 139/.test(oemOf(r))).length;
    okTrue(n >= 8, 'найдено только ' + n + ' жгутов салона');
    okTrue(parts.some(r => oemOf(r) === '6N1 971 139 AR'), 'нет 6N1 971 139 AR');
});
t('parts.json: дублей «OEM+название» нет', () => {
    const seen = new Set(); let d = 0;
    parts.forEach(r => { const k = (oemOf(r).toLowerCase() + '|' + nameOf(r).toLowerCase()); if (seen.has(k)) d++; seen.add(k); });
    eq(d, 0);
});

/* ================= словари: проверки ================= */
t('ENGINES: AEH добавлен', () => okTrue(ENGINES.includes('AEH'), 'AEH нет в ENGINES'));
t('ENGINE_GEARBOX покрывает все коды ENGINES', () => {
    const miss = ENGINES.filter(e => !EGB.includes(e));
    eq(miss.length, 0, 'нет записей для: ' + miss.join(', '));
});
t('ENGINE_GEARBOX: у AKV появился код DXP', () => {
    const m = /'AKV':\s*\{\s*fams:\s*\[[^\]]*\]\s*,\s*codes:\s*\[([^\]]*)\]/.exec(egbBlock);
    okTrue(m && /DXP/.test(m[1]), 'DXP не найден у AKV');
});
t('ENGINE_FAMILIES: AEH в EA111', () => {
    const fam = cut('const ENGINE_FAMILIES = {', 'const ENGINE_CODE_FAM');
    const ea111 = /'EA111':[\s\S]*?codes:\s*\[([^\]]*)\]/.exec(fam);
    okTrue(ea111 && /'AEH'/.test(ea111[1]), 'AEH не в списке EA111');
});

/* ================= версии ================= */
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const upd = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'update.json'), 'utf8'));
t('версия синхронна в 5 местах', () => {
    const vApp = /let APP_VERSION = '([^']+)'/.exec(src)[1];
    const vMeta = /app-ui-ver" content="([^"]+)"/.exec(html)[1];
    const vCss = /app\.css\?v=([0-9.]+)/.exec(html)[1];
    const vCh = upd.changelog[0].version;
    eq(vMeta, vApp, 'index.html meta'); eq(vCss, vApp, 'index.html css?v=');
    eq(upd.appVersion, vApp, 'update.json appVersion'); eq(vCh, vApp, 'changelog[0]');
    eq(vApp, upd.appVersion, 'app.js ↔ update.json');
});
t('changelog: версии строго по убыванию и без дублей', () => {
    const sem = v => v.split('.').map(Number);
    const seen = new Set();
    upd.changelog.forEach((c, i) => {
        okTrue(!seen.has(c.version), 'дубль ' + c.version); seen.add(c.version);
        okTrue(!!c.date && Array.isArray(c.changes) && c.changes.length, c.version + ': нет даты/изменений');
        if (i) {
            const a = sem(c.version), b = sem(upd.changelog[i - 1].version);
            okTrue(a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]) || (a[0] === b[0] && a[1] === b[1] && a[2] < b[2]), 'порядок нарушен у ' + c.version);
        }
    });
});

/* ================= аналогии рантайма ================= */
t('analogs.json: KB не содержит мусорных значений', () => {
    const a = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'analogs.json'), 'utf8'));
    let bad = 0;
    Object.keys(a.kb).forEach(k => (a.kb[k] || []).forEach(v => { if (!A.anCodeOk(v)) bad++; }));
    eq(bad, 0);
});
t('restore/parts.with-analogs.json: нет ложных кроссов через «Universeel»', () => {
    const p = path.join(ROOT, 'restore', 'parts.with-analogs.json');
    if (!fs.existsSync(p)) return;   // не собран — не ошибка
    const wa = JSON.parse(fs.readFileSync(p, 'utf8'));
    const g = wa.find(r => oemOf(r).trim() === 'N 011 184 14');
    okTrue(g && !(g.a || []).some(x => /pioneer/i.test(String(x))), 'у гайки снова динамик');
    const b = wa.find(r => oemOf(r).trim() === 'N 010 245 4');
    okTrue(b && (b.a || []).length === 0, 'у болта стартера появились чужие номера');
});

/* ================= итог ================= */
console.log('test_1106: ' + ok + ' ok, ' + fail + ' fail');
if (fail) { fails.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
