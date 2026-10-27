#!/usr/bin/env node
/* ============================================================
   tests/test_instructions.js — библиотека инструкций и tools/build-instructions.js
   ------------------------------------------------------------
   Появился по итогам аудита 2026-10-27 (INSTRUCTIONS-AUDIT.md).
   Прогоняется без браузера и без jsdom; формат вывода — как у
   остальных сюит: «N ok, M fail», exit 1 при ошибках.

   Что проверяется:
     A. гигиена библиотеки (независимый пересчёт, а не доверие инструменту);
     B. `--check` инструмента — exit 0, 0 ошибок;
     C. слияние на синтетическом data-src: точный артикул, СОСТАВНОЙ «·» (M6),
        oemRe, cats, порядок типов, дедупликация;
     D. H3 — карточка с полем `inst` не теряет его и не получает `i`;
     E. идемпотентность (I5) и формат записи (I4);
     F. H1 — пустой/отсутствующий data-src: exit 2, артефакты не тронуты;
        нулевой прогон пишет .noop.md вместо затирания истории;
     G. M1 — --force со сломанной регуляркой не падает и не портит данные;
     H. M3/L1 — валидатор ловит нумерованный proc + общий блок с proc
        и смешанную нумерацию;
     I. parseInst() в рантайме: оба поля объединяются, дубли отбрасываются.

   Запуск:  node tests/test_instructions.js
   ============================================================ */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const LIB = path.join(ROOT, 'tools', 'instructions');
const TOOL = path.join(ROOT, 'tools', 'build-instructions.js');
const APP = path.join(ROOT, 'js', 'app.js');

let ok = 0, fail = 0;
const fails = [];
function t(name, fn) {
    try { fn(); ok++; }
    catch (e) { fail++; fails.push(name + ' — ' + e.message); }
}
const eq = (a, b, m) => { if (a !== b) throw new Error((m || '') + ' ожидается ' + JSON.stringify(b) + ', получено ' + JSON.stringify(a)); };
const okTrue = (v, m) => { if (!v) throw new Error(m || 'ожидалось true'); };

/* spawnSync, а не execFileSync: инструмент печатает ПРЕДУПРЕЖДЕНИЯ в stderr,
   но выходит при этом с кодом 0 — execFileSync в этом случае отдаёт только
   stdout, и предупреждения теряются (проверено: ровно так падали H3/H4). */
function _run(script, args, cwd) {
    const r = spawnSync(process.execPath, [script].concat(args), { cwd, encoding: 'utf8' });
    const out = r.stdout || '', err = r.stderr || '';
    return { code: r.status == null ? -1 : r.status, out, err, txt: out + err };
}
const runWs = (ws, args) => _run(path.join(ws, 'tools', 'build-instructions.js'), args, ws);
const runTool = (args, cwd) => _run(TOOL, args, cwd || ROOT);


/* типы — как в js/app.js (IM/MI) и в инструменте (FIELD/ORDER) */
const FIELD = { spec: 's', tools: 't', proc: 'p', warn: 'w', note: 'n', rec: 'r' };
const ORDER = ['spec', 'tools', 'proc', 'warn', 'note', 'rec'];
const SRC_OK = /^(?:Спр\.(?:Torque|FluidSpecs|Wheels|Lamps)|A\/E|AD\.Polo6N1|ОП|К .+|⚠ .*|restore\/[A-Za-z0-9._-]+\.md|Ф\.[A-Za-z0-9._-]+)$/;
const NUM = /^\s*\d+[.)]\s/;

/* ---------- загрузка библиотеки ---------- */
const libFiles = fs.readdirSync(LIB).filter(f => f.endsWith('.json')).sort();
const docs = {};
libFiles.forEach(f => { docs[f] = JSON.parse(fs.readFileSync(path.join(LIB, f), 'utf8')); });
const shared = docs['00-shared.json'] ? docs['00-shared.json'].shared : {};
const entries = [];
libFiles.forEach(f => {
    if (f === '00-shared.json') return;
    (docs[f].entries || []).forEach(e => entries.push(Object.assign({ _file: f }, e)));
});

/* ================================================================
   A. ГИГИЕНА БИБЛИОТЕКИ — независимый пересчёт
   ================================================================ */
/* A1/A2 намеренно НЕ хардкодят состав библиотеки: сейчас загружено 8 файлов из 16
   (нет 11-maintenance, 20-cooling, 21-fuel-intake, 22-ignition, 50-drivetrain,
   60-exhaust, 70-electrical-drive, 90-wheels), и при дозагрузке эти проверки
   пришлось бы править. Фиксируем структуру и нижнюю границу. */
t('A1 библиотека: 00-shared.json + файлы по узлам, и тех не меньше 8', () => {
    okTrue(libFiles.includes('00-shared.json'), 'нет 00-shared.json');
    okTrue(libFiles.length >= 8, 'файлов меньше 8: ' + libFiles.length);
    libFiles.filter(f => f !== '00-shared.json').forEach(f =>
        okTrue(Array.isArray(docs[f].entries), f + ': нет массива entries'));
});
t('A2 библиотека: записей и общих блоков не меньше эталонных 38 / 8', () => {
    okTrue(entries.length >= 38, 'записей меньше 38: ' + entries.length);
    okTrue(Object.keys(shared).length >= 8, 'общих блоков меньше 8: ' + Object.keys(shared).length);
});
t('A3 id уникальны во всех файлах (записи + общие блоки)', () => {
    const ids = entries.map(e => e.id).concat(Object.keys(shared));
    eq(new Set(ids).size, ids.length, 'есть повтор id');
});
t('A4 у каждой записи есть обязательные поля', () => {
    entries.forEach(e => {
        ['id', 'title', 'src', 'tools', 'proc', 'warn'].forEach(k =>
            okTrue(e[k] !== undefined, e._file + '/' + e.id + ': нет ' + k));
        okTrue(e.id && e.title && String(e.title).trim(), e._file + '/' + e.id + ': пустой title');
    });
});
t('A5 у каждой записи есть селектор (oems или oemRe)', () => {
    entries.forEach(e => okTrue((e.oems || []).length || (e.oemRe || []).length,
        e._file + '/' + e.id + ': нет ни oems, ни oemRe'));
});
t('A6 src непустой у всех записей и блоков', () => {
    entries.concat(Object.values(shared)).forEach(e =>
        okTrue(Array.isArray(e.src) && e.src.length, (e.id || '?') + ': пустой src'));
});
t('A7 все метки src соответствуют таксономии README', () => {
    const bad = [];
    entries.concat(Object.values(shared)).forEach(e =>
        (e.src || []).forEach(s => { if (!SRC_OK.test(String(s))) bad.push(e.id + ': ' + s); }));
    eq(bad.length, 0, 'вне таксономии: ' + bad.join(', '));
});
t('A8 все ключи use существуют в 00-shared.json', () => {
    const bad = [];
    entries.forEach(e => (e.use || []).forEach(u => {
        const id = typeof u === 'string' ? u : u.id;
        if (!shared[id]) bad.push(e.id + ' → ' + id);
    }));
    eq(bad.length, 0, 'нет блока: ' + bad.join(', '));
});
t('A9 use.only — только допустимые поля, и они есть у блока', () => {
    const bad = [], ghost = [];
    entries.forEach(e => (e.use || []).forEach(u => {
        if (typeof u !== 'object' || !Array.isArray(u.only)) return;
        u.only.forEach(k => {
            if (!ORDER.includes(k)) bad.push(e.id + ': ' + k);
            else if (!(shared[u.id][k] || []).length) ghost.push(e.id + ' ← ' + u.id + '.' + k);
        });
    }));
    eq(bad.length, 0, 'недопустимые only: ' + bad.join(', '));
    eq(ghost.length, 0, 'only указывает на пустое поле блока: ' + ghost.join(', '));
});
t('A10 все общие блоки кем-то используются', () => {
    const used = new Set();
    entries.forEach(e => (e.use || []).forEach(u => used.add(typeof u === 'string' ? u : u.id)));
    const orphans = Object.keys(shared).filter(k => !used.has(k));
    eq(orphans.length, 0, 'не используются: ' + orphans.join(', '));
});
t('A11 все oemRe/nameRe компилируются', () => {
    entries.forEach(e => {
        (e.oemRe || []).forEach(r => { try { new RegExp(r); } catch (x) { throw new Error(e.id + ': ' + r + ' — ' + x.message); } });
        if (e.nameRe) { try { new RegExp(e.nameRe); } catch (x) { throw new Error(e.id + ': nameRe — ' + x.message); } }
    });
});
t('A12 текст: нет пустых строк, управляющих символов и двойных пробелов', () => {
    let n = 0; const bad = [];
    entries.concat(Object.values(shared)).forEach(e => ORDER.forEach(k => {
        (e[k] || []).forEach((s, i) => {
            n++;
            const t2 = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
            if (!t2) bad.push(e.id + '.' + k + '[' + i + '] пуст');
            else if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(String(s))) bad.push(e.id + '.' + k + '[' + i + '] управляющие символы');
            else if (/  /.test(t2)) bad.push(e.id + '.' + k + '[' + i + '] двойной пробел');
        });
    }));
    okTrue(n > 800, 'строк подозрительно мало: ' + n);
    eq(bad.length, 0, bad.slice(0, 3).join('; '));
});
t('A13 текст: нет HTML/Markdown (карточка рендерится через esc())', () => {
    const bad = [];
    entries.concat(Object.values(shared)).forEach(e => ORDER.forEach(k =>
        (e[k] || []).forEach(s => { if (/<[a-zA-Z/]|&[a-z]+;|\*\*|__/.test(String(s))) bad.push(e.id + '.' + k + ': ' + String(s).slice(0, 40)); })));
    eq(bad.length, 0, bad.slice(0, 3).join('; '));
});
t('A14 нет неизвестных полей у записей', () => {
    const allowed = ['id', 'title', 'oems', 'oemRe', 'cats', 'nameRe', 'applies', 'appliesEngines', 'src', 'use', '_file'].concat(ORDER);
    const bad = [];
    entries.forEach(e => Object.keys(e).forEach(k => { if (!allowed.includes(k)) bad.push(e.id + ': ' + k); }));
    eq(bad.length, 0, bad.join(', '));
});
t('A15 L1: внутри записи нумерация proc единообразна', () => {
    const bad = [];
    entries.forEach(e => {
        const p = e.proc || [];
        const num = p.filter(x => NUM.test(String(x))).length;
        if (num && num !== p.length) bad.push(e.id + ': ' + num + ' из ' + p.length);
    });
    eq(bad.length, 0, 'смешанная нумерация: ' + bad.join(', '));
});
t('A16 M3: нумерованный proc не подключает общий блок с ненумерованным proc', () => {
    const bad = [];
    entries.forEach(e => {
        const p = e.proc || [];
        if (!p.length || p.some(x => !NUM.test(String(x)))) return;   /* не полностью нумерован */
        (e.use || []).forEach(u => {
            const inj = (typeof u === 'object' && Array.isArray(u.only)) ? u.only.includes('proc') : true;
            const sp = (shared[u.id || u] || {}).proc || [];
            if (inj && sp.some(x => !NUM.test(String(x)))) bad.push(e.id + ' ← ' + (u.id || u));
        });
    });
    eq(bad.length, 0, 'развалят нумерацию: ' + bad.join(', '));
});

t('A17 M5: appliesEngines (если есть) — коды из словаря ENGINES приложения', () => {
    const appSrc2 = fs.readFileSync(APP, 'utf8');
    const m = appSrc2.match(/const ENGINES = \{([\s\S]*?)\n\};/);
    okTrue(m, 'в app.js не найден const ENGINES = {…}');
    const dict = new Set([...m[1].matchAll(/'([0-9A-Za-z]+)'\s*:/g)].map(x => x[1]));
    okTrue(dict.size >= 30, 'кодов моторов подозрительно мало: ' + dict.size);
    const bad = [];
    entries.forEach(e => (e.appliesEngines || []).forEach(x => {
        if (!dict.has(String(x).trim().toUpperCase())) bad.push(e.id + ': ' + x);
    }));
    eq(bad.length, 0, 'неизвестные коды: ' + bad.join(', '));
});

/* ================================================================
   B. --check инструмента
   ================================================================ */
t('B1 --check: exit 0, ошибок 0', () => {
    const r = runTool(['--check']);
    eq(r.code, 0, 'exit');
    okTrue(/ошибок 0/.test(r.out + r.err), 'в выводе нет «ошибок 0»: ' + (r.out + r.err).slice(0, 200));
});
t('B2 --check --verbose: предупреждений 0', () => {
    const r = runTool(['--check', '--verbose']);
    eq(r.code, 0, 'exit');
    okTrue(/предупреждений 0/.test(r.out + r.err), (r.out + r.err).slice(0, 200));
});

/* ================================================================
   Вспомогательное: временный рабочий каталог с инструментом
   ================================================================ */
function mkWs() {
    const ws = fs.mkdtempSync(path.join(os.tmpdir(), 'instr-test-'));
    fs.mkdirSync(path.join(ws, 'js'), { recursive: true });
    fs.mkdirSync(path.join(ws, 'tools'), { recursive: true });
    fs.mkdirSync(path.join(ws, 'data-src'), { recursive: true });
    fs.mkdirSync(path.join(ws, 'restore'), { recursive: true });
    fs.copyFileSync(APP, path.join(ws, 'js', 'app.js'));
    fs.copyFileSync(TOOL, path.join(ws, 'tools', 'build-instructions.js'));
    fs.symlinkSync(LIB, path.join(ws, 'tools', 'instructions'), 'dir');
    return ws;
}
const writeSrc = (ws, arr) => fs.writeFileSync(path.join(ws, 'data-src', 'parts-99-test.json'),
    JSON.stringify(arr, null, 2).replace(/\n/g, '\r\n'), 'utf8');
const readSrc = ws => JSON.parse(fs.readFileSync(path.join(ws, 'data-src', 'parts-99-test.json'), 'utf8'));
/* карточка-мишень: точный артикул из библиотеки (rear-shock → 6N0 513 031) */
const TARGET = '6N0 513 031';
const targetEntry = entries.find(e => (e.oems || []).some(o => o.toUpperCase() === TARGET));

/* ================================================================
   C. СЛИЯНИЕ: точный артикул, составной «·», oemRe, cats, порядок
   ================================================================ */
t('C0 в библиотеке есть запись под тестовый артикул ' + TARGET, () => okTrue(targetEntry, 'не найдена'));
/* На синтетическом data-src из одной карточки 37 записей библиотеки не находят
   ничего → deadSelectors → exit 1. Это штатное поведение инструмента, поэтому
   проверяем не код возврата, а результат слияния. */
t('C1 точный артикул: карточка получила инструкции', () => {
    const ws = mkWs();
    writeSrc(ws, [{ o: TARGET, n: 'Амортизатор задний', cat: 'RearAxle', sub: 'Амортизаторы' }]);
    runWs(ws, ['--apply']);
    const c = readSrc(ws)[0];
    okTrue(Array.isArray(c.i) && c.i.length > 5, 'строк мало: ' + (c.i || []).length);
});
t('C2 M6: составной артикул «A · B» находится точным селектором по части', () => {
    const ws = mkWs();
    writeSrc(ws, [{ o: TARGET + ' · ' + TARGET + ' X', n: 'Амортизатор (составной номер)', cat: 'RearAxle' }]);
    runWs(ws, ['--apply']);
    const c = readSrc(ws)[0];
    okTrue(Array.isArray(c.i) && c.i.length > 5, 'составной артикул не сматчился: строк ' + (c.i || []).length);
});
t('C3 порядок типов без use: строго s → t → p → w → n → r', () => {
    /* Берём запись БЕЗ `use` (rear-spring): общие блоки разворачиваются ПЕРЕД
       собственными полями записи, поэтому на rear-shock последовательность
       legitimately начинается с «w» (jack-safety.only=["warn"]). */
    const noUse = entries.filter(e => !(e.use || []).length && (e.oems || []).length);
    okTrue(noUse.length > 3, 'мало записей без use: ' + noUse.length);
    let checked = 0;
    /* выборка: полный прогон инструмента на каждой записи при росте библиотеки
       делает тест долгим — 6 записей достаточно для проверки инварианта */
    noUse.slice(0, 6).forEach(e => {
        const oem = e.oems[0];
        const ws = mkWs();
        writeSrc(ws, [{ o: oem, n: 'Тест', cat: (e.cats && e.cats[0]) || 'RearAxle' }]);
        runWs(ws, ['--apply']);
        const i = readSrc(ws)[0].i || [];
        if (!i.length) return;
        const blocks = [];
        i.map(x => x[0]).forEach(c => { if (blocks[blocks.length - 1] !== c) blocks.push(c); });
        const expect = ORDER.map(k => FIELD[k]).filter(c => blocks.includes(c));
        eq(blocks.join(''), expect.join(''), e.id + ': порядок блоков типов');
        checked++;
    });
    okTrue(checked >= 3, 'проверено записей мало: ' + checked);
});
t('C3b use разворачивается ПЕРЕД собственными строками записи', () => {
    /* rear-shock: use=[jack-safety(only warn), wheel-nuts(only spec)] →
       карточка начинается с «w» (общий блок), затем собственные s,t,p,w,n. */
    const ws = mkWs();
    writeSrc(ws, [{ o: TARGET, n: 'Амортизатор задний', cat: 'RearAxle' }]);
    runWs(ws, ['--apply']);
    const i = readSrc(ws)[0].i;
    eq(i[0][0], 'w', 'первой должна быть строка общего блока jack-safety');
    okTrue(i.some(x => x[0] === 's' && /110 Нм/.test(x[1])), 'нет строки wheel-nuts (110 Нм)');
    const blocks = [];
    i.map(x => x[0]).forEach(c => { if (blocks[blocks.length - 1] !== c) blocks.push(c); });
    eq(blocks.join(''), 'wstpwn', 'порядок блоков: ' + blocks.join(''));
});
t('C4 существующие строки карточки не удаляются и остаются первыми', () => {
    const ws = mkWs();
    writeSrc(ws, [{ o: TARGET, n: 'Амортизатор задний', cat: 'RearAxle', i: [['n', 'своя старая заметка карточки']] }]);
    runWs(ws, ['--apply']);
    const i = readSrc(ws)[0].i;
    eq(i[0][1], 'своя старая заметка карточки', 'первая строка');
    okTrue(i.length > 6, 'строк мало');
});
t('C5 дедупликация: строка, уже присутствующая в карточке, не дублируется', () => {
    const ws = mkWs();
    /* берём первую строку, которую добавит библиотека, и кладём её в карточку заранее */
    writeSrc(ws, [{ o: TARGET, n: 'Амортизатор задний', cat: 'RearAxle' }]);
    runWs(ws, ['--apply']);
    const first = readSrc(ws)[0].i[0];
    writeSrc(ws, [{ o: TARGET, n: 'Амортизатор задний', cat: 'RearAxle', i: [first] }]);
    runWs(ws, ['--apply']);
    const i = readSrc(ws)[0].i;
    const dupes = i.filter(x => x[0] === first[0] && x[1] === first[1]).length;
    eq(dupes, 1, 'строка продублирована');
});
t('C6 cats ограничивает применение записи', () => {
    const ws = mkWs();
    /* запись с cats, который НЕ совпадает с cat карточки */
    const lib2 = path.join(ws, 'tools', 'instructions2');
    fs.mkdirSync(lib2, { recursive: true });
    fs.writeFileSync(path.join(lib2, '00-shared.json'), JSON.stringify({ shared: {} }), 'utf8');
    fs.writeFileSync(path.join(lib2, '90-test.json'), JSON.stringify({
        entries: [{ id: 'cats-test', title: 't', oems: ['ZZZ 111 111'], cats: ['Engine'], src: ['ОП'], proc: ['1. Шаг.'] }]
    }), 'utf8');
    fs.rmSync(path.join(ws, 'tools', 'instructions'));
    fs.renameSync(lib2, path.join(ws, 'tools', 'instructions'));
    writeSrc(ws, [{ o: 'ZZZ 111 111', n: 'Деталь', cat: 'Brakes' }]);
    const r = runWs(ws, ['--apply']);
    const c = readSrc(ws)[0];
    okTrue(!Array.isArray(c.i) || !c.i.length, 'cats проигнорирован — запись применилась к чужой категории');
    okTrue(r.code !== 0, 'ожидали exit 1 из-за мёртвого селектора');
});
t('C7 oemRe находит карточку по маске', () => {
    const ws = mkWs();
    fs.rmSync(path.join(ws, 'tools', 'instructions'), { recursive: true, force: true });
    fs.mkdirSync(path.join(ws, 'tools', 'instructions'), { recursive: true });
    fs.writeFileSync(path.join(ws, 'tools', 'instructions', '00-shared.json'), JSON.stringify({ shared: {} }), 'utf8');
    fs.writeFileSync(path.join(ws, 'tools', 'instructions', '90-test.json'), JSON.stringify({
        entries: [{ id: 're-test', title: 't', oemRe: ['^6N0 513 03'], src: ['ОП'], spec: ['20 Нм.'] }]
    }), 'utf8');
    writeSrc(ws, [{ o: TARGET, n: 'Амортизатор задний', cat: 'RearAxle' }]);
    const r = runWs(ws, ['--apply']);
    eq(r.code, 0, 'exit: ' + r.err.slice(0, 200));
    okTrue((readSrc(ws)[0].i || []).length === 1, 'oemRe не сработал');
});

/* ================================================================
   D. H3 — поле inst не теряется
   ================================================================ */
t('D1 карточка с inst получает inst (а не i), исходная строка остаётся первой', () => {
    const ws = mkWs();
    writeSrc(ws, [{ id: 'p_test', oem: TARGET, name: 'Амортизатор задний', cat: 'RearAxle', v: false, inst: [{ type: 'warn', text: 'ВАЖНОЕ ПРЕДУПРЕЖДЕНИЕ КАРТОЧКИ' }] }]);
    runWs(ws, ['--apply']);   /* exit 1 здесь штатный: 37 записей библиотеки не нашли карточек */
    const c = readSrc(ws)[0];
    okTrue(!('i' in c), 'создано поле i — inst будет вытеснено в parseInst()');
    okTrue(Array.isArray(c.inst) && c.inst.length > 5, 'inst не дополнен: ' + (c.inst || []).length);
    eq(c.inst[0].text, 'ВАЖНОЕ ПРЕДУПРЕЖДЕНИЕ КАРТОЧКИ', 'исходная строка сместилась');
});
t('D2 в inst пишутся полные имена типов (spec/tool/proc/warn/note/recommendation)', () => {
    const ws = mkWs();
    writeSrc(ws, [{ oem: TARGET, name: 'Амортизатор задний', cat: 'RearAxle', inst: [{ type: 'warn', text: 'x' }] }]);
    runWs(ws, ['--apply']);
    const types = new Set(readSrc(ws)[0].inst.map(x => x.type));
    const allowed = new Set(['spec', 'tool', 'proc', 'warn', 'note', 'recommendation']);
    const bad = [...types].filter(x => !allowed.has(x));
    eq(bad.length, 0, 'неизвестные типы: ' + bad.join(', '));
    okTrue(types.size >= 3, 'типов подозрительно мало: ' + [...types].join(','));
});
t('D3 второй прогон не дублирует строки в inst (нормализация типа warn↔w)', () => {
    const ws = mkWs();
    writeSrc(ws, [{ oem: TARGET, name: 'Амортизатор задний', cat: 'RearAxle', inst: [{ type: 'warn', text: 'x' }] }]);
    runWs(ws, ['--apply']);
    const n1 = readSrc(ws)[0].inst.length;
    const r = runWs(ws, ['--apply']);
    const n2 = readSrc(ws)[0].inst.length;
    eq(n2, n1, 'дубли при повторном прогоне');
    okTrue(/карточек затронуто: 0/.test(r.out + r.err), 'второй прогон что-то добавил');
});
t('D4 после слияния нет карточек с обоими полями i и inst', () => {
    const ws = mkWs();
    writeSrc(ws, [
        { oem: TARGET, name: 'Амортизатор задний', cat: 'RearAxle', inst: [{ type: 'warn', text: 'x' }] },
        { o: TARGET + ' L', n: 'Амортизатор задний L', cat: 'RearAxle', i: [['w', 'y']] }
    ]);
    runWs(ws, ['--apply']);
    const bad = readSrc(ws).filter(c => Array.isArray(c.i) && Array.isArray(c.inst) && c.inst.length);
    eq(bad.length, 0, 'карточек с i и inst одновременно: ' + bad.length);
});

/* ================================================================
   E. Идемпотентность (I5) и формат записи (I4)
   ================================================================ */
t('E1 три прогона подряд: md5 data-src не меняется после первого', () => {
    const ws = mkWs();
    writeSrc(ws, [{ o: TARGET, n: 'Амортизатор задний', cat: 'RearAxle' }]);
    runWs(ws, ['--apply']);
    const p = path.join(ws, 'data-src', 'parts-99-test.json');
    const h1 = fs.readFileSync(p);
    runWs(ws, ['--apply']);
    const h2 = fs.readFileSync(p);
    runWs(ws, ['--apply']);
    const h3 = fs.readFileSync(p);
    okTrue(h1.equals(h2) && h2.equals(h3), 'файл изменился на повторном прогоне');
});
t('E2 I4: CRLF, 2 пробела, без завершающего перевода строки', () => {
    const ws = mkWs();
    writeSrc(ws, [{ o: TARGET, n: 'Амортизатор задний', cat: 'RearAxle' }]);
    runWs(ws, ['--apply']);
    const raw = fs.readFileSync(path.join(ws, 'data-src', 'parts-99-test.json'));
    const txt = raw.toString('utf8');
    eq(txt.split('\n').length - 1, txt.split('\r\n').length - 1, 'есть LF без CR');
    okTrue(raw[raw.length - 1] !== 0x0A, 'файл заканчивается переводом строки');
    const indent = txt.split('\n').find(l => l.startsWith(' ') && l.trim());
    okTrue(indent && /^ {2}\S/.test(indent), 'отступ не 2 пробела: ' + JSON.stringify((indent || '').slice(0, 6)));
});
t('E3 карточке без инструкций не создаётся пустое поле i', () => {
    const ws = mkWs();
    fs.rmSync(path.join(ws, 'tools', 'instructions'), { recursive: true, force: true });
    fs.mkdirSync(path.join(ws, 'tools', 'instructions'), { recursive: true });
    fs.writeFileSync(path.join(ws, 'tools', 'instructions', '00-shared.json'), JSON.stringify({ shared: {} }), 'utf8');
    fs.writeFileSync(path.join(ws, 'tools', 'instructions', '90-test.json'), JSON.stringify({
        entries: [{ id: 'x1', title: 't', oems: ['AAA 111 111'], src: ['ОП'], proc: ['1. Шаг.'] }]
    }), 'utf8');
    writeSrc(ws, [{ o: 'BBB 222 222', n: 'Другая деталь', cat: 'RearAxle' }]);
    runWs(ws, ['--apply']);
    okTrue(!('i' in readSrc(ws)[0]), 'создано пустое поле i');
});

/* ================================================================
   F. H1 — защита от пустого data-src и затирания артефактов
   ================================================================ */
t('F1 data-src отсутствует: exit 2, внятное сообщение, без стека ENOENT', () => {
    const ws = mkWs();
    fs.rmSync(path.join(ws, 'data-src'), { recursive: true, force: true });
    const r = runWs(ws, ['--apply']);
    eq(r.code, 2, 'exit');
    okTrue(/не найден/.test(r.err), 'нет внятного сообщения: ' + r.err.slice(0, 160));
    okTrue(!/ENOENT/.test(r.err), ' fallthrough на необработанный ENOENT');
});
t('F2 data-src пуст: exit 2, артефакты не созданы', () => {
    const ws = mkWs();
    const r = runWs(ws, ['--apply']);
    eq(r.code, 2, 'exit');
    okTrue(/нет ни одного parts-\*\.json/.test(r.err), 'нет сообщения: ' + r.err.slice(0, 160));
    okTrue(!fs.existsSync(path.join(ws, 'restore', 'INSTRUCTIONS-REPORT.md')), 'отчёт всё-таки создан');
    okTrue(!fs.existsSync(path.join(ws, 'restore', 'instructions-applied.json')), 'applied.json всё-таки создан');
});
t('F3 нулевой прогон не затирает боевой отчёт, пишет .noop.md', () => {
    const ws = mkWs();
    writeSrc(ws, [{ o: TARGET, n: 'Амортизатор задний', cat: 'RearAxle' }]);
    runWs(ws, ['--apply']);
    const rep = path.join(ws, 'restore', 'INSTRUCTIONS-REPORT.md');
    const app = path.join(ws, 'restore', 'instructions-applied.json');
    okTrue(fs.existsSync(rep) && fs.existsSync(app), 'артефакты первого прогона не созданы');
    const before1 = fs.readFileSync(rep), before2 = fs.readFileSync(app);
    const r2 = runWs(ws, ['--apply']);
    okTrue(before1.equals(fs.readFileSync(rep)), 'INSTRUCTIONS-REPORT.md перезаписан нулевым прогоном');
    okTrue(before2.equals(fs.readFileSync(app)), 'instructions-applied.json перезаписан нулевым прогоном');
    okTrue(fs.existsSync(path.join(ws, 'restore', 'INSTRUCTIONS-REPORT.noop.md')), 'нет .noop.md');
    okTrue(/уже слито/.test(r2.out + r2.err), 'нет сообщения о нулевом прогоне');
});
t('F4 instructions-applied.json честный: applied=true только при реальных правках', () => {
    const ws = mkWs();
    writeSrc(ws, [{ o: TARGET, n: 'Амортизатор задний', cat: 'RearAxle' }]);
    runWs(ws, ['--apply']);
    const j = JSON.parse(fs.readFileSync(path.join(ws, 'restore', 'instructions-applied.json'), 'utf8'));
    eq(j.applied, true);
    okTrue(j.addedItems > 0, 'addedItems = 0 при applied = true');
    okTrue(j.touchedRecs === 1, 'touchedRecs = ' + j.touchedRecs);
});

/* ================================================================
   G. M1 — --force со сломанной регуляркой
   ================================================================ */
t('G1 --force со сломанной oemRe не падает и не портит данные', () => {
    const ws = mkWs();
    const libDir = path.join(ws, 'tools', 'instructions');
    fs.rmSync(libDir, { recursive: true, force: true });
    fs.mkdirSync(libDir, { recursive: true });
    fs.writeFileSync(path.join(libDir, '00-shared.json'), JSON.stringify({ shared: {} }), 'utf8');
    fs.writeFileSync(path.join(libDir, '90-test.json'), JSON.stringify({
        entries: [
            { id: 'bad-re', title: 't', oemRe: ['6N0 513 031 (X'], src: ['ОП'], proc: ['1. Шаг.'] },
            { id: 'good', title: 't2', oems: [TARGET], src: ['ОП'], spec: ['20 Нм.'] }
        ]
    }), 'utf8');
    writeSrc(ws, [{ o: TARGET, n: 'Амортизатор задний', cat: 'RearAxle' }]);
    const rc = runWs(ws, ['--check']);
    okTrue(rc.code === 1, '--check не увидел сломанную регулярку');
    okTrue(/Unterminated group|Invalid regular expression/.test(rc.txt), 'нет внятной ошибки: ' + rc.txt.slice(0, 160));
    const r = runWs(ws, ['--apply', '--force']);
    okTrue(!/SyntaxError/.test(r.txt), 'падение на SyntaxError: ' + r.txt.slice(0, 200));
    okTrue(!/at Module\._load|node:internal/.test(r.txt), 'необработанный стек');
    const c = readSrc(ws)[0];
    okTrue((c.i || []).length >= 1, 'хорошая запись не применилась');
});

/* ================================================================
   H. Валидатор ловит дефекты библиотеки (M3, L1)
   ================================================================ */
function brokenLib(mutate) {
    const ws = mkWs();
    const libDir = path.join(ws, 'tools', 'instructions');
    fs.rmSync(libDir, { recursive: true, force: true });
    fs.mkdirSync(libDir, { recursive: true });
    /* копируем настоящую библиотеку и ломаем одну запись */
    fs.readdirSync(LIB).forEach(f => {
        let txt = fs.readFileSync(path.join(LIB, f), 'utf8');
        txt = mutate(f, txt);
        fs.writeFileSync(path.join(libDir, f), txt, 'utf8');
    });
    return ws;
}
t('H1 L1: смешанная нумерация proc — ошибка --check', () => {
    /* ломаем запись, у которой proc БЕЗ нумерации, — добавляем один нумерованный шаг */
    const ws = brokenLib((f, txt) => txt);
    const p = path.join(ws, 'tools', 'instructions', '41-rear-axle.json');
    const d = JSON.parse(fs.readFileSync(p, 'utf8'));
    const e = d.entries.find(x => (x.proc || []).length && !(x.proc || []).some(s2 => NUM.test(String(s2))));
    okTrue(e, 'не найдена запись с ненумерованным proc');
    e.proc = ['1. Нумерованный шаг.'].concat(e.proc.slice(0, 2));
    fs.writeFileSync(p, JSON.stringify(d, null, 2), 'utf8');
    const r = runWs(ws, ['--check']);
    eq(r.code, 1, 'exit');
    okTrue(/смешанная нумерация/.test(r.txt), 'нет сообщения: ' + r.txt.slice(-260));
});
t('H2 M3: нумерованный proc + общий блок с proc — ошибка --check', () => {
    const ws = brokenLib((f, txt) => txt);
    const p = path.join(ws, 'tools', 'instructions', '32-brakes-hydraulics.json');
    const d = JSON.parse(fs.readFileSync(p, 'utf8'));
    const e = d.entries.find(x => x.id === 'brake-master-cylinder');
    okTrue(e, 'нет записи brake-master-cylinder');
    e.use = [{ id: 'brake-bleed', only: ['proc', 'warn'] }];
    fs.writeFileSync(p, JSON.stringify(d, null, 2), 'utf8');
    const r = runWs(ws, ['--check']);
    eq(r.code, 1, 'exit');
    okTrue(/вставит перед ним/.test(r.err), 'нет диагностики M3: ' + r.err.slice(0, 200));
});
t('H3 M3: use.only на несуществующее поле блока — предупреждение', () => {
    const ws = brokenLib((f, txt) => txt);
    const p = path.join(ws, 'tools', 'instructions', '32-brakes-hydraulics.json');
    const d = JSON.parse(fs.readFileSync(p, 'utf8'));
    const e = d.entries.find(x => x.id === 'abs-sensor');
    e.use = [{ id: 'abs-work', only: ['proc', 'warn', 'note'] }];
    fs.writeFileSync(p, JSON.stringify(d, null, 2), 'utf8');
    const r = runWs(ws, ['--check', '--verbose']);
    okTrue(/нет такого поля/.test(r.txt), 'нет предупреждения: ' + r.txt.slice(-300));
});
t('H4 M4: неизвестная метка src — предупреждение', () => {
    const ws = brokenLib((f, txt) => txt);
    const p = path.join(ws, 'tools', 'instructions', '41-rear-axle.json');
    const d = JSON.parse(fs.readFileSync(p, 'utf8'));
    d.entries[0].src = ['Из головы'];
    fs.writeFileSync(p, JSON.stringify(d, null, 2), 'utf8');
    const r = runWs(ws, ['--check', '--verbose']);
    okTrue(/не соответствует таксономии/.test(r.txt), 'нет предупреждения о src: ' + r.txt.slice(-300));
});

/* ================================================================
   I. Рантайм: parseInst() объединяет i и inst
   ================================================================ */
const appSrc = fs.readFileSync(APP, 'utf8');
function cut(start, endMark) {
    const i = appSrc.indexOf(start);
    if (i < 0) throw new Error('в app.js нет ' + start);
    const j = appSrc.indexOf(endMark, i);
    if (j < 0) throw new Error('не найден конец ' + start);
    return appSrc.slice(i, j + endMark.length);
}
const sandbox = { console };
vm.createContext(sandbox);
vm.runInContext([
    appSrc.match(/const IM = \{[^}]*\};/)[0],
    appSrc.match(/const MI = \{[^}]*\};/)[0],
    cut('function instEntry(x) {', '\n}\n'),
    cut('function parseInst(p) {', '\n}\n'),
    ';Object.assign(globalThis, { IM, MI, instEntry, parseInst });'
].join('\n'), sandbox);

t('I1 parseInst: только i', () => {
    const r = sandbox.parseInst({ i: [['w', 'A'], ['s', 'B']] });
    eq(r.length, 2);
    eq(r[0].type, 'warn');
    eq(r[1].type, 'spec');
});
t('I2 parseInst: только inst', () => {
    const r = sandbox.parseInst({ inst: [{ type: 'warn', text: 'A' }] });
    eq(r.length, 1);
    eq(r[0].type, 'warn');
});
t('I3 parseInst: ОБА поля объединяются (H3 — inst больше не теряется)', () => {
    const r = sandbox.parseInst({ i: [['w', 'из библиотеки']], inst: [{ type: 'warn', text: 'из карточки' }] });
    eq(r.length, 2, 'inst потерян');
    eq(r[1].text, 'из карточки');
});
t('I4 parseInst: дубли по типу+тексту отбрасываются', () => {
    const r = sandbox.parseInst({ i: [['w', 'A']], inst: [{ type: 'warn', text: 'A' }, { type: 'note', text: 'B' }] });
    eq(r.length, 2, 'дубль не отброшен');
});
t('I5 parseInst: плоский формат ["s","текст"] и мусор', () => {
    eq(sandbox.parseInst({ i: ['s', 'Шланг'] })[0].type, 'spec');
    eq(sandbox.parseInst({}).length, 0);
    eq(sandbox.parseInst({ i: [] }).length, 0);
    eq(sandbox.parseInst({ i: [null, ['s', ''], 'строка', ['x']] }).length, 0);
});
t('I6 parseInst: короткий код и длинное имя типа дают одно и то же', () => {
    eq(sandbox.parseInst({ i: [['w', 'A']] })[0].type, sandbox.parseInst({ i: [{ type: 'warn', text: 'A' }] })[0].type);
});
t('I7 parseInst самодостаточна (тест вырезает её из исходника по маркеру)', () => {
    okTrue(typeof sandbox.parseInst === 'function', 'не извлёкся');
    /* внешний помощник сломал бы извлечение — проверяем, что его нет */
    okTrue(!/function instList/.test(appSrc), 'в app.js появилась внешняя instList — извлечение в тесте сломается');
});

/* ================================================================
   J. M5 — appliesEngines как рабочий фильтр
   ================================================================ */
function wsWithLib(libEntries, cards) {
    const ws = mkWs();
    const libDir = path.join(ws, 'tools', 'instructions');
    fs.rmSync(libDir, { recursive: true, force: true });
    fs.mkdirSync(libDir, { recursive: true });
    fs.writeFileSync(path.join(libDir, '00-shared.json'), JSON.stringify({ shared: {} }), 'utf8');
    fs.writeFileSync(path.join(libDir, '90-test.json'), JSON.stringify({ entries: libEntries }, null, 2), 'utf8');
    writeSrc(ws, cards);
    return ws;
}
t('J1 appliesEngines: запись применяется только при пересечении кодов', () => {
    const ws = wsWithLib([
        { id: 'e-all', title: 't', oems: ['ZZZ 111 111'], src: ['ОП'], spec: ['A'] },
        { id: 'e-ok', title: 't', oems: ['ZZZ 111 111'], appliesEngines: ['AEX', 'AKV'], src: ['ОП'], spec: ['B'] },
        { id: 'e-no', title: 't', oems: ['ZZZ 111 111'], appliesEngines: ['AHW', 'APE'], src: ['ОП'], spec: ['C'] }
    ], [{ o: 'ZZZ 111 111', n: 'Деталь', cat: 'Engine', engines: ['AER', 'AEX', 'AKV'] }]);
    runWs(ws, ['--apply']);
    const txt = (readSrc(ws)[0].i || []).map(x => x[1]);
    okTrue(txt.includes('A'), 'запись без фильтра не применилась');
    okTrue(txt.includes('B'), 'appliesEngines с пересечением не применился');
    okTrue(!txt.includes('C'), 'appliesEngines БЕЗ пересечения применился — фильтр не работает');
});
t('J2 appliesEngines: пустая применимость карточки = «для всех»', () => {
    const ws = wsWithLib([
        { id: 'e-any', title: 't', oems: ['YYY 222 222'], appliesEngines: ['AHW'], src: ['ОП'], spec: ['D'] }
    ], [{ o: 'YYY 222 222', n: 'Деталь без engines', cat: 'Engine' }]);
    runWs(ws, ['--apply']);
    const i = readSrc(ws)[0].i || [];
    eq(i.length, 1, 'карточка без engines должна получать запись (правило «пустая применимость = для всех»)');
});
t('J3 appliesEngines: неизвестный код мотора — ошибка --check', () => {
    const ws = wsWithLib([
        { id: 'e-bad', title: 't', oems: ['ZZZ 111 111'], appliesEngines: ['ZZZZZ'], src: ['ОП'], spec: ['A'] }
    ], [{ o: 'ZZZ 111 111', n: 'Деталь', cat: 'Engine' }]);
    const r = runWs(ws, ['--check']);
    eq(r.code, 1, 'exit');
    okTrue(/неизвестные коды моторов/.test(r.txt), 'нет диагностики: ' + r.txt.slice(-240));
});
t('J4 appliesEngines: пустой массив — ошибка --check', () => {
    const ws = wsWithLib([
        { id: 'e-empty', title: 't', oems: ['ZZZ 111 111'], appliesEngines: [], src: ['ОП'], spec: ['A'] }
    ], [{ o: 'ZZZ 111 111', n: 'Деталь', cat: 'Engine' }]);
    const r = runWs(ws, ['--check']);
    eq(r.code, 1, 'exit');
    okTrue(/непустым массивом/.test(r.txt), 'нет диагностики: ' + r.txt.slice(-240));
});

/* ---------- итог ---------- */
console.log('test_instructions: ' + ok + ' ok, ' + fail + ' fail');
if (fail) {
    fails.forEach(f => console.log('  ✗ ' + f));
    process.exit(1);
}
process.exit(0);
