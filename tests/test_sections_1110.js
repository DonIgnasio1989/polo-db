#!/usr/bin/env node
/* ============================================================
   tests/test_sections_1110.js — справочники сайдбара (1.11.0)
   ------------------------------------------------------------
   Проверяет:
     · _mergeSections(): серверные rows/cols побеждают локальные,
       пользовательские label/icon сохраняются, пустой серверный
       раздел не затирает локальные строки;
     · регистрацию разделов в сайдбаре (SEC_TABLE_IDS, VIRTUAL_CATS,
       CAT_GROUPS.refs) — иначе раздел не отрисуется;
     • целостность data/sections.json: арность строк, отсутствие
       дублей кодов OBD, исправленные значения в таблице моментов;
     · согласованность справочников с каталогом деталей
       (лампы и жидкости собираются из карточек Bulbs/Fluids).

   Запуск:  node tests/test_sections_1110.js
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'js', 'app.js'), 'utf8');
const SECS = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'sections.json'), 'utf8'));
const PARTS = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'parts.json'), 'utf8'));

let ok = 0, fail = 0; const fails = [];
function t(name, fn) { try { fn(); ok++; } catch (e) { fail++; fails.push(name + ' — ' + e.message); } }
const eq = (a, b, m) => { if (a !== b) throw new Error((m || '') + ' ожидается ' + JSON.stringify(b) + ', получено ' + JSON.stringify(a)); };
const okTrue = (v, m) => { if (!v) throw new Error(m || 'ожидалось true'); };

/* ---------- извлекаем функции из app.js и гоняем в песочнице ---------- */
function cut(start, endMark) {
    const i = src.indexOf(start);
    if (i < 0) throw new Error('не найдено в app.js: ' + start.slice(0, 40));
    const j = src.indexOf(endMark, i);
    if (j < 0) throw new Error('не найден конец: ' + endMark);
    return src.slice(i, j + endMark.length);
}
const mergeFn = cut('function _mergeSections(secs) {', '\n}\n');
const cellFn = cut('const secNz = ', ';\n');
const cellHtml = cut('function secCellHtml(c) {', '\n}\n');
const rowMatch = cut('function secRowMatch(row, q) {', '\n}\n');
const sortFn = cut('function secSortRows(rows, col, dir) {', '\n}\n');
const rowsHtml = cut('function secRowsHtml(rows) {', ';\n}');
/* песочница: nz/esc/escA из app.js + заглушка document для esc() */
const sb = {
    CUSTOM: { categories: [], sections: {} }, saved: 0,
    document: { createElement: () => ({ set textContent(v) { this._v = String(v); }, get innerHTML() {
        return this._v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); } }) }
};
sb.sMeta = () => { sb.saved++; };
vm.createContext(sb);
vm.runInContext([
    cut('const nz = ', ';\n'),
    cut('const esc = ', ';\n'),
    cut('const escA = ', ';\n'),
    cellFn, mergeFn, cellHtml, rowMatch, sortFn, rowsHtml,
    '\n;Object.assign(globalThis, { nz, esc, escA, secNz, _mergeSections, secCellHtml, secRowMatch, secSortRows, secRowsHtml });'
].join('\n'), sb);
const A = sb;

/* ================= _mergeSections ================= */
t('_mergeSections: серверные строки замещают устаревшие локальные', () => {
    sb.CUSTOM.sections = { Torque: { label: 'Моменты затяжки', icon: '🔩', cols: ['A'], rows: [['старое']] } };
    sb._mergeSections({ Torque: { label: 'Моменты затяжки', icon: '🔩', cols: ['A', 'B'], rows: [['новое', '1'], ['ещё', '2']] } });
    eq(sb.CUSTOM.sections.Torque.rows.length, 2, 'строк');
    eq(sb.CUSTOM.sections.Torque.rows[0][0], 'новое');
    eq(sb.CUSTOM.sections.Torque.cols.length, 2, 'колонок');
});
t('_mergeSections: пользовательские label/icon сохраняются', () => {
    sb.CUSTOM.sections = { Torque: { label: 'Мои моменты', icon: '🛠️', rows: [['x']] } };
    sb._mergeSections({ Torque: { label: 'Моменты затяжки', icon: '🔩', rows: [['новое']] } });
    eq(sb.CUSTOM.sections.Torque.label, 'Мои моменты');
    eq(sb.CUSTOM.sections.Torque.icon, '🛠️');
    eq(sb.CUSTOM.sections.Torque.rows[0][0], 'новое');
});
t('_mergeSections: пустой серверный раздел не затирает локальные строки', () => {
    sb.CUSTOM.sections = { Torque: { label: 'L', icon: 'I', cols: ['A'], rows: [['локальное']] } };
    sb._mergeSections({ Torque: { label: 'S', icon: 'S', rows: [] } });
    eq(sb.CUSTOM.sections.Torque.rows.length, 1);
    eq(sb.CUSTOM.sections.Torque.rows[0][0], 'локальное');
    eq(sb.CUSTOM.sections.Torque.cols[0], 'A', 'колонки сохранены');
});
t('_mergeSections: новый раздел добавляется целиком', () => {
    sb.CUSTOM.sections = {};
    sb._mergeSections({ Lamps: { label: 'Лампы', icon: '💡', cols: ['A'], rows: [['r']] } });
    eq(sb.CUSTOM.sections.Lamps.rows.length, 1);
});
t('_mergeSections: мусор не ломает слияние', () => {
    sb.CUSTOM.sections = {};
    sb._mergeSections(null); sb._mergeSections([]); sb._mergeSections({ X: null, Y: 'строка' });
    eq(Object.keys(sb.CUSTOM.sections).length, 0);
});
t('_mergeSections: сохраняет мета в localStorage (sMeta вызван)', () => {
    sb.saved = 0;
    sb.CUSTOM.sections = {};
    sb._mergeSections({ Torque: { rows: [['a']], cols: ['c'] } });
    okTrue(sb.saved > 0, 'sMeta не вызван');
});

/* ================= регистрация в сайдбаре ================= */
const secIds = Object.keys(SECS);
t('SEC_TABLE_IDS содержит все разделы sections.json', () => {
    const m = /const SEC_TABLE_IDS = \[([^\]]*)\]/.exec(src);
    okTrue(m, 'SEC_TABLE_IDS не найден');
    const ids = [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]);
    secIds.forEach(id => okTrue(ids.includes(id), 'в SEC_TABLE_IDS нет ' + id));
});
t('все новые разделы есть в VIRTUAL_CATS (иконка + подпись)', () => {
    const vc = cut('const VIRTUAL_CATS = {', '\n};');
    ['Lamps', 'FluidSpecs', 'Torque', 'Diagnostics'].forEach(id => {
        okTrue(new RegExp(id + "\\s*:\\s*\\{").test(vc), 'в VIRTUAL_CATS нет ' + id);
    });
});
t('новые разделы добавлены в группу «Справочники» сайдбара', () => {
    const grp = /id:\s*'refs'[\s\S]*?cats:\s*\[([^\]]*)\]/.exec(src);
    okTrue(grp, 'группа refs не найдена');
    const cats = [...grp[1].matchAll(/'([^']+)'/g)].map(x => x[1]);
    ['Lamps', 'FluidSpecs'].forEach(id => okTrue(cats.includes(id), 'в CAT_GROUPS.refs нет ' + id));
    /* порядок в сайдбаре совпадает с порядком разделов в файле */
    const inFile = secIds.filter(id => cats.includes(id));
    const inMenu = cats.filter(id => secIds.includes(id));
    eq(JSON.stringify(inFile), JSON.stringify(inMenu), 'порядок разделов');
});
t('id новых разделов не конфликтуют с категориями деталей', () => {
    const cats = new Set(PARTS.map(p => p.cat));
    secIds.forEach(id => okTrue(!cats.has(id), 'id справочника «' + id + '» совпадает с категорией деталей — раздел перекроет каталог'));
});

/* ================= целостность sections.json ================= */
t('арность строк соответствует cols во всех разделах', () => {
    secIds.forEach(id => {
        const s = SECS[id];
        okTrue(Array.isArray(s.cols) && s.cols.length, id + ': нет cols');
        s.rows.forEach((r, i) => eq(r.length, s.cols.length, id + ' rows[' + i + ']'));
    });
});
t('у каждого раздела есть icon и label', () => {
    secIds.forEach(id => {
        okTrue(SECS[id].icon && SECS[id].label, id + ': нет icon/label');
    });
});
t('в Diagnostics нет дублей кодов', () => {
    const seen = new Set(); const dup = [];
    SECS.Diagnostics.rows.forEach(r => {
        if (r[0] === '—') return;
        if (seen.has(r[0])) dup.push(r[0]); seen.add(r[0]);
    });
    eq(dup.length, 0, 'дубли: ' + dup.join(', '));
    okTrue(seen.size >= 90, 'кодов маловато: ' + seen.size);
});
t('коды OBD имеют формат Pxxxx и отсортированы', () => {
    const codes = SECS.Diagnostics.rows.map(r => r[0]).filter(c => c !== '—');
    codes.forEach(c => okTrue(/^P\d{4}$/.test(c), 'неверный формат: ' + c));
    eq(codes.join(','), codes.slice().sort().join(','), 'коды не отсортированы');
});
t('исправлена расшифровка P1143 (не лямбда, а расчёт нагрузки)', () => {
    const r = SECS.Diagnostics.rows.find(x => x[0] === 'P1143');
    okTrue(r && /нагрузк/i.test(r[1]), 'P1143: ' + (r && r[1]));
    okTrue(/17551/.test(r[3]) || /17551/.test(r[2]), 'не указан код VAG 17551');
});
t('в Diagnostics есть частые для 6N коды (катушки, дроссель, главное реле, ХХ)', () => {
    const have = new Set(SECS.Diagnostics.rows.map(r => r[0]));
    ['P0351', 'P0506', 'P0507', 'P0685', 'P1558', 'P1559', 'P1561', 'P0340', 'P0134', 'P0522'].forEach(c =>
        okTrue(have.has(c), 'нет кода ' + c));
});
t('в Diagnostics есть строки про 6N1 (2-pin) и 6N2 (OBD-II)', () => {
    const txt = SECS.Diagnostics.rows.map(r => r.join(' ')).join('\n');
    okTrue(/6N1/.test(txt) && /6N2/.test(txt), 'нет упоминания 6N1/6N2');
    okTrue(/пятизначн|16485|17551/.test(txt), 'нет пояснения про коды VAG');
});

/* ================= таблица моментов ================= */
const TQ = SECS.Torque.rows.map(r => r.join(' | ')).join('\n');
t('Torque: колёсные болты — M12×1,5 и 110 Нм (а не M14×1.5)', () => {
    const row = SECS.Torque.rows.find(r => /Колёсные болты/.test(r[0]));
    okTrue(row, 'нет строки колёсных болтов');
    eq(row[1], '110 Нм');
    okTrue(/M12×1,5/.test(row[2]), 'в примечании нет M12×1,5: ' + row[2]);
    /* M14×1.5 в колонке «Момент» не встречается вообще, а в примечаниях —
       только как упоминание прежней ошибки. (Сливная пробка поддона M14×1,5×16
       — легитимная резьба, она в проверке не участвует.) */
    SECS.Torque.rows.forEach((r, i) => {
        /* M14×1,5×16 (сливная пробка) — полное обозначение резьбы, это не ошибка */
        const M14 = /M14×1[.,]5(?!×\d)/;
        okTrue(!M14.test(r[1]), 'в колонке «Момент» строки ' + i + ' осталось M14×1.5');
        if (M14.test(r[2]) && !/прежней таблице|неверн/.test(r[2]))
            throw new Error('строка ' + i + ' («' + r[0].slice(0, 30) + '»): M14×1.5 без пометки об ошибке');
    });
});
t('Torque: для Caddy больше нет 140 Нм', () => {
    okTrue(!/Caddy 9K \(4×100\) \| 140/.test(SECS.Torque.rows.map(r => r.join(' | ')).join('\n')), 'осталось 140 Нм для Caddy');
});
t('Torque: нет дубля «Свеча накаливания (втор.)»', () => {
    eq(SECS.Torque.rows.filter(r => /накаливания/.test(r[0])).length, 1);
});
t('Torque: гайка ступицы помечена как спорная и со ссылкой на артикулы', () => {
    const row = SECS.Torque.rows.find(r => /Гайка ступицы перед/.test(r[0]));
    okTrue(row, 'нет строки');
    okTrue(/200 Нм/.test(row[1]) && /265/.test(row[1]), 'не показан диапазон: ' + row[1]);
    okTrue(/N 905 876 02/.test(row[2]) && /6N0 498 621/.test(row[2]), 'нет ссылок на карточки');
});
t('Torque: ГБЦ EA111 — три ступени (40 → 60 → +180°)', () => {
    const row = SECS.Torque.rows.find(r => /ГБЦ 1\.0\/1\.4\/1\.6 8V/.test(r[0]));
    okTrue(/40 Нм → 60 Нм → \+180°/.test(row[1]), 'неверная последовательность: ' + row[1]);
});
t('Torque: стойка стабилизатора исправлена на 75 Нм', () => {
    const row = SECS.Torque.rows.find(r => /Стойка стабилизатора/.test(r[0]));
    eq(row[1], '75 Нм');
});
t('Torque: спорные места помечены ⚠ и есть дисклеймер об источниках', () => {
    const warn = SECS.Torque.rows.filter(r => /⚠/.test(r.join(' '))).length;
    okTrue(warn >= 8, 'мало помеченных расхождений: ' + warn);
    okTrue(/Источники:/.test(SECS.Torque.rows[SECS.Torque.rows.length - 1][2]), 'нет дисклеймера');
});
t('Torque: каждая строка с артикулом из каталога действительно есть в parts.json', () => {
    const oems = new Set(PARTS.map(p => String(p.o || p.oem || '').trim().toUpperCase().replace(/\s+/g, ' ')));
    const norm = s => s.toUpperCase().replace(/\s+/g, ' ');
    let checked = 0;
    SECS.Torque.rows.forEach(r => {
        const m = r.join(' ').match(/\b(?:[0-9A-Z]{3} \d{3} \d{3}[A-Z0-9 ]*|N \d{3} \d{3} \d{1,2}|WHT \d{3} \d{3}|G \d{3} \d{3}[A-Z0-9 ]*|VW \d{3} \d{2})\b/g) || [];
        m.forEach(o => {
            const key = norm(o).replace(/ (A|B|C|K|J|N|M|L|AB|AA)$/g, x => x);
            okTrue(oems.has(key), 'артикул из таблицы моментов не найден в каталоге: ' + o);
            checked++;
        });
    });
    okTrue(checked >= 20, 'слишком мало сверенных артикулов: ' + checked);
});

/* ================= новые разделы ================= */
/* текст всего каталога: артикул + название + инструкции (справочники ссылаются
   на карточки разных категорий — Bulbs, Fluids, Transmission, Steering…) */
const CAT_TXT = PARTS.map(p => String(p.o || p.oem || '') + ' ' + String(p.n || p.name || '') + ' ' +
    (p.i || p.inst || []).map(x => Array.isArray(x) ? x[1] : (x && x.text) || '').join(' ')).join('\n');
t('Lamps: типы ламп совпадают с карточками каталога (H4/W5W/P21W/PY21W/H3)', () => {
    const txt = SECS.Lamps.rows.map(r => r.join(' ')).join('\n');
    const bulbs = CAT_TXT;
    ['H4', 'W5W', 'P21W', 'PY21W'].forEach(x => {
        okTrue(txt.includes(x), 'в справочнике нет ' + x);
        okTrue(bulbs.includes(x), 'в каталоге (Bulbs) нет ' + x);
    });
    okTrue(/H3/.test(txt) && /H3/.test(bulbs), 'H3 (ПТФ) рассинхронизирован');
    okTrue(/BAU15s/.test(txt), 'нет цоколя BAU15s');
});
t('Lamps: есть предупреждение про превышение мощности', () => {
    const last = SECS.Lamps.rows[SECS.Lamps.rows.length - 1].join(' ');
    okTrue(/Мощность превышать нельзя/.test(last), 'нет предупреждения');
});
t('FluidSpecs: спецификации взяты из карточек Fluids', () => {
    const txt = SECS.FluidSpecs.rows.map(r => r.join(' ')).join('\n');
    const fluids = CAT_TXT;
    ['VW 502 00', 'VW 505 01', 'G 052 726 A2', 'G 052 162 A2', 'G 004 000 M2', 'DOT 4'].forEach(x => {
        okTrue(txt.includes(x), 'в справочнике нет ' + x);
    });
    ['G 052 726 A2', 'G 052 162 A2', 'G 004 000 M2'].forEach(x =>
        okTrue(fluids.includes(x), 'в каталоге Fluids нет ' + x + ' — справочник расходится с каталогом'));
    okTrue(/2\.7–3\.1 л/.test(txt), 'в справочнике нет объёма масла МКПП 085');
    okTrue(/2\.7-3\.1 л|2\.7–3\.1 л/.test(fluids), 'в карточке каталога другой объём масла МКПП 085');
});
t('FluidSpecs: конфликт двух жидкостей ГУР отмечен явно', () => {
    const txt = SECS.FluidSpecs.rows.map(r => r.join(' ')).join('\n');
    okTrue(/G 002 000/.test(txt) && /G 004 000 M2/.test(txt), 'не упомянуты обе жидкости ГУР');
    okTrue(/НЕ смешивать|не смешивать/.test(txt), 'нет предупреждения о смешивании');
});
t('WiringRef: добавлены недостающие клеммы DIN 72552 (49a, 56a, 56b, 53a)', () => {
    const txt = SECS.WiringRef.rows.map(r => r[0]).join(' ');
    ['49', '56', '53', '31a', '15a'].forEach(k => okTrue(txt.includes(k), 'нет Kl. ' + k));
    okTrue(/Сечение провода/.test(SECS.WiringRef.rows.map(r => r.join(' ')).join('\n')), 'нет пояснения про сечение');
});
t('WiringFuses/Relays/Pins: добавлены поясняющие строки', () => {
    const f = SECS.WiringFuses.rows.map(r => r.join(' ')).join('\n');
    okTrue(/красный/.test(f) && /синий/.test(f), 'нет таблицы цветов предохранителей');
    okTrue(/6N2/.test(f), 'нет предупреждения про 6N2');
    const rel = SECS.WiringRelays.rows.map(r => r.join(' ')).join('\n');
    okTrue(/J271/.test(rel), 'в реле нет упоминания J271');
    okTrue(/85 \/ 86|85\/86|85 .*86/.test(rel), 'нет схемы контактов реле');
    const pins = SECS.WiringPins.rows.map(r => r.join(' ')).join('\n');
    okTrue(/G62/.test(pins) && /N152/.test(pins) && /J338/.test(pins), 'не добавлены пиновки G62/N152/J338');
});
t('Wiring: все ссылки имеют метку|url и домен разрешён', () => {
    let links = 0;
    SECS.Wiring.rows.forEach(r => r.forEach(c => {
        const m = /^(.+?)\|(https?:\/\/\S+)$/.exec(String(c));
        if (m) {
            links++;
            okTrue(/^https:\/\/(vwts\.ru|www\.clubgti\.com)\//.test(m[2]), 'посторонний домен: ' + m[2]);
        }
    }));
    okTrue(links >= 9, 'мало ссылок: ' + links);
});
t('sections.json собирается генератором (tools/build-sections.py)', () => {
    okTrue(fs.existsSync(path.join(ROOT, 'tools', 'build-sections.py')), 'нет генератора');
});

/* ================= 1.12.0: рендер справочника ================= */
t('secCellHtml: внешняя ссылка «метка|url»', () => {
    const h = A.secCellHtml('Архив схем|https://vwts.ru/x.zip');
    okTrue(h.includes('href="https://vwts.ru/x.zip"'), h);
    okTrue(h.includes('target="_blank"') && h.includes('rel="noopener noreferrer"'), 'нет защиты от reverse tabnabbing');
    okTrue(h.includes('Архив схем') && h.includes('↗'), h);
});
t('secCellHtml: внутренняя ссылка «метка|#q:запрос» → кнопка поиска', () => {
    const h = A.secCellHtml('свечи|#q:свечи');
    okTrue(h.includes('class="sec-q"'), h);
    okTrue(h.includes('data-q="свечи"'), 'нет запроса: ' + h);
    okTrue(!h.includes('href'), 'не должно быть href');
});
t('secCellHtml: переход в другой справочник «метка|#sec:Id»', () => {
    const h = A.secCellHtml('моменты|#sec:Torque');
    okTrue(h.includes('class="sec-s"') && h.includes('data-sec="Torque"'), h);
});
t('secCellHtml: несколько ссылок в одной ячейке через «;;»', () => {
    const h = A.secCellHtml('свечи|#q:свечи;;катушка|#q:катушка зажигания');
    eq((h.match(/sec-q/g) || []).length, 2, 'кнопок: ' + h);
    okTrue(h.includes('data-q="свечи"') && h.includes('data-q="катушка зажигания"'), h);
});
t('secCellHtml: голый URL и обычный текст', () => {
    okTrue(A.secCellHtml('https://vwts.ru/a').includes('<a href="https://vwts.ru/a"'), 'голый URL не стал ссылкой');
    eq(A.secCellHtml('110 Нм'), '110 Нм');
    eq(A.secCellHtml(''), '');
    eq(A.secCellHtml(null), '');
});
t('secCellHtml: экранирует HTML (защита от поломки таблицы)', () => {
    const h = A.secCellHtml('<img src=x onerror=alert(1)>');
    okTrue(!h.includes('<img'), h);
    okTrue(h.includes('&lt;img'), h);
});
t('secCellHtml: переводы строк → <br>', () => {
    okTrue(A.secCellHtml('строка1\nстрока2').includes('<br>'), 'нет <br>');
});
t('secRowMatch: ищет по всем ячейкам, все слова обязательны', () => {
    const row = ['P0301', 'Пропуск: цилиндр 1', 'свечи|#q:свечи'];
    eq(A.secRowMatch(row, 'p0301'), true, 'регистр');
    eq(A.secRowMatch(row, 'ПРОПУСК цилиндр'), true, 'несколько слов');
    eq(A.secRowMatch(row, 'свечи'), true, 'поиск по части ссылки');
    eq(A.secRowMatch(row, 'p0302'), false);
    eq(A.secRowMatch(row, ''), true, 'пустой запрос');
    eq(A.secRowMatch(row, '   '), true);
});
t('secRowMatch: регистр, ё→е и диакритика не мешают поиску', () => {
    eq(A.secRowMatch(['Свечи зажигания'], 'СВЕЧИ'), true, 'регистр');
    eq(A.secRowMatch(['Трёхконтактный разъём'], 'трехконтактный разъем'), true, 'ё→е');
    eq(A.secRowMatch(['Свечи зажигания'], 'свечы'), false, 'чужое слово не должно находиться');
});
t('secSortRows: числа сортируются как числа, текст — по-русски', () => {
    const rows = [['10'], ['9'], ['100'], ['1']];
    eq(A.secSortRows(rows, 0, 1).map(r => r[0]).join(','), '1,9,10,100');
    eq(A.secSortRows(rows, 0, -1).map(r => r[0]).join(','), '100,10,9,1');
    const txt = [['Шкив'], ['Амортизатор'], ['Болт']];
    eq(A.secSortRows(txt, 0, 1).map(r => r[0]).join(','), 'Амортизатор,Болт,Шкив');
    eq(A.secSortRows(txt, -1, 1).length, 3, 'несуществующий столбец не должен ломать');
    eq(A.secSortRows([], 0, 1).length, 0);
});
t('secSortRows: моменты «40 Нм → 60 Нм» сортируются по первому числу', () => {
    const rows = [['a', '110 Нм'], ['b', '25 Нм'], ['c', '40 Нм → 60 Нм → +180°']];
    eq(A.secSortRows(rows, 1, 1).map(r => r[0]).join(','), 'b,c,a');
});
t('secRowsHtml: зебра через класс sec-alt', () => {
    const h = A.secRowsHtml([['a'], ['b'], ['c']]);
    eq((h.match(/sec-alt/g) || []).length, 1, 'зебра только на чётных: ' + h);
    eq((h.match(/<tr/g) || []).length, 3);
});

/* ================= 1.12.0: раздел Wheels и 5-я колонка ================= */
t('Wheels: посадочные параметры Polo 6N', () => {
    okTrue(SECS.Wheels, 'раздела Wheels нет');
    const txt = SECS.Wheels.rows.map(r => r.join(' | ')).join('\n');
    okTrue(/4×100/.test(txt), 'нет PCD 4×100');
    okTrue(/57\.1/.test(txt), 'нет DIA 57.1');
    okTrue(/M12×1,5/.test(txt), 'нет резьбы M12×1,5');
    okTrue(/110 Нм/.test(txt), 'нет момента 110 Нм');
    okTrue(/ET35/.test(txt), 'нет вылета ET35');
    okTrue(/3A0 601 139/.test(txt), 'нет артикула болта');
});
t('Wheels: размеры шин собраны из каталога (без расхождений)', () => {
    const sizes = SECS.Wheels.rows.map(r => r[0]).filter(x => /^\d{3}\/\d{2} R\d{2}$/.test(x));
    const catSizes = new Set(PARTS.map(p => String(p.o || p.oem || '').trim()).filter(x => /^\d{3}\/\d{2} R\d{2}$/.test(x)));
    eq(sizes.length, catSizes.size, 'размеров в справочнике ' + sizes.length + ', в каталоге ' + catSizes.size);
    sizes.forEach(x => okTrue(catSizes.has(x), 'в каталоге нет размера ' + x));
    okTrue(sizes.length >= 10, 'мало размеров: ' + sizes.length);
    /* отсортированы по диаметру */
    const dia = sizes.map(x => Number(/R(\d{2})/.exec(x)[1]));
    eq(dia.join(','), dia.slice().sort((a, b) => a - b).join(','), 'размеры не отсортированы');
});
t('Wheels: давление 3.4 бар для гружёного Caddy видно и в справочнике', () => {
    const row = SECS.Wheels.rows.find(r => r[0] === '195/65 R15');
    okTrue(row, 'нет строки 195/65 R15');
    okTrue(/3\.4/.test(row[2]), 'нет 3.4 бар: ' + row[2]);
});
t('Diagnostics: 5 колонок, симптомы и ссылки у большинства кодов', () => {
    eq(SECS.Diagnostics.cols.length, 5);
    eq(SECS.Diagnostics.cols[2], 'Симптомы / причина');
    eq(SECS.Diagnostics.cols[4], 'Детали каталога');
    const withLinks = SECS.Diagnostics.rows.filter(r => r[4]).length;
    okTrue(withLinks >= 60, 'строк со ссылками на каталог: ' + withLinks);
    const withSym = SECS.Diagnostics.rows.filter(r => /MIL|глохнет|троит|расход|обороты|перегрев|мигает/i.test(r[2])).length;
    okTrue(withSym >= 25, 'строк с симптомами: ' + withSym);
});
t('Diagnostics: все внутренние ссылки ведут на существующие запросы (не пустые)', () => {
    SECS.Diagnostics.rows.forEach(r => {
        String(r[4] || '').split(';;').filter(Boolean).forEach(part => {
            const m = /^(.+?)\|#q:(.+)$/.exec(part);
            okTrue(m, 'битый формат ссылки: ' + part);
            okTrue(m[1].trim().length > 0 && m[2].trim().length > 0, 'пустая метка/запрос: ' + part);
        });
    });
});
t('во всех разделах внутренние #sec-ссылки указывают на существующие разделы', () => {
    secIds.forEach(id => SECS[id].rows.forEach((r, i) => r.forEach(c => {
        const m = /\|#sec:([A-Za-z]+)/.exec(String(c));
        if (m) okTrue(SECS[m[1]], id + ' rows[' + i + ']: нет раздела ' + m[1]);
    })));
});

console.log('test_sections_1110: ' + ok + ' ok, ' + fail + ' fail');
if (fail) { fails.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
