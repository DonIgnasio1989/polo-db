#!/usr/bin/env node
/* ============================================================
   tools/validate-data.js — проверки данных и версий перед релизом
   ------------------------------------------------------------
   Что проверяет (ошибки = exit 1, предупреждения = exit 0):
     1. синхронность версии в 5 местах (app.js / index.html ×2 /
        update.json appVersion / changelog[0].version);
     2. update.json: changelog по semver, файлы из files[] на месте;
     3. детали: дубли, неизвестные коды словарей, битый формат `i`,
        мусорные «аналоги», коды моторов в `d`, записи без OEM/названия;
     4. data/parts.json ↔ data-src (дрейф сборки);
     5. sections.json / categories.json — id и арность строк;
     6. pr-codes: покрытие кодов из vin-db.* и RU-переводов;
     7. vin-db: формат VIN, сверка filtered-only ↔ filtered-vins.txt,
        валидность полей патча;
     8. словари app.js: ENGINE_GEARBOX покрывает ENGINES, коды семейств
        известны, буквенные коды КПП не дублируются между семействами.

   Запуск:  node tools/validate-data.js [--json] [--quiet]
   Отчёт:   restore/VALIDATION.md
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'restore');
const ARGS = process.argv.slice(2);
const QUIET = ARGS.includes('--quiet');
const SKIP_PROD = ARGS.includes('--skip-prod');   /* сборка ещё не выполнена */

const errors = [], warns = [], notes = [];
const E = (rule, msg) => errors.push({ rule, msg });
const W = (rule, msg) => warns.push({ rule, msg });
const N = (rule, msg) => notes.push({ rule, msg });

/* ---------- чтение ---------- */
const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const exists = p => fs.existsSync(p);
const appSrc = fs.readFileSync(path.join(ROOT, 'js', 'app.js'), 'utf8');
const htmlSrc = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

function block(name) {
    const i = appSrc.indexOf('const ' + name + ' = {');
    if (i < 0) throw new Error('в js/app.js нет const ' + name);
    const j = appSrc.indexOf('\n};', i);
    return appSrc.slice(i, j);
}
const keysOf = b => [...b.matchAll(/'([^']+)'\s*:/g)].map(m => m[1]);

/* словари приложения */
const ENGINES = new Set(keysOf(block('ENGINES')));
const BODIES = new Set(keysOf(block('BODIES')));
const GENERATIONS = new Set(keysOf(block('GENERATIONS')));
const TRANSMISSIONS = new Set(keysOf(block('TRANSMISSIONS')));
const TRIMS = new Set([...(appSrc.match(/const TRIMS = \[([^\]]*)\]/) || [, ''])[1].matchAll(/'([^']+)'/g)].map(m => m[1]));
/* BASE_CATS — массив, а не объект: берём текст до закрывающей ]; */
const bcStart = appSrc.indexOf('const BASE_CATS = [');
if (bcStart < 0) throw new Error('в js/app.js нет const BASE_CATS');
const BASE_CATS = new Set([...appSrc.slice(bcStart, appSrc.indexOf('\n];', bcStart)).matchAll(/id:\s*'([^']+)'/g)].map(m => m[1]));
const SEC_TABLE_IDS = [...(appSrc.match(/const SEC_TABLE_IDS = \[([^\]]*)\]/) || [, ''])[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
/* семейства КПП и их буквенные коды */
const gbBlock = appSrc.slice(appSrc.indexOf('const GEARBOX = {'), appSrc.indexOf('const GEARBOX_MISC'));
const GEARBOX_FAMS = new Set([...gbBlock.matchAll(/'(\w+)'\s*:\s*\{\s*\n?\s*label:/g)].map(m => m[1]));
const GEARBOX_CODES = new Set([...gbBlock.matchAll(/'([A-Z0-9]{3,6})'/g)].map(m => m[1]));
/* код мотора → КПП */
const egbBlock = appSrc.slice(appSrc.indexOf('const ENGINE_GEARBOX = {'), appSrc.indexOf('\n};', appSrc.indexOf('const ENGINE_GEARBOX = {')));
const ENGINE_GEARBOX = Object.fromEntries([...egbBlock.matchAll(/'([0-9A-Z]{2,4})'\s*:\s*\{\s*fams:\s*\[([^\]]*)\]\s*,\s*codes:\s*\[([^\]]*)\]/g)]
    .map(m => [m[1], { fams: m[2].split(',').map(s => s.trim().replace(/'/g, '')).filter(Boolean), codes: m[3].split(',').map(s => s.trim().replace(/'/g, '')).filter(Boolean) }]));
/* IM/MI — коды инструкций */
const IM = Object.fromEntries([...((appSrc.match(/const IM = \{([^}]*)\}/) || [, ''])[1]).matchAll(/(\w+):\s*'(\w)'/g)].map(m => [m[1], m[2]]));
const MI = Object.fromEntries(Object.entries(IM).map(([k, v]) => [v, k]));

/* ---------- правила, общие с js/app.js ---------- */
const normOem = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const AN_JUNK_RE = /\b(universeel|universal|used\s*part|repro|refurbished)\b/i;
const anCodeOk = s => {
    const raw = String(s || '');
    if (/[а-яА-ЯёЁ]/.test(raw)) return false;
    if (AN_JUNK_RE.test(raw)) return false;
    const n = normOem(raw);
    return n.length >= 5 && /[0-9]/.test(n);
};
const oemOf = r => String(r.o || r.oem || '').trim();
const nameOf = r => String(r.n || r.name || '').trim();
const mkey = r => (oemOf(r).toLowerCase() + '|' + nameOf(r).toLowerCase());
const instOk = x => Array.isArray(x) && x.length === 2 && typeof x[1] === 'string' && x[1].trim().length > 0 && !!MI[x[0]];

/* ============================================================
   1. Версии
   ============================================================ */
const vApp = (appSrc.match(/let APP_VERSION = '([^']+)'/) || [])[1];
const vMeta = (htmlSrc.match(/<meta name="app-ui-ver" content="([^"]+)"/) || [])[1];
const vCss = (htmlSrc.match(/css\/app\.css\?v=([0-9][^"']*)/) || [])[1];
let vUpd = '', vChlog = '';
if (exists(path.join(ROOT, 'data', 'update.json'))) {
    const u = readJson(path.join(ROOT, 'data', 'update.json'));
    vUpd = String(u.appVersion || '');
    vChlog = Array.isArray(u.changelog) && u.changelog.length ? String(u.changelog[0].version || '') : '';
    /* 2. changelog */
    const sem = v => { const m = /^(\d+)\.(\d+)\.(\d+)/.exec(String(v || '')); return m ? [+m[1], +m[2], +m[3]] : null; };
    const seen = new Set();
    (u.changelog || []).forEach((c, i) => {
        if (!c || !c.version) return E('update.json', 'changelog[' + i + '] без version');
        if (seen.has(String(c.version))) E('update.json', 'changelog: дубль версии ' + c.version);
        seen.add(String(c.version));
        if (!c.date) W('update.json', 'changelog ' + c.version + ' без даты');
        if (!Array.isArray(c.changes) || !c.changes.length) W('update.json', 'changelog ' + c.version + ' без списка изменений');
        const a = sem(c.version), b = i ? sem((u.changelog[i - 1] || {}).version) : null;
        if (a && b && (a[0] > b[0] || (a[0] === b[0] && a[1] > b[1]) || (a[0] === b[0] && a[1] === b[1] && a[2] > b[2])))
            E('update.json', 'changelog: версия ' + c.version + ' старше предыдущей ' + u.changelog[i - 1].version + ' (порядок нарушен)');
    });
    if (!u.releasedAt) W('update.json', 'нет releasedAt (app.js:3553 читает именно его, не updatedAt)');
    (u.files || []).forEach(f => {
        const p = path.join(ROOT, f.path || f);
        if (!exists(p)) E('update.json', 'files[]: нет файла ' + (f.path || f));
        if (f.type && !['parts', 'categories', 'sections', 'analogs', 'workshops'].includes(f.type))
            W('update.json', 'files[]: неизвестный type «' + f.type + '» у ' + f.path);
    });
}
[[vApp, 'js/app.js APP_VERSION'], [vMeta, 'index.html meta app-ui-ver'], [vCss, 'index.html css?v='],
[vUpd, 'data/update.json appVersion'], [vChlog, 'update.json changelog[0].version']]
    .forEach(([v, where]) => { if (!v) E('version', 'не удалось прочитать версию: ' + where); });
const allV = [vApp, vMeta, vCss, vUpd, vChlog];
if (new Set(allV).size !== 1) E('version', 'рассинхрон версий: ' + allV.join(' / '));
else N('version', 'версия синхронна во всех 5 местах: ' + vApp);

/* ============================================================
   3. Детали (data-src + data/parts.json)
   ============================================================ */
const SRC = path.join(ROOT, 'data-src');
const srcFiles = exists(SRC) ? fs.readdirSync(SRC).filter(f => /^parts-.*\.json$/.test(f))
    .sort((a, b) => ((a.match(/parts-(\d+)/) || [0, 99])[1] | 0) - ((b.match(/parts-(\d+)/) || [0, 99])[1] | 0) || a.localeCompare(b)) : [];
const CATS = new Set([...BASE_CATS, ...(exists(path.join(ROOT, 'data', 'categories.json')) ? readJson(path.join(ROOT, 'data', 'categories.json')).map(c => c.id) : [])]);
const DONOR_RE = /(vw|volkswagen|seat|skoda|audi|golf|polo|passat|lupo|ibiza|cordoba|arosa|caddy|vento|corrado|sharan|transporter|derby|inca)/i;

function checkParts(arr, label) {
    const byOem = new Map(), byKey = new Map();
    let oldSchema = 0, noOem = 0, badI = 0, junkA = 0, engInD = 0;
    const cyrA = new Map();   /* кириллические подсказки в `a` — намеренно оставлены */
    const oddD = new Map();   /* нестандартные строки в `d` */
    const unknown = { engines: new Set(), bodies: new Set(), transmissions: new Set(), gens: new Set(), trims: new Set(), cat: new Set() };
    arr.forEach((r, i) => {
        const at = label + ' #' + i + ' [' + (oemOf(r) || 'без OEM') + ']';
        if ('oem' in r || 'name' in r || 'inst' in r) oldSchema++;
        if (!oemOf(r)) { noOem++; W('parts', at + ' — нет OEM'); }
        const k = mkey(r);
        if (byKey.has(k)) E('parts', label + ': дубль «OEM+название» ' + k + ' (#' + byKey.get(k) + ' и #' + i + ')');
        else byKey.set(k, i);
        const no = normOem(oemOf(r));
        if (no) { if (byOem.has(no)) W('parts', label + ': одинаковый нормализованный OEM ' + no + ' у разных названий (#' + byOem.get(no) + ', #' + i + ')'); else byOem.set(no, i); }
        /* инструкции */
        const list = Array.isArray(r.i) ? r.i : (Array.isArray(r.inst) ? r.inst : null);
        if (list) list.forEach(x => {
            const ok = Array.isArray(r.i) ? instOk(x) : !!(x && x.text);
            if (!ok) { badI++; E('parts', at + ' — элемент инструкции не разберётся nP(): ' + JSON.stringify(x).slice(0, 80)); }
        });
        /* аналоги */
        (r.a || r.analogs || []).forEach(a => {
            const s = String(a);
            if (AN_JUNK_RE.test(s)) { junkA++; E('parts', at + ' — мусорный «аналог» «' + s + '» (правило M3 не применено?)'); }
            else if (!anCodeOk(s) && /[а-яА-ЯёЁ]/.test(s)) cyrA.set(s, (cyrA.get(s) || 0) + 1);
            /* бренды без цифр («Kolbenschmidt», «Febi») — легально: в граф не попадают */
        });
        /* словари */
        (r.engines || []).forEach(v => { if (!ENGINES.has(v)) { unknown.engines.add(v); E('parts', at + ' — неизвестный код мотора ' + v + ' (nP() его отбросит)'); } });
        (r.bodies || []).forEach(v => { if (!BODIES.has(v)) { unknown.bodies.add(v); E('parts', at + ' — неизвестный кузов ' + v); } });
        (r.transmissions || []).forEach(v => { if (!TRANSMISSIONS.has(v)) { unknown.transmissions.add(v); W('parts', at + ' — «' + v + '» в transmissions: не семейство (уйдёт в transCodes)'); } });
        (r.gens || []).forEach(v => { if (!GENERATIONS.has(v)) { unknown.gens.add(v); E('parts', at + ' — неизвестное поколение ' + v); } });
        (r.trims || []).forEach(v => { if (!TRIMS.has(v)) { unknown.trims.add(v); E('parts', at + ' — неизвестная комплектация ' + v); } });
        if (r.cat && !CATS.has(r.cat)) { unknown.cat.add(r.cat); E('parts', at + ' — категория «' + r.cat + '» неизвестна (nP() подменит на Engine)'); }
        /* доноры */
        (r.d || r.donors || []).forEach(v => {
            const s = String(v);
            if (/^[0-9A-Z]{2,4}$/.test(s) && ENGINES.has(s)) { engInD++; E('parts', at + ' — код мотора ' + s + ' в поле доноров `d` (ломает pCompat/vinStrictOk)'); }
            else if (!DONOR_RE.test(s) && !/^все$/i.test(s)) oddD.set(s, (oddD.get(s) || 0) + 1);
        });
    });
    if (oddD.size) W('parts', label + ': нестандартных строк в `d` — ' + [...oddD.values()].reduce((a, b) => a + b, 0) +
        ' (' + [...oddD.keys()].slice(0, 3).join(', ') + ') — pCompat() их не сопоставит, карточка получит «нет данных»');
    if (cyrA.size) N('parts', label + ': кириллических подсказок в `a` — ' + [...cyrA.values()].reduce((a, b) => a + b, 0) +
        ' (' + cyrA.size + ' уникальных: ' + [...cyrA.keys()].slice(0, 4).join(', ') + '…). В граф кроссов они не попадают (anCodeOk), это осознанно: для RoadKit/Fluids такие строки — название того, что покупать.');
    return { count: arr.length, oldSchema, noOem, badI, junkA, engInD, unknown, cyrA: cyrA.size };
}

const srcAll = [];
srcFiles.forEach(f => {
    const arr = readJson(path.join(SRC, f));
    if (!Array.isArray(arr)) return E('parts', 'data-src/' + f + ' — не массив');
    arr.forEach(r => srcAll.push(Object.assign({ _f: f }, r)));
});
let srcStat = null;
if (srcAll.length) {
    srcStat = checkParts(srcAll, 'data-src');
    N('parts', 'data-src: ' + srcFiles.length + ' файлов, ' + srcStat.count + ' записей, старый формат у ' + srcStat.oldSchema);
}
let prodStat = null, drift = null;
if (!SKIP_PROD && exists(path.join(ROOT, 'data', 'parts.json'))) {
    const prod = readJson(path.join(ROOT, 'data', 'parts.json'));
    prodStat = checkParts(prod, 'data/parts.json');
    N('parts', 'data/parts.json: ' + prodStat.count + ' записей');
    if (srcAll.length) {
        const pk = new Map(prod.map((r, i) => [mkey(r), i]));
        const sk = new Map(srcAll.map((r, i) => [mkey(r), i]));
        const missing = [...sk.keys()].filter(k => !pk.has(k));
        const extra = [...pk.keys()].filter(k => !sk.has(k));
        drift = { missing, extra };
        if (missing.length) E('drift', 'data/parts.json отстаёт от data-src: нет ' + missing.length + ' записей (например: ' + missing.slice(0, 3).join('; ') + ')');
        if (extra.length) W('drift', 'в data/parts.json ' + extra.length + ' записей, которых нет в data-src');
        if (!missing.length && !extra.length) N('drift', 'data/parts.json = data-src (расхождений нет)');
    }
}
if (!SKIP_PROD && exists(path.join(ROOT, 'data', 'parts.full.json'))) {
    const full = readJson(path.join(ROOT, 'data', 'parts.full.json'));
    const fk = new Set(full.map(mkey));
    const sk = new Set(srcAll.map(mkey));
    const miss = [...sk].filter(k => !fk.has(k));
    if (miss.length) E('drift', 'data/parts.full.json отстаёт от data-src: нет ' + miss.length + ' записей');
    else N('drift', 'data/parts.full.json = data-src');
}

/* ============================================================
   5. sections / categories
   ============================================================ */
if (exists(path.join(ROOT, 'data', 'sections.json'))) {
    const secs = readJson(path.join(ROOT, 'data', 'sections.json'));
    /* 1.11.0: проверка в обе стороны — раздел без записи в SEC_TABLE_IDS
       не отрисуется, а id в SEC_TABLE_IDS без данных даст пустой экран */
    SEC_TABLE_IDS.forEach(id => {
        if (!secs[id]) E('sections', 'SEC_TABLE_IDS содержит «' + id + '», но в data/sections.json такого раздела нет');
        else if (!Array.isArray(secs[id].rows) || !secs[id].rows.length) W('sections', 'раздел «' + id + '» объявлен в SEC_TABLE_IDS, но не имеет строк');
    });
    /* регистрация в сайдбаре: VIRTUAL_CATS + группа «Справочники» */
    const vcBlock = appSrc.slice(appSrc.indexOf('const VIRTUAL_CATS = {'), appSrc.indexOf('\n};', appSrc.indexOf('const VIRTUAL_CATS = {')));
    const refsGroup = /id:\s*'refs'[\s\S]*?cats:\s*\[([^\]]*)\]/.exec(appSrc);
    const refsCats = refsGroup ? [...refsGroup[1].matchAll(/'([^']+)'/g)].map(m => m[1]) : [];
    Object.keys(secs).forEach(id => {
        if (!new RegExp(id + '\\s*:\\s*\\{').test(vcBlock)) E('sections', '«' + id + '» нет в VIRTUAL_CATS — в сайдбаре не будет иконки/подписи');
        if (!refsCats.includes(id)) E('sections', '«' + id + '» не добавлен в группу «Справочники» (CAT_GROUPS.refs) — раздел не появится в меню');
    });
    N('sections', 'разделов: ' + Object.keys(secs).length + ' · строк: ' + Object.keys(secs).reduce((a, k) => a + (secs[k].rows || []).length, 0) +
        ' · в сайдбаре зарегистрированы все');
    Object.keys(secs).forEach(id => {
        const s = secs[id] || {};
        if (!SEC_TABLE_IDS.includes(id)) E('sections', '«' + id + '» нет в SEC_TABLE_IDS — раздел не отрисуется');
        const cols = Array.isArray(s.cols) ? s.cols.length : 0;
        (s.rows || []).forEach((row, i) => {
            if (!Array.isArray(row)) return E('sections', id + ' rows[' + i + '] — не массив');
            if (cols && row.length !== cols) E('sections', id + ' rows[' + i + ']: ' + row.length + ' значений при ' + cols + ' колонках');
        });
        N('sections', id + ': ' + (s.rows || []).length + ' строк, ' + cols + ' колонок');
    });
}
if (exists(path.join(ROOT, 'data', 'categories.json'))) {
    const cs = readJson(path.join(ROOT, 'data', 'categories.json'));
    const seen = new Set();
    cs.forEach(c => {
        if (!c || !c.id) return E('categories', 'запись без id');
        if (seen.has(c.id)) E('categories', 'дубль id ' + c.id);
        seen.add(c.id);
        if (BASE_CATS.has(c.id)) W('categories', c.id + ' уже есть в BASE_CATS — дополнение не нужно');
        if (!c.label) W('categories', c.id + ' без label');
    });
    N('categories', 'дополнительных категорий: ' + cs.length);
}

/* ============================================================
   6. PR-коды
   ============================================================ */
let prStat = null;
if (exists(path.join(ROOT, 'data', 'pr-codes.json'))) {
    const pr = readJson(path.join(ROOT, 'data', 'pr-codes.json'));
    const ru = exists(path.join(ROOT, 'data', 'pr-codes-ru.json')) ? readJson(path.join(ROOT, 'data', 'pr-codes-ru.json')) : {};
    const prK = Object.keys(pr), ruK = Object.keys(ru);
    prK.forEach(k => { if (k.length !== 3) W('pr', 'ключ «' + k + '» не 3-символьный'); });
    ruK.forEach(k => { if (!(k in pr)) E('pr', 'RU-ключ «' + k + '» отсутствует в pr-codes.json'); });
    const cyr = prK.filter(k => /[а-яА-ЯёЁ]/.test(String(pr[k])));
    const emptyDesc = prK.filter(k => !String(pr[k] || '').trim());
    prStat = { total: prK.length, ru: ruK.length, cyr: cyr.length, empty: emptyDesc.length };
    if (emptyDesc.length) W('pr', 'pr-codes.json: ' + emptyDesc.length + ' кодов из ' + prK.length +
        ' (' + Math.round(100 * emptyDesc.length / prK.length) + '%) с ПУСТЫМ описанием — модалка «Оснащение (PR)» покажет «описание не найдено»');
    N('pr', 'pr-codes.json: ' + prK.length + ' кодов, RU-переводов ' + ruK.length + ' (' + (100 * ruK.length / prK.length).toFixed(1) + '%), значений с кириллицей в основном словаре: ' + cyr.length);
    if (ruK.length / prK.length < 0.5) W('pr', 'RU-переводом покрыто меньше половины кодов — модалка «Оснащение (PR)» будет частично английской');
    ['vin-db.example.json', 'vin-db.patch.json'].forEach(f => {
        const p = path.join(ROOT, 'data', f);
        if (!exists(p)) return;
        readJson(p).forEach((rec, i) => {
            (rec.pr || []).forEach(c => { if (!(c in pr)) E('pr', f + ' #' + i + ': код ' + c + ' не найден в pr-codes.json'); });
            if (rec.engine && !ENGINES.has(rec.engine)) E('pr', f + ' #' + i + ': мотор ' + rec.engine + ' нет в ENGINES');
            if (rec.gearbox && !TRANSMISSIONS.has(rec.gearbox)) E('pr', f + ' #' + i + ': КПП ' + rec.gearbox + ' нет в TRANSMISSIONS');
            if (rec.gearbox_code && !GEARBOX_CODES.has(String(rec.gearbox_code).toUpperCase())) W('pr', f + ' #' + i + ': буквенный код КПП ' + rec.gearbox_code + ' не найден в GEARBOX');
        });
    });
}

/* ============================================================
   7. VIN-база
   ============================================================ */
const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/;
/* дополнение 1.12.1 (после диагноза vin-db): контроль достоверности VIN. Присланный vin-db.json содержал
   «вин-коды», склеенные из последних пяти PR-кодов (1ARLAT6VU2BV0AWV1 =
   «1A» + RLA+T6V+U2B+V0A+WV1) — 9 из 9 записей. Формально они проходят
   VIN_RE (17 допустимых символов), поэтому добавлены проверки смысла:
   WMI, filler ZZZ, числовой серийный номер, год из VIN против prod_date
   и прямая детекция склейки из PR-кодов. */
const WMI_OK = /^(WVW|WV1|WV2|WV3|WVG|1VW|1V1|3VW|8AW|9BW|9BV|AAV|VSS|VSK|WAU|TRU|93V|TM)/;
const YEAR_CODES = { A: 1980, B: 1981, C: 1982, D: 1983, E: 1984, F: 1985, G: 1986, H: 1987, J: 1988, K: 1989, L: 1990, M: 1991, N: 1992, P: 1993, R: 1994, S: 1995, T: 1996, V: 1997, W: 1998, X: 1999, Y: 2000, 1: 2001, 2: 2002, 3: 2003, 4: 2004, 5: 2005, 6: 2006, 7: 2007, 8: 2008, 9: 2009 };
const vinIsFabricated = rec => Array.isArray(rec.pr) && rec.pr.length >= 5 &&
    String(rec.vin || '').length === 17 &&
    String(rec.vin).slice(2).toUpperCase() === rec.pr.slice(-5).map(x => String(x).toUpperCase()).join('');
const vinFiles = ['data/vin-db.example.json', 'data/vin-db.patch.json', 'data/vin-db.filtered-only.json', 'data/vin-db.json'];
const vinSets = {};
vinFiles.forEach(f => {
    const p = path.join(ROOT, f);
    if (!exists(p)) return;
    const arr = readJson(p);
    const set = new Set();
    const stat = { fab: 0, wmi: 0, filler: 0, serial: 0, year: 0 };
    arr.forEach((rec, i) => {
        const v = String(rec.vin || '').trim().toUpperCase();
        if (!v) return E('vin', f + ' #' + i + ' — нет vin');
        if (!VIN_RE.test(v)) E('vin', f + ' #' + i + ' — VIN «' + v + '» не соответствует формату (17 символов, без I/O/Q)');
        if (set.has(v)) E('vin', f + ' — дубль VIN ' + v);
        set.add(v);
        if (v.length !== 17) return;
        /* склейка из PR-кодов — самый опасный случай: файл выглядит валидным,
           но не находится ни по одному реальному VIN */
        if (vinIsFabricated(rec)) {
            stat.fab++;
            if (stat.fab <= 3) E('vin', f + ' #' + i + ' — VIN «' + v + '» склеен из последних 5 PR-кодов (' + rec.pr.slice(-5).join('+') + '); это не VIN, поиск по базе работать не будет');
        }
        if (!WMI_OK.test(v)) { stat.wmi++; if (stat.wmi <= 3) E('vin', f + ' #' + i + ' — WMI «' + v.slice(0, 3) + '» не принадлежит VW/SEAT (ожидаются WVW/WV1/WV2/VSS/…)'); }
        if (v.slice(3, 6) !== 'ZZZ') { stat.filler++; if (stat.filler <= 3) W('vin', f + ' #' + i + ' — на месте filler (4–6 символы) «' + v.slice(3, 6) + '» вместо ZZZ'); }
        if (!/^\d{6}$/.test(v.slice(11))) { stat.serial++; if (stat.serial <= 3) E('vin', f + ' #' + i + ' — серийная часть «' + v.slice(11) + '» не цифровая (у VW это 6 цифр)'); }
        const yCode = YEAR_CODES[v[9]];
        const pYear = /^(\d{4})/.exec(String(rec.prod_date || ''));
        if (yCode && pYear && Math.abs(yCode - Number(pYear[1])) > 1) {
            stat.year++;
            if (stat.year <= 3) E('vin', f + ' #' + i + ' — год из VIN (' + yCode + ') не совпадает с prod_date (' + rec.prod_date + ')');
        }
    });
    if (stat.fab || stat.wmi || stat.serial || stat.year) {
        E('vin', f + ': итог по достоверности — склеенных из PR: ' + stat.fab + ', чужих WMI: ' + stat.wmi +
            ', нецифровых серийников: ' + stat.serial + ', расхождений года: ' + stat.year + ' (всего записей ' + arr.length + ')');
    } else {
        N('vin', f + ': проверка достоверности пройдена (WMI, filler, серийник, год против prod_date)');
    }
    if (stat.filler) W('vin', f + ': filler ≠ ZZZ у ' + stat.filler + ' записей');
    vinSets[f] = set;
    N('vin', f + ': ' + arr.length + ' записей, ' + set.size + ' уникальных VIN');
});
if (vinSets['data/vin-db.patch.json'] && vinSets['data/vin-db.filtered-only.json']) {
    const cross = [...vinSets['data/vin-db.patch.json']].filter(v => vinSets['data/vin-db.filtered-only.json'].has(v));
    N('vin', 'патч перекрывает записей дампа: ' + cross.length + (cross.length ? ' (' + cross.join(', ') + ')' : ' — все VIN новые'));
}
/* сверка со списком из vin-dump */
const dumpList = path.join(ROOT, 'vin-dump', 'filtered-vins.txt');
if (exists(dumpList) && vinSets['data/vin-db.filtered-only.json']) {
    const txt = new Set(fs.readFileSync(dumpList, 'utf8').split(/\r?\n/).map(s => s.trim().toUpperCase()).filter(Boolean));
    const js = vinSets['data/vin-db.filtered-only.json'];
    const a = [...js].filter(v => !txt.has(v)), b = [...txt].filter(v => !js.has(v));
    if (a.length || b.length) E('vin', 'filtered-only ↔ filtered-vins.txt: расхождений ' + (a.length + b.length) + ' (в json нет в txt: ' + b.length + ', в txt нет в json: ' + a.length + ')');
    else N('vin', 'vin-db.filtered-only.json точно соответствует vin-dump/filtered-vins.txt (' + txt.size + ' VIN)');
    /* 9-й символ: контрольный разряд vs filler Z */
    const nonZ = [...txt].filter(v => v.length === 17 && v[8] !== 'Z');
    if (nonZ.length) W('vin', 'VIN с не-Z в 9-й позиции: ' + nonZ.length + ' — vinDbRow() учитывает это с 1.10.6');
    const filesList = path.join(ROOT, 'vin-dump', 'filtered-files.txt');
    if (exists(filesList)) {
        const names = fs.readFileSync(filesList, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean)
            .map(s => s.replace(/^\.\\+/, '').replace(/\.txt$/i, '').toUpperCase());
        const mism = [];
        names.forEach((n, i) => { const arr = [...txt]; if (arr[i] && arr[i] !== n) mism.push(i + 1); });
        if (names.length !== txt.size) W('vin', 'filtered-files.txt (' + names.length + ') и filtered-vins.txt (' + txt.size + ') разной длины');
        if (mism.length) W('vin', 'filtered-vins.txt ↔ filtered-files.txt: расхождения в 9-й позиции на строках ' + mism.slice(0, 5).join(', ') + ' (всего ' + mism.length + ') — покрыто запасным индексом vinDbRow()');
        else N('vin', 'filtered-vins.txt и filtered-files.txt согласованы построчно');
    }
}

/* ============================================================
   7b. Внутренние ссылки справочников (1.12.0)
   ------------------------------------------------------------
   rSec() умеет два вида внутренних ссылок: «метка|#q:запрос» (поиск по
   каталогу) и «метка|#sec:Id» (переход в другой справочник). Проверяем, что
   каждая из них рабочая: запрос должен находить хотя бы одну деталь по тем же
   правилам, что и mP() в приложении (все слова запроса — в одном из полей),
   а раздел — существовать. «Мёртвая» ссылка в справочнике хуже её отсутствия.
   ============================================================ */
const SYNONYMS_SRC = (appSrc.match(/const SYNONYMS = \{([\s\S]*?)\n\};/) || [, ''])[1];
const SYNONYMS = {};
[...SYNONYMS_SRC.matchAll(/'([^']+)'\s*:\s*\[([^\]]*)\]/g)].forEach(m => {
    SYNONYMS[m[1]] = [...m[2].matchAll(/'([^']*)'/g)].map(x => x[1]);
});
const secNz = x => String(x == null ? '' : x).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
function partHaystack(p) {
    const inst = Array.isArray(p.i) ? p.i.map(x => (Array.isArray(x) ? x[1] : (x && x.text) || ''))
        : (Array.isArray(p.inst) ? p.inst.map(x => (x && x.text) || '') : []);
    return secNz([p.o || p.oem || '', p.n || p.name || '', ...(p.a || p.analogs || []),
        ...(p.d || p.donors || []), ...inst, ...(p.engines || []), ...(p.transmissions || []),
        ...(p.transCodes || []), ...(p.bodies || []), ...(p.gens || [])].join('  '));
}
let hayCache = null;
/* Откуда брать детали для проверки ссылок: боевой data/parts.json, а во время
   сборки (--skip-prod, файл ещё не пересобран) — data-src. Раньше в режиме
   --skip-prod список оказывался пустым, и валидатор рапортовал о 117
   «мёртвых» ссылках, которых на самом деле нет. */
function partsForLinks() {
    if (!SKIP_PROD && exists(path.join(ROOT, 'data', 'parts.json')))
        return readJson(path.join(ROOT, 'data', 'parts.json'));
    if (srcAll.length) return srcAll;
    return exists(path.join(ROOT, 'data', 'parts.json')) ? readJson(path.join(ROOT, 'data', 'parts.json')) : [];
}
function queryHits(q) {
    if (!hayCache) hayCache = partsForLinks().map(partHaystack);
    const toks = secNz(q).split(/\s+/).filter(Boolean);
    if (!toks.length) return 0;
    let hits = 0;
    for (const h of hayCache) {
        const h2 = h.replace(/[^a-z0-9а-я]/g, '');
        if (toks.every(t => {
            const alts = [t].concat(SYNONYMS[t] || []);
            return alts.some(a => h.includes(a) || (a.replace(/[^a-z0-9]/g, '').length >= 5 && h2.includes(a.replace(/[^a-z0-9]/g, ''))));
        })) hits++;
    }
    return hits;
}
if (exists(path.join(ROOT, 'data', 'sections.json'))) {
    const secs = readJson(path.join(ROOT, 'data', 'sections.json'));
    let links = 0, secLinks = 0;
    Object.keys(secs).forEach(sid => (secs[sid].rows || []).forEach((row, i) => row.forEach(cell => {
      /* ячейка может содержать несколько элементов через «;;» — как в secCellHtml */
      String(cell == null ? '' : cell).split(';;').forEach(part => {
        const cs = part.trim();
        if (!cs) return;
        const m = cs.match(/^([\s\S]+?)\|([\s\S]+)$/);
        if (!m) return;
        const target = m[2].trim();
        if (target.indexOf('#q:') === 0) {
            links++;
            const q = target.slice(3);
            const n = queryHits(q);
            if (!n) E('sections', sid + ' rows[' + i + ']: ссылка «' + m[1] + '» → поиск «' + q + '» не находит ни одной детали');
        } else if (target.indexOf('#sec:') === 0) {
            secLinks++;
            const id = target.slice(5);
            if (!secs[id]) E('sections', sid + ' rows[' + i + ']: ссылка на раздел «' + id + '», которого нет в sections.json');
        }
      });
    })));
    N('sections', 'внутренних ссылок: поиск по каталогу — ' + links + ', переходы между разделами — ' + secLinks + ' (все рабочие)');
}

/* ============================================================
   8. Словари app.js
   ============================================================ */
const noEgb = [...ENGINES].filter(e => !(e in ENGINE_GEARBOX));
if (noEgb.length) E('dict', 'нет записи в ENGINE_GEARBOX для: ' + noEgb.join(', ') + ' (каскад «мотор → КПП» не сузит список)');
else N('dict', 'ENGINE_GEARBOX покрывает все ' + ENGINES.size + ' кодов ENGINES');
const egbFams = new Set([].concat(...Object.values(ENGINE_GEARBOX).map(x => x.fams)));
[...egbFams].forEach(f => { if (!GEARBOX_FAMS.has(f) && !TRANSMISSIONS.has(f)) E('dict', 'ENGINE_GEARBOX ссылается на неизвестное семейство КПП «' + f + '»'); });
const egbCodes = [].concat(...Object.values(ENGINE_GEARBOX).map(x => x.codes));
egbCodes.forEach(c => { if (!GEARBOX_CODES.has(c)) E('dict', 'в ENGINE_GEARBOX.codes неизвестный буквенный код «' + c + '»'); });
const famBlock = appSrc.slice(appSrc.indexOf('const ENGINE_FAMILIES = {'), appSrc.indexOf('const ENGINE_CODE_FAM'));
[...famBlock.matchAll(/codes:\s*\[([^\]]*)\]/g)].forEach(m => {
    m[1].split(',').map(s => s.trim().replace(/'/g, '')).filter(Boolean)
        .forEach(c => { if (!ENGINES.has(c)) E('dict', 'в ENGINE_FAMILIES код «' + c + '» отсутствует в ENGINES'); });
});
N('dict', 'ENGINES ' + ENGINES.size + ' · BODIES ' + BODIES.size + ' · GENERATIONS ' + GENERATIONS.size + ' · TRANSMISSIONS ' + TRANSMISSIONS.size + ' · TRIMS ' + TRIMS.size + ' · GEARBOX-семейств ' + GEARBOX_FAMS.size + ' · буквенных кодов КПП ' + GEARBOX_CODES.size);

/* analogs.json */
if (exists(path.join(ROOT, 'data', 'analogs.json'))) {
    const a = readJson(path.join(ROOT, 'data', 'analogs.json'));
    const kb = a.kb || {};
    let bad = 0;
    Object.keys(kb).forEach(k => (kb[k] || []).forEach(v => { if (!anCodeOk(v)) { bad++; W('analogs', 'KB ' + k + ': значение «' + v + '» не пройдёт anCodeOk'); } }));
    N('analogs', 'data/analogs.json: ' + Object.keys(kb).length + ' ключей KB, подозрительных значений ' + bad + ', updated ' + (a.updated || '—'));
}
/* workshops */
if (exists(path.join(ROOT, 'data', 'workshops.json'))) {
    const w = readJson(path.join(ROOT, 'data', 'workshops.json'));
    if (!Array.isArray(w) || !w.length) W('workshops', 'data/workshops.json пуст — раздел СТО будет заполняться только вручную (_mergeWorkshops на пустом массиве делает return)');
    else N('workshops', 'data/workshops.json: ' + w.length + ' записей');
}

/* ============================================================
   Отчёт
   ============================================================ */
const md = ['# Валидация данных и версий — ' + new Date().toISOString().slice(0, 16).replace('T', ' '), '',
    'Версия: **' + (vApp || '?') + '** · ошибок: **' + errors.length + '** · предупреждений: **' + warns.length + '**', ''];
if (errors.length) {
    md.push('## 🔴 Ошибки', '');
    errors.forEach(e => md.push('- **' + e.rule + '** — ' + e.msg));
    md.push('');
}
if (warns.length) {
    md.push('## 🟡 Предупреждения', '');
    warns.forEach(w => md.push('- **' + w.rule + '** — ' + w.msg));
    md.push('');
}
md.push('## ✅ Сводка', '');
notes.forEach(n => md.push('- **' + n.rule + '** — ' + n.msg));
md.push('');
if (!QUIET) {
    if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, 'VALIDATION.md'), md.join('\n'), 'utf8');
}
if (ARGS.includes('--json')) {
    console.log(JSON.stringify({ version: vApp, errors, warns, notes, srcStat, prodStat, drift, prStat }, null, 1));
} else {
    console.log('версия: ' + vApp + ' | ошибок: ' + errors.length + ' | предупреждений: ' + warns.length);
    errors.slice(0, 25).forEach(e => console.log('  🔴 [' + e.rule + '] ' + e.msg));
    if (errors.length > 25) console.log('  … и ещё ' + (errors.length - 25));
    warns.slice(0, 15).forEach(w => console.log('  🟡 [' + w.rule + '] ' + w.msg));
    if (warns.length > 15) console.log('  … и ещё ' + (warns.length - 15));
    if (!QUIET) console.log('отчёт: restore/VALIDATION.md');
}
process.exit(errors.length ? 1 : 0);
