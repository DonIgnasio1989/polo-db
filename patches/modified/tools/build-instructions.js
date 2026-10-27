#!/usr/bin/env node
/* ============================================================
   tools/build-instructions.js — слияние библиотеки инструкций
   ------------------------------------------------------------
   Библиотека: tools/instructions/*.json (см. tools/instructions/README.md)
   Цель:       data-src/parts-*.json (поле `i` каждой записи)

   Запуск:
     node tools/build-instructions.js --dry      # показать, что будет сделано
     node tools/build-instructions.js --apply    # записать в data-src
     node tools/build-instructions.js --check    # только гигиена библиотеки (CI)

   Правила:
     I1  совпадение по точному артикулу (`oems`) или по регулярному
         выражению (`oemRe`) поля `o`; необязательные фильтры `cats`
         и `nameRe`. Одна запись библиотеки применяется к карточке
         НЕ БОЛЕЕ ОДНОГО РАЗА.
     I2  строки библиотеки ДОПОЛНЯЮТ существующие `i`, ничего не
         удаляя и не переписывая: дубликаты по тексту отбрасываются.
         Порядок типов: s → t → p → w → n → r (в UI предупреждения
         всё равно поднимаются наверх — js/app.js:4940).
     I3  имена, артикулы, категории, `sup` НЕ трогаются: ключ слияния
         приложения (oem + name) остаётся прежним, «сирот» в IndexedDB
         не появляется, «♻️ Пересобрать базу» не требуется.
     I4  файлы data-src записываются в том же формате, что и после
         остальных миграций: JSON.stringify(arr, null, 2) + CRLF,
         без завершающего перевода строки (детерминированно).
     I5  идемпотентность: повторный запуск не меняет ни байта.

   Гигиена библиотеки (--dry/--apply/--check):
     · id уникальны во всех файлах;
     · ключи в `use` существуют в 00-shared.json;
     · типы — только s/t/p/w/n/r (как в MI из js/app.js);
     · текст непустой, без управляющих символов и двойных пробелов;
     · каждый `oems`/`oemRe` находит хотя бы одну карточку
       (иначе это опечатка в артикуле — ошибка, не предупреждение);
     · у записи есть хотя бы один из oems/oemRe;
     · `src` непустой: источник обязателен (правило «не выдумывать»).

   Отчёт: restore/INSTRUCTIONS-REPORT.md + restore/instructions-applied.json
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'data-src');
const LIB = path.join(__dirname, 'instructions');
const OUT = path.join(ROOT, 'restore');

const ARGS = process.argv.slice(2);
const APPLY = ARGS.includes('--apply');
const CHECK_ONLY = ARGS.includes('--check');
const VERBOSE = ARGS.includes('--verbose') || ARGS.includes('-v');

/* типы инструкций — из js/app.js (IM/MI), чтобы не разъезжаться с рантаймом */
const appSrc = fs.readFileSync(path.join(ROOT, 'js', 'app.js'), 'utf8');
const IM = Object.fromEntries([...((appSrc.match(/const IM = \{([^}]*)\}/) || [, ''])[1])
    .matchAll(/(\w+):\s*'(\w)'/g)].map(m => [m[1], m[2]]));
/* M5: словарь кодов двигателей из js/app.js — для валидации `appliesEngines` */
const ENGINES = new Set([...((appSrc.match(/const ENGINES = \{([\s\S]*?)\n\};/) || [, ''])[1])
    .matchAll(/'([0-9A-Za-z]+)'\s*:/g)].map(m => m[1]));
/* поле библиотеки → код типа */
const FIELD = { spec: 's', tools: 't', proc: 'p', warn: 'w', note: 'n', rec: 'r' };
/* H3: обратная карта к IM из js/app.js — поле `inst` хранит типы полными словами */
const MI_REV = { s: 'spec', t: 'tool', p: 'proc', w: 'warn', n: 'note', r: 'recommendation' };
const ORDER = ['spec', 'tools', 'proc', 'warn', 'note', 'rec'];
const KEYS_TXT = ORDER;
/* M4: допустимые метки `src` (таксономия tools/instructions/README.md).
       Незаявленная метка — предупреждение, а не ошибка: список источников растёт.
       `restore/<файл>` — внутренний аналитический отчёт проекта (например
       restore/VCDS-LOG-ANALYSIS.md); в таксономию README добавлен явно.
       `Ф.<площадка>` — форумы/клубы/пресса (Ф.drive2, Ф.zr.ru, Ф.auto.ru…):
       данные НЕ заводские, факты из таких источников пишутся с ⚠ в тексте. */
const SRC_OK = /^(?:Спр\.(?:Torque|FluidSpecs|Wheels|Lamps)|A\/E|AD\.Polo6N1|ОП|К .+|⚠ .*|restore\/[A-Za-z0-9._-]+\.md|Ф\.[A-Za-z0-9._-]+)$/;

const norm = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
const normOem = s => String(s == null ? '' : s).toUpperCase().replace(/\s+/g, ' ');
const oemOf = r => normOem(r.o || r.oem);
const nameOf = r => norm(r.n || r.name);
const catOf = r => String(r.cat || '');

/* ---------- загрузка библиотеки ---------- */
function loadLibrary() {
    const files = fs.readdirSync(LIB).filter(f => f.endsWith('.json')).sort();
    const shared = {};
    const entries = [];
    const errors = [];
    const warns = [];
    const ids = new Map();

    for (const f of files) {
        let doc;
        try { doc = JSON.parse(fs.readFileSync(path.join(LIB, f), 'utf8')); }
        catch (e) { errors.push(f + ': не JSON — ' + e.message); continue; }
        if (f === '00-shared.json') {
            for (const [k, v] of Object.entries(doc.shared || {})) {
                if (shared[k]) errors.push('00-shared.json: дубль общего блока «' + k + '»');
                shared[k] = Object.assign({ id: k }, v);
                if (ids.has(k)) errors.push('id «' + k + '» повторяется (' + ids.get(k) + ' и 00-shared.json)');
                ids.set(k, f);
            }
            continue;
        }
        for (const e of (doc.entries || [])) {
            if (!e.id) { errors.push(f + ': запись без id'); continue; }
            if (ids.has(e.id)) errors.push('id «' + e.id + '» повторяется (' + ids.get(e.id) + ' и ' + f + ')');
            ids.set(e.id, f);
            entries.push(Object.assign({ _file: f }, e));
        }
    }

    /* гигиена каждой записи */
    for (const e of entries.concat(Object.values(shared))) {
        const f = e._file || '00-shared.json';
        const hasSel = (Array.isArray(e.oems) && e.oems.length) || (Array.isArray(e.oemRe) && e.oemRe.length);
        if (e._file && !hasSel) errors.push(f + ' / ' + e.id + ': нет ни oems, ни oemRe — запись ни к чему не применится');
        if (hasSel && e._file === undefined) warns.push('общий блок «' + e.id + '» имеет селектор — он не применяется к карточкам напрямую');
        /* M1: регулярки компилируем ОДИН раз и здесь же — дальше по коду
               используются готовые объекты (_oemRe/_nameRe), поэтому --force
               больше не может упасть необработанным SyntaxError в цикле слияния. */
        e._oemRe = [];
        for (const re of (e.oemRe || [])) {
            try { e._oemRe.push(new RegExp(re)); } catch (err) { errors.push(f + ' / ' + e.id + ': oemRe «' + re + '» — ' + err.message); }
        }
        if (e.nameRe) {
            try { e._nameRe = new RegExp(e.nameRe); } catch (err) { errors.push(f + ' / ' + e.id + ': nameRe — ' + err.message); }
        }
        /* H1/M4: белый список меток источника (таксономия из tools/instructions/README.md) */
        for (const s of (e.src || [])) {
            if (!SRC_OK.test(String(s))) warns.push(f + ' / ' + e.id + ': src «' + s + '» не соответствует таксономии README');
        }
        if (!Array.isArray(e.src) || !e.src.length) errors.push(f + ' / ' + e.id + ': пустой src — источник обязателен');
        /* M5: appliesEngines — РАБОЧИЙ фильтр по кодам моторов (в отличие от
           `applies`, который остаётся комментарием для читателя). */
        if (e.appliesEngines !== undefined) {
            if (!Array.isArray(e.appliesEngines) || !e.appliesEngines.length)
                errors.push(f + ' / ' + e.id + ': appliesEngines должен быть непустым массивом кодов');
            else {
                const bad = e.appliesEngines.map(x => String(x).trim().toUpperCase()).filter(x => !ENGINES.has(x));
                if (bad.length) errors.push(f + ' / ' + e.id + ': appliesEngines — неизвестные коды моторов: ' + bad.join(', '));
                const norm2 = e.appliesEngines.map(x => String(x).trim().toUpperCase());
                if (new Set(norm2).size !== norm2.length) warns.push(f + ' / ' + e.id + ': appliesEngines — повторы кодов');
            }
        }
        for (const u of (e.use || [])) {
            const id = typeof u === 'string' ? u : (u && u.id);
            if (!id || !shared[id]) { errors.push(f + ' / ' + e.id + ': use «' + JSON.stringify(u) + '» отсутствует в 00-shared.json'); continue; }
            if (typeof u === 'object' && Array.isArray(u.only)) u.only.forEach(k => { if (!ORDER.includes(k)) errors.push(f + ' / ' + e.id + ': use.only «' + k + '» — нет такого поля'); });
            /* M3 (аудит 2026-10-27): only ссылается на поле, которого у блока нет —
               селекция вводит в заблуждение (так было у abs-sensor ← abs-work.proc). */
            if (typeof u === 'object' && Array.isArray(u.only)) u.only.forEach(k => {
                if (ORDER.includes(k) && !(Array.isArray(shared[id][k]) && shared[id][k].length))
                    warns.push(f + ' / ' + e.id + ': use.only «' + k + '» — у блока «' + id + '» нет такого поля');
            });
            /* M3 (аудит 2026-10-27): общие строки `proc` встают ПЕРЕД собственными
               (flatten() сначала разворачивает use). Если свои шаги нумерованы,
               вставка ненумерованных ломает последовательность «1. 2. 3…» в карточке. */
            const ownProc = Array.isArray(e.proc) ? e.proc : [];
            const numbered = ownProc.filter(x => /^\s*\d+[.)]\s/.test(String(x))).length;
            if (numbered === ownProc.length && ownProc.length) {
                const sharedProc = (Array.isArray(shared[id].proc) ? shared[id].proc : [])
                    .filter(x => !/^\s*\d+[.)]\s/.test(String(x)));
                const inj = (typeof u === 'object' && Array.isArray(u.only)) ? u.only.includes('proc') : true;
                if (inj && sharedProc.length) errors.push(f + ' / ' + e.id + ': proc нумерован (1…' + ownProc.length
                    + '), но общий блок «' + id + '» вставит перед ним ' + sharedProc.length
                    + ' ненумерованных строк — уберите «proc» из use.only или перенесите их в note');
            }
        }
        for (const k of KEYS_TXT) {
            const v = e[k];
            if (v === undefined) continue;
            if (!Array.isArray(v)) { errors.push(f + ' / ' + e.id + ': ' + k + ' должен быть массивом строк'); continue; }
            v.forEach((s, i) => {
                const t = norm(s);
                if (!t) errors.push(f + ' / ' + e.id + ': ' + k + '[' + i + '] пуст');
                else if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s)) errors.push(f + ' / ' + e.id + ': ' + k + '[' + i + '] содержит управляющие символы');
                else if (/  /.test(t)) warns.push(f + ' / ' + e.id + ': ' + k + '[' + i + '] двойной пробел');
            });
        }
        /* L1 (аудит 2026-10-27): стиль нумерации шагов. В библиотеке нет единого
           правила (222 из 343 строк proc нумерованы), но ВНУТРИ одной записи стиль
           выдержан всегда — это и фиксируем, чтобы разнобой не появился. */
        if (Array.isArray(e.proc) && e.proc.length) {
            const num = e.proc.filter(x => /^\s*\d+[.)]\s/.test(String(x))).length;
            if (num && num !== e.proc.length) errors.push(f + ' / ' + e.id + ': proc — смешанная нумерация ('
                + num + ' из ' + e.proc.length + ' с «N.»): внутри записи стиль должен быть один');
        }
        for (const k of Object.keys(e)) {
            /* служебные поля с «_» добавляет сам валидатор (_file, _oemRe, _nameRe) */
            if (k[0] === '_') continue;
            if (!['id', 'title', 'oems', 'oemRe', 'cats', 'nameRe', 'applies', 'appliesEngines', 'src', 'use'].concat(KEYS_TXT).includes(k)) {
                errors.push(f + ' / ' + e.id + ': неизвестное поле «' + k + '»');
            }
        }
    }
    return { entries, shared, errors, warns };
}

/* ---------- разворачивание записи в плоский список [type, text] ---------- */
function flatten(e, shared) {
    const items = [];
    const push = (k, arr) => (arr || []).forEach(s => items.push([FIELD[k], norm(s)]));
    /* сначала общие блоки (use) — они задают правила, потом свои строки.
       Поддержка двух форм: "use": ["brake-bleed"] и
       "use": [{"id": "brake-bleed", "only": ["proc", "warn"]}] — чтобы
       не тащить в карточку весь блок, а взять только нужную часть. */
    for (const u of (e.use || [])) {
        const id = typeof u === 'string' ? u : u.id;
        const only = (typeof u === 'object' && Array.isArray(u.only) && u.only.length) ? u.only : ORDER;
        const s = shared[id];
        if (!s) continue;
        for (const k of ORDER) if (only.includes(k)) push(k, s[k]);
    }
    for (const k of ORDER) push(k, e[k]);
    /* дедупликация по тексту внутри одной записи библиотеки */
    const seen = new Set();
    return items.filter(it => (seen.has(it[0] + '|' + it[1]) ? false : (seen.add(it[0] + '|' + it[1]), true)));
}

/* ---------- соответствие карточки ---------- */
/* M6: `o` бывает составным — «6X0 199 315 E · 6X0 199 315 F», «030 121 008 C · CX».
       Точное сравнение со строкой целиком такие карточки не находило, поэтому
       артикул разбивается по «·» и сравнивается по частям (регулярки проверяются
       и по частям, и по строке целиком — чтобы «^030 121 008» продолжало работать). */
const oemPartsOf = r => oemOf(r).split('·').map(s => s.trim()).filter(Boolean);

function match(e, rec) {
    const whole = oemOf(rec);
    const parts = oemPartsOf(rec);
    let hit = false;
    if (Array.isArray(e.oems)) {
        const want = e.oems.map(normOem);
        hit = parts.some(p => want.includes(p));
    }
    if (!hit && (e._oemRe || []).length) hit = e._oemRe.some(re => parts.some(p => re.test(p)) || re.test(whole));
    if (!hit) return false;
    if (Array.isArray(e.cats) && e.cats.length && !e.cats.includes(catOf(rec))) return false;
    if (e._nameRe && !e._nameRe.test(nameOf(rec))) return false;
    /* M5: appliesEngines. Пустая применимость карточки = «для всех» (правило
       проекта из restore/PARTS-AUDIT.md), поэтому такие карточки проходят. */
    if (Array.isArray(e.appliesEngines) && e.appliesEngines.length) {
        const ce = Array.isArray(rec.engines) ? rec.engines.map(x => String(x).trim().toUpperCase()) : [];
        if (ce.length) {
            const want = new Set(e.appliesEngines.map(x => String(x).trim().toUpperCase()));
            if (!ce.some(x => want.has(x))) return false;
        }
    }
    return true;
}

/* ---------- основное ---------- */
const lib = loadLibrary();

let code = 0;
if (lib.errors.length) {
    console.error('🔴 Ошибки библиотеки инструкций (' + lib.errors.length + '):');
    lib.errors.forEach(e => console.error('   ' + e));
    code = 1;
}
if (lib.warns.length && VERBOSE) {
    console.warn('⚠ Предупреждения (' + lib.warns.length + '):');
    lib.warns.forEach(w => console.warn('   ' + w));
}
if (code && !ARGS.includes('--force')) process.exit(code);

console.log('библиотека: ' + lib.entries.length + ' записей, ' + Object.keys(lib.shared).length + ' общих блоков, '
    + 'ошибок ' + lib.errors.length + ', предупреждений ' + lib.warns.length);

/* M2 (аудит 2026-10-27): --check раньше не читал каталог вовсе, хотя README
   обещает «валидатор падает, если артикула нет ни в одной карточке». Теперь,
   ЕСЛИ data-src на месте и в нём есть parts-*.json, каждый селектор сверяется
   с каталогом; «мёртвый» селектор — ошибка (опечатка в артикуле), как в README.
   Без каталога --check остаётся чистой гигиеной библиотеки (CI на форке без
   data-src не сломается). Учитывается разбивка составного `o` по «·» (M6). */
if (CHECK_ONLY) {
    if (fs.existsSync(SRC) && fs.statSync(SRC).isDirectory()) {
        const cFiles = fs.readdirSync(SRC).filter(f => /^parts-.*\.json$/.test(f));
        if (cFiles.length) {
            const oemSet = new Set();
            const oemList = [];
            cFiles.forEach(f => {
                JSON.parse(fs.readFileSync(path.join(SRC, f), 'utf8')).forEach(r => {
                    const whole = oemOf(r);
                    oemList.push(whole);
                    oemSet.add(whole);
                    oemPartsOf(r).forEach(p => oemSet.add(p));
                });
            });
            const dead = [];
            for (const e of lib.entries) {
                let hit = (e.oems || []).some(o => oemSet.has(normOem(o)));
                if (!hit) hit = (e._oemRe || []).some(re => oemList.some(o => re.test(o) || oemPartsOf({ o }).some(p => re.test(p))));
                if (!hit) dead.push(e._file + ' / ' + e.id + ' → ' + (e.oems || []).concat(e.oemRe || []).join(', '));
            }
            if (dead.length) {
                console.error('🔴 Селекторы, не нашедшие ни одной карточки в data-src (' + dead.length + ') — опечатка в артикуле или карточки нет в каталоге:');
                dead.forEach(x => console.error('   ' + x));
                code = 1;
            } else {
                console.log('сверка с каталогом: все записи (' + lib.entries.length + ') находят карточки (' + cFiles.length + ' файлов, ' + oemList.length + ' карточек)');
            }
        }
    }
    process.exit(code);
}

/* H1 (часть 1): каталог может отсутствовать вовсе — проверяем ДО readdirSync,
       иначе вместо внятного сообщения будет необработанный ENOENT: scandir. */
if (!fs.existsSync(SRC) || !fs.statSync(SRC).isDirectory()) {
    console.error('🔴 Каталог ' + SRC + ' не найден — сливать некуда.');
    console.error('   Проверьте, что запуск идёт из корня репозитория (tools/.. = корень).');
    console.error('   Отчёт и instructions-applied.json НЕ перезаписаны.');
    process.exit(2);
}

const files = fs.readdirSync(SRC).filter(f => /^parts-.*\.json$/.test(f))
    .sort((a, b) => ((a.match(/parts-(\d+)/) || [0, 99])[1] | 0) - ((b.match(/parts-(\d+)/) || [0, 99])[1] | 0) || a.localeCompare(b));

/* H1: без каталога сливать некуда. Раньше прогон молча доходил до конца,
       печатал «карточек затронуто: 0» и ПЕРЕЗАПИСЫВАЛ restore/ отчётом
       с "applied": true — история прошлого настоящего прогона терялась.
       Тот же гард уже есть в tools/build-parts.js. */
if (!files.length) {   /* H1 (часть 2): каталог есть, но parts-*.json в нём нет */
    console.error('🔴 В ' + SRC + ' нет ни одного parts-*.json — сливать некуда.');
    console.error('   Проверьте, что запуск идёт из корня репозитория и data-src собран миграциями.');
    console.error('   Отчёт и instructions-applied.json НЕ перезаписаны.');
    process.exit(2);
}

const data = files.map(f => ({ f, arr: JSON.parse(fs.readFileSync(path.join(SRC, f), 'utf8')) }));

/* индекс: нормализованный OEM → записи.
   M6: составной артикул индексируется ПО ЧАСТЯМ, каждая часть указывает
   на ту же карточку — иначе «030 121 008 C» не найдёт «030 121 008 C · CX». */
const byOem = new Map();
data.forEach(d => d.arr.forEach((r, i) => {
    const t = { f: d.f, idx: i, rec: r };
    const keys = new Set(oemPartsOf(r));
    keys.add(oemOf(r));                    /* строка целиком — для обратной совместимости */
    keys.forEach(k => { if (!k) return; if (!byOem.has(k)) byOem.set(k, []); byOem.get(k).push(t); });
}));

const perEntry = [];
const log = [];
let addedItems = 0, touchedRecs = 0;
const deadSelectors = [];

for (const e of lib.entries) {
    const items = flatten(e, lib.shared);
    const targets = [];
    const selSet = new Set();
    (e.oems || []).forEach(o => selSet.add(normOem(o)));
    const byExact = [];
    selSet.forEach(o => (byOem.get(o) || []).forEach(t => byExact.push(t)));
    const byRe = [];
    /* M1: берём уже скомпилированные регулярки; M6: проверяем и части составного `o` */
    (e._oemRe || []).forEach(re => {
        data.forEach(d => d.arr.forEach((r, i) => {
            const parts = oemPartsOf(r);
            if (parts.some(p => re.test(p)) || re.test(oemOf(r))) byRe.push({ f: d.f, idx: i, rec: r });
        }));
    });
    const uniq = new Map();
    byExact.concat(byRe).forEach(t => {
        const k = t.f + '#' + t.idx;
        if (!uniq.has(k) && match(e, t.rec)) uniq.set(k, t);
    });
    uniq.forEach(t => targets.push(t));

    if (!targets.length) { deadSelectors.push(e._file + ' / ' + e.id + ' → ' + (e.oems || []).concat(e.oemRe || []).join(', ')); continue; }

    let applied = 0, newItems = 0;
    for (const t of targets) {
        const rec = t.rec;
        /* H3: часть карточек (data-src/parts-06.json) хранит инструкции в поле `inst`
               в виде [{type,text}], а не в `i` в виде [["s","текст"]]. Раньше слияние
               всегда писало в `i`, а parseInst() в js/app.js читает `i` ВМЕСТО `inst`,
               если оно есть — прежние инструкции карточки молча пропадали из UI.
               Пишем в то поле, которое у карточки уже есть. */
        const useInst = Array.isArray(rec.inst) && !Array.isArray(rec.i);
        const haveList = useInst ? rec.inst : (Array.isArray(rec.i) ? rec.i : []);
        /* ключ сравнения приводим к одному виду: в `inst` типы — полные слова
           (warn/recommendation), в `i` — буквы (w/r). IM из app.js — как раз
           карта «полное имя → буква». Без нормализации повторный прогон считал
           бы все строки новыми и дублировал их (проверено: ловится на 2-м --apply). */
        const typeCode = x => Array.isArray(x)
            ? String(x[0])
            : String(IM[String((x && x.type) || '')] || (x && x.type) || '');
        const have = new Set(haveList.map(x => typeCode(x) + '|' + norm(Array.isArray(x) ? x[1] : (x && x.text))));
        const fresh = items.filter(it => !have.has(it[0] + '|' + it[1]));
        if (!fresh.length) continue;               /* поле не создаём, если добавлять нечего */
        const added = useInst
            ? fresh.map(it => ({ type: MI_REV[it[0]] || 'note', text: it[1] }))
            : fresh.map(it => [it[0], it[1]]);
        if (useInst) rec.inst = haveList.concat(added);
        else rec.i = haveList.concat(added);
        applied++; newItems += fresh.length;
        log.push({ file: t.f, idx: t.idx, oem: rec.o || rec.oem, name: rec.n || rec.name, entry: e.id, field: useInst ? 'inst' : 'i', added: fresh.map(x => x[0] + ': ' + x[1].slice(0, 60)) });
    }
    if (applied) { touchedRecs += applied; addedItems += newItems; }
    perEntry.push({ id: e.id, file: e._file, title: e.title || '', targets: targets.length, applied, items: newItems,
        oems: (e.oems || []).concat((e.oemRe || []).map(x => 're:' + x)).join(', ') });
}

/* ---------- запись ---------- */
let written = 0;
if (APPLY && addedItems) {
    for (const d of data) {
        const txt = JSON.stringify(d.arr, null, 2).replace(/\n/g, '\r\n');
        const p = path.join(SRC, d.f);
        if (fs.readFileSync(p, 'utf8') !== txt) { fs.writeFileSync(p, txt, 'utf8'); written++; }
    }
}

/* ---------- отчёт ---------- */
/* L5 (аудит 2026-10-27): в отчёт и в JSON пишется версия приложения, чтобы по
   артефакту было видно, каким релизом он сделан. Имя файла не версионируем:
   на него ссылается документация, а история защищена от затирания нулевым
   прогоном (.noop.md — см. блок записи артефактов ниже). */
let APPVER = '';
try {
    const u = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'update.json'), 'utf8'));
    APPVER = String(u.appVersion || '');
} catch (e) { /* нет update.json — не критично */ }

const md = [];
md.push('# Отчёт по слиянию инструкций — ' + new Date().toISOString().slice(0, 10) + (APPVER ? ' · v' + APPVER : ''));
md.push('');
md.push('Инструмент: `tools/build-instructions.js` · библиотека: `tools/instructions/*.json`');
md.push('Режим: **' + (APPLY ? 'ЗАПИСЬ' : 'ПРОСМОТР (--dry)') + '** · файлов изменено: ' + written + ' · карточек: ' + touchedRecs + ' · добавлено строк: ' + addedItems);
md.push('');
md.push('Слияние ДОПОЛНЯЕТ инструкции карточки и ничего не удаляет: существующие строки');
md.push('остаются на месте, дубликаты по тексту отбрасываются (повторный запуск ничего не меняет).');
md.push('Запись идёт в то поле, которое у карточки уже есть — `i` (`[["s","текст"]]`) или');
md.push('`inst` (`[{type,text}]`, длинная схема `parts-06.json`); типы приводятся по карте `IM`.');
md.push('Ключ слияния приложения (`oem + name`) не затрагивается.');
md.push('');
md.push('## Записи библиотеки');
md.push('');
md.push('| id | файл | заголовок | карточек найдено | применено | строк добавлено |');
md.push('|---|---|---|---|---|---|');
perEntry.forEach(e => md.push('| `' + e.id + '` | ' + e.file + ' | ' + (e.title || '').replace(/\|/g, '/') + ' | ' + e.targets + ' | ' + e.applied + ' | ' + e.items + ' |'));
md.push('');
md.push('## Селекторы, не нашедшие карточек (' + deadSelectors.length + ')');
md.push('');
md.push(deadSelectors.length ? deadSelectors.map(x => '- ⚠ ' + x).join('\n') : '_Нет._');
md.push('');
md.push('## Ошибки и предупреждения библиотеки');
md.push('');
md.push(lib.errors.length ? lib.errors.map(x => '- 🔴 ' + x).join('\n') : '_Ошибок нет._');
md.push('');
md.push(lib.warns.length ? lib.warns.map(x => '- ⚠ ' + x).join('\n') : '_Предупреждений нет._');
md.push('');

/* H1: артефакты перезаписываем, только если прогон содержательный.
       Три случая:
       · ни одна запись не нашла карточку  → data-src скорее всего чужой/неполный:
         НИЧЕГО не перезаписываем, кричим в консоль;
       · карточки найдены, но добавлять нечего (всё уже слито) → просмотрочный
         отчёт уходит в отдельный файл, боевая история не затирается;
       · что-то добавлено → обычный отчёт (+ instructions-applied.json при --apply). */
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
if (!perEntry.length) {
    console.error('🔴 Ни одна запись библиотеки не нашла карточку в ' + SRC + '.');
    console.error('   Похоже на чужой/неполный data-src. Отчёт и instructions-applied.json НЕ перезаписаны.');
} else if (!addedItems) {
    const p = path.join(OUT, 'INSTRUCTIONS-REPORT.noop.md');
    fs.writeFileSync(p, md.join('\n'), 'utf8');
    console.log('добавлять нечего (всё уже слито) — просмотрочный отчёт: restore/INSTRUCTIONS-REPORT.noop.md');
    console.log('   боевые restore/INSTRUCTIONS-REPORT.md и instructions-applied.json НЕ перезаписаны.');
} else {
    /* L5: перед перезаписью архивируем предыдущую версию (.prev) — история
       последнего содержательного прогона не теряется, даже если отчёты
       в restore/ не коммитятся. */
    const repPath = path.join(OUT, 'INSTRUCTIONS-REPORT.md');
    if (fs.existsSync(repPath)) fs.copyFileSync(repPath, path.join(OUT, 'INSTRUCTIONS-REPORT.prev.md'));
    fs.writeFileSync(repPath, md.join('\n'), 'utf8');
    if (APPLY) {
        const apPath = path.join(OUT, 'instructions-applied.json');
        if (fs.existsSync(apPath)) fs.copyFileSync(apPath, path.join(OUT, 'instructions-applied.prev.json'));
        fs.writeFileSync(apPath,
            /* L6: CRLF — как у data-src (правило I4), раньше здесь был LF */
            JSON.stringify({ generated: new Date().toISOString(), appVersion: APPVER, applied: APPLY, touchedRecs, addedItems, written, perEntry, deadSelectors, log }, null, 1)
                .replace(/\n/g, '\r\n'), 'utf8');
    }
    console.log('отчёт: restore/INSTRUCTIONS-REPORT.md');
}

console.log('карточек затронуто: ' + touchedRecs + ', строк инструкций добавлено: ' + addedItems + ', файлов ' + (APPLY ? 'записано ' + written : '(dry — не записано)'));
console.log('записей библиотеки с совпадением: ' + perEntry.length + ' из ' + lib.entries.length);
if (deadSelectors.length) {
    console.warn('⚠ селекторы без карточек (' + deadSelectors.length + '):');
    deadSelectors.forEach(x => console.warn('   ' + x));
}
/* путь к отчёту печатает блок записи артефактов выше — он знает, какой именно
   файл был создан (INSTRUCTIONS-REPORT.md / .noop.md / ничего). */
process.exit(code || (deadSelectors.length ? 1 : 0));
