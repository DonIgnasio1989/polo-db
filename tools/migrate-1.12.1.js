#!/usr/bin/env node
/* ============================================================
   tools/migrate-1.12.1.js — обогащение каталога (второй раунд)
   ------------------------------------------------------------
   Запускать ПОСЛЕ tools/migrate-1.10.6.js (на чистом data-src —
   подряд: 1.10.6, затем 1.12.1). Идемпентна.

   Правила:
     N1  коды моторов, зашитые в НАЗВАНИЕ (артефакт выгрузки ETKA),
         переносятся в поле `engines`. Название не трогаем — иначе
         запись «осиротеет» в IndexedDB у уже загрузивших базу.
     N2  интервал замены ремня ГРМ: по данным производителя VW задаёт
         жёсткий интервал (60/90 тыс. км) только для ДИЗЕЛЕЙ 6N;
         для бензиновых регламентного интервала нет — добавлено
         уточнение, чтобы «60.000 км / 4 года» не читалось как
         предписание завода для 1.0/1.4/1.6.
     N3  помпа ОЖ приводится ремнём ГРМ — добавлено напоминание
         менять вместе с ремнём (VW не предписывает, но это практика).
     N4  тормозные диски: минимальная толщина (MIN) и обкатка —
         типовые ошибки при замене. Числа MIN намеренно НЕ пишем:
         они различаются по размерам и выбиты на кромке диска.

   Источники (проверено 2026-10-24):
     · repareo.de/zahnriemenwechsel-vw-polo — «по данным производителя:
       для 6N1/6N2/6NF есть предписания только для дизелей, 60.000 и
       90.000 км»; помпа у части моторов приводится ремнём, VW замену
       вместе с ремнём не предписывает, но это стандартная практика;
     · polotreff.de/forum/t/161506 и motor-talk.de — практика владельцев:
       120.000 км или 5 лет, контроль с 90.000;
     · autodoc.de / teile-direkt.at — у Polo 6N несколько размеров
       передних дисков (239×10, 239×18, 256×20, 256×25), MIN у каждого свой.

   Лог: restore/DATA-FIXES-1.12.1.md + restore/data-fixes-1.12.1.json
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'data-src');
const OUT = path.join(ROOT, 'restore');
const DRY = process.argv.includes('--dry');

const appSrc = fs.readFileSync(path.join(ROOT, 'js', 'app.js'), 'utf8');
const i0 = appSrc.indexOf('const ENGINES = {');
const ENGINES = new Set([...appSrc.slice(i0, appSrc.indexOf('\n};', i0)).matchAll(/'([^']+)'\s*:/g)].map(m => m[1]));
const IM = Object.fromEntries([...((appSrc.match(/const IM = \{([^}]*)\}/) || [, ''])[1]).matchAll(/(\w+):\s*'(\w)'/g)].map(m => [m[1], m[2]]));

const oemOf = r => String(r.o || r.oem || '').trim();
const isNew = r => ('n' in r) || ('o' in r) || ('i' in r);
const log = [];
const add = (file, idx, oem, rule, text) => log.push({ file, idx, oem, rule, text });

function pushInst(r, type, text) {
    text = String(text || '').trim();
    if (!text) return false;
    const list = isNew(r) ? (r.i = r.i || []) : (r.inst = r.inst || []);
    const has = list.some(x => {
        const t = Array.isArray(x) ? String(x[1] || '') : String((x && x.text) || '');
        return t.trim() === text || (text.length > 40 && t.includes(text.slice(0, 40)));
    });
    if (has) return false;
    if (isNew(r)) list.push([IM[type] || 'n', text]);
    else list.push({ type, text });
    return true;
}

/* ---------- N1: коды моторов из названия → engines ----------
   Только явный список: автоматическое извлечение рискованно (в названиях
   встречаются трёхбуквенные аббревиатуры, совпадающие с кодами моторов). */
const N1 = {
    '028 121 132 B · 028 121 132 C': {
        add: ['AEF', 'AGD', 'AHG', 'AKU'],
        why: 'в названии «Фланец (AEF / AGD,AHG,AKU)» — дизели 1.9 SDI и 1.7 SDI'
    },
    '6N0 199 111 H · 6N0 199 111 G · 6N0 199 111 F · 6N0 199 565 C': {
        add: ['AMF'],
        why: 'в названии заявлен AMF (1.4 TDI), в engines его не было'
    },
    '6X0 973 815': { add: ['AEE', 'AEX', 'AER', 'AHS', 'AKV', 'ALL', 'ANX', 'APQ'], why: 'список моторов из названия (жгут моторного отсека, МКПП)' },
    '6X0 973 817': { add: ['AEE', 'AEX', 'AER', 'AHS', 'AKV', 'ANX', 'APQ', 'AFH'], why: 'список из названия; «AF/HALL» в имени — искажённое «AFH» (подтверждено соседней позицией 1J0 973 715, где AFH указан явно)' },
    '1J0 973 824': { add: ['AEE', 'AEX', 'AER', 'AHS', 'AKV', 'ANX', 'APQ', 'AFH'], why: 'список из названия; «AF/HALL» — искажённое «AFH» (см. 1J0 973 715)' },
    '1J0 973 715': { add: ['AEE', 'AEX', 'AER', 'AHS', 'AFH', 'ALL', 'ANX', 'APQ', 'AKV'], why: 'список моторов из названия (соединительная муфта жгута)' }
};

/* ---------- N2/N3/N4: тексты уточнений ---------- */
const BELT_NOTE = 'Уточнение по данным производителя: жёсткий интервал замены ремня (60 000 / 90 000 км) VW задаёт только для ДИЗЕЛЕЙ 6N. Для бензиновых 1.0/1.4/1.6 регламентного интервала нет — «60 000 км / 4 года» в этой карточке следует читать как консервативную рекомендацию для тяжёлых условий. На практике: осмотр с 90 000 км и обязательная замена по возрасту (5–6 лет), резина стареет и на стоящей машине. Обрыв = встреча клапанов с поршнями.';
const PUMP_NOTE = 'Помпа приводится ремнём ГРМ: менять вместе с ремнём и роликами. VW замену помпы отдельно не предписывает, но её заклинание обрывает ремень — экономия не оправдана.';
const DISC_NOTE = 'MIN (минимальная толщина) выбита на кромке диска — проверять штангенциркулем, а не «на глаз»: у каждого размера она своя (у 6N четыре варианта передних дисков: 239×10, 239×18, 256×20, 256×25). При достижении MIN — замена парой, проточка ниже MIN запрещена. Новые диски обезжирить, первые 200–300 км — обкатка без резких торможений.';

const N2_OEMS = ['030 109 119', '030 109 119 F', '030 198 119'];           /* ремни и комплект ТО-3 */
const N2_SUB = /ТО-3|ремень грм/i;                                          /* на случай переименования */
const N3_OEMS = ['030 121 011', '030 121 008 C', '030 121 008 D', '030 121 008 J', '036 121 005 S'];
const N4_RE = /^6N0 615 (301|601)/;                                          /* диски передние и задние */
const N4_ALSO = ['JZW 615 301 L'];

function migrate(file, arr) {
    arr.forEach((r, idx) => {
        const oem = oemOf(r), name = String(r.n || r.name || '').trim();
        const at = (rule, text) => add(file, idx, oem, rule, text);

        /* N1 */
        if (N1[oem]) {
            const cur = r.engines || [];
            const missing = N1[oem].add.filter(c => ENGINES.has(c) && !cur.includes(c));
            if (missing.length) {
                r.engines = cur.concat(missing);
                at('N1', 'engines += ' + missing.join(', ') + ' (' + N1[oem].why + ')');
            }
        }
        /* N2 */
        if (N2_OEMS.includes(oem) || (name && N2_SUB.test(name) && /ремень|грм/i.test(name))) {
            if (pushInst(r, 'warn', BELT_NOTE)) at('N2', 'добавлено уточнение интервала ГРМ (данные производителя: интервал только для дизелей)');
        }
        /* N3 */
        if (N3_OEMS.includes(oem)) {
            if (pushInst(r, 'note', PUMP_NOTE)) at('N3', 'добавлено напоминание: помпа приводится ремнём ГРМ');
        }
        /* N4 */
        if (N4_RE.test(oem) || N4_ALSO.includes(oem)) {
            if (pushInst(r, 'warn', DISC_NOTE)) at('N4', 'добавлено про MIN-толщину, обезжиривание и обкатку');
        }
    });
    return arr;
}

const files = fs.readdirSync(SRC).filter(f => /^parts-.*\.json$/.test(f)).sort();
let touchedFiles = 0, touchedRecs = 0;
const perRule = {};
for (const f of files) {
    const p = path.join(SRC, f);
    const arr = JSON.parse(fs.readFileSync(p, 'utf8'));
    const before = log.length;
    migrate(f, arr);
    const mine = log.slice(before);
    if (!mine.length) continue;
    touchedFiles++;
    touchedRecs += new Set(mine.map(x => x.idx)).size;
    mine.forEach(x => { perRule[x.rule] = (perRule[x.rule] || 0) + 1; });
    if (!DRY) fs.writeFileSync(p, JSON.stringify(arr, null, 2).replace(/\n/g, '\r\n'), 'utf8');
}

if (!DRY && !fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
const md = [
    '# Обогащение каталога 1.12.1 (tools/migrate-1.12.1.js)', '',
    'Дата: ' + new Date().toISOString().slice(0, 10) + (DRY ? ' · **dry-run**' : ''), '',
    '| Правило | Что делает | Правок |', '|---|---|---|',
    '| N1 | коды моторов из названия → `engines` | ' + (perRule.N1 || 0) + ' |',
    '| N2 | уточнение интервала ГРМ (по данным производителя) | ' + (perRule.N2 || 0) + ' |',
    '| N3 | помпа приводится ремнём ГРМ | ' + (perRule.N3 || 0) + ' |',
    '| N4 | тормозные диски: MIN-толщина, обезжиривание, обкатка | ' + (perRule.N4 || 0) + ' |',
    '', 'Файлов изменено: **' + touchedFiles + '** · записей: **' + touchedRecs + '** · правок: **' + log.length + '**', '',
    '## Источники', '',
    '- Интервалы ГРМ: repareo.de/zahnriemenwechsel-vw-polo (по данным производителя: для 6N1/6N2/6NF предписания есть только для дизелей — 60.000 и 90.000 км); практика владельцев — polotreff.de/forum/t/161506 (120.000 км или 5 лет), motor-talk.de (контроль с 90.000).',
    '- Помпа приводится ремнём ГРМ; VW замену вместе с ремнём не предписывает, но это стандартная практика (repareo.de).',
    '- Размеры передних дисков Polo 6N: autodoc.de, teile-direkt.at (239×10 / 239×18 / 256×20 / 256×25). Числа MIN намеренно не вносились — они выбиты на кромке диска и различаются по размерам.', '',
    '## Детализация', ''
];
const byFile = {};
log.forEach(x => { (byFile[x.file] = byFile[x.file] || []).push(x); });
Object.keys(byFile).sort().forEach(f => {
    md.push('### ' + f); md.push('');
    byFile[f].forEach(x => md.push('- `#' + x.idx + '` **' + x.rule + '** `' + (x.oem || '—') + '` — ' + x.text));
    md.push('');
});
if (!DRY) {
    fs.writeFileSync(path.join(OUT, 'DATA-FIXES-1.12.1.md'), md.join('\n'), 'utf8');
    fs.writeFileSync(path.join(OUT, 'data-fixes-1.12.1.json'), JSON.stringify({ generated: new Date().toISOString(), perRule, touchedFiles, touchedRecs, log }, null, 1), 'utf8');
}
console.log((DRY ? '[dry] ' : '') + 'файлов: ' + touchedFiles + ' · записей: ' + touchedRecs + ' · правок: ' + log.length);
console.log('по правилам:', JSON.stringify(perRule));
