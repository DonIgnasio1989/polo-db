#!/usr/bin/env node
/* ============================================================
   tools/migrate-1.10.6.js — миграция data-src к релизу 1.10.6
   ------------------------------------------------------------
   Правит ИСХОДНИКИ (data-src/parts-*.json) и ничего больше.
   Идемпентна: повторный запуск не добавляет дублей заметок и
   не ломает уже исправленные записи.

   Правила (M1…M8) описаны в RELEASE-1.10.6.md; машинный лог —
   restore/data-fixes-1.10.6.json, человекочитаемый —
   restore/DATA-FIXES-1.10.6.md.

   Запуск:  node tools/migrate-1.10.6.js [--dry]
   Формат записи сохраняется: CRLF, отступ 2, без завершающего
   перевода строки — как в остальных файлах data-src.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'data-src');
const OUT = path.join(ROOT, 'restore');
const DRY = process.argv.includes('--dry');

/* ---------- словари берём из js/app.js, чтобы не дублировать руками ---------- */
const appSrc = fs.readFileSync(path.join(ROOT, 'js', 'app.js'), 'utf8');
function dictKeys(name) {
    const i = appSrc.indexOf('const ' + name + ' = {');
    if (i < 0) throw new Error('в js/app.js не найден ' + name);
    const j = appSrc.indexOf('\n};', i);
    return new Set([...appSrc.slice(i, j).matchAll(/'([^']+)'\s*:/g)].map(m => m[1]));
}
const ENGINES = dictKeys('ENGINES');
const imBlock = (appSrc.match(/const IM = \{([^}]*)\}/) || [])[1] || '';
const IM = Object.fromEntries([...imBlock.matchAll(/(\w+):\s*'(\w)'/g)].map(m => [m[1], m[2]]));
const MI = Object.fromEntries(Object.entries(IM).map(([k, v]) => [v, k]));
if (!MI.s || !MI.w) throw new Error('не разобрал IM/MI из js/app.js');

/* ---------- утилиты ---------- */
const uniq = a => Array.from(new Set(a.filter(Boolean)));
const oemOf = r => String(r.o || r.oem || '').trim();
const nameOf = r => String(r.n || r.name || '').trim();
const segs = o => String(o || '').split('·').map(s => s.trim()).filter(Boolean);
const isNew = r => ('n' in r) || ('o' in r) || ('i' in r);

/* инструкция в ТОМ ЖЕ формате, в каком хранится запись */
function pushInst(r, type, text) {
    text = String(text || '').trim();
    if (!text) return false;
    if (isNew(r)) {
        if (!Array.isArray(r.i)) r.i = [];
        const code = IM[type] || 'n';
        if (r.i.some(x => Array.isArray(x) && String(x[1]).trim() === text)) return false;
        r.i.push([code, text]);
    } else {
        if (!Array.isArray(r.inst)) r.inst = [];
        if (r.inst.some(x => x && String(x.text).trim() === text)) return false;
        r.inst.push({ type, text });
    }
    return true;
}
/* уже ли есть в инструкциях запись, содержащая эту подстроку */
function instHas(r, needle) {
    const n = String(needle || '').trim().toLowerCase();
    if (!n) return false;
    const list = isNew(r) ? (r.i || []) : (r.inst || []);
    return list.some(x => {
        const t = Array.isArray(x) ? String(x[1] || '') : String((x && x.text) || '');
        return t.toLowerCase().includes(n);
    });
}

/* ---------- «мусорные» аналоги ----------
   «Universeel 10.9», «Universeel М12», «Used part», «Repro» — не артикулы.
   Они либо отравляли граф кроссов (см. anCodeOk в js/app.js), либо висели
   в карточке как «аналог». Переносим в инструкции, из `a` убираем.
   Кириллические подсказки («ФЭСТ», «Качок К90», «Любой по ГОСТ») НЕ трогаем:
   для RoadKit/Fluids это осмысленные названия того, что покупать. */
const JUNK_RE = /^(universeel|universal)\b|^used part$|^repro$|^refurbished$/i;
function junkNote(s) {
    const v = String(s).trim();
    const low = v.toLowerCase();
    if (low === 'used part') return 'Допустима б/у-деталь (used part).';
    if (low === 'repro') return 'Есть неоригинальные реплики (repro).';
    if (low === 'refurbished') return 'Встречаются восстановленные (refurbished).';
    const tail = v.replace(/^(universeel|universal)\b[:\-–]?\s*/i, '').trim();
    if (!tail) return 'Универсальный аналог — это не артикул: подбирайте по размеру/характеристике.';
    return 'Универсальный аналог: ' + tail + ' — это не артикул, подбирайте по размеру/характеристике.';
}

/* ---------- правила ---------- */
const log = [];
const review = [];   /* спорная применимость — на ручное подтверждение */
const add = (file, idx, oem, rule, text) => log.push({ file, idx, oem, rule, text });

function migrate(file, arr) {
    arr.forEach((r, idx) => {
        const oem = oemOf(r), name = nameOf(r);
        const at = t => add(file, idx, oem, t.rule, t.text);

        /* M1 — плоский `i`: ["s","текст"] вместо [["s","текст"]] */
        if (Array.isArray(r.i) && r.i.length === 2 &&
            typeof r.i[0] === 'string' && typeof r.i[1] === 'string' && MI[r.i[0]]) {
            const flat = r.i.slice();
            r.i = [[flat[0], flat[1]]];
            at({ rule: 'M1', text: 'i: плоский массив ["' + flat[0] + '",…] → пара [["' + flat[0] + '","' + flat[1] + '"]]' });
        }

        /* M2 — объекты внутри `i`: {type:"spec",text:"…"} → ["s","…"] */
        if (Array.isArray(r.i) && r.i.some(x => x && typeof x === 'object' && !Array.isArray(x))) {
            const fixed = r.i.map(x => {
                if (Array.isArray(x)) return x;
                if (x && typeof x === 'object') {
                    const t = String(x.type || x.t || '').trim();
                    /* в `i` храним КОРОТКИЙ код (s/t/p/w/n/r): IM — длинное→короткое */
                    const code = MI[t] ? t : (IM[t] || 'n');
                    return [code, String(x.text == null ? '' : x.text)];
                }
                return null;
            }).filter(x => x && String(x[1] || '').trim());
            at({ rule: 'M2', text: 'i: ' + r.i.length + ' объектов {type,text} → ' + fixed.length + ' пар [код,текст]' });
            r.i = fixed;
        }

        /* M3 — мусорные «аналоги» → в инструкции */
        const ak = isNew(r) ? 'a' : 'a';
        if (Array.isArray(r[ak]) && r[ak].some(x => JUNK_RE.test(String(x)))) {
            const keep = [], moved = [];
            r[ak].forEach(x => {
                const s = String(x);
                if (JUNK_RE.test(s)) moved.push(s); else keep.push(x);
            });
            moved.forEach(s => {
                const note = junkNote(s);
                const tail = s.replace(/^(universeel|universal)\b[:\-–]?\s*/i, '').trim();
                if (tail && instHas(r, tail)) return;   // уже описано в инструкциях
                if (pushInst(r, 'note', note)) return;
            });
            r[ak] = keep;
            if (!keep.length && isNew(r) && Array.isArray(r[ak])) { /* оставляем пустой массив как было */ }
            at({ rule: 'M3', text: 'из `a` убрано ' + moved.length + ' не-артикулов (' + moved.join(', ') + ') → в инструкции' });
        }

        /* M4 — колёсный болт 3A0 601 139: доноры и пояснение */
        if (oem === '3A0 601 139') {
            const d = r.d || [];
            if (d.includes('VW Golf IV') || d.includes('VW Passat B5')) {
                r.d = ['VW Polo 6N', 'VW Golf III', 'VW Passat B3/B4'];
                at({ rule: 'M4', text: 'd: [' + d.join(', ') + '] → [' + r.d.join(', ') + '] (3A0 = Passat B3/B4, 4×100; Golf IV/Passat B5 — 5 болтов M14×1,5)' });
            }
            if (pushInst(r, 'warn', 'M12×1,5×23,5 — крепёж колёс 4×100 (Polo 6N, Golf III, Passat B3/B4). На Golf IV и Passat B5 не встаёт: там 5×100/5×112 и болты M14×1,5.'))
                at({ rule: 'M4', text: 'добавлено предупреждение о посадке 4×100' });
        }

        /* M5 — неподтверждённый код AFD убираем из фильтра моторов */
        if (Array.isArray(r.engines) && r.engines.includes('AFD')) {
            r.engines = r.engines.filter(x => x !== 'AFD');
            at({ rule: 'M5', text: 'engines: убран AFD (в ENGINES его нет — по Polo 6N не подтверждён)' });
            pushInst(r, 'note', 'В исходной применимости ETKA встречался код AFD: по Polo 6N он не подтверждён, поэтому в фильтре моторов не участвует (1.10.6).');
        }

        /* M6 — «ADX/ET» в названии: пояснение вместо переименования
           (переименование создало бы дубль карточки у тех, кто уже
           загрузил старую базу: ключ слияния = oem + name). */
        if (oem === '6N1 721 555 J' && /ET/i.test(name)) {
            if (pushInst(r, 'note', 'Обозначение «ET» в названии — не моторный код Polo 6N: в фильтре применимости учтён только ADX.'))
                at({ rule: 'M6', text: 'добавлено пояснение про «ET» (название не меняли — иначе дубль карточки при merge)' });
        }

        /* M7 — перекрёстные ссылки на составной и одиночный крепёж */
        const sg = segs(oem).map(s => s.toUpperCase().replace(/\s+/g, ' '));
        if (sg.length > 1) {
            if (sg.includes('N 101 559 01') && pushInst(r, 'note', 'Винт N 101 559 01 (M8×20 с буртиком) есть в каталоге и отдельной позицией: «Трансмиссия → Кулиса». Не заказывайте дважды.'))
                at({ rule: 'M7', text: 'ссылка на отдельную позицию N 101 559 01' });
            if (sg.includes('N 010 218 6') && pushInst(r, 'note', 'Винт N 010 218 6 (M6×25) есть в каталоге и отдельной позицией: «Органы управления → Педаль газа». Не заказывайте дважды.'))
                at({ rule: 'M7', text: 'ссылка на отдельную позицию N 010 218 6' });
        } else if (oem === 'N 101 559 01' || oem === 'N 010 218 6') {
            if (pushInst(r, 'note', 'Этот винт входит также в составные позиции крепежа двигателя (например, «Винты … крепления сайлент-блока/подрамника/опоры») — проверьте, не заказываете ли его дважды.'))
                at({ rule: 'M7', text: 'обратная ссылка на составные позиции крепежа' });
        }

        /* M8 — parts-07: коды моторов лежали в `d` (доноры).
           Из-за этого pCompat() считал деталь «не подходящей» любой машине,
           а vinStrictOk() исключал её в режиме «VIN-строго». */
        if (/^parts-07/.test(file) && Array.isArray(r.d) && r.d.length) {
            const keepD = [], toEng = [], toNote = [];
            r.d.forEach(x => {
                const s = String(x).trim();
                if (/^[0-9A-Z]{2,4}$/.test(s) && ENGINES.has(s)) toEng.push(s);
                else if (/(vw|volkswagen|seat|skoda|audi|golf|polo|passat|lupo|ibiza|cordoba|arosa|caddy|vento|corrado|sharan|transporter|derby|inca)/i.test(s)) keepD.push(s);
                else if (/^все$/i.test(s)) { /* пусто = «все» — так деталь и так видна всем */ }
                else toNote.push(s);
            });
            if (toEng.length || toNote.length || keepD.length !== r.d.length) {
                const before = r.d.length;
                if (toEng.length) r.engines = uniq((r.engines || []).concat(toEng));
                r.d = keepD;
                if (toNote.length) pushInst(r, 'spec', 'Применимость (из ETKA): ' + toNote.join('; ') + '.');
                at({
                    rule: 'M8',
                    text: 'd: ' + before + ' знач. → доноров ' + keepD.length +
                        ', в engines ' + toEng.length + ' (' + toEng.slice(0, 6).join(',') + (toEng.length > 6 ? '…' : '') + ')' +
                        (toNote.length ? ', в примечание ' + toNote.length + ' (' + toNote.join('; ').slice(0, 60) + ')' : '')
                });
            }
        }
        /* M9 — неполный список доноров.
           Запись про Polo, но в `d` стоят только «соседи» (VW Lupo, Seat Arosa),
           из-за чего pCompat() давал 0 % и метку «не подходит», а vinStrictOk()
           исключал деталь в режиме «VIN-строго». Добавляем Polo только при
           жёстком признаке: префикс OEM 6N* (платформа Polo 6N) или заявленный
           мотор Polo в `engines`. Спорные случаи (030* без моторов) НЕ трогаем —
           они идут списком в restore/COMPAT-REVIEW-1.10.6.md на подтверждение. */
        if (Array.isArray(r.d) && r.d.length &&
            !r.d.some(x => /polo|6n/i.test(String(x)))) {
            const bod = r.bodies || [];
            const caddyOnly = bod.length && bod.every(b => /^caddy/i.test(String(b)));
            if (!caddyOnly) {
                const seg0 = segs(oem)[0] || '';
                const byPrefix = /^6N[0-9]/i.test(seg0);
                const byEngine = (r.engines || []).some(e => ENGINES.has(e) && e !== 'AEH');
                if (byPrefix || byEngine) {
                    r.d = ['VW Polo 6N'].concat(r.d);
                    at({
                        rule: 'M9',
                        text: 'd: добавлен «VW Polo 6N» (' + (byPrefix ? 'префикс OEM 6N*' : 'моторы Polo в engines: ' + (r.engines || []).slice(0, 4).join(',') + '…') + ')'
                    });
                } else {
                    review.push({ file, idx, oem, name, d: r.d, reason: 'нет ни префикса 6N*, ни моторов Polo — подтвердить применимость вручную' });
                }
            } else {
                review.push({ file, idx, oem, name, d: r.d, reason: 'кузова только Caddy — для Polo не добавляем' });
            }
        }
        /* M10 — явные пары «то же изделие, две карточки».
           Записи НЕ удаляем: ключ слияния в приложении = oem+name, поэтому
           удаление/переименование оставило бы старую карточку в IndexedDB у
           тех, кто уже загрузил базу (лечится только кнопкой «♻️ Пересобрать
           базу», а она стирает ручные цены/заметки/фото). Вместо этого:
           · суперсессия J→K — штатное поле `sup` (app.js:1987 рисует
             «Артикул заменён производителем на …» + кнопку перехода);
           · дубль RoadKit — взаимные ссылки в инструкциях. */
        if (oem === '030 109 243 J') {
            if (!r.sup) { r.sup = '030 109 243 K'; at({ rule: 'M10', text: 'sup → 030 109 243 K (суперсессия J→K, аналоги INA 531 0279 30 / SKF VKM 31025 совпадают)' }); }
        }
        if (oem === 'KIT-04') {
            if (pushInst(r, 'note', 'Та же позиция с заводским номером — «1J0 010 239» (Знак аварийной остановки): там же инструкция по установке.'))
                at({ rule: 'M10', text: 'ссылка на дубль 1J0 010 239' });
            if (!r.sub) { r.sub = 'Аварийный набор'; at({ rule: 'M10', text: 'sub: пусто → «Аварийный набор»' }); }
        }
        if (oem === '1J0 010 239') {
            if (pushInst(r, 'spec', 'ГОСТ Р 41.27.')) at({ rule: 'M10', text: 'перенесён ГОСТ из дубля KIT-04' });
            if (pushInst(r, 'note', 'Дубль позиции в разделе «С собой в дорогу» — KIT-04 «Знак аварийной остановки».'))
                at({ rule: 'M10', text: 'ссылка на дубль KIT-04' });
            if (!r.sub) { r.sub = 'Аварийный набор'; at({ rule: 'M10', text: 'sub: пусто → «Аварийный набор»' }); }
        }
    });
    return arr;
}

/* ---------- прогон ---------- */
const files = fs.readdirSync(SRC).filter(f => /^parts-.*\.json$/.test(f)).sort();
let touchedFiles = 0, touchedRecs = 0;
const perRule = {};
for (const f of files) {
    const p = path.join(SRC, f);
    const raw = fs.readFileSync(p, 'utf8');
    const arr = JSON.parse(raw);
    const before = log.length;
    migrate(f, arr);
    const mine = log.slice(before);
    if (!mine.length) continue;
    touchedFiles++;
    touchedRecs += new Set(mine.map(x => x.idx)).size;
    mine.forEach(x => { perRule[x.rule] = (perRule[x.rule] || 0) + 1; });
    const out = JSON.stringify(arr, null, 2).replace(/\n/g, '\r\n');   // CRLF, без завершающего \n — как было
    if (!DRY) fs.writeFileSync(p, out, 'utf8');
}

/* ---------- отчёты ---------- */
if (!DRY && !fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
const byFile = {};
log.forEach(x => { (byFile[x.file] = byFile[x.file] || []).push(x); });
const md = [
    '# Правки данных 1.10.6 (tools/migrate-1.10.6.js)',
    '',
    'Дата: ' + new Date().toISOString().slice(0, 10) + (DRY ? ' · **dry-run, файлы не менялись**' : ''),
    '',
    '| Правило | Что делает | Правок |',
    '|---|---|---|',
    '| M1 | плоский `i` → пара `[код, текст]` | ' + (perRule.M1 || 0) + ' |',
    '| M2 | объекты `{type,text}` внутри `i` → пары | ' + (perRule.M2 || 0) + ' |',
    '| M3 | не-артикулы из `a` → в инструкции | ' + (perRule.M3 || 0) + ' |',
    '| M4 | `3A0 601 139`: доноры + посадка 4×100 | ' + (perRule.M4 || 0) + ' |',
    '| M5 | убран неподтверждённый код `AFD` | ' + (perRule.M5 || 0) + ' |',
    '| M6 | пояснение про «ET» в названии | ' + (perRule.M6 || 0) + ' |',
    '| M7 | перекрёстные ссылки на крепёж | ' + (perRule.M7 || 0) + ' |',
    '| M8 | parts-07: коды моторов из `d` → `engines` | ' + (perRule.M8 || 0) + ' |',
    '| M9 | в `d` добавлен «VW Polo 6N» по жёсткому признаку | ' + (perRule.M9 || 0) + ' |',
    '| M10 | пары «то же изделие»: `sup` и взаимные ссылки | ' + (perRule.M10 || 0) + ' |',
    '',
    'Файлов изменено: **' + touchedFiles + '** · записей затронуто: **' + touchedRecs + '** · всего правок: **' + log.length + '**',
    '',
    '## Детализация',
    ''
];
Object.keys(byFile).sort().forEach(f => {
    md.push('### ' + f);
    md.push('');
    byFile[f].forEach(x => md.push('- `#' + x.idx + '` **' + x.rule + '** `' + (x.oem || '—') + '` — ' + x.text));
    md.push('');
});
/* спорные записи: доноры без Polo, но и без жёстких признаков */
const rev = ['# Спорные записи по применимости (1.10.6)', '',
    'Список сформирован tools/migrate-1.10.6.js (правило M9). У этих позиций в `d`',
    'нет Polo/6N, но и жёстких признаков (префикс OEM 6N*, моторы Polo в `engines`)',
    'тоже нет — поэтому автоматически «VW Polo 6N» им НЕ добавлялся. Пока список',
    'доноров не совпадёт с моделью, карточка показывает «не подходит», а в режиме',
    '«VIN-строго» позиция скрывается.', '',
    '| Файл | # | OEM | Название | Доноры | Почему спорно |', '|---|---|---|---|---|---|'];
review.forEach(x => rev.push('| ' + x.file + ' | ' + x.idx + ' | `' + (x.oem || '—') + '` | ' + x.name + ' | ' + x.d.join(', ') + ' | ' + x.reason + ' |'));
rev.push('', 'Всего: **' + review.length + '** записей.');

if (!DRY) {
    fs.writeFileSync(path.join(OUT, 'COMPAT-REVIEW-1.10.6.md'), rev.join('\n'), 'utf8');
    fs.writeFileSync(path.join(OUT, 'DATA-FIXES-1.10.6.md'), md.join('\n'), 'utf8');
    fs.writeFileSync(path.join(OUT, 'data-fixes-1.10.6.json'), JSON.stringify({ generated: new Date().toISOString(), perRule, touchedFiles, touchedRecs, log, review }, null, 1), 'utf8');
}
console.log((DRY ? '[dry] ' : '') + 'файлов: ' + touchedFiles + ' · записей: ' + touchedRecs + ' · правок: ' + log.length);
console.log('по правилам:', JSON.stringify(perRule));
console.log('спорных записей (restore/COMPAT-REVIEW-1.10.6.md):', review.length);
